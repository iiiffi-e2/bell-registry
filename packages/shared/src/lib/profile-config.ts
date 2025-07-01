import { ProfileStatus } from '../types';

/**
 * Gets the default profile status based on configuration
 * 
 * Default behavior: Auto-approve new profiles (APPROVED)
 * Configuration: Use Admin Portal Settings page to change this
 * 
 * Note: In future versions, this will read from the database settings
 * configured via the admin portal. For now, it defaults to APPROVED.
 * 
 * @returns ProfileStatus - The default status for new candidate profiles
 */
export function getDefaultProfileStatus(): ProfileStatus {
  // TODO: Read from SystemSettings database table in future version
  // For now, default to auto-approve behavior
  return ProfileStatus.APPROVED;
}

/**
 * Checks if the system is configured to require manual profile approval
 * @returns boolean - True if profiles need manual approval, false if auto-approved
 */
export function requiresManualApproval(): boolean {
  return getDefaultProfileStatus() === ProfileStatus.PENDING;
}

/**
 * Gets the appropriate approval fields for a new profile
 * @returns Object with approval-related fields based on default status
 */
export function getProfileApprovalFields() {
  const defaultStatus = getDefaultProfileStatus();
  
  if (defaultStatus === ProfileStatus.APPROVED) {
    return {
      status: ProfileStatus.APPROVED,
      approvedAt: new Date(),
      // Note: approvedBy would need to be set to a system user or admin if required
    };
  }
  
  return {
    status: defaultStatus,
  };
} 