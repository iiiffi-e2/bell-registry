import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma, User } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

type CandidateProfileWithAll = Prisma.CandidateProfileGetPayload<{
  select: {
    id: true;
    bio: true;
    preferredRole: true;
    skills: true;
    experience: true;
    certifications: true;
    location: true;
    availability: true;
    resumeUrl: true;
    profileViews: true;
    workLocations: true;
    openToRelocation: true;
    yearsOfExperience: true;
    whatImSeeking: true;
    whyIEnjoyThisWork: true;
    whatSetsApartMe: true;
    idealEnvironment: true;
    seekingOpportunities: true;
    payRangeMin: true;
    payRangeMax: true;
    payType: true;
    additionalPhotos: true;
    mediaUrls: true;
    openToWork: true;
  }
}>;

type ProfileWithCandidate = User & {
  candidateProfile: CandidateProfileWithAll | null;
};

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const isEmployerOrAgency = session?.user?.role === "EMPLOYER" || session?.user?.role === "AGENCY";

    console.log("[PROFILE_GET] Looking for profile with slug:", params.slug);

    // Find the profile using the profileSlug field
    const profile = await prisma.user.findFirst({
      where: {
        profileSlug: params.slug
      },
      include: {
        candidateProfile: true
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

    // Log profile view event
    await prisma.profileViewEvent.create({
      data: {
        userId: profile.id,
      }
    });

    // Format the response data
    const responseData = {
      id: profile.candidateProfile.id,
      bio: profile.candidateProfile.bio,
      title: profile.candidateProfile.preferredRole,
      preferredRole: profile.candidateProfile.preferredRole,
      skills: profile.candidateProfile.skills || [],
      experience: profile.candidateProfile.experience || [],
      certifications: profile.candidateProfile.certifications || [],
      location: profile.candidateProfile.location,
      availability: profile.candidateProfile.availability ? profile.candidateProfile.availability.toISOString() : null,
      resumeUrl: isEmployerOrAgency ? null : profile.candidateProfile.resumeUrl,
      profileViews: profile.candidateProfile.profileViews,
      workLocations: profile.candidateProfile.workLocations || [],
      openToRelocation: profile.candidateProfile.openToRelocation || false,
      yearsOfExperience: profile.candidateProfile.yearsOfExperience,
      whatImSeeking: profile.candidateProfile.whatImSeeking,
      whyIEnjoyThisWork: profile.candidateProfile.whyIEnjoyThisWork,
      whatSetsApartMe: profile.candidateProfile.whatSetsApartMe,
      idealEnvironment: profile.candidateProfile.idealEnvironment,
      seekingOpportunities: profile.candidateProfile.seekingOpportunities || [],
      payRangeMin: profile.candidateProfile.payRangeMin,
      payRangeMax: profile.candidateProfile.payRangeMax,
      payType: profile.candidateProfile.payType || 'Salary',
      additionalPhotos: isEmployerOrAgency ? [] : (profile.candidateProfile.additionalPhotos || []),
      mediaUrls: profile.candidateProfile.mediaUrls || [],
      openToWork: profile.candidateProfile.openToWork || false,
      employmentType: (profile.candidateProfile as any).employmentType || null,
      user: {
        id: profile.id,
        firstName: isEmployerOrAgency ? (profile.firstName?.[0] || '') : profile.firstName,
        lastName: isEmployerOrAgency ? (profile.lastName?.[0] || '') : profile.lastName,
        image: isEmployerOrAgency ? null : profile.image,
        role: profile.role,
        createdAt: profile.createdAt.toISOString(),
        email: isEmployerOrAgency ? '' : profile.email,
        phoneNumber: isEmployerOrAgency ? null : profile.phoneNumber,
        isAnonymous: isEmployerOrAgency ? true : (profile.isAnonymous || false),
        dontContactMe: (profile as any).dontContactMe || false,
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