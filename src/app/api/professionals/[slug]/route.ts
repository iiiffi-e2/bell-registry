import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    console.log("[PROFILE_GET] Looking for profile with slug:", params.slug);

    // Find the profile using the profileSlug field
    const profile = await prisma.user.findFirst({
      where: {
        profileSlug: params.slug
      },
      select: {
        firstName: true,
        lastName: true,
        image: true,
        role: true,
        createdAt: true,
        email: true,
        phoneNumber: true,
        candidateProfile: {
          select: {
            id: true,
            bio: true,
            skills: true,
            experience: true,
            certifications: true,
            location: true,
            availability: true,
            resumeUrl: true,
            profileViews: true,
          }
        }
      }
    });

    console.log("[PROFILE_GET] Raw profile data:", profile);

    if (!profile || !profile.candidateProfile) {
      console.log("[PROFILE_GET] Profile not found");
      return new NextResponse("Profile not found", { status: 404 });
    }

    // Increment profile views
    await prisma.candidateProfile.update({
      where: { id: profile.candidateProfile.id },
      data: { profileViews: { increment: 1 } }
    });

    // Format the response data
    const responseData = {
      id: profile.candidateProfile.id,
      bio: profile.candidateProfile.bio,
      skills: profile.candidateProfile.skills || [],
      experience: profile.candidateProfile.experience || [],
      certifications: profile.candidateProfile.certifications || [],
      location: profile.candidateProfile.location,
      availability: profile.candidateProfile.availability ? profile.candidateProfile.availability.toISOString() : null,
      resumeUrl: profile.candidateProfile.resumeUrl,
      profileViews: profile.candidateProfile.profileViews,
      user: {
        firstName: profile.firstName,
        lastName: profile.lastName,
        image: profile.image,
        role: profile.role,
        createdAt: profile.createdAt.toISOString(),
        email: profile.email,
        phoneNumber: profile.phoneNumber,
      }
    };

    console.log("[PROFILE_GET] Formatted response data:", responseData);

    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'private, max-age=30, must-revalidate',
        'Surrogate-Control': 'no-store',
        'Pragma': 'no-cache',
      }
    });
  } catch (error) {
    console.error("[PROFILE_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 