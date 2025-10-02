/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

import { prisma } from '../src/lib/prisma';
import bcrypt from 'bcryptjs';

async function resetAdminPassword() {
  console.log('🔧 Admin Password Reset Script');
  console.log('================================');

  const adminEmail = 'admin@bellregistry.com';
  const newPassword = 'Es!w*&I4BrZ58084';

  try {
    // Find the admin user
    const adminUser = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (!adminUser) {
      console.log('❌ Admin user not found!');
      console.log('Run the create-admin-user.ts script first.');
      return;
    }

    // Hash the new password
    console.log('🔐 Hashing new password...');
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update the password
    const updatedUser = await prisma.user.update({
      where: { email: adminEmail },
      data: { 
        password: hashedPassword,
        role: 'ADMIN', // Ensure role is admin
        isDeleted: false, // Ensure account is not deleted
        emailVerified: new Date(), // Ensure email is verified
      }
    });

    // console.log('✅ Successfully reset admin password!');
    // console.log('📧 Email:', updatedUser.email);
    // console.log('🔑 New Password:', newPassword);
    // console.log('👤 Role:', updatedUser.role);
    // console.log('🆔 User ID:', updatedUser.id);
    // console.log('✅ Email Verified:', updatedUser.emailVerified ? 'Yes' : 'No');
    
    // console.log('\n🎯 Ready to login:');
    // console.log('1. Go to: http://localhost:3001');
    // console.log('2. Email: admin@bellregistry.com');
    // console.log('3. Password: AdminPassword123!');

  } catch (error) {
    console.error('❌ Error resetting admin password:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

resetAdminPassword(); 