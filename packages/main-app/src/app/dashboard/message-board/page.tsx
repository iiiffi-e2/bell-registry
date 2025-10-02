/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ThreadList } from "@/components/message-board/thread-list";
import { MessageBoardTermsAgreement } from "@/components/message-board/MessageBoardTermsAgreement";

const ROLES = {
  PROFESSIONAL: "PROFESSIONAL",
  EMPLOYER: "EMPLOYER",
  AGENCY: "AGENCY",
  ADMIN: "ADMIN",
} as const;

export default function MessageBoardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [hasAgreedToTerms, setHasAgreedToTerms] = useState<boolean | null>(null);
  const [isCheckingTerms, setIsCheckingTerms] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    // Only allow professionals to access message board
    if (session?.user?.role !== ROLES.PROFESSIONAL) {
      router.push("/dashboard");
      return;
    }

    // Check if user has agreed to terms
    checkTermsAgreement();
  }, [session, status, router]);

  const checkTermsAgreement = async () => {
    try {
      setIsCheckingTerms(true);
      const response = await fetch("/api/message-board/terms");
      if (response.ok) {
        const data = await response.json();
        setHasAgreedToTerms(data.hasAgreedToTerms);
      } else {
        console.error("Failed to check terms agreement");
        setHasAgreedToTerms(false);
      }
    } catch (error) {
      console.error("Error checking terms agreement:", error);
      setHasAgreedToTerms(false);
    } finally {
      setIsCheckingTerms(false);
    }
  };

  const handleTermsAgreement = async () => {
    try {
      const response = await fetch("/api/message-board/terms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        setHasAgreedToTerms(true);
      } else {
        const data = await response.json();
        throw new Error(data.error || "Failed to accept terms");
      }
    } catch (error) {
      console.error("Error accepting terms:", error);
      alert("Failed to accept terms. Please try again.");
      throw error;
    }
  };

  // Show loading while checking authentication or terms
  if (status === "loading" || isCheckingTerms) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Don't render if not authenticated or not a professional
  if (status === "unauthenticated" || session?.user?.role !== ROLES.PROFESSIONAL) {
    return null;
  }

  // Show terms agreement if user hasn't agreed yet
  if (hasAgreedToTerms === false) {
    return <MessageBoardTermsAgreement onAgree={handleTermsAgreement} />;
  }

  // Show message board if user has agreed to terms
  if (hasAgreedToTerms === true) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <ThreadList />
      </div>
    );
  }

  // Fallback loading state
  return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );
}
