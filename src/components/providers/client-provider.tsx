"use client";

import { AuthProvider } from "@/providers/auth-provider";

export function ClientProvider({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
} 