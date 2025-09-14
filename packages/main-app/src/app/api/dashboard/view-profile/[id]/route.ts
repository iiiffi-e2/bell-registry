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

    // Allow employers, agencies, and professionals to view professional profiles in dashboard
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

    // Find the professional profile
    const professional = await prisma.user.findUnique({
      where: {
        id: params.id
      },
      include: {
        candidateProfile: true
      }
    });

    if (!professional || !professional.candidateProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Increment profile views
    await prisma.candidateProfile.update({
      where: { id: professional.candidateProfile.id },
      data: { profileViews: { increment: 1 } }
    });

    // Log profile view event
    await prisma.profileViewEvent.create({
      data: {
        userId: professional.id,
      }
    });

    // Determine if we should anonymize the profile
    const isViewingOwnProfile = session?.user?.id === professional.id;
    const shouldAnonymize = (session?.user?.role === "PROFESSIONAL" && !isViewingOwnProfile) || 
                           (isEmployerOrAgency && !hasNetworkAccess);

    // Format the response data
    const responseData = {
      id: professional.candidateProfile.id,
      bio: professional.candidateProfile.bio,
      title: professional.candidateProfile.preferredRole,
      preferredRole: professional.candidateProfile.preferredRole,
      skills: professional.candidateProfile.skills || [],
      experience: professional.candidateProfile.experience || [],
      certifications: professional.candidateProfile.certifications || [],
      location: professional.candidateProfile.location,
      availability: professional.candidateProfile.availability?.toISOString() || null,
      resumeUrl: shouldAnonymize ? null : professional.candidateProfile.resumeUrl, // Hide resume if anonymized
      profileViews: professional.candidateProfile.profileViews + 1, // Include the incremented view
      workLocations: professional.candidateProfile.workLocations || [],
      openToRelocation: professional.candidateProfile.openToRelocation || false,
      yearsOfExperience: professional.candidateProfile.yearsOfExperience,
      whatImSeeking: professional.candidateProfile.whatImSeeking,
      whyIEnjoyThisWork: professional.candidateProfile.whyIEnjoyThisWork,
      whatSetsApartMe: professional.candidateProfile.whatSetsApartMe,
      idealEnvironment: professional.candidateProfile.idealEnvironment,
      seekingOpportunities: professional.candidateProfile.seekingOpportunities || [],
      payRangeMin: professional.candidateProfile.payRangeMin,
      payRangeMax: professional.candidateProfile.payRangeMax,
      payType: professional.candidateProfile.payType || 'Salary',
      additionalPhotos: shouldAnonymize ? [] : (professional.candidateProfile.additionalPhotos || []), // Hide photos if anonymized
      mediaUrls: professional.candidateProfile.mediaUrls || [],
      openToWork: (professional.candidateProfile as any).openToWork || false,
      employmentType: (professional.candidateProfile as any).employmentType || null,
      user: {
        id: professional.id,
        // Anonymize personal information based on access level
        firstName: shouldAnonymize ? (professional.firstName?.[0] || '') : professional.firstName,
        lastName: shouldAnonymize ? (professional.lastName?.[0] || '') : professional.lastName,
        image: shouldAnonymize ? null : professional.image, // Hide profile image if anonymized
        role: professional.role,
        createdAt: professional.createdAt.toISOString(),
        email: shouldAnonymize ? '' : professional.email, // Hide email if anonymized
        phoneNumber: shouldAnonymize ? null : professional.phoneNumber, // Hide phone number if anonymized
        isAnonymous: shouldAnonymize ? true : false, // Mark as anonymous if anonymized
        preferredAnonymity: professional.isAnonymous || false, // Original anonymity preference
        customInitials: (professional as any).customInitials || null,
        dontContactMe: (professional as any).dontContactMe || false,
      }
    };

    return NextResponse.json(responseData, {
      headers: {
        'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet, noimageindex',
      }
    });

  } catch (error) {
    console.error('Error fetching professional profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
} 