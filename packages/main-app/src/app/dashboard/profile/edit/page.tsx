/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { ProfileForm } from "@/components/profile/profile-form";
import { toast } from "sonner";
import { signIn, getSession } from "next-auth/react";

export default function EditProfilePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    
    try {
      // Show loading toast
      const loadingToast = toast.loading("Saving your profile...");
      
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      // Dismiss loading toast
      toast.dismiss(loadingToast);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        
        // Handle specific error cases
        if (response.status === 401) {
          // Try to refresh the session first
          const refreshedSession = await getSession();
          if (refreshedSession) {
            // Session was refreshed, retry the request
            toast.info("Session refreshed. Retrying save...");
            return handleSubmit(data);
          } else {
            // Session is truly expired
            toast.error("Your session has expired. Please log in again.", {
              action: {
                label: "Login",
                onClick: () => signIn()
              },
              duration: 10000
            });
            return;
          }
        }
        
        if (response.status === 413) {
          toast.error("Your profile data is too large. Please reduce image sizes or remove some media files.");
          return;
        }
        
        if (response.status === 422) {
          toast.error(`Validation error: ${errorData.error || "Please check your form data and try again."}`); 
          return;
        }
        
        if (response.status === 400) {
          toast.error(`Invalid data: ${errorData.error || "Please check your form and try again."}`); 
          return;
        }
        
        // Generic error for other status codes
        toast.error(`Failed to save profile: ${errorData.error || "Please try again later."}`); 
        return;
      }
      
      // Success! Clear any saved draft
      localStorage.removeItem('profile-draft');
      toast.success("Profile saved successfully!");
      router.push("/dashboard/profile");
      
    } catch (error) {
      console.error("Error updating profile:", error);
      
      // Network or other errors
      if (error instanceof TypeError && error.message.includes("fetch")) {
        toast.error("Network error. Please check your connection and try again.");
      } else {
        toast.error("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Edit Profile
            </h2>
          </div>
        </div>

        <ProfileForm onSubmit={handleSubmit} />
      </div>
    </div>
  );
} 