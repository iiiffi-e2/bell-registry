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
      "VIEW_JOBS",
      { endpoint: "/api/jobs" },
      request.ip,
      request.headers.get("user-agent") || undefined
    );

    // Get query parameters for filtering and pagination
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status'); // Filter by admin status
    const search = searchParams.get('search'); // Search in title or company name

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      employer: { isDeleted: false }
    };

    if (status && status !== 'ALL') {
      where.adminStatus = status;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { employer: { employerProfile: { companyName: { contains: search, mode: 'insensitive' } } } }
      ];
    }

    // Fetch jobs with employer information
    const [jobs, totalCount] = await Promise.all([
      prisma.job.findMany({
        where,
        include: {
          employer: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
              employerProfile: {
                select: {
                  companyName: true,
                  industry: true,
                  location: true
                }
              }
            }
          },
          approver: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          },
          rejecter: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          },
          _count: {
            select: {
              applications: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.job.count({ where })
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      jobs,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return NextResponse.json(
      { error: "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}
