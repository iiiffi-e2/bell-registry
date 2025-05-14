import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { prisma } from "@/lib/prisma";
import { generateProfileSlug } from "@/lib/utils";

// Use static rendering by default, only opt into dynamic when needed
export const dynamic = 'force-dynamic';
export const revalidate = 30; // Revalidate every 30 seconds

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { 
        status: 401,
        headers: {
          'Cache-Control': 'no-store'
        }
      });
    }

    const profile = await prisma.candidateProfile.findFirst({
      where: {
        user: {
          email: session.user.email
        }
      },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            image: true,
            profileSlug: true,
            id: true
          }
        }
      }
    });

    if (!profile) {
      return new NextResponse("Profile not found", { 
        status: 404,
        headers: {
          'Cache-Control': 'no-store'
        }
      });
    }

    // Add cache control headers for successful responses
    return NextResponse.json(profile, {
      headers: {
        'Cache-Control': 'private, max-age=30, must-revalidate',
        'Surrogate-Control': 'no-store',
        'Pragma': 'no-cache',
      }
    });
    
  } catch (error) {
    console.error("[PROFILE_GET]", error);
    return new NextResponse("Internal error", { 
      status: 500,
      headers: {
        'Cache-Control': 'no-store'
      }
    });
  }
}

export async function PUT(request: NextRequest) {
  console.log("[PROFILE_PUT] Request received");
  try {
    const session = await getServerSession(authOptions);
    console.log("[PROFILE_PUT] Session:", session);
    
    if (!session?.user?.email) {
      console.log("[PROFILE_PUT] No session or email");
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    console.log("[PROFILE_PUT] Request body:", body);
    
    const {
      bio,
      title,
      location,
      phoneNumber,
      skills,
      certifications,
      availability,
      experience,
      firstName,
      lastName
    } = body;

    // First get the user
    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email
      }
    });

    console.log("[PROFILE_PUT] User found:", user);

    if (!user) {
      console.log("[PROFILE_PUT] No user found");
      return new NextResponse("User not found", { status: 404 });
    }

    // Generate profile slug if it's null or if name changed
    let profileSlug = user.profileSlug;
    if ((!profileSlug && user.firstName && user.lastName) || 
        (firstName && lastName && (firstName !== user.firstName || lastName !== user.lastName))) {
      profileSlug = await generateProfileSlug(
        firstName || user.firstName, 
        lastName || user.lastName, 
        user.id
      );
    }

    // Update user's basic info
    await prisma.user.update({
      where: {
        id: user.id
      },
      data: {
        phoneNumber,
        firstName: firstName || user.firstName,
        lastName: lastName || user.lastName,
        profileSlug
      }
    });

    // Update or create profile
    const profile = await prisma.candidateProfile.upsert({
      where: {
        userId: user.id
      },
      create: {
        userId: user.id,
        bio,
        location,
        skills: Array.isArray(skills) ? skills : skills.split(",").map(s => s.trim()),
        certifications: Array.isArray(certifications) ? certifications : certifications.split(",").map(s => s.trim()),
        availability: availability ? new Date(availability) : null,
        experience: Array.isArray(experience) ? experience : []
      },
      update: {
        bio,
        location,
        skills: Array.isArray(skills) ? skills : skills.split(",").map(s => s.trim()),
        certifications: Array.isArray(certifications) ? certifications : certifications.split(",").map(s => s.trim()),
        availability: availability ? new Date(availability) : null,
        experience: Array.isArray(experience) ? experience : []
      }
    });

    console.log("[PROFILE_PUT] Profile updated:", profile);
    return NextResponse.json(profile);
  } catch (error) {
    console.error("[PROFILE_PUT]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 