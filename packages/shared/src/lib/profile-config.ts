import { ProfileStatus } from '../types';
import { prisma } from './prisma';

/**
 * Gets the default profile status based on configuration
 * 
 * Reads from the SystemSettings database table configured via the admin portal.
 * Falls back to APPROVED if no setting is found.
 * 
 * @returns ProfileStatus - The default status for new candidate profiles
 */
export async function getDefaultProfileStatus(): Promise<ProfileStatus> {
  try {
    const setting = await (prisma as any).systemSettings.findUnique({
      where: {
        settingKey: 'DEFAULT_PROFILE_STATUS'
      }
    });
    
    if (setting && setting.settingValue) {
      return setting.settingValue as ProfileStatus;
    }
  } catch (error) {
    console.error('Error reading DEFAULT_PROFILE_STATUS setting:', error);
  }
  
  // Fallback to auto-approve behavior if setting not found or error occurs
  return ProfileStatus.APPROVED;
}

/**
 * Checks if the system is configured to require manual profile approval
 * @returns boolean - True if profiles need manual approval, false if auto-approved
 */
export async function requiresManualApproval(): Promise<boolean> {
  const defaultStatus = await getDefaultProfileStatus();
  return defaultStatus === ProfileStatus.PENDING;
}

/**
 * Gets the appropriate approval fields for a new profile
 * @returns Object with approval-related fields based on default status
 */
export async function getProfileApprovalFields() {
  const defaultStatus = await getDefaultProfileStatus();
  
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