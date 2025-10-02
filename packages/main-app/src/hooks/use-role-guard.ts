/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

type UserRole = "PROFESSIONAL" | "EMPLOYER" | "AGENCY" | "ADMIN";

interface UseRoleGuardOptions {
  allowedRoles: UserRole[];
  redirectTo?: string;
  onAuthorized?: () => void;
}

export function useRoleGuard({ allowedRoles, redirectTo = "/dashboard", onAuthorized }: UseRoleGuardOptions) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Only make redirect decisions once session is fully loaded
    if (status === "loading") return;
    
    if (status === "authenticated" && session?.user?.role) {
      const userRole = session.user.role as UserRole;
      
      // Check if user has required role
      if (!allowedRoles.includes(userRole)) {
        router.push(redirectTo);
        return;
      }
      
      // User is authorized, call callback if provided
      onAuthorized?.();
    } else if (status === "unauthenticated") {
      // User is not authenticated, let middleware handle redirect
      router.push("/login");
    }
  }, [session, status, router, allowedRoles, redirectTo, onAuthorized]);

  return {
    session,
    status,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
    isAuthorized: status === "authenticated" && session?.user?.role && allowedRoles.includes(session.user.role as UserRole),
  };
}