const { PrismaClient } = require('@prisma/client');

async function checkAndAddCustomInitials() {
  const prisma = new PrismaClient();
  
  try {
    // Try to query the customInitials field
    await prisma.$queryRaw`SELECT "customInitials" FROM "User" LIMIT 1`;
    console.log('✅ customInitials column exists');
  } catch (error) {
    if (error.message.includes('column') && error.message.includes('does not exist')) {
      console.log('❌ customInitials column missing, adding it...');
      
      try {
        // Add the column
        await prisma.$executeRaw`ALTER TABLE "User" ADD COLUMN "customInitials" VARCHAR(3)`;
        console.log('✅ customInitials column added successfully');
      } catch (addError) {
        console.error('❌ Failed to add customInitials column:', addError.message);
      }
    } else {
      console.error('❌ Unexpected error:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

checkAndAddCustomInitials(); 