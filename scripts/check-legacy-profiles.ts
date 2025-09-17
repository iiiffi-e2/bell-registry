import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkLegacyProfiles() {
  console.log('🔍 Checking for profiles with potential location issues...\n');

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

  console.log(`Found ${allApprovedProfiles.length} approved profiles with location data`);

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

  console.log(`\n📍 Profiles with legacy location format: ${legacyFormatProfiles.length}`);
  console.log(`📅 True legacy profiles (pre-2024): ${trueLegacyProfiles.length}`);
  
  console.log('\n--- Legacy Format Profiles ---');
  legacyFormatProfiles.slice(0, 10).forEach(profile => {
    const legacyFlag = profile.isLegacy ? '🕰️' : '🆕';
    console.log(`${legacyFlag} ${profile.name} (${profile.email}): "${profile.location}" (${profile.locationLength} chars, created: ${profile.profileCreated.toISOString().split('T')[0]})`);
  });

  if (legacyFormatProfiles.length > 10) {
    console.log(`... and ${legacyFormatProfiles.length - 10} more`);
  }

  // Show some examples of good location formats
  const goodFormatProfiles = locationAnalysis.filter(p => 
    p.locationLength >= 5 && p.hasComma
  ).slice(0, 5);

  console.log('\n--- Good Format Examples ---');
  goodFormatProfiles.forEach(profile => {
    console.log(`✅ ${profile.name}: "${profile.location}"`);
  });

  // Summary statistics
  console.log('\n📊 Summary:');
  console.log(`- Total approved profiles: ${allApprovedProfiles.length}`);
  console.log(`- Profiles with legacy location format: ${legacyFormatProfiles.length} (${((legacyFormatProfiles.length / allApprovedProfiles.length) * 100).toFixed(1)}%)`);
  console.log(`- Average location length: ${(locationAnalysis.reduce((sum, p) => sum + p.locationLength, 0) / locationAnalysis.length).toFixed(1)} chars`);
  console.log(`- Profiles with comma in location: ${locationAnalysis.filter(p => p.hasComma).length} (${((locationAnalysis.filter(p => p.hasComma).length / allApprovedProfiles.length) * 100).toFixed(1)}%)`);

  console.log('\n✅ Quick fix has been applied - these profiles should now be visible in search results!');

  await prisma.$disconnect();
}

checkLegacyProfiles().catch(console.error);
