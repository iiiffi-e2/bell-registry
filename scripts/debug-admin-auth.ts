/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

import { prisma } from '../src/lib/prisma';
import bcrypt from 'bcryptjs';
import { UserRole } from '../packages/shared/src/types';

async function debugAdminAuth() {
  console.log('🔧 Debug Admin Authentication');
  console.log('=============================');

  const testEmail = 'admin@bellregistry.com';
  const testPassword = 'AdminPassword123!';

  try {
    console.log('1. Testing direct database query...');
    
    // Test the exact query that admin-auth.ts uses
    console.log(`🔍 UserRole.ADMIN value: "${UserRole.ADMIN}"`);
    
    const userWithRoleFilter = await prisma.user.findUnique({
      where: { 
        email: testEmail,
        role: UserRole.ADMIN // This is what admin-auth.ts does
      }
    });

    if (!userWithRoleFilter) {
      console.log('❌ User NOT found with role filter - THIS IS THE PROBLEM!');
      
      // Try without role filter
      const userWithoutFilter = await prisma.user.findUnique({
        where: { email: testEmail }
      });
      
      if (userWithoutFilter) {
        console.log(`✅ User found WITHOUT role filter`);
        console.log(`📧 Email: ${userWithoutFilter.email}`);
        console.log(`👤 Database Role: "${userWithoutFilter.role}"`);
        console.log(`🔍 UserRole.ADMIN: "${UserRole.ADMIN}"`);
        console.log(`🔍 Role Match: ${userWithoutFilter.role === UserRole.ADMIN}`);
        console.log(`🔍 Role Type: ${typeof userWithoutFilter.role}`);
        console.log(`🔍 Enum Type: ${typeof UserRole.ADMIN}`);
      }
    } else {
      console.log('✅ User found with role filter - authentication should work');
    }

    console.log('\n2. Testing password comparison...');
    const user = await prisma.user.findUnique({
      where: { email: testEmail }
    });

    if (user?.password) {
      const isPasswordValid = await bcrypt.compare(testPassword, user.password);
      console.log(`🔐 Password valid: ${isPasswordValid}`);
    }

  } catch (error) {
    console.error('❌ Error during debug:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugAdminAuth(); 