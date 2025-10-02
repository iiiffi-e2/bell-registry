/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addSampleBillingData() {
  try {
    console.log('Adding sample billing data...');

    // Find all employer profiles
    const employerProfiles = await prisma.employerProfile.findMany({
      include: {
        user: true,
        billingHistory: true,
      },
    });

    console.log(`Found ${employerProfiles.length} employer profiles`);

    for (const profile of employerProfiles) {
      // Skip if they already have billing history
      if (profile.billingHistory && profile.billingHistory.length > 0) {
        console.log(`Skipping ${profile.user.email} - already has billing history`);
        continue;
      }

      // Add sample billing records for demonstration
      const sampleRecords = [
        {
          amount: 250.0,
          currency: 'usd',
          description: 'Spotlight Plan - 1 job post for 30 days',
          subscriptionType: 'SPOTLIGHT',
          status: 'COMPLETED',
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        },
        {
          amount: 650.0,
          currency: 'usd',
          description: 'Hiring Bundle - 3 job posts for 30 days',
          subscriptionType: 'BUNDLE',
          status: 'COMPLETED',
          createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
        },
      ];

      // Add one random record for each profile
      const randomRecord = sampleRecords[Math.floor(Math.random() * sampleRecords.length)];
      
      await prisma.billingHistory.create({
        data: {
          employerProfileId: profile.id,
          amount: randomRecord.amount,
          currency: randomRecord.currency,
          description: randomRecord.description,
          subscriptionType: randomRecord.subscriptionType as any,
          status: randomRecord.status as any,
          createdAt: randomRecord.createdAt,
        },
      });

      console.log(`Added billing record for ${profile.user.email}`);
    }

    console.log('Sample billing data added successfully!');
  } catch (error) {
    console.error('Error adding sample billing data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addSampleBillingData(); 