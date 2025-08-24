"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface NetworkAccessData {
  hasNetworkAccess: boolean;
  subscriptionType?: string;
  loading: boolean;
  error?: string;
}

export function useNetworkAccess(): NetworkAccessData {
  const { data: session, status } = useSession();
  const [data, setData] = useState<NetworkAccessData>({
    hasNetworkAccess: false,
    loading: true,
  });

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session?.user?.id || (session.user.role !== "EMPLOYER" && session.user.role !== "AGENCY")) {
      setData({
        hasNetworkAccess: false,
        loading: false,
      });
      return;
    }

    const fetchNetworkAccess = async () => {
      try {
        const response = await fetch("/api/test-network-access");
        if (!response.ok) {
          throw new Error("Failed to fetch network access data");
        }
        
        const result = await response.json();
        setData({
          hasNetworkAccess: result.employerProfile?.hasNetworkAccess || false,
          subscriptionType: result.employerProfile?.subscriptionType,
          loading: false,
        });
      } catch (error) {
        console.error("Error checking network access:", error);
        setData({
          hasNetworkAccess: false,
          loading: false,
          error: "Failed to check network access",
        });
      }
    };

    fetchNetworkAccess();
  }, [session, status]);

  return data;
}