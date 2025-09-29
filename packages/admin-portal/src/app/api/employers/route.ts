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
    const subscriptionType = searchParams.get('subscriptionType');
    const hasNetworkAccess = searchParams.get('hasNetworkAccess');
    const sortBy = searchParams.get('sortBy') || 'newest';
    const pageParam = parseInt(searchParams.get('page') || '1', 10);
    const pageSizeParam = parseInt(searchParams.get('pageSize') || '50', 10);
    const page = Number.isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
    const pageSize = Number.isNaN(pageSizeParam) || pageSizeParam < 1 ? 50 : Math.min(pageSizeParam, 100);

    // Build where clause for employer profiles
    const whereClause: any = {
      user: { 
        isDeleted: false,
        role: { in: ['EMPLOYER', 'AGENCY'] } // Include both employers and agencies
      }
    };

    // Status filter - this will be based on user account status since employer profiles don't have status
    // We'll determine status from user.isSuspended, user.isBanned, etc.

    // Search filter
    if (search) {
      whereClause.OR = [
        {
          companyName: { contains: search, mode: 'insensitive' }
        },
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
        },
        {
          industry: { contains: search, mode: 'insensitive' }
        }
      ];
    }

    // Subscription type filter
    if (subscriptionType && subscriptionType !== 'all') {
      if (subscriptionType === 'none') {
        whereClause.subscriptionType = null;
      } else {
        whereClause.subscriptionType = subscriptionType;
      }
    }

    // Network access filter
    if (hasNetworkAccess !== null) {
      whereClause.hasNetworkAccess = hasNetworkAccess === 'true';
    }

    // Sorting
    let orderBy: any = { createdAt: 'desc' }; // default newest first
    
    switch (sortBy) {
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'mostJobs':
        orderBy = { jobsPostedCount: 'desc' };
        break;
      case 'newest':
      default:
        orderBy = { createdAt: 'desc' };
        break;
    }

    // Count total for pagination (before status/report derived filters)
    const totalCount = await (prisma as any).employerProfile.count({
      where: whereClause
    });

    // Get employer profiles with user data
    const employerProfiles = await (prisma as any).employerProfile.findMany({
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
            isSuspended: true,
            isBanned: true,
            membershipAccess: true,
            role: true,
          }
        }
      },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize
    });

    // Transform data with actual status and report count
    const transformedEmployers = await Promise.all(employerProfiles.map(async (profile: any) => {
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

      // Determine display status based on account restrictions
      let displayStatus = 'APPROVED'; // Default for employer profiles
      if (profile.user.isBanned) {
        displayStatus = 'BANNED';
      } else if (profile.user.isSuspended) {
        displayStatus = 'SUSPENDED';
      } else if (profile.user.isRemoved) {
        displayStatus = 'REMOVED';
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
          membershipAccess: profile.user.membershipAccess,
          role: profile.user.role,
        },
        companyName: profile.companyName,
        industry: profile.industry,
        location: profile.location,
        subscriptionType: profile.subscriptionType,
        jobCredits: profile.jobCredits || 0,
        jobsPostedCount: profile.jobsPostedCount || 0,
        hasNetworkAccess: profile.hasNetworkAccess || false,
        createdAt: profile.createdAt,
        status: displayStatus, // Use computed display status
        reportCount: reportCount, // Use actual report count
      };
    }));

    // Filter by status if requested (after transformation since status is computed)
    let filteredEmployers = transformedEmployers;
    if (status && status !== 'all') {
      filteredEmployers = transformedEmployers.filter(e => e.status === status);
    }

    // Filter by reports if requested
    if (hasReports) {
      filteredEmployers = filteredEmployers.filter(e => e.reportCount > 0);
    }

    // Sort by most reported if requested
    const finalEmployers = sortBy === 'mostReported' 
      ? filteredEmployers.sort((a, b) => (b.reportCount || 0) - (a.reportCount || 0))
      : filteredEmployers;

    // Log this admin action
    await logAdminAction(
      session.user.id,
      "VIEW_EMPLOYERS",
      { 
        endpoint: "/api/employers",
        filters: { status, search, hasReports, subscriptionType, hasNetworkAccess, sortBy, page, pageSize },
        resultCount: finalEmployers.length
      },
      request.ip,
      request.headers.get("user-agent") || undefined
    );

    return NextResponse.json({
      employers: finalEmployers,
      total: totalCount,
      page,
      pageSize,
      hasMore: page * pageSize < totalCount
    });

  } catch (error) {
    console.error("Error fetching employers:", error);
    return NextResponse.json(
      { error: "Failed to fetch employers" },
      { status: 500 }
    );
  }
}
