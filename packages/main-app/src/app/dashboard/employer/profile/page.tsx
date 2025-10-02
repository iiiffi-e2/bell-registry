/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Metadata } from "next";
import { EmployerProfileForm } from "@/components/profile/employer-profile-form";
import { toast } from "sonner";

export default function EmployerProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Role-based access control
  useEffect(() => {
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

  const handleSubmit = async (data: any) => {
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Employer Profile</h1>
        <EmployerProfileForm onSubmit={handleSubmit} />
      </div>
    </div>
  );
} 