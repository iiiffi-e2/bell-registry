/**
 * Utility functions for generating appropriate welcome messages based on user status
 */

interface WelcomeMessageOptions {
  createdAt: Date | string;
  lastLoginAt?: Date | string | null;
  firstName?: string | null;
  role?: string;
}

/**
 * Determines if a user is "new" based on their account creation date
 * A user is considered new if they created their account within the last 7 days
 */
export function isNewUser(createdAt: Date | string): boolean {
  const accountCreated = new Date(createdAt);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  return accountCreated > sevenDaysAgo;
}

/**
 * Determines if this appears to be a user's first login
 * This is true if they have no lastLoginAt or if lastLoginAt is very close to createdAt
 */
export function isFirstLogin(createdAt: Date | string, lastLoginAt?: Date | string | null): boolean {
  if (!lastLoginAt) {
    return true;
  }
  
  const accountCreated = new Date(createdAt);
  const lastLogin = new Date(lastLoginAt);
  
  // If last login is within 5 minutes of account creation, consider it first login
  const timeDifference = lastLogin.getTime() - accountCreated.getTime();
  const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
  
  return timeDifference <= fiveMinutes;
}

/**
 * Gets the appropriate welcome message based on user status
 */
export function getWelcomeMessage(options: WelcomeMessageOptions): {
  title: string;
  subtitle: string;
} {
  const { createdAt, lastLoginAt, firstName, role } = options;
  const userName = firstName || getUserRoleDisplayName(role);
  const isNew = isNewUser(createdAt);
  const isFirst = isFirstLogin(createdAt, lastLoginAt);

  // For brand new users (first login or very recent signup)
  if (isFirst || isNew) {
    return {
      title: `Welcome, ${userName}!`,
      subtitle: getNewUserSubtitle(role)
    };
  }

  // For returning users
  return {
    title: `Welcome back, ${userName}`,
    subtitle: getReturningUserSubtitle(role)
  };
}

/**
 * Gets display name for user role
 */
function getUserRoleDisplayName(role?: string): string {
  switch (role?.toUpperCase()) {
    case 'PROFESSIONAL':
      return 'Professional';
    case 'EMPLOYER':
      return 'Employer';
    case 'AGENCY':
      return 'Agency';
    case 'ADMIN':
      return 'Admin';
    default:
      return 'User';
  }
}

/**
 * Gets appropriate subtitle for new users
 */
function getNewUserSubtitle(role?: string): string {
  switch (role?.toUpperCase()) {
    case 'PROFESSIONAL':
      return "Let's get your profile set up and start your job search journey";
    case 'EMPLOYER':
      return "Let's get you set up to find the perfect candidates";
    case 'AGENCY':
      return "Welcome to the platform - let's help you connect talent with opportunities";
    case 'ADMIN':
      return "Welcome to the admin portal";
    default:
      return "Welcome to Bell Registry";
  }
}

/**
 * Gets appropriate subtitle for returning users
 */
function getReturningUserSubtitle(role?: string): string {
  switch (role?.toUpperCase()) {
    case 'PROFESSIONAL':
      return "Here's what's happening with your job search";
    case 'EMPLOYER':
      return "Manage your job listings and view candidate applications";
    case 'AGENCY':
      return "Continue connecting talent with opportunities";
    case 'ADMIN':
      return "System overview and management tools";
    default:
      return "Welcome back to Bell Registry";
  }
}
