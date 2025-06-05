import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { prisma } from "@/lib/prisma";
import { generateProfileSlug } from "@/lib/utils";

// Use static rendering by default, only opt into dynamic when needed
export const dynamic = 'force-dynamic';
export const revalidate = 30; // Revalidate every 30 seconds

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (session.user.role === "EMPLOYER" || session.user.role === "AGENCY") {
      const profile = await prisma.employerProfile.findUnique({
        where: { userId: session.user.id },
      });
      return NextResponse.json({ employerProfile: profile });
    } else {
      const profile = await prisma.candidateProfile.findUnique({
        where: { userId: session.user.id },
        include: {
          user: true
        }
      });
      return NextResponse.json(profile);
    }
  } catch (error) {
    console.error("[PROFILE_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();

    if (session.user.role === "EMPLOYER" || session.user.role === "AGENCY") {
      // Update employer profile
      const updatedProfile = await prisma.employerProfile.update({
        where: { userId: session.user.id },
        data: {
          companyName: body.companyName,
          description: body.description,
          website: body.website,
          logoUrl: body.logoUrl,
          location: body.location,
        },
      });

      return NextResponse.json(updatedProfile);
    } else {
      // Update both user and candidate profile in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Check if names are being updated and regenerate slug if needed
        let profileSlug: string | undefined;
        if (body.firstName && body.lastName) {
          const currentUser = await tx.user.findUnique({
            where: { id: session.user.id },
            select: { firstName: true, lastName: true, profileSlug: true }
          });
          
          // Only regenerate slug if names are different
          if (currentUser && 
              (currentUser.firstName !== body.firstName || currentUser.lastName !== body.lastName)) {
            profileSlug = await generateProfileSlug(body.firstName, body.lastName);
          }
        }

        // Update user fields
        const updatedUser = await tx.user.update({
          where: { id: session.user.id },
          data: {
            firstName: body.firstName,
            lastName: body.lastName,
            phoneNumber: body.phoneNumber,
            isAnonymous: body.isAnonymous,
            ...(profileSlug && { profileSlug })
          },
        });

        // Update candidate profile
        const updatedProfile = await tx.candidateProfile.update({
          where: { userId: session.user.id },
          data: {
            bio: body.bio,
            skills: body.skills ? body.skills.split(",").map((s: string) => s.trim()) : undefined,
            experience: body.experience,
            certifications: body.certifications ? body.certifications.split(",").map((c: string) => c.trim()) : undefined,
            availability: body.availability ? new Date(body.availability) : undefined,
            resumeUrl: body.resumeUrl,
            photoUrl: body.photoUrl,
            location: body.location,
            title: body.preferredRole,
            additionalPhotos: body.additionalPhotos,
            currentLocation: body.location,
            headshot: body.photoUrl,
            idealEnvironment: body.idealEnvironment,
            mediaUrls: body.mediaUrls,
            openToRelocation: body.openToRelocation,
            payType: body.payType,
            payRangeMax: body.payRangeMax ? parseFloat(body.payRangeMax) : undefined,
            payRangeMin: body.payRangeMin ? parseFloat(body.payRangeMin) : undefined,
            preferredRole: body.preferredRole,
            seekingOpportunities: body.seekingOpportunities,
            whatImSeeking: body.whatImSeeking,
            whatSetsApartMe: body.whatSetsApartMe,
            whyIEnjoyThisWork: body.whyIEnjoyThisWork,
            workLocations: body.workLocations,
            yearsOfExperience: body.yearsOfExperience ? parseInt(body.yearsOfExperience) : undefined,
          },
          include: {
            user: true
          }
        });

        return updatedProfile;
      });

      return NextResponse.json(result);
    }
  } catch (error) {
    console.error("[PROFILE_PUT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 