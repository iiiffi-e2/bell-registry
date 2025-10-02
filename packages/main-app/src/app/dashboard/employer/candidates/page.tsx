/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function CandidatesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Role-based access control
  useEffect(() => {
    // Only make redirect decisions once session is fully loaded
    if (status === "loading") return;
    
    if (status === "authenticated" && session?.user?.role) {
      // Redirect professionals away from employer screens
      if (session.user.role === "PROFESSIONAL") {
        router.push("/dashboard");
        return;
      }
      
      // Only allow employers and agencies
      if (session.user.role !== "EMPLOYER" && session.user.role !== "AGENCY") {
        router.push("/dashboard");
        return;
      }
    }
  }, [session, status, router]);

  // Show loading state while checking authentication and role
  if (status === "loading" || !session?.user?.role) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirect unauthorized users
  if (session.user.role === "PROFESSIONAL") {
    router.push("/dashboard");
    return null;
  }

  if (session.user.role !== "EMPLOYER" && session.user.role !== "AGENCY") {
    router.push("/dashboard");
    return null;
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Candidates</h1>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">
          Select an option from the sidebar menu to browse all candidates or view your saved candidates.
        </p>
      </div>
    </div>
  );
} 