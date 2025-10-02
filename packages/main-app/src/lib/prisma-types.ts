/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

import type { UserRole as PrismaUserRole } from ".prisma/client";
import { UserRole } from "@/types";

export function toPrismaUserRole(role: UserRole): PrismaUserRole {
  return role as PrismaUserRole;
}

export function fromPrismaUserRole(role: PrismaUserRole): UserRole {
  return role as UserRole;
} 