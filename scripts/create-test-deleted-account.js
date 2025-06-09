const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestDeletedAccount() {
  try {
    // Create a test user that was "deleted" 35 days ago
    const thirtyFiveDaysAgo = new Date();
    thirtyFiveDaysAgo.setDate(thirtyFiveDaysAgo.getDate() - 35);
    
    const testUser = await prisma.user.create({
      data: {
        email: `test-deleted-old-${Date.now()}@example.com`,
        firstName: 'Test Deleted',
        lastName: 'User (Old)',
        isDeleted: true,
        deletedAt: thirtyFiveDaysAgo,
        password: 'deleted_password_hash',
      }
    });
    
    console.log('✅ Created test deleted user (35 days old):', {
      id: testUser.id,
      email: testUser.email,
      deletedAt: testUser.deletedAt
    });

    // Create another one that was deleted 20 days ago (should NOT be purged)
    const twentyDaysAgo = new Date();
    twentyDaysAgo.setDate(twentyDaysAgo.getDate() - 20);
    
    const recentTestUser = await prisma.user.create({
      data: {
        email: `test-deleted-recent-${Date.now()}@example.com`,
        firstName: 'Test Deleted',
        lastName: 'User (Recent)',
        isDeleted: true,
        deletedAt: twentyDaysAgo,
        password: 'deleted_password_hash',
      }
    });
    
    console.log('✅ Created test deleted user (20 days old):', {
      id: recentTestUser.id,
      email: recentTestUser.email,
      deletedAt: recentTestUser.deletedAt
    });

    console.log('\n📝 Summary:');
    console.log('- User deleted 35 days ago: SHOULD be purged');
    console.log('- User deleted 20 days ago: should NOT be purged');
    console.log('\nNow you can test the /api/test-purge-deleted-accounts endpoint!');
    
    return { oldUser: testUser, recentUser: recentTestUser };
  } catch (error) {
    console.error('❌ Error creating test data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  createTestDeletedAccount()
    .then(() => {
      console.log('✅ Test data created successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { createTestDeletedAccount }; 