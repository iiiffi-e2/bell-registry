import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const currentUserId = session?.user?.id;

    // Find the job by URL slug to get the job ID and employer ID
    const job = await prisma.job.findUnique({
      where: {
        urlSlug: params.slug,
      },
      select: {
        id: true,
        employerId: true,
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    // Only track view if the viewer is not the job creator (employer or agency)
    if (currentUserId !== job.employerId) {
      try {
        // Check for rate limiting using cookies
        const cookieName = `job_viewed_${job.id}`;
        const existingCookie = request.cookies.get(cookieName);
        
        if (existingCookie) {
          // Cookie exists, check if it's still within the rate limit window
          const cookieTime = parseInt(existingCookie.value);
          const oneHourAgo = Date.now() - (60 * 60 * 1000); // 1 hour in milliseconds
          
          if (cookieTime > oneHourAgo) {
            // Still within rate limit window
            return NextResponse.json({ 
              success: true, 
              tracked: false, 
              reason: "rate_limited" 
            });
          }
        }

        // No recent view found, track the view
        await prisma.$executeRaw`
          INSERT INTO "JobViewEvent" (id, "jobId", "userId", "viewedAt")
          VALUES (gen_random_uuid(), ${job.id}, ${currentUserId}, NOW())
        `;

        // Set cookie with current timestamp for rate limiting
        const response = NextResponse.json({ success: true, tracked: true });
        response.cookies.set(cookieName, Date.now().toString(), {
          maxAge: 60 * 60, // 1 hour in seconds
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax'
        });

        return response;
      } catch (error) {
        console.error("Error tracking job view:", error);
        return NextResponse.json(
          { error: "Failed to track view" },
          { status: 500 }
        );
      }
    }

    // Return success even if we didn't track the view (employer viewing own job)
    return NextResponse.json({ success: true, tracked: false, reason: "own_job" });
  } catch (error) {
    console.error("Error in job view tracking:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 