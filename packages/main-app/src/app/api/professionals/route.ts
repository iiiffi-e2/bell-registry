import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma, UserRole } from '@bell-registry/shared'
import { type SortOption } from '@/types/sort'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const isEmployerOrAgency = session?.user?.role === "EMPLOYER" || session?.user?.role === "AGENCY"

    // Check if employer has network access
    let hasNetworkAccess = false
    if (isEmployerOrAgency && session?.user?.id) {
      const employerProfile = await prisma.employerProfile.findUnique({
        where: { userId: session.user.id },
        select: { hasNetworkAccess: true }
      })
      hasNetworkAccess = employerProfile?.hasNetworkAccess || false
      
    }

  const { searchParams } = new URL(request.url)
  const location = searchParams.get('location')
  const roleType = searchParams.get('roleType') as UserRole | null
  const roles = searchParams.get('roles')?.split(',').filter(Boolean) || []
  const searchQuery = searchParams.get('search')
  const openToWork = searchParams.get('openToWork') === 'true'
  const radius = searchParams.get('radius') ? parseInt(searchParams.get('radius')!) : undefined
  const sortBy = searchParams.get('sort') as SortOption || 'recent'
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '9')
  const skip = (page - 1) * limit

    // Check if pg_trgm extension is available for fuzzy search
    let pgTrgmAvailable = false;
    if (searchQuery) {
      try {
        await prisma.$queryRaw`SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm' LIMIT 1`;
        pgTrgmAvailable = true;
      } catch (error) {
        // pg_trgm extension not available, using fallback search
        pgTrgmAvailable = false;
      }
    }

    // Enhanced fuzzy search with role and location parsing
    if (searchQuery && pgTrgmAvailable) {
      try {
        // Parse for 'in' to separate role from location (e.g., "private chef in Austin")
        let roleQuery = searchQuery
        let locationQuery: string | null = null
        if (searchQuery.toLowerCase().includes(' in ')) {
          const [role, loc] = searchQuery.split(/ in /i)
          roleQuery = role.trim()
          locationQuery = loc.trim()
        }

        // Expand location query to handle state names and abbreviations
        const expandLocationQuery = (loc: string): string[] => {
          const stateMap: Record<string, string> = {
            'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR', 'california': 'CA',
            'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE', 'florida': 'FL', 'georgia': 'GA',
            'hawaii': 'HI', 'idaho': 'ID', 'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA',
            'kansas': 'KS', 'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
            'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS', 'missouri': 'MO',
            'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ',
            'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH',
            'oklahoma': 'OK', 'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
            'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT', 'vermont': 'VT',
            'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV', 'wisconsin': 'WI', 'wyoming': 'WY'
          };
          
          const reverseStateMap: Record<string, string> = Object.fromEntries(
            Object.entries(stateMap).map(([name, abbr]) => [abbr.toLowerCase(), name])
          );

          const variations: string[] = [loc];
          const lowerLoc = loc.toLowerCase();

          // If it's a state name, add abbreviation
          if (stateMap[lowerLoc]) {
            variations.push(stateMap[lowerLoc]);
          }
          // If it's a state abbreviation, add full name
          else if (reverseStateMap[lowerLoc]) {
            variations.push(reverseStateMap[lowerLoc]);
          }

          return variations;
        };
        
        // Build SQL for fuzzy search with similarity threshold
        let paramIndex = 1;
        let params: any[] = [];
        
        // Add role query parameter
        params.push(roleQuery);
        const roleParamIndex = paramIndex++;
        
        // Build where clauses with proper parameter indexing
        let whereClauses = [
          `similarity("preferredRole", $${roleParamIndex}) > 0.1`,
          `similarity("title", $${roleParamIndex}) > 0.1`,
          `similarity("bio", $${roleParamIndex}) > 0.1`,
          `similarity("location", $${roleParamIndex}) > 0.1`
        ];
        
        let rankExpr = `GREATEST(similarity("preferredRole", $${roleParamIndex}), similarity("title", $${roleParamIndex}), similarity("bio", $${roleParamIndex}), similarity("location", $${roleParamIndex}))`;
        
        // Add location filtering if location is parsed from query
        let locationParamIndex: number | null = null;
        let locationVariations: string[] = [];
        if (locationQuery) {
          locationVariations = expandLocationQuery(locationQuery);
          // Add all location variations as parameters
          locationVariations.forEach(variation => {
            params.push(`%${variation}%`);
          });
          locationParamIndex = paramIndex;
          paramIndex += locationVariations.length;
        }

        // Add limit and offset parameters
        params.push(limit);
        const limitParamIndex = paramIndex++;
        params.push(skip);
        const offsetParamIndex = paramIndex++;

        // Add additional filters to the query with proper parameter indexing
        let additionalWhere = '';
        if (roles.length > 0) {
          const roleConditions = roles.map((role) => {
            params.push(role);
            return `"preferredRole" = $${paramIndex++}`;
          });
          additionalWhere += ` AND (${roleConditions.join(' OR ')})`;
        }
        if (openToWork) {
          additionalWhere += ` AND "openToWork" = true`;
        }
        // Handle separate location and radius filters (not from parsed query)
        if (location && !locationQuery) {
          const locationVariationsForFilter = expandLocationQuery(location);
          
          // If radius is specified and > 50 miles, make location search more flexible
          if (radius && radius > 50) {
            // For larger radius, be more flexible with location matching
            const locationConditions = locationVariationsForFilter.map(() => {
              params.push(`%${location.split(' ')[0]}%`); // Use first word for broader search
              return `"location" ILIKE $${paramIndex++}`;
            });
            // Also include state-level matches for large radius
            locationVariationsForFilter.forEach(variation => {
              params.push(`%${variation}%`);
              locationConditions.push(`"location" ILIKE $${paramIndex++}`);
            });
            additionalWhere += ` AND (${locationConditions.join(' OR ')})`;
          } else {
            // Standard location matching for smaller radius or no radius
            const locationConditions = locationVariationsForFilter.map(variation => {
              params.push(`%${variation}%`);
              return `"location" ILIKE $${paramIndex++}`;
            });
            additionalWhere += ` AND (${locationConditions.join(' OR ')})`;
          }
        }
        // Add location filter from parsed query (strict matching with variations)
        if (locationQuery && locationParamIndex && locationVariations.length > 0) {
          let locationConditions = locationVariations.map((_, index) => 
            `"location" ILIKE $${locationParamIndex + index}`
          );
          
          // If radius is specified and > 50 miles, add broader location matching
          if (radius && radius > 50) {
            // Add broader search for larger radius
            const firstWord = locationQuery.split(' ')[0];
            params.push(`%${firstWord}%`);
            locationConditions.push(`"location" ILIKE $${paramIndex++}`);
          }
          
          additionalWhere += ` AND (${locationConditions.join(' OR ')})`;
        }

        const query = `
          SELECT cp.*,
            ${rankExpr} AS rank,
            u."firstName", u."lastName", u."email", u."image", u."role", u."profileSlug", u."isAnonymous", u."customInitials", u."id" as "userId"
          FROM "CandidateProfile" cp
          JOIN "User" u ON cp."userId" = u."id"
          WHERE (${whereClauses.join(' OR ')})
          AND cp."status" = 'APPROVED'
          AND cp."bio" IS NOT NULL AND cp."bio" != ''
          AND cp."location" IS NOT NULL AND cp."location" != ''
          AND u."isDeleted" = false
          ${additionalWhere}
          ORDER BY rank DESC
          LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}
        `;
        
        
        let professionals = await prisma.$queryRawUnsafe(query, ...params) as any[];
        
        // Transform raw results to match expected structure
        professionals = professionals.map((prof: any) => ({
          id: prof.id,
          bio: prof.bio,
          title: prof.title,
          preferredRole: prof.preferredRole,
          location: prof.location,
          skills: prof.skills,
          openToWork: prof.openToWork,
          employmentType: prof.employmentType,
          status: prof.status,
          user: {
            id: prof.userId,
            email: prof.email,
            firstName: prof.firstName,
            lastName: prof.lastName,
            image: prof.image,
            role: prof.role,
            profileSlug: prof.profileSlug,
            isAnonymous: prof.isAnonymous,
            customInitials: prof.customInitials,
          },
        }));

        // Get total count for pagination (reuse the same where conditions but without limit/offset)
        const countQuery = `
          SELECT COUNT(*) as total
          FROM "CandidateProfile" cp
          JOIN "User" u ON cp."userId" = u."id"
          WHERE (${whereClauses.join(' OR ')})
          AND cp."status" = 'APPROVED'
          AND cp."bio" IS NOT NULL AND cp."bio" != ''
          AND cp."location" IS NOT NULL AND cp."location" != ''
          AND u."isDeleted" = false
          ${additionalWhere}
        `;
        
        // Create count params (exclude limit and offset)
        const countParams = params.slice(0, -2); // Remove the last two params (limit and offset)
        
        const totalResult = await prisma.$queryRawUnsafe(countQuery, ...countParams) as any[];
        const total = parseInt(totalResult[0]?.total || '0');


        // Apply anonymization
        let shouldAnonymize = false
        
        if (session?.user?.role === "PROFESSIONAL") {
          shouldAnonymize = true
        } else if (isEmployerOrAgency) {
          shouldAnonymize = !hasNetworkAccess
        }
        
        const anonymizedProfessionals = professionals.map(professional => {
          if (shouldAnonymize) {
            return {
              ...professional,
              user: {
                ...professional.user,
                firstName: professional.user.firstName?.[0] || '',
                lastName: professional.user.lastName?.[0] || '',
                image: null,
                email: '',
                isAnonymous: true,
                preferredAnonymity: professional.user.isAnonymous || false,
                customInitials: professional.user.customInitials || null,
              }
            };
          }
          return {
            ...professional,
            user: {
              ...professional.user,
              preferredAnonymity: professional.user.isAnonymous || false,
            }
          };
        });

        return NextResponse.json({
          professionals: anonymizedProfessionals,
          pagination: {
            total,
            pages: Math.ceil(total / limit),
            page,
            limit,
          },
        })

      } catch (error) {
        console.error('Fuzzy search failed, falling back to standard search:', error);
        // Fall through to standard search
      }
    }

    // Helper function for state expansion (reused for fallback)
    const expandLocationQueryFallback = (loc: string): string[] => {
      const stateMap: Record<string, string> = {
        'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR', 'california': 'CA',
        'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE', 'florida': 'FL', 'georgia': 'GA',
        'hawaii': 'HI', 'idaho': 'ID', 'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA',
        'kansas': 'KS', 'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
        'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS', 'missouri': 'MO',
        'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ',
        'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH',
        'oklahoma': 'OK', 'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
        'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT', 'vermont': 'VT',
        'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV', 'wisconsin': 'WI', 'wyoming': 'WY'
      };
      
      const reverseStateMap: Record<string, string> = Object.fromEntries(
        Object.entries(stateMap).map(([name, abbr]) => [abbr.toLowerCase(), name])
      );

      const variations: string[] = [loc];
      const lowerLoc = loc.toLowerCase();

      // If it's a state name, add abbreviation
      if (stateMap[lowerLoc]) {
        variations.push(stateMap[lowerLoc]);
      }
      // If it's a state abbreviation, add full name
      else if (reverseStateMap[lowerLoc]) {
        variations.push(reverseStateMap[lowerLoc]);
      }

      return variations;
    };

    // Build location filter with state variations for fallback search
    const buildLocationFilter = () => {
      if (!location) return {};
      
      const locationVariations = expandLocationQueryFallback(location);
      
      // If radius is large, make search more flexible
      if (radius && radius > 50) {
        return {
          OR: [
            ...locationVariations.map(variation => ({
              location: { contains: variation, mode: 'insensitive' as Prisma.QueryMode }
            })),
            // Add broader search for large radius
            { location: { contains: location.split(' ')[0], mode: 'insensitive' as Prisma.QueryMode } }
          ]
        };
      } else {
        return {
          OR: locationVariations.map(variation => ({
            location: { contains: variation, mode: 'insensitive' as Prisma.QueryMode }
          }))
        };
      }
    };

    // Standard search (fallback)
    const where = {
      // Only show approved profiles (pending profiles need admin approval)
      status: 'APPROVED',
      // Basic profile completion requirements
      NOT: {
        OR: [
          { bio: null },
          { bio: '' },
          { location: null },
          { location: '' }
        ]
      },
      // Filter conditions
      ...(location ? buildLocationFilter() : {}),
      // Combine user filters
      user: {
        isDeleted: false,
        ...(roleType ? { role: roleType } : {}),
      },
      ...(roles.length > 0 ? { preferredRole: { in: roles } } : {}),
      ...(openToWork ? { openToWork: true } : {}),
      ...(searchQuery
        ? {
            OR: [
              {
                user: {
                  OR: [
                    {
                      firstName: {
                        contains: searchQuery,
                        mode: 'insensitive' as Prisma.QueryMode,
                      },
                    },
                    {
                      lastName: {
                        contains: searchQuery,
                        mode: 'insensitive' as Prisma.QueryMode,
                      },
                    },
                  ],
                },
              },
              {
                bio: {
                  contains: searchQuery,
                  mode: 'insensitive' as Prisma.QueryMode,
                },
              },
              {
                title: {
                  contains: searchQuery,
                  mode: 'insensitive' as Prisma.QueryMode,
                },
              },
              {
                preferredRole: {
                  contains: searchQuery,
                  mode: 'insensitive' as Prisma.QueryMode,
                },
              },
              {
                location: {
                  contains: searchQuery,
                  mode: 'insensitive' as Prisma.QueryMode,
                },
              },
              {
                skills: {
                  has: searchQuery,
                },
              },
            ],
          }
        : {}),
    }

    // Define sorting based on sortBy parameter
    const orderBy = (() => {
      switch (sortBy) {
        case 'recent':
          return { updatedAt: 'desc' as const }
        case 'experience':
          return { updatedAt: 'desc' as const } // Fallback to recent as experience count is not directly sortable
        case 'certifications':
          return { certifications: 'desc' as const }
        case 'views':
          return { profileViews: 'desc' as const }
        case 'relevance':
          return searchQuery
            ? { updatedAt: 'desc' as const } // Fallback to recent as relevance sorting is not supported
            : { updatedAt: 'desc' as const }
        default:
          return { updatedAt: 'desc' as const }
      }
    })()


    const [professionals, total] = await Promise.all([
      prisma.candidateProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          bio: true,
          title: true,
          preferredRole: true,
          location: true,
          skills: true,
          openToWork: true,
          employmentType: true,
          status: true,
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              image: true,
              role: true,
              profileSlug: true,
              isAnonymous: true,
              customInitials: true,
            },
          },
        },
      }),
      prisma.candidateProfile.count({ where }),
    ])


    // Anonymize data based on user role and network access
    let shouldAnonymize = false
    
    if (session?.user?.role === "PROFESSIONAL") {
      // Professionals viewing other professionals should see anonymized profiles
      shouldAnonymize = true
    } else if (isEmployerOrAgency) {
      // Employers/agencies without network access should see anonymized profiles
      shouldAnonymize = !hasNetworkAccess
    }
    
    
    const anonymizedProfessionals = professionals.map(professional => {
      const userWantsAnonymous = professional.user.isAnonymous || false;
      
      if (shouldAnonymize || userWantsAnonymous) {
        return {
          ...professional,
          user: {
            ...professional.user,
            firstName: professional.user.firstName?.[0] || '',
            lastName: professional.user.lastName?.[0] || '',
            image: shouldAnonymize ? null : professional.user.image, // Hide profile image only if forced anonymization
            email: shouldAnonymize ? '' : professional.user.email, // Hide email only if forced anonymization
            isAnonymous: true, // Mark as anonymous when anonymized
            preferredAnonymity: professional.user.isAnonymous || false, // Original anonymity preference
            customInitials: (professional.user as any).customInitials || null,
          }
        };
      }
      return {
        ...professional,
        user: {
          ...professional.user,
          isAnonymous: false, // Not anonymous when user doesn't want it and employer has access
          preferredAnonymity: professional.user.isAnonymous || false, // Original anonymity preference
        }
      };
    });

    return NextResponse.json({
      professionals: anonymizedProfessionals,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit,
      },
    })
  } catch (error) {
    console.error('Error fetching professionals:', error)
    return NextResponse.json(
      { error: 'Failed to fetch professionals' },
      { status: 500 }
    )
  }
} 