#!/usr/bin/env ts-node

/**
 * Quick script to check agency profile data
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAgencyProfile() {
  console.log('🔍 Checking agency profiles...\n');

  try {
    // Find the most recent agency user
    const agencies = await prisma.user.findMany({
      where: { role: 'AGENCY' },
      include: { employerProfile: true },
      orderBy: { createdAt: 'desc' },
      take: 3
    });

    if (agencies.length === 0) {
      console.log('❌ No agency users found');
      return;
    }

    agencies.forEach((agency, index) => {
      console.log(`📋 Agency ${index + 1}:`);
      console.log(`   Name: ${agency.firstName} ${agency.lastName}`);
      console.log(`   Email: ${agency.email}`);
      console.log(`   Role: ${agency.role}`);
      console.log(`   Created: ${agency.createdAt}`);
      
      if (agency.employerProfile) {
        const profile = agency.employerProfile as any;
        console.log(`   Profile Data:`);
        console.log(`     - Subscription Type: ${profile.subscriptionType}`);
        console.log(`     - Job Credits: ${profile.jobCredits}`);
        console.log(`     - Job Post Limit: ${profile.jobPostLimit}`);
        console.log(`     - Jobs Posted Count: ${profile.jobsPostedCount}`);
        console.log(`     - Subscription Start: ${profile.subscriptionStartDate}`);
        
        // Check if this matches expected values
        if (profile.jobCredits === 5 && profile.jobPostLimit === 5) {
          console.log(`     ✅ CORRECT: Agency has 5 credits and 5 limit`);
        } else {
          console.log(`     ❌ INCORRECT: Agency should have 5 credits and 5 limit`);
        }
      } else {
        console.log(`   ❌ No employer profile found`);
      }
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error checking profiles:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
if (require.main === module) {
  checkAgencyProfile();
}

export { checkAgencyProfile };
