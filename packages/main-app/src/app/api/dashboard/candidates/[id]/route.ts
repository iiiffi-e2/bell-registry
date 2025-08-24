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

    // Check if employer has network access
    let hasNetworkAccess = false
    const isEmployerOrAgency = session?.user?.role === "EMPLOYER" || session?.user?.role === "AGENCY"
    if (isEmployerOrAgency && session?.user?.id) {
      const employerProfile = await prisma.employerProfile.findUnique({
        where: { userId: session.user.id },
        select: { hasNetworkAccess: true }
      })
      hasNetworkAccess = employerProfile?.hasNetworkAccess || false
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

    // Determine if we should anonymize the profile
    const isViewingOwnProfile = session?.user?.id === candidate.id;
    const shouldAnonymize = (session?.user?.role === "PROFESSIONAL" && !isViewingOwnProfile) || 
                           (isEmployerOrAgency && !hasNetworkAccess);

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
      resumeUrl: shouldAnonymize ? null : candidate.candidateProfile.resumeUrl, // Hide resume if anonymized
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
      additionalPhotos: shouldAnonymize ? [] : (candidate.candidateProfile.additionalPhotos || []), // Hide photos if anonymized
      mediaUrls: candidate.candidateProfile.mediaUrls || [],
      openToWork: (candidate.candidateProfile as any).openToWork || false,
      employmentType: (candidate.candidateProfile as any).employmentType || null,
      user: {
        id: candidate.id,
        // Anonymize personal information based on access level
        firstName: shouldAnonymize ? (candidate.firstName?.[0] || '') : candidate.firstName,
        lastName: shouldAnonymize ? (candidate.lastName?.[0] || '') : candidate.lastName,
        image: shouldAnonymize ? null : candidate.image, // Hide profile image if anonymized
        role: candidate.role,
        createdAt: candidate.createdAt.toISOString(),
        email: shouldAnonymize ? '' : candidate.email, // Hide email if anonymized
        phoneNumber: shouldAnonymize ? null : candidate.phoneNumber, // Hide phone number if anonymized
        isAnonymous: shouldAnonymize ? true : (candidate.isAnonymous || false), // Mark as anonymous if anonymized
        preferredAnonymity: candidate.isAnonymous || false, // Original anonymity preference
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