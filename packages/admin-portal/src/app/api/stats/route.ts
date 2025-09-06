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
      // Total users (excluding deleted)
      prisma.user.count({
        where: { isDeleted: false }
      }),
      
      // Total professionals
      prisma.user.count({
        where: { 
          role: UserRole.PROFESSIONAL,
          isDeleted: false 
        }
      }),
      
      // Total employers
      prisma.user.count({
        where: { 
          role: UserRole.EMPLOYER,
          isDeleted: false 
        }
      }),
      
      // Pending profiles (we'll count all profiles for now and refine later)
      prisma.candidateProfile.count({
        where: { 
          user: { isDeleted: false }
        }
      }),
      
      // Pending jobs (jobs awaiting admin approval)
      prisma.job.count({
        where: { 
          adminStatus: 'PENDING',
          employer: { isDeleted: false }
        }
      }),
      
      // Total active jobs
      prisma.job.count({
        where: { 
          status: "ACTIVE",
          employer: { isDeleted: false }
        }
      }),
      
      // Total job applications
      prisma.jobApplication.count({
        where: {
          candidate: { isDeleted: false },
          job: { employer: { isDeleted: false } }
        }
      }),
      
      // Active conversations
      prisma.conversation.count({
        where: { 
          status: "ACTIVE",
          client: { isDeleted: false },
          professional: { isDeleted: false }
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