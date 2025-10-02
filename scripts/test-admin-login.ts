/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

import { prisma } from '../src/lib/prisma';
import bcrypt from 'bcryptjs';

async function testAdminLogin() {
  console.log('🧪 Testing Admin Login Credentials');
  console.log('===================================');

  const testEmail = 'admin@bellregistry.com';
  const testPassword = 'AdminPassword123!';

  try {
    // Find the user
    console.log(`🔍 Looking for user: ${testEmail}`);
    const user = await prisma.user.findUnique({
      where: { email: testEmail }
    });

    if (!user) {
      console.log('❌ User not found in database');
      return;
    }

    console.log('✅ User found in database');
    console.log(`📧 Email: ${user.email}`);
    console.log(`👤 Role: ${user.role}`);
    console.log(`🆔 ID: ${user.id}`);
    console.log(`🗑️ Is Deleted: ${user.isDeleted}`);
    console.log(`✉️ Email Verified: ${user.emailVerified ? 'Yes' : 'No'}`);
    console.log(`🔑 Has Password: ${user.password ? 'Yes' : 'No'}`);

    if (!user.password) {
      console.log('❌ User has no password set!');
      return;
    }

    // Test password
    console.log(`🔐 Testing password: ${testPassword}`);
    const isPasswordValid = await bcrypt.compare(testPassword, user.password);
    
    if (isPasswordValid) {
      console.log('✅ Password is CORRECT');
    } else {
      console.log('❌ Password is INCORRECT');
    }

    // Check admin role
    if (user.role === 'ADMIN') {
      console.log('✅ User has ADMIN role');
    } else {
      console.log(`❌ User role is ${user.role}, not ADMIN`);
    }

    // Check if account is deleted
    if (user.isDeleted) {
      console.log('❌ Account is marked as deleted');
    } else {
      console.log('✅ Account is active (not deleted)');
    }

    // Overall status
    console.log('\n🎯 Login Test Summary:');
    const canLogin = user && user.password && isPasswordValid && user.role === 'ADMIN' && !user.isDeleted;
    
    if (canLogin) {
      console.log('✅ LOGIN SHOULD WORK - All conditions met');
    } else {
      console.log('❌ LOGIN WILL FAIL - Issues found above');
    }

  } catch (error) {
    console.error('❌ Error testing login:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAdminLogin(); 