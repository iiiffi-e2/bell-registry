"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
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

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role) {
      // Redirect based on role
      switch (session.user.role) {
        case ROLES.EMPLOYER:
          router.push("/dashboard/employer");
          break;
        case ROLES.AGENCY:
          router.push("/dashboard/agency");
          break;
        case ROLES.ADMIN:
          router.push("/dashboard/admin");
          break;
        // For PROFESSIONAL role, stay on this page
        default:
          break;
      }
    }
  }, [session, status, router]);

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

function EmployerDashboard() {
  return (
    <div className="py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">
          Employer Dashboard
        </h1>
      </div>
    </div>
  );
}


