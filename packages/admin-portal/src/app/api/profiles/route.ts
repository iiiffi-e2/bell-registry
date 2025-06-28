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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const hasReports = searchParams.get('hasReports') === 'true';
    const openToWork = searchParams.get('openToWork');
    const sortBy = searchParams.get('sortBy') || 'newest';

    // Build where clause
    const whereClause: any = {
      user: { 
        isDeleted: false,
        role: 'PROFESSIONAL' // Only show professional profiles
      }
    };

    // Status filter
    if (status && status !== 'all') {
      whereClause.status = status;
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

    // Get profiles with user data
    const profiles = await prisma.candidateProfile.findMany({
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
          }
        }
      },
      orderBy,
      take: 100 // Limit results for performance
    });

    // Transform data with actual status and report count
    const transformedProfiles = await Promise.all(profiles.map(async (profile) => {
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

      return {
        id: profile.id,
        user: {
          id: profile.user.id,
          firstName: profile.user.firstName,
          lastName: profile.user.lastName,
          email: profile.user.email,
          createdAt: profile.user.createdAt,
          image: profile.user.image,
          profileSlug: profile.user.profileSlug,
        },
        preferredRole: profile.preferredRole,
        location: profile.location,
        profileViews: profile.profileViews,
        openToWork: profile.openToWork,
        createdAt: profile.createdAt,
        status: (profile as any).status || 'PENDING', // Use actual status from database with fallback
        reportCount: reportCount, // Use actual report count
      };
    }));

    // Filter by reports if requested
    const filteredProfiles = hasReports 
      ? transformedProfiles.filter(p => p.reportCount > 0)
      : transformedProfiles;

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
        filters: { status, search, hasReports, openToWork, sortBy },
        resultCount: finalProfiles.length
      },
      request.ip,
      request.headers.get("user-agent") || undefined
    );

    return NextResponse.json({
      profiles: finalProfiles,
      total: finalProfiles.length
    });

  } catch (error) {
    console.error("Error fetching profiles:", error);
    return NextResponse.json(
      { error: "Failed to fetch profiles" },
      { status: 500 }
    );
  }
} 