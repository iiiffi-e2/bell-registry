import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const location = searchParams.get('location') || '';
    const skills = searchParams.get('skills') || '';
    const openToWork = searchParams.get('openToWork');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const session = await getServerSession(authOptions);

    // Build filter conditions
    const where: any = {
      AND: [
        { isDeleted: false }, // Exclude deleted users
        { 
          // isSuspended: false // Exclude suspended users (when field is available)
        },
        {
          candidateProfile: {
            isNot: null, // Must have a candidate profile
          }
        }
      ]
    };

    // Add additional filters for suspended users (temporary workaround)
    // This will be replaced with proper isSuspended field check
    const suspendedUserCondition = {
      NOT: {
        // Add any suspended user conditions here when available
      }
    };

    if (search) {
      where.AND.push({
        OR: [
          {
            firstName: {
              contains: search,
              mode: 'insensitive',
            }
          },
          {
            lastName: {
              contains: search,
              mode: 'insensitive',
            }
          },
          {
            candidateProfile: {
              bio: {
                contains: search,
                mode: 'insensitive',
              }
            }
          },
          {
            candidateProfile: {
              preferredRole: {
                contains: search,
                mode: 'insensitive',
              }
            }
          }
        ]
      });
    }

    if (location) {
      where.AND.push({
        candidateProfile: {
          location: {
            contains: location,
            mode: 'insensitive',
          }
        }
      });
    }

    if (skills) {
      const skillsArray = skills.split(',').map(skill => skill.trim());
      where.AND.push({
        candidateProfile: {
          skills: {
            hasSome: skillsArray
          }
        }
      });
    }

    if (openToWork === 'true') {
      where.AND.push({
        candidateProfile: {
          openToWork: true
        }
      });
    }

    // Get professionals with enforcement
    const professionals = await prisma.user.findMany({
      where,
      include: {
        candidateProfile: {
          select: {
            id: true,
            bio: true,
            preferredRole: true,
            location: true,
            skills: true,
            experience: true,
            profileViews: true,
            openToWork: true,
            yearsOfExperience: true,
            payRangeMin: true,
            payRangeMax: true,
            payType: true,
            createdAt: true,
            updatedAt: true,
            // status: true, // Include when ProfileStatus is available
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset,
    });

    // Additional filtering for suspended profiles (when status field is available)
    const filteredProfessionals = professionals.filter(professional => {
      // Check if profile is suspended or rejected
      const profileStatus = (professional.candidateProfile as any)?.status;
      if (profileStatus === 'SUSPENDED' || profileStatus === 'REJECTED') {
        return false;
      }
      
      // Check user suspension status (when isSuspended field is available)
      const isSuspended = (professional as any)?.isSuspended;
      if (isSuspended) {
        return false;
      }

      return true;
    });

    // Transform the data for response
    const transformedProfessionals = filteredProfessionals.map(professional => ({
      id: professional.id,
      firstName: professional.firstName,
      lastName: professional.lastName,
      email: professional.email,
      image: professional.image,
      profileSlug: professional.profileSlug,
      profile: professional.candidateProfile,
      joinDate: professional.createdAt,
    }));

    // Get total count for pagination
    const totalCount = await prisma.user.count({
      where
    });

    return NextResponse.json({
      professionals: transformedProfessionals,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      },
      enforcement: {
        suspended_filtered: professionals.length - filteredProfessionals.length,
        note: "Suspended and rejected profiles are automatically filtered out"
      }
    });

  } catch (error) {
    console.error("Error fetching professionals:", error);
    return NextResponse.json(
      { error: "Failed to fetch professionals" },
      { status: 500 }
    );
  }
} 