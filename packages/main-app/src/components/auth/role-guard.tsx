"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, ReactNode } from "react";

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: string[];
  redirectTo?: string;
}

export function RoleGuard({ 
  children, 
  allowedRoles, 
  redirectTo = "/dashboard" 
}: RoleGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Role-based access control
  useEffect(() => {
    if (status === "authenticated" && session?.user?.role) {
      // Check if user's role is in the allowed roles
      if (!allowedRoles.includes(session.user.role)) {
        router.push(redirectTo);
        return;
      }
    }
  }, [session, status, router, allowedRoles, redirectTo]);

  // Show loading state while checking authentication and role
  if (status === "loading" || !session?.user?.role) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirect unauthorized users
  if (!allowedRoles.includes(session.user.role)) {
    router.push(redirectTo);
    return null;
  }

  return <>{children}</>;
}

// Convenience component for employer-only pages
export function EmployerOnly({ children, redirectTo = "/dashboard" }: { 
  children: ReactNode; 
  redirectTo?: string; 
}) {
  return (
    <RoleGuard allowedRoles={["EMPLOYER", "AGENCY"]} redirectTo={redirectTo}>
      {children}
    </RoleGuard>
  );
}

// Convenience component for professional-only pages
export function ProfessionalOnly({ children, redirectTo = "/dashboard" }: { 
  children: ReactNode; 
  redirectTo?: string; 
}) {
  return (
    <RoleGuard allowedRoles={["PROFESSIONAL"]} redirectTo={redirectTo}>
      {children}
    </RoleGuard>
  );
} 