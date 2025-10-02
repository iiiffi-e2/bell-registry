/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

import { prisma } from '../packages/shared/src/lib/prisma';
import bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';

async function createAdminUser() {
  console.log('🔧 Admin User Creation Script');
  console.log('================================');

  // Configuration - Update these values
  const adminEmail = 'admin@bellregistry.com';
  const adminPassword = 'AdminPassword123!'; // Change this to a secure password
  const adminFirstName = 'Admin';
  const adminLastName = 'User';

  try {
    // Check if admin user already exists
    console.log(`📧 Checking if user exists: ${adminEmail}`);
    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (existingUser) {
      console.log('👤 User already exists. Updating role to ADMIN...');
      
      // Update existing user to admin role
      const updatedUser = await prisma.user.update({
        where: { email: adminEmail },
        data: { 
          role: UserRole.ADMIN,
          isDeleted: false, // Ensure account is not deleted
        }
      });

      console.log('✅ Successfully updated user to ADMIN role');
      console.log(`📧 Email: ${updatedUser.email}`);
      console.log(`👤 Role: ${updatedUser.role}`);
      console.log(`🆔 User ID: ${updatedUser.id}`);
      
      return updatedUser;
    }

    // Create new admin user
    console.log('👤 Creating new admin user...');
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    
    const newAdminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        role: UserRole.ADMIN,
        firstName: adminFirstName,
        lastName: adminLastName,
        emailVerified: new Date(), // Mark as verified
        lastLoginAt: new Date(),
      }
    });

    console.log('✅ Successfully created admin user!');
    console.log(`📧 Email: ${newAdminUser.email}`);
    console.log(`🔑 Password: ${adminPassword}`);
    console.log(`👤 Role: ${newAdminUser.role}`);
    console.log(`🆔 User ID: ${newAdminUser.id}`);
    
    return newAdminUser;

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    throw error;
  }
}

async function listExistingUsers() {
  console.log('\n📋 Existing users in database:');
  console.log('================================');
  
  try {
    const users = await prisma.user.findMany({
      where: { isDeleted: false },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10 // Show last 10 users
    });

    if (users.length === 0) {
      console.log('No users found in database.');
      return;
    }

    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.firstName} ${user.lastName}) - ${user.role}`);
    });

    console.log(`\nShowing ${users.length} most recent users.`);
  } catch (error) {
    console.error('❌ Error listing users:', error);
  }
}

async function main() {
  try {
    console.log('🚀 Starting admin user setup...\n');
    
    // First, show existing users
    await listExistingUsers();
    
    console.log('\n🔧 Creating/updating admin user...');
    await createAdminUser();
    
    console.log('\n🎉 Admin user setup complete!');
    console.log('\n📋 Next steps:');
    console.log('1. Start the admin portal: npm run dev (in packages/admin-portal)');
    console.log('2. Visit: http://localhost:3001');
    console.log('3. Login with the admin credentials shown above');
    console.log('4. Change the default password after first login');
    
  } catch (error) {
    console.error('💥 Script failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Allow running with different options
const args = process.argv.slice(2);
if (args.includes('--list-only')) {
  listExistingUsers().then(() => prisma.$disconnect());
} else {
  main();
} 