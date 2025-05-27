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
    
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        candidateProfile: true,
        employerProfile: true,
      },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    return NextResponse.json(user);
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
      // Update candidate profile
      const updatedProfile = await prisma.candidateProfile.update({
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
          payCurrency: body.payCurrency,
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
      });

      return NextResponse.json(updatedProfile);
    }
  } catch (error) {
    console.error("[PROFILE_PUT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 