/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

// Export types
export * from './types';

// Export database client and types
export { prisma, Prisma, PrismaClient } from './lib/prisma';

// Export auth configurations
export { authOptions } from './lib/auth';
export { adminAuthOptions, validateAdminAccess, logAdminAction } from './lib/admin-auth';

// Export email services
export { sendSuspensionNotification, sendBanNotification, sendUnsuspensionNotification } from './lib/notification-email-service';

// Export utilities
export * from './lib/utils'; 