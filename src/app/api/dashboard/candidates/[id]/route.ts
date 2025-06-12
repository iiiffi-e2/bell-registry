import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Allow employers, agencies, and professionals to view candidate profiles in dashboard
    if (!['EMPLOYER', 'AGENCY', 'PROFESSIONAL'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Find the candidate profile
    const candidate = await prisma.user.findUnique({
      where: {
        id: params.id
      },
      include: {
        candidateProfile: true
      }
    });

    if (!candidate || !candidate.candidateProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Increment profile views
    await prisma.candidateProfile.update({
      where: { id: candidate.candidateProfile.id },
      data: { profileViews: { increment: 1 } }
    });

    // Log profile view event
    await prisma.profileViewEvent.create({
      data: {
        userId: candidate.id,
      }
    });

    // Format the response data
    const responseData = {
      id: candidate.candidateProfile.id,
      bio: candidate.candidateProfile.bio,
      title: candidate.candidateProfile.preferredRole,
      preferredRole: candidate.candidateProfile.preferredRole,
      skills: candidate.candidateProfile.skills || [],
      experience: candidate.candidateProfile.experience || [],
      certifications: candidate.candidateProfile.certifications || [],
      location: candidate.candidateProfile.location,
      availability: candidate.candidateProfile.availability?.toISOString() || null,
      resumeUrl: null, // Hide resume from employers
      profileViews: candidate.candidateProfile.profileViews + 1, // Include the incremented view
      workLocations: candidate.candidateProfile.workLocations || [],
      openToRelocation: candidate.candidateProfile.openToRelocation || false,
      yearsOfExperience: candidate.candidateProfile.yearsOfExperience,
      whatImSeeking: candidate.candidateProfile.whatImSeeking,
      whyIEnjoyThisWork: candidate.candidateProfile.whyIEnjoyThisWork,
      whatSetsApartMe: candidate.candidateProfile.whatSetsApartMe,
      idealEnvironment: candidate.candidateProfile.idealEnvironment,
      seekingOpportunities: candidate.candidateProfile.seekingOpportunities || [],
      payRangeMin: candidate.candidateProfile.payRangeMin,
      payRangeMax: candidate.candidateProfile.payRangeMax,
      payType: candidate.candidateProfile.payType || 'Salary',
      additionalPhotos: [], // Hide additional photos from employers
      mediaUrls: candidate.candidateProfile.mediaUrls || [],
      openToWork: (candidate.candidateProfile as any).openToWork || false,
      employmentType: (candidate.candidateProfile as any).employmentType || null,
      user: {
        id: candidate.id,
        // Anonymize personal information for employers
        firstName: candidate.firstName?.[0] || '',
        lastName: candidate.lastName?.[0] || '',
        image: null, // Hide profile image
        role: candidate.role,
        createdAt: candidate.createdAt.toISOString(),
        email: '', // Hide email
        phoneNumber: null, // Hide phone number
        isAnonymous: true, // Mark as anonymous for employers
        customInitials: (candidate as any).customInitials || null,
        dontContactMe: (candidate as any).dontContactMe || false,
      }
    };

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Error fetching candidate profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
} 