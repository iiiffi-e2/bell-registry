"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface PendingOAuthData {
  role: string;
  membershipAccess: string;
  referralProfessionalName?: string;
  companyName?: string;
}

export default function OAuthCompletion() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isCompleting, setIsCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;

    if (status === "authenticated" && session?.user) {
      // Only run OAuth completion if there's actually pending OAuth data
      const pendingDataStr = sessionStorage.getItem("pendingOAuthData");
      if (pendingDataStr) {
        completeOAuthRegistration();
      }
    }
  }, [status, session]);

  const completeOAuthRegistration = async () => {
    try {
      // Check if there's pending OAuth data
      const pendingDataStr = sessionStorage.getItem("pendingOAuthData");
      if (!pendingDataStr) {
        // No pending data (regular login), redirect to dashboard
        router.push("/dashboard");
        return;
      }

      const pendingData: PendingOAuthData = JSON.parse(pendingDataStr);
      
      // Only proceed if we have membership access data
      if (!pendingData.membershipAccess) {
        sessionStorage.removeItem("pendingOAuthData");
        router.push("/dashboard");
        return;
      }

      setIsCompleting(true);

      // Call the API to complete OAuth registration
      const response = await fetch("/api/auth/complete-oauth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          membershipAccess: pendingData.membershipAccess,
          referralProfessionalName: pendingData.referralProfessionalName,
          companyName: pendingData.companyName,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to complete OAuth registration");
      }

      // Clear the pending data
      sessionStorage.removeItem("pendingOAuthData");

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (err) {
      console.error("Error completing OAuth registration:", err);
      setError("Failed to complete registration. Please try again.");
      
      // Clear the pending data on error
      sessionStorage.removeItem("pendingOAuthData");
      
      // Redirect to dashboard after a delay
      setTimeout(() => {
        router.push("/dashboard");
      }, 3000);
    } finally {
      setIsCompleting(false);
    }
  };

  if (status === "loading" || isCompleting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {isCompleting ? "Completing your registration..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Registration Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return null;
} 