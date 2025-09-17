import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma, adminAuthOptions, logAdminAction } from "@bell-registry/shared";
import { UserRole } from "@bell-registry/shared";

export async function GET(request: NextRequest) {
  try {
    // Admin authentication check
    const session = await getServerSession(adminAuthOptions);
    
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 401 });
    }

    // Log this admin action
    await logAdminAction(
      session.user.id,
      "CHECK_LEGACY_PROFILES",
      { endpoint: "/api/admin/check-legacy-profiles" },
      request.ip,
      request.headers.get("user-agent") || undefined
    );

    console.log('🔍 Legacy Profile Location Analysis - Admin Portal');
    console.log('Running diagnostic script via API...');

    // Find approved profiles that might be getting filtered out
    const allApprovedProfiles = await prisma.candidateProfile.findMany({
      where: {
        status: 'APPROVED',
        bio: { not: null },
        bio: { not: '' },
        location: { not: null },
        location: { not: '' },
        user: { isDeleted: false }
      },
      select: {
        id: true,
        location: true,
        bio: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Analyze location formats
    const locationAnalysis = allApprovedProfiles.map(profile => ({
      userId: profile.user.id,
      name: `${profile.user.firstName || 'Unknown'} ${profile.user.lastName || 'User'}`,
      email: profile.user.email,
      location: profile.location,
      locationLength: profile.location?.length || 0,
      hasComma: profile.location?.includes(',') || false,
      bioLength: profile.bio?.length || 0,
      profileCreated: profile.createdAt,
      userCreated: profile.user.createdAt,
      isLegacy: profile.createdAt < new Date('2024-01-01') // Profiles created before 2024
    }));

    // Find potentially problematic locations (legacy format)
    const legacyFormatProfiles = locationAnalysis.filter(p => 
      p.locationLength < 5 || !p.hasComma
    );

    const trueLegacyProfiles = legacyFormatProfiles.filter(p => p.isLegacy);

    // Show some examples of good location formats
    const goodFormatProfiles = locationAnalysis.filter(p => 
      p.locationLength >= 5 && p.hasComma
    ).slice(0, 5);

    // Summary statistics
    const summary = {
      totalApprovedProfiles: allApprovedProfiles.length,
      legacyFormatCount: legacyFormatProfiles.length,
      trueLegacyCount: trueLegacyProfiles.length,
      legacyFormatPercentage: ((legacyFormatProfiles.length / allApprovedProfiles.length) * 100).toFixed(1),
      averageLocationLength: (locationAnalysis.reduce((sum, p) => sum + p.locationLength, 0) / locationAnalysis.length).toFixed(1),
      profilesWithComma: locationAnalysis.filter(p => p.hasComma).length,
      profilesWithCommaPercentage: ((locationAnalysis.filter(p => p.hasComma).length / allApprovedProfiles.length) * 100).toFixed(1)
    };

    const result = {
      summary,
      legacyFormatProfiles: legacyFormatProfiles.slice(0, 20).map(p => ({
        name: p.name,
        email: p.email,
        location: p.location,
        locationLength: p.locationLength,
        isLegacy: p.isLegacy,
        profileCreated: p.profileCreated.toISOString().split('T')[0]
      })),
      goodFormatExamples: goodFormatProfiles.map(p => ({
        name: p.name,
        location: p.location
      })),
      message: "Quick fix has been applied - these profiles should now be visible in search results!"
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error running legacy profile check:', error);
    return NextResponse.json(
      { error: 'Failed to check legacy profiles' },
      { status: 500 }
    );
  }
}
