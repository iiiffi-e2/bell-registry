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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(adminAuthOptions);
    
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = params.id;

    // Get user with their candidate profile and additional data
    const user = await (prisma as any).user.findUnique({
      where: { 
        id: userId,
        isDeleted: false 
      },
      include: {
        candidateProfile: true,
        employerProfile: true,
        postedJobs: {
          select: {
            id: true,
            title: true,
            status: true,
            createdAt: true
          },
          take: 10 // Limit for performance
        },
        applications: {
          select: {
            id: true,
            status: true,
            createdAt: true,
            job: {
              select: {
                title: true,
                employer: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                }
              }
            }
          },
          take: 10 // Limit for performance
        },
        sentMessages: {
          select: {
            id: true,
            createdAt: true
          },
          take: 5
        },
        profileViewEvents: {
          select: {
            viewedAt: true
          },
          orderBy: {
            viewedAt: 'desc'
          },
          take: 10
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get reports against this user
    let reports = [];
    try {
      reports = await (prisma as any).profileReport.findMany({
        where: {
          reportedUserId: userId
        },
        include: {
          reporterUser: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 20
      });
    } catch (error) {
      // If profileReport table doesn't exist yet, use empty array
      reports = [];
    }

    // Transform the data to match frontend expectations
    const profileData = {
      id: user.candidateProfile?.id || user.id,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        image: getImageUrl(user.image),
        profileSlug: user.profileSlug,
      },
      
      // Profile data from candidateProfile (or defaults)
      bio: user.candidateProfile?.bio || null,
      preferredRole: user.candidateProfile?.preferredRole || null,
      location: user.candidateProfile?.location || null,
      profileViews: user.candidateProfile?.profileViews || 0,
      openToWork: user.candidateProfile?.openToWork || false,
      skills: user.candidateProfile?.skills || [],
      experience: user.candidateProfile?.experience || [],
      certifications: user.candidateProfile?.certifications || [],
      workLocations: user.candidateProfile?.workLocations || [],
      seekingOpportunities: user.candidateProfile?.seekingOpportunities || [],
      payRangeMin: user.candidateProfile?.payRangeMin || null,
      payRangeMax: user.candidateProfile?.payRangeMax || null,
      payType: user.candidateProfile?.payType || null,
      yearsOfExperience: user.candidateProfile?.yearsOfExperience || null,
      createdAt: user.candidateProfile?.createdAt || user.createdAt,
      updatedAt: user.candidateProfile?.updatedAt || user.updatedAt,
      
      // Status and admin fields (prioritize account restrictions over profile status)
      status: (() => {
        // Account-level restrictions take priority
        if (user.isBanned) return 'BANNED';
        if (user.isSuspended) return 'SUSPENDED';
        // Otherwise use profile status
        return user.candidateProfile?.status || 'PENDING';
      })(),
      reportCount: reports.length,
      reports: reports,
      
      // Additional admin data
      adminData: {
        role: user.role,
        emailVerified: user.emailVerified,
        isDemo: user.isDemo || false,
        isSuspended: user.isSuspended || false,
        isBanned: user.isBanned || false,
        suspensionReason: user.suspensionReason,
        suspensionNote: user.suspensionNote,
        suspendedAt: user.suspendedAt,
        bannedAt: user.bannedAt,
        twoFactorEnabled: user.twoFactorEnabled,
        
        // Profile data
        candidateProfile: user.candidateProfile ? {
          ...user.candidateProfile,
          photoUrl: getImageUrl(user.candidateProfile.photoUrl),
          resumeUrl: getImageUrl(user.candidateProfile.resumeUrl),
          headshot: getImageUrl(user.candidateProfile.headshot),
          additionalPhotos: user.candidateProfile.additionalPhotos?.map((url: string) => getImageUrl(url)).filter(Boolean) || [],
          mediaUrls: user.candidateProfile.mediaUrls?.map((url: string) => getImageUrl(url)).filter(Boolean) || []
        } : null,
        
        employerProfile: user.employerProfile ? {
          ...user.employerProfile,
          logoUrl: getImageUrl(user.employerProfile.logoUrl)
        } : null,
        
        // Activity data
        stats: {
          jobsPosted: user.postedJobs?.length || 0,
          applicationsSubmitted: user.applications?.length || 0,
          messagesSent: user.sentMessages?.length || 0,
          profileViews: user.candidateProfile?.profileViews || 0,
          reportsReceived: reports.length
        },
        
        // Recent activity
        recentJobs: user.postedJobs || [],
        recentApplications: user.applications || [],
        recentProfileViews: user.profileViewEvents || []
      }
    };

    // Log this admin action
    await logAdminAction(
      session.user.id,
      "VIEW_PROFILE_DETAILS",
      { 
        viewedUserId: userId,
        viewedUserEmail: user.email,
        viewedUserRole: user.role
      },
      request.ip,
      request.headers.get("user-agent") || undefined
    );

    return NextResponse.json(profileData);

  } catch (error) {
    console.error("Error fetching profile details:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile details" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(adminAuthOptions);
    
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = params.id;
    const body = await request.json();
    const { action, reason, note } = body;

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let updatedUser;
    let actionType = "";

    switch (action) {
      case 'suspend':
        updatedUser = await (prisma as any).user.update({
          where: { id: userId },
          data: {
            isSuspended: true,
            suspensionReason: reason,
            suspensionNote: note,
            suspendedAt: new Date(),
            suspendedBy: session.user.id
          }
        });
        actionType = "SUSPEND_USER";
        break;

      case 'unsuspend':
        updatedUser = await (prisma as any).user.update({
          where: { id: userId },
          data: {
            isSuspended: false,
            suspensionReason: null,
            suspensionNote: null,
            suspendedAt: null,
            suspendedBy: null
          }
        });
        actionType = "UNSUSPEND_USER";
        break;

      case 'ban':
        updatedUser = await (prisma as any).user.update({
          where: { id: userId },
          data: {
            isBanned: true,
            bannedAt: new Date(),
            bannedBy: session.user.id
          }
        });
        actionType = "BAN_USER";
        break;

      case 'unban':
        updatedUser = await (prisma as any).user.update({
          where: { id: userId },
          data: {
            isBanned: false,
            bannedAt: null,
            bannedBy: null
          }
        });
        actionType = "UNBAN_USER";
        break;

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Log this admin action
    await logAdminAction(
      session.user.id,
      actionType,
      { 
        targetUserId: userId,
        targetUserEmail: user.email,
        reason: reason,
        note: note
      },
      request.ip,
      request.headers.get("user-agent") || undefined
    );

    return NextResponse.json({ 
      success: true, 
      message: `User ${action}ed successfully`,
      user: updatedUser 
    });

  } catch (error) {
    console.error(`Error updating user:`, error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
} 