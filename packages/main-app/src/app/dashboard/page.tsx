"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { ProfessionalDashboard } from "@/components/dashboard/professional-dashboard";

const ROLES = {
  PROFESSIONAL: "PROFESSIONAL",
  EMPLOYER: "EMPLOYER",
  AGENCY: "AGENCY",
  ADMIN: "ADMIN",
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Wait for session to fully load before making any redirect decisions
    if (status === "loading") return;
    
    // Only redirect if we're on the exact /dashboard route and user is authenticated
    if (status === "authenticated" && session?.user?.role && pathname === "/dashboard") {
      // Check if we're already on the correct role-specific route
      const targetRoute = (() => {
        switch (session.user.role) {
    case ROLES.EMPLOYER:
    case ROLES.AGENCY:
      return "/dashboard/employer";
    case ROLES.ADMIN:
      return "/dashboard/admin";
          default:
            return null; // For PROFESSIONAL role, stay on this page
        }
      })();
      
      // Only redirect if we have a target route
      if (targetRoute) {
        router.push(targetRoute);
      }
    }
  }, [session, status, router, pathname]);

  // Show loading state while checking session
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If not authenticated, return null (auth middleware will handle redirect)
  if (status === "unauthenticated") {
    return null;
  }

  // If user is a professional, show professional dashboard
  if (session?.user?.role === ROLES.PROFESSIONAL) {
    return <ProfessionalDashboard />;
  }

  // For other roles, show loading while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
}




