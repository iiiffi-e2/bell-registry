import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma, adminAuthOptions, logAdminAction } from "@bell-registry/shared";
import { UserRole } from "@bell-registry/shared";

// Helper function to convert relative image URLs to absolute URLs
function getImageUrl(imagePath: string | null): string | null {
  if (!imagePath) return null;
  
  // If it's already a full URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // If it's a relative path, prepend the main app URL
  const MAIN_APP_URL = process.env.MAIN_APP_URL || 'http://localhost:3000';
  
  // Handle paths that start with / or don't start with /
  const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  
  return `${MAIN_APP_URL}${cleanPath}`;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(adminAuthOptions);
    
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const hasReports = searchParams.get('hasReports') === 'true';
    const openToWork = searchParams.get('openToWork');
    const sortBy = searchParams.get('sortBy') || 'newest';
    const pageParam = parseInt(searchParams.get('page') || '1', 10);
    const pageSizeParam = parseInt(searchParams.get('pageSize') || '50', 10);
    const page = Number.isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
    const pageSize = Number.isNaN(pageSizeParam) || pageSizeParam < 1 ? 50 : Math.min(pageSizeParam, 100);

    // Build where clause
    const whereClause: any = {
      user: { 
        isDeleted: false,
        role: 'PROFESSIONAL' // Only show professional profiles
      }
    };

    // Status filter
    if (status && status !== 'all') {
      if (status === 'REMOVED') {
        // For removed status, check user's isRemoved field instead of profile status
        whereClause.user.isRemoved = true;
      } else if (status === 'INCOMPLETE') {
        // Incomplete profiles: missing any required field
        // We'll filter further after fetch for cases like bio length < 50
        whereClause.OR = [
          { bio: null },
          { bio: '' },
          { title: null },
          { title: '' },
          { location: null },
          { location: '' },
          { user: { firstName: null } },
          { user: { firstName: '' } },
          { user: { lastName: null } },
          { user: { lastName: '' } },
        ];
      } else {
        whereClause.status = status;
      }
    }

    // Search filter
    if (search) {
      whereClause.OR = [
        {
          user: {
            firstName: { contains: search, mode: 'insensitive' }
          }
        },
        {
          user: {
            lastName: { contains: search, mode: 'insensitive' }
          }
        },
        {
          user: {
            email: { contains: search, mode: 'insensitive' }
          }
        }
      ];
    }

    // Open to work filter
    if (openToWork !== null) {
      whereClause.openToWork = openToWork === 'true';
    }

    // Sorting
    let orderBy: any = { createdAt: 'desc' }; // default newest first
    
    switch (sortBy) {
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'mostViewed':
        orderBy = { profileViews: 'desc' };
        break;
      case 'newest':
      default:
        orderBy = { createdAt: 'desc' };
        break;
    }

    // Count total for pagination (before reports/incomplete post-filters)
    const totalCount = await (prisma as any).candidateProfile.count({
      where: whereClause
    });

    // Get profiles with user data
    const profiles = await (prisma as any).candidateProfile.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            createdAt: true,
            image: true,
            profileSlug: true,
            isSuspended: true,
            isBanned: true,
            membershipAccess: true,
            referralProfessionalName: true,
          }
        }
      },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize
    });

    // Transform data with actual status and report count
    const transformedProfiles = await Promise.all(profiles.map(async (profile: any) => {
      // Get actual report count for this user
      let reportCount = 0;
             try {
         reportCount = await (prisma as any).profileReport.count({
           where: {
             reportedUserId: profile.user.id
           }
         });
       } catch (error) {
         // If profileReport table doesn't exist yet, default to 0
         reportCount = 0;
       }

      // Determine display status (prioritize account restrictions over profile status)
      let displayStatus = profile.status || 'PENDING';
      if (profile.user.isBanned) {
        displayStatus = 'BANNED';
      } else if (profile.user.isSuspended) {
        displayStatus = 'SUSPENDED';
      }

      return {
        id: profile.id,
        user: {
          id: profile.user.id,
          firstName: profile.user.firstName,
          lastName: profile.user.lastName,
          email: profile.user.email,
          createdAt: profile.user.createdAt,
          image: getImageUrl(profile.user.image), // Transform image URL
          profileSlug: profile.user.profileSlug,
          membershipAccess: profile.user.membershipAccess,
          referralProfessionalName: profile.user.referralProfessionalName,
        },
        preferredRole: profile.preferredRole,
        location: profile.location,
        bio: profile.bio,
        profileViews: profile.profileViews,
        openToWork: profile.openToWork,
        createdAt: profile.createdAt,
        status: displayStatus, // Use computed display status
        reportCount: reportCount, // Use actual report count
      };
    }));

    // Additional filter for incomplete status (ensure bio meets length requirement)
    let filteredByStatus = transformedProfiles;
    if (status === 'INCOMPLETE') {
      filteredByStatus = transformedProfiles.filter(p => {
        const bioLen = (p.bio || '').trim().length;
        return (
          !p.user.firstName || !p.user.lastName ||
          !p.preferredRole || !p.location ||
          bioLen < 50
        );
      });
    }

    // Filter by reports if requested
    const filteredProfiles = hasReports 
      ? filteredByStatus.filter(p => p.reportCount > 0)
      : filteredByStatus;

    // Sort by most reported if requested
    const finalProfiles = sortBy === 'mostReported' 
      ? filteredProfiles.sort((a, b) => (b.reportCount || 0) - (a.reportCount || 0))
      : filteredProfiles;

    // Log this admin action
    await logAdminAction(
      session.user.id,
      "VIEW_PROFILES",
      { 
        endpoint: "/api/profiles",
        filters: { status, search, hasReports, openToWork, sortBy, page, pageSize },
        resultCount: finalProfiles.length
      },
      request.ip,
      request.headers.get("user-agent") || undefined
    );

    return NextResponse.json({
      profiles: finalProfiles,
      total: totalCount,
      page,
      pageSize,
      hasMore: page * pageSize < totalCount
    });

  } catch (error) {
    console.error("Error fetching profiles:", error);
    return NextResponse.json(
      { error: "Failed to fetch profiles" },
      { status: 500 }
    );
  }
} 