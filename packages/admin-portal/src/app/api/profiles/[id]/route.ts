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

    const profileId = params.id;

    // Get profile with user data
    const profile = await prisma.candidateProfile.findFirst({
      where: { 
        userId: profileId,
        user: { 
          isDeleted: false,
          role: 'PROFESSIONAL'
        }
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
            createdAt: true,
            lastLoginAt: true,
            image: true,
            profileSlug: true,
          }
        }
      }
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Get report count for this user
    let reportCount = 0;
    let reports = [];
    try {
      reportCount = await (prisma as any).profileReport.count({
        where: {
          reportedUserId: profile.user.id
        }
      });
      
      reports = await (prisma as any).profileReport.findMany({
        where: {
          reportedUserId: profile.user.id
        },
        include: {
          reporter: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    } catch (error) {
      console.warn("ProfileReport table not available yet:", error);
    }

    // Transform the profile data
    const transformedProfile = {
      id: profile.id,
      user: {
        id: profile.user.id,
        firstName: profile.user.firstName,
        lastName: profile.user.lastName,
        email: profile.user.email,
        phoneNumber: profile.user.phoneNumber,
        createdAt: profile.user.createdAt,
        lastLoginAt: profile.user.lastLoginAt,
        image: getImageUrl(profile.user.image), // Transform image URL
        profileSlug: profile.user.profileSlug,
      },
      bio: profile.bio,
      preferredRole: profile.preferredRole,
      location: profile.location,
      profileViews: profile.profileViews,
      openToWork: profile.openToWork,
      skills: profile.skills,
      experience: profile.experience,
      certifications: profile.certifications,
      workLocations: profile.workLocations,
      seekingOpportunities: profile.seekingOpportunities,
      payRangeMin: profile.payRangeMin,
      payRangeMax: profile.payRangeMax,
      payType: profile.payType,
      yearsOfExperience: profile.yearsOfExperience,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
      status: (profile as any).status || 'PENDING',
      reportCount: reportCount,
      reports: reports,
    };

    // Log this admin action
    await logAdminAction(
      session.user.id,
      "VIEW_PROFILE_DETAIL",
      { 
        endpoint: `/api/profiles/${profileId}`,
        targetUserId: profile.user.id,
        targetUserEmail: profile.user.email,
        targetUserName: `${profile.user.firstName} ${profile.user.lastName}`.trim(),
      },
      request.ip,
      request.headers.get("user-agent") || undefined
    );

    return NextResponse.json(transformedProfile);

  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
} 