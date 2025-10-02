/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

#!/usr/bin/env node

// Verification script to check Prisma client availability
console.log('🔍 Verifying Prisma client...');

try {
  // Try to import from the shared package
  console.log('📦 Checking shared package Prisma client...');
  const { prisma } = require('@bell-registry/shared');
  console.log('✅ Shared package Prisma client imported successfully');
  
  console.log('🎉 Prisma client is accessible!');
  process.exit(0);
} catch (error) {
  console.error('❌ Prisma client verification failed:');
  console.error(error.message);
  console.error('Stack:', error.stack);
  
  // Additional debugging info
  console.log('\n🔧 Debugging info:');
  console.log('Current working directory:', process.cwd());
  console.log('Node modules paths:', require.resolve.paths('@bell-registry/shared'));
  
  process.exit(1);
} 