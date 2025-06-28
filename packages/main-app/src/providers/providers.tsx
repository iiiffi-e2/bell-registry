"use client";

import { SessionProvider } from "next-auth/react";
import { ProfileProvider } from "./profile-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ProfileProvider>
        {children}
      </ProfileProvider>
    </SessionProvider>
  );
} 