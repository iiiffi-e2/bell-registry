"use client";

import { SessionProvider } from "next-auth/react";
import { ProfileProvider } from "./profile-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider
      // Reduce session polling to prevent unnecessary re-fetches that could cause flickers
      refetchInterval={5 * 60} // 5 minutes instead of default 60 seconds
      refetchOnWindowFocus={false} // Don't refetch when user returns to tab
    >
      <ProfileProvider>
        {children}
      </ProfileProvider>
    </SessionProvider>
  );
} 