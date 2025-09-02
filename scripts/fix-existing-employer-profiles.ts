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

  try {
    // Fix EMPLOYER profiles
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
    `;
    
    console.log(`   ✅ Updated ${employerResult} employer profiles`);

    // Fix AGENCY profiles  
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
