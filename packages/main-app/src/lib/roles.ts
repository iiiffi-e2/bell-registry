/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

import { UserRole } from "@bell-registry/shared";

export function isProfessionalRole(role: unknown): role is UserRole {
  return role === UserRole.PROFESSIONAL;
}

export function isEmployerOrAgencyRole(role: unknown): role is UserRole {
  return role === UserRole.EMPLOYER || role === UserRole.AGENCY;
}

export function parseRole(role: string | undefined): UserRole {
  const upperRole = (role || "PROFESSIONAL").toUpperCase();
  if (Object.values(UserRole).includes(upperRole as UserRole)) {
    return upperRole as UserRole;
  }
  return UserRole.PROFESSIONAL;
} 