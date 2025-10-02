/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma, adminAuthOptions, logAdminAction, UserRole } from "@bell-registry/shared";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(adminAuthOptions);
    
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Log this admin action
    await logAdminAction(
      session.user.id,
      "VIEW_PROFILE_STATS",
      { endpoint: "/api/profiles/stats" },
      request.ip,
      request.headers.get("user-agent") || undefined
    );

    // Get profile statistics (professionals only)
    const [
      totalProfessionals,
      totalProfessionalsWithCompletedProfile,
      totalPendingProfessionals,
    ] = await Promise.all([
      // Total professionals (excluding deleted, demo users, and test users)
      prisma.user.count({
        where: { 
          isDeleted: false,
          isDemo: false,
          email: {
            not: {
              contains: 'test.com'
            }
          },
          NOT: {
            email: {
              contains: 'example.com'
            }
          },
          role: UserRole.PROFESSIONAL
        }
      }),
      
      // Total professionals with completed profiles (all required fields filled)
      prisma.user.count({
        where: { 
          isDeleted: false,
          isDemo: false,
          email: {
            not: {
              contains: 'test.com'
            }
          },
          NOT: {
            email: {
              contains: 'example.com'
            }
          },
          role: UserRole.PROFESSIONAL,
          candidateProfile: {
            bio: {
              not: null
            },
            title: {
              not: null
            },
            location: {
              not: null
            },
            user: {
              firstName: {
                not: null
              },
              lastName: {
                not: null
              }
            }
          }
        }
      }),
      
      // Total pending professionals (PENDING status)
      prisma.user.count({
        where: { 
          isDeleted: false,
          isDemo: false,
          email: {
            not: {
              contains: 'test.com'
            }
          },
          NOT: {
            email: {
              contains: 'example.com'
            }
          },
          role: UserRole.PROFESSIONAL,
          candidateProfile: {
            status: 'PENDING'
          }
        }
      }),
    ]);

    // Calculate professionals without completed profiles
    const totalProfessionalsWithoutCompletedProfile = totalProfessionals - totalProfessionalsWithCompletedProfile;

    const stats = {
      totalUsers: totalProfessionals,
      totalUsersWithCompletedProfile: totalProfessionalsWithCompletedProfile,
      totalPendingUsers: totalPendingProfessionals,
      totalUsersWithoutCompletedProfile: totalProfessionalsWithoutCompletedProfile,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching profile stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile statistics" },
      { status: 500 }
    );
  }
}
