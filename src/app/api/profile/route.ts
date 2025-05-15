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
      headshot,
      title,
      location,
      workLocations,
      openToRelocation,
      yearsOfExperience,
      
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

    // Update user's phone number
    await prisma.user.update({
      where: { id: user.id },
      data: { phoneNumber }
    });

    // Update or create profile
    const profile = await prisma.candidateProfile.upsert({
      where: {
        userId: user.id
      },
      create: {
        userId: user.id,
        // Basic Info
        photoUrl: headshot || null,
        preferredRole: title || null,
        location,
        workLocations: workLocations ? (Array.isArray(workLocations) ? workLocations : workLocations.split(",").map(l => l.trim())) : [],
        openToRelocation: openToRelocation || false,
        yearsOfExperience: yearsOfExperience ? parseInt(yearsOfExperience.toString()) : null,
        
        // About Me Sections
        whatImSeeking,
        whyIEnjoyThisWork,
        whatSetsApartMe,
        idealEnvironment,
        
        // Professional Details
        seekingOpportunities: seekingOpportunities ? (Array.isArray(seekingOpportunities) ? seekingOpportunities : seekingOpportunities.split(",").map(o => o.trim())) : [],
        skills: skills ? (Array.isArray(skills) ? skills : skills.split(",").map(s => s.trim())) : [],
        payRangeMin: payRangeMin ? parseFloat(payRangeMin) : null,
        payRangeMax: payRangeMax ? parseFloat(payRangeMax) : null,
        payCurrency,
        
        // Media
        additionalPhotos: additionalPhotos || [],
        mediaUrls: mediaUrls || [],
        
        // Existing fields
        bio,
        certifications: certifications ? (Array.isArray(certifications) ? certifications : certifications.split(",").map(c => c.trim())) : [],
        availability: availability ? new Date(availability) : null,
        experience: Array.isArray(experience) ? experience : []
      },
      update: {
        photoUrl: headshot || null,
        preferredRole: title || null,
        location,
        workLocations: workLocations ? (Array.isArray(workLocations) ? workLocations : workLocations.split(",").map(l => l.trim())) : [],
        openToRelocation: openToRelocation || false,
        yearsOfExperience: yearsOfExperience ? parseInt(yearsOfExperience.toString()) : null,
        
        // About Me Sections
        whatImSeeking,
        whyIEnjoyThisWork,
        whatSetsApartMe,
        idealEnvironment,
        
        // Professional Details
        seekingOpportunities: seekingOpportunities ? (Array.isArray(seekingOpportunities) ? seekingOpportunities : seekingOpportunities.split(",").map(o => o.trim())) : [],
        skills: skills ? (Array.isArray(skills) ? skills : skills.split(",").map(s => s.trim())) : [],
        payRangeMin: payRangeMin ? parseFloat(payRangeMin) : null,
        payRangeMax: payRangeMax ? parseFloat(payRangeMax) : null,
        payCurrency,
        
        // Media
        additionalPhotos: additionalPhotos || [],
        mediaUrls: mediaUrls || [],
        
        // Existing fields
        bio,
        certifications: certifications ? (Array.isArray(certifications) ? certifications : certifications.split(",").map(c => c.trim())) : [],
        availability: availability ? new Date(availability) : null,
        experience: Array.isArray(experience) ? experience : []
      }
    });

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Error updating profile:", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 