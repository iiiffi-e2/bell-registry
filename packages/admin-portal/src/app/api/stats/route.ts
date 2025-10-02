/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma, adminAuthOptions, logAdminAction } from "@bell-registry/shared";
import { UserRole } from "@bell-registry/shared";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(adminAuthOptions);
    
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Log this admin action
    await logAdminAction(
      session.user.id,
      "VIEW_STATS",
      { endpoint: "/api/stats" },
      request.ip,
      request.headers.get("user-agent") || undefined
    );

    // Fetch real stats from database
    const [
      totalUsers,
      totalProfessionals,
      totalEmployers,
      pendingProfiles,
      pendingJobs,
      totalJobs,
      totalApplications,
      activeConversations,
    ] = await Promise.all([
      // Total users (excluding deleted, demo users, and test users)
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
          }
        }
      }),
      
      // Total professionals (excluding deleted, demo users, and test users)
      prisma.user.count({
        where: { 
          role: UserRole.PROFESSIONAL,
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
          }
        }
      }),
      
      // Total employers (excluding deleted, demo users, and test users)
      prisma.user.count({
        where: { 
          role: UserRole.EMPLOYER,
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
          }
        }
      }),
      
      // Pending profiles (profiles awaiting approval)
      prisma.candidateProfile.count({
        where: { 
          status: 'PENDING',
          user: { 
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
            }
          }
        }
      }),
      
      // Pending jobs (jobs awaiting admin approval)
      prisma.job.count({
        where: { 
          adminStatus: 'PENDING',
          employer: { 
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
            }
          }
        }
      }),
      
      // Total active jobs
      prisma.job.count({
        where: { 
          status: "ACTIVE",
          employer: { 
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
            }
          }
        }
      }),
      
      // Total job applications
      prisma.jobApplication.count({
        where: {
          candidate: { 
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
            }
          },
          job: { 
            employer: { 
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
              }
            } 
          }
        }
      }),
      
      // Active conversations
      prisma.conversation.count({
        where: { 
          status: "ACTIVE",
          client: { 
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
            }
          },
          professional: { 
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
            }
          }
        }
      }),
    ]);

    const stats = {
      totalUsers,
      totalProfessionals,
      totalEmployers,
      pendingProfiles,
      pendingJobs,
      totalJobs,
      totalApplications,
      activeConversations,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 }
    );
  }
} 