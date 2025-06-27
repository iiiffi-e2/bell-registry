/**
 * Get display name for a user, handling anonymization for professionals
 * @param user User object with firstName, lastName, and optional isAnonymous flag
 * @param role User role to determine if anonymization should apply
 * @returns Formatted display name (full name or initials)
 */
export function getDisplayName(
  user: {
    firstName: string | null
    lastName: string | null
    isAnonymous?: boolean
    customInitials?: string | null
    role?: string
  }
): string {
  const firstName = user.firstName || '';
  const lastName = user.lastName || '';
  
  // For professionals/candidates, check if names should be anonymized
  if (user.role === 'PROFESSIONAL') {
    // Check if anonymized (either by isAnonymous flag or single character names)
    if (user.isAnonymous || (firstName.length === 1 && lastName.length === 1)) {
      // Use custom initials if provided, otherwise use name initials
      if (user.customInitials && user.customInitials.length >= 2) {
        const initials = user.customInitials.toUpperCase();
        if (initials.length === 2) {
          return `${initials[0]}. ${initials[1]}.`;
        } else if (initials.length === 3) {
          return `${initials[0]}. ${initials[1]}. ${initials[2]}.`;
        }
      }
      
      // Fallback to name initials
      const firstInitial = firstName[0] || '';
      const lastInitial = lastName[0] || '';
      return `${firstInitial}. ${lastInitial}.`;
    }
  }
  
  // For all other roles or non-anonymized professionals, show full name
  return `${firstName} ${lastName}`.trim();
}

/**
 * Get initials from a name
 * @param firstName First name
 * @param lastName Last name
 * @returns Initials formatted as "F. L."
 */
export function getInitials(firstName: string | null, lastName: string | null): string {
  const firstInitial = firstName?.[0] || '';
  const lastInitial = lastName?.[0] || '';
  return `${firstInitial}. ${lastInitial}.`;
} 