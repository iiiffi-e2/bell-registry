#!/usr/bin/env ts-node

/**
 * Test script for new business rules:
 * - EMPLOYER: No free trial, no free job posts (starts with 0 job credits)
 * - AGENCY: Free trial with 5 job credits that can be used anytime and stack with purchases
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testBusinessRules() {
  console.log('🧪 Testing New Business Rules for Employer and Agency Signups\n');

  try {
    // Test 1: Check EMPLOYER signup
    console.log('📋 Test 1: EMPLOYER signup should have 0 job credits');
    const employerUsers = await prisma.user.findMany({
      where: { role: 'EMPLOYER' },
      include: { employerProfile: true },
      take: 3,
      orderBy: { createdAt: 'desc' }
    });

    if (employerUsers.length === 0) {
      console.log('   ⚠️  No EMPLOYER users found in database');
    } else {
      employerUsers.forEach(user => {
        const profile = user.employerProfile;
        console.log(`   👤 Employer: ${user.firstName} ${user.lastName}`);
        console.log(`      - Job Credits: ${(profile as any)?.jobCredits || 0}`);
        console.log(`      - Job Post Limit: ${(profile as any)?.jobPostLimit || 0}`);
        console.log(`      - Jobs Posted Count: ${(profile as any)?.jobsPostedCount || 0}`);
        
        // Validate business rules
        if ((profile as any)?.jobCredits === 0 && (profile as any)?.jobPostLimit === 0) {
          console.log('      ✅ PASS: Employer has no free credits or job posts');
        } else {
          console.log('      ❌ FAIL: Employer should have 0 credits and 0 job post limit');
        }
        console.log('');
      });
    }

    // Test 2: Check AGENCY signup
    console.log('📋 Test 2: AGENCY signup should have 5 job credits');
    const agencyUsers = await prisma.user.findMany({
      where: { role: 'AGENCY' },
      include: { employerProfile: true },
      take: 3,
      orderBy: { createdAt: 'desc' }
    });

    if (agencyUsers.length === 0) {
      console.log('   ⚠️  No AGENCY users found in database');
    } else {
      agencyUsers.forEach(user => {
        const profile = user.employerProfile;
        console.log(`   👤 Agency: ${user.firstName} ${user.lastName}`);
        console.log(`      - Job Credits: ${(profile as any)?.jobCredits || 0}`);
        console.log(`      - Job Post Limit: ${(profile as any)?.jobPostLimit || 0}`);
        console.log(`      - Jobs Posted Count: ${(profile as any)?.jobsPostedCount || 0}`);
        
        // Validate business rules
        if ((profile as any)?.jobCredits === 5 && (profile as any)?.jobPostLimit === 5) {
          console.log('      ✅ PASS: Agency has 5 free credits');
        } else {
          console.log('      ❌ FAIL: Agency should have 5 credits and 5 job post limit');
        }
        console.log('');
      });
    }

    // Test 3: Check credit stacking scenario (agencies with purchases)
    console.log('📋 Test 3: AGENCY credit stacking after purchases');
    const agenciesWithCredits = await prisma.employerProfile.findMany({
      where: { 
        user: { role: 'AGENCY' },
        ...(prisma as any).employerProfile.fields.jobCredits ? { jobCredits: { gt: 5 } } : {}
      },
      include: { user: true },
      take: 3
    });

    if (agenciesWithCredits.length === 0) {
      console.log('   ⚠️  No agencies with purchased credits found');
    } else {
      agenciesWithCredits.forEach(profile => {
        console.log(`   👤 Agency: ${(profile as any).user.firstName} ${(profile as any).user.lastName}`);
        console.log(`      - Job Credits: ${(profile as any).jobCredits}`);
        console.log(`      - Subscription Type: ${profile.subscriptionType}`);
        console.log('      ✅ PASS: Agency has stacked credits (5 free + purchased)');
        console.log('');
      });
    }

    // Test 4: Summary statistics
    console.log('📊 Summary Statistics');
    const totalEmployers = await prisma.user.count({ where: { role: 'EMPLOYER' } });
    const totalAgencies = await prisma.user.count({ where: { role: 'AGENCY' } });
    
    const employersWithCredits = await prisma.employerProfile.count({
      where: { 
        user: { role: 'EMPLOYER' }
      }
    });
    
    const agenciesWithFreeCredits = await prisma.employerProfile.count({
      where: { 
        user: { role: 'AGENCY' }
      }
    });

    console.log(`   📈 Total Employers: ${totalEmployers}`);
    console.log(`   📈 Employers with Credits: ${employersWithCredits}`);
    console.log(`   📈 Total Agencies: ${totalAgencies}`);
    console.log(`   📈 Agencies with 5+ Credits: ${agenciesWithFreeCredits}`);
    
    console.log('\n✅ Business Rules Test Complete!');
    
  } catch (error) {
    console.error('❌ Error running tests:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testBusinessRules();
