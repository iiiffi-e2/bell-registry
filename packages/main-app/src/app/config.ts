/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

// This configuration ensures proper handling of dynamic and static routes
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

// Disable static optimization for specific routes
export const unstable_settings = {
  // Enable dynamic rendering for these routes
  dynamicRoutes: {
    '/api/**': true,
    '/dashboard/**': true,
    '/login': true,
    '/register': true,
  },
}; 