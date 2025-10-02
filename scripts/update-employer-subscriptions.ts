/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateEmployerSubscriptions() {
  console.log('Starting employer subscription migration...');
  
  try {
    // Update all existing employer profiles to have default subscription values
    const result = await prisma.$executeRaw`
      UPDATE "EmployerProfile" 
      SET 
        "subscriptionType" = 'TRIAL',
        "subscriptionStartDate" = COALESCE("subscriptionStartDate", "createdAt"),
        "jobPostLimit" = COALESCE("jobPostLimit", 5),
        "jobsPostedCount" = COALESCE("jobsPostedCount", 0)
      WHERE "subscriptionType" IS NULL OR "jobPostLimit" IS NULL OR "jobsPostedCount" IS NULL
    `;

    console.log(`Migration completed. Updated employer profiles.`);
    
    // Verify the migration with raw queries
    const employerCountResult = await prisma.$queryRaw`SELECT COUNT(*) FROM "EmployerProfile"` as any[];
    const employersWithTrialResult = await prisma.$queryRaw`
      SELECT COUNT(*) FROM "EmployerProfile" WHERE "subscriptionType" = 'TRIAL'
    ` as any[];
    
    const employerCount = parseInt(employerCountResult[0].count);
    const employersWithTrial = parseInt(employersWithTrialResult[0].count);
    
    console.log(`Total employer profiles: ${employerCount}`);
    console.log(`Employer profiles with trial subscription: ${employersWithTrial}`);
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  updateEmployerSubscriptions()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export { updateEmployerSubscriptions }; 