/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

/**
 * Utility functions for subscription-related operations
 */

/**
 * Format subscription type names for user-friendly display
 */
export const formatSubscriptionType = (subscriptionType: string): string => {
  switch (subscriptionType) {
    case 'NETWORK_QUARTERLY':
      return 'Network Quarterly';
    case 'NETWORK':
      return 'Network Annual';
    case 'TRIAL':
      return 'Trial';
    case 'UNLIMITED':
      return 'Unlimited';
    case 'SPOTLIGHT':
      return 'Spotlight';
    case 'BUNDLE':
      return 'Bundle';
    default:
      return subscriptionType;
  }
};
