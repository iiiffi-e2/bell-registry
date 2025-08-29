import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function applyMessageBoardMigration() {
  try {
    console.log('🚀 Applying message board migration...');
    
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '../packages/shared/src/database/migrations/add_message_board.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing: ${statement.substring(0, 50)}...`);
        await prisma.$executeRawUnsafe(statement);
      }
    }
    
    console.log('✅ Message board migration applied successfully!');
    
    // Test the new tables by creating a sample thread
    console.log('🧪 Testing new tables...');
    
    const testUser = await prisma.user.findFirst({
      where: { role: 'PROFESSIONAL' }
    });
    
    if (testUser) {
      const testThread = await prisma.messageBoardThread.create({
        data: {
          title: 'Welcome to the Message Board!',
          authorId: testUser.id,
        }
      });
      
      console.log(`✅ Test thread created with ID: ${testThread.id}`);
      
      // Clean up test data
      await prisma.messageBoardThread.delete({
        where: { id: testThread.id }
      });
      
      console.log('✅ Test data cleaned up');
    } else {
      console.log('ℹ️  No professional user found for testing, but migration completed successfully');
    }
    
  } catch (error) {
    if (error instanceof Error && error.message.includes('already exists')) {
      console.log('ℹ️  Message board tables already exist, skipping migration');
    } else {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  applyMessageBoardMigration()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { applyMessageBoardMigration };
