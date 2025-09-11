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

    const { id: employerId } = params;

    // Log this admin action
    await logAdminAction(
      session.user.id,
      "VIEW_EMPLOYER_DETAILS",
      { endpoint: `/api/employers/${employerId}`, targetId: employerId },
      request.ip,
      request.headers.get("user-agent") || undefined
    );

    // Get the user and their employer profile
    const user = await prisma.user.findUnique({
      where: { 
        id: employerId,
        isDeleted: false 
      },
      include: {
        employerProfile: true,
        postedJobs: {
          select: {
            id: true,
            title: true,
            status: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 10 // Limit for performance
        }
      }
    });

    if (!user || !user.employerProfile || !['EMPLOYER', 'AGENCY'].includes(user.role)) {
      return NextResponse.json({ error: "Employer not found" }, { status: 404 });
    }

    // Get reports for this employer
    let reports: any[] = [];
    let reportCount = 0;
    
    try {
      reports = await (prisma as any).profileReport.findMany({
        where: {
          reportedUserId: employerId
        },
        include: {
          reporter: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 20
      });
      reportCount = reports.length;
    } catch (error) {
      // If profileReport table doesn't exist yet, default to empty
      reports = [];
      reportCount = 0;
    }

    // Transform the data
    const employerDetail = {
      id: user.employerProfile.id,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        createdAt: user.createdAt,
        image: getImageUrl(user.image),
        membershipAccess: user.membershipAccess,
        role: user.role,
        isSuspended: user.isSuspended || false,
        isBanned: user.isBanned || false,
        suspensionReason: user.suspensionReason,
        suspensionNote: user.suspensionNote,
      },
      companyName: user.employerProfile.companyName,
      industry: user.employerProfile.industry,
      location: user.employerProfile.location,
      subscriptionType: user.employerProfile.subscriptionType,
      subscriptionStartDate: user.employerProfile.subscriptionStartDate,
      subscriptionEndDate: user.employerProfile.subscriptionEndDate,
      jobCredits: user.employerProfile.jobCredits || 0,
      jobsPostedCount: user.employerProfile.jobsPostedCount || 0,
      hasNetworkAccess: user.employerProfile.hasNetworkAccess || false,
      stripeCustomerId: user.employerProfile.stripeCustomerId,
      logoUrl: getImageUrl(user.employerProfile.logoUrl),
      website: user.employerProfile.website,
      description: user.employerProfile.description,
      createdAt: user.employerProfile.createdAt,
      postedJobs: user.postedJobs,
      reportCount,
      reports
    };

    return NextResponse.json({
      employer: employerDetail
    });

  } catch (error) {
    console.error("Error fetching employer details:", error);
    return NextResponse.json(
      { error: "Failed to fetch employer details" },
      { status: 500 }
    );
  }
}
