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
        user: true
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
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { candidateProfile: true }
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    const data = await request.json();
    const {
      // Basic Info
      firstName,
      lastName,
      photoUrl,
      preferredRole,
      location,
      workLocations,
      openToRelocation,
      yearsOfExperience,
      isAnonymous,
      
      // About Me Sections
      whatImSeeking,
      whyIEnjoyThisWork,
      whatSetsApartMe,
      idealEnvironment,
      
      // Professional Details
      seekingOpportunities,
      skills,
      payRangeMin,
      payRangeMax,
      payCurrency,
      
      // Media
      additionalPhotos,
      mediaUrls,
      
      // Existing fields
      bio,
      phoneNumber,
      certifications,
      availability,
      experience
    } = data;

    // Update user's basic information
    const userUpdateData = {
      phoneNumber,
      firstName,
      lastName
    };

    // Only update isAnonymous if it's explicitly provided
    if (typeof isAnonymous === 'boolean') {
      Object.assign(userUpdateData, { isAnonymous });
    }

    // Update user
    await prisma.user.update({
      where: { id: user.id },
      data: userUpdateData
    });

    // Update or create candidate profile
    const profileData = {
      userId: user.id,
      bio,
      preferredRole,
      location,
      workLocations,
      openToRelocation,
      yearsOfExperience,
      whatImSeeking,
      whyIEnjoyThisWork,
      whatSetsApartMe,
      idealEnvironment,
      seekingOpportunities,
      skills,
      payRangeMin: payRangeMin ? parseFloat(payRangeMin) : null,
      payRangeMax: payRangeMax ? parseFloat(payRangeMax) : null,
      payCurrency,
      additionalPhotos,
      mediaUrls,
      certifications,
      availability,
      experience
    };

    const updatedProfile = await prisma.candidateProfile.upsert({
      where: { userId: user.id },
      create: profileData,
      update: profileData,
    });

    return NextResponse.json(updatedProfile);
  } catch (error) {
    console.error("[PROFILE_PUT]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 