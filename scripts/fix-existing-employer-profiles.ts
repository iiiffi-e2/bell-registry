/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

#!/usr/bin/env ts-node

/**
 * Script to fix existing employer profiles that were created before the new business rules.
 * 
 * This script will:
 * 1. Find all EMPLOYER users with TRIAL subscription type
 * 2. Update their profiles to reflect the new business rules:
 *    - jobCredits = 0 (no free credits for employers)
 *    - jobPostLimit = 0 (no free job post limit)
 * 3. Find all AGENCY users with TRIAL subscription type  
 * 4. Update their profiles to reflect the new business rules:
 *    - jobCredits = 5 (5 free credits for agencies)
 *    - jobPostLimit = 5 (matches the free credits)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixExistingEmployerProfiles() {
  console.log('🔧 Fixing existing employer and agency profiles for new business rules...\n');
  console.log('⚠️  This script will update existing TRIAL profiles to match new business rules:');
  console.log('   - EMPLOYER profiles: Set to 0 credits, 0 limit');
  console.log('   - AGENCY profiles: Set to 5 credits, 5 limit');
  console.log('   - Only affects profiles that need updating\n');

  try {
    // First, show what would be updated (dry run info)
    const employersToUpdate = await prisma.employerProfile.count({
      where: {
        user: { role: 'EMPLOYER' },
        subscriptionType: 'TRIAL',
        OR: [
          { jobCredits: { not: 0 } },
          { jobPostLimit: { not: 0 } }
        ]
      }
    });

    const agenciesToUpdate = await prisma.employerProfile.count({
      where: {
        user: { role: 'AGENCY' },
        subscriptionType: 'TRIAL',
        OR: [
          { jobCredits: { not: 5 } },
          { jobPostLimit: { not: 5 } }
        ]
      }
    });

    console.log(`📊 Profiles that will be updated:`);
    console.log(`   - ${employersToUpdate} EMPLOYER profiles`);
    console.log(`   - ${agenciesToUpdate} AGENCY profiles`);
    
    if (employersToUpdate === 0 && agenciesToUpdate === 0) {
      console.log('✅ No profiles need updating. All profiles already match business rules.');
      return;
    }

    console.log('\n🚀 Proceeding with updates...\n');
    // Fix EMPLOYER profiles - only those with TRIAL subscription
    console.log('📋 Step 1: Updating EMPLOYER profiles...');
    const employerResult = await prisma.$executeRaw`
      UPDATE "EmployerProfile" 
      SET 
        "jobCredits" = 0,
        "jobPostLimit" = 0
      WHERE "userId" IN (
        SELECT "id" FROM "User" WHERE "role" = 'EMPLOYER'
      )
      AND "subscriptionType" = 'TRIAL'
      AND ("jobCredits" != 0 OR "jobPostLimit" != 0)
    `;
    
    console.log(`   ✅ Updated ${employerResult} employer profiles`);

    // Fix AGENCY profiles - only those with TRIAL subscription that don't have 5 credits
    console.log('📋 Step 2: Updating AGENCY profiles...');
    const agencyResult = await prisma.$executeRaw`
      UPDATE "EmployerProfile" 
      SET 
        "jobCredits" = 5,
        "jobPostLimit" = 5
      WHERE "userId" IN (
        SELECT "id" FROM "User" WHERE "role" = 'AGENCY'  
      )
      AND "subscriptionType" = 'TRIAL'
      AND ("jobCredits" != 5 OR "jobPostLimit" != 5)
    `;

    console.log(`   ✅ Updated ${agencyResult} agency profiles`);

    // Verify the changes
    console.log('\n📊 Verification - Current profile status:');
    
    const employers = await prisma.employerProfile.findMany({
      where: {
        user: { role: 'EMPLOYER' },
        subscriptionType: 'TRIAL'
      },
      include: { user: true },
      take: 5
    });

    console.log('\n👔 EMPLOYER profiles (sample):');
    employers.forEach(profile => {
      console.log(`   - ${profile.user.firstName} ${profile.user.lastName}: ${(profile as any).jobCredits} credits, limit: ${(profile as any).jobPostLimit}`);
    });

    const agencies = await prisma.employerProfile.findMany({
      where: {
        user: { role: 'AGENCY' },
        subscriptionType: 'TRIAL'
      },
      include: { user: true },
      take: 5
    });

    console.log('\n🏢 AGENCY profiles (sample):');
    agencies.forEach(profile => {
      console.log(`   - ${profile.user.firstName} ${profile.user.lastName}: ${(profile as any).jobCredits} credits, limit: ${(profile as any).jobPostLimit}`);
    });

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📝 Summary:');
    console.log(`   - Fixed ${employerResult} employer profiles (0 credits, 0 limit)`);
    console.log(`   - Fixed ${agencyResult} agency profiles (5 credits, 5 limit)`);

  } catch (error) {
    console.error('❌ Error during migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
if (require.main === module) {
  fixExistingEmployerProfiles()
    .then(() => {
      console.log('\n🎉 All done! Existing profiles have been updated to match new business rules.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

export { fixExistingEmployerProfiles };
