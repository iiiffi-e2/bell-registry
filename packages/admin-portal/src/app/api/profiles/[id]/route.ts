import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma, adminAuthOptions, logAdminAction } from "@bell-registry/shared";
import { UserRole } from "@bell-registry/shared";

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

    // Get detailed profile information
    const user = await prisma.user.findUnique({
      where: { id: profileId },
      include: {
        candidateProfile: true
      }
    });

    // Get profile reports separately
    let profileReports: any[] = [];
    try {
             profileReports = await (prisma as any).profileReport.findMany({
        where: {
          reportedUserId: profileId
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
        }
      });
    } catch (error) {
      // If profileReport table doesn't exist yet, use empty array
      profileReports = [];
    }

    if (!user || !user.candidateProfile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Transform the data for the frontend
    const profileDetail = {
      id: user.candidateProfile.id,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        image: user.image,
        profileSlug: user.profileSlug,
      },
      bio: user.candidateProfile.bio,
      preferredRole: user.candidateProfile.preferredRole,
      location: user.candidateProfile.location,
      profileViews: user.candidateProfile.profileViews,
      openToWork: user.candidateProfile.openToWork,
      skills: user.candidateProfile.skills,
      experience: user.candidateProfile.experience,
      certifications: user.candidateProfile.certifications,
      workLocations: user.candidateProfile.workLocations,
      seekingOpportunities: user.candidateProfile.seekingOpportunities,
      payRangeMin: user.candidateProfile.payRangeMin,
      payRangeMax: user.candidateProfile.payRangeMax,
      payType: user.candidateProfile.payType,
      yearsOfExperience: user.candidateProfile.yearsOfExperience,
      createdAt: user.candidateProfile.createdAt,
      updatedAt: user.candidateProfile.updatedAt,
      status: (user.candidateProfile as any).status || 'PENDING', // Use actual status from database with fallback
      reportCount: profileReports.length, // Use actual report count
      reports: profileReports, // Include the actual reports
    };

    // Log this admin action
    await logAdminAction(
      session.user.id,
      "VIEW_PROFILE_DETAIL",
      { 
        endpoint: `/api/profiles/${profileId}`,
        targetUserId: profileId,
        targetUserEmail: user.email,
        targetUserName: `${user.firstName} ${user.lastName}`.trim()
      },
      request.ip,
      request.headers.get("user-agent") || undefined
    );

    return NextResponse.json(profileDetail);

  } catch (error) {
    console.error("Error fetching profile detail:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile detail" },
      { status: 500 }
    );
  }
} 