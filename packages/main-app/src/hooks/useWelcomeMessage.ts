/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { getWelcomeMessage } from "@/lib/welcome-message-utils";

interface UserWelcomeData {
  createdAt: string;
  lastLoginAt?: string | null;
  firstName?: string | null;
  role?: string;
}

interface WelcomeMessage {
  title: string;
  subtitle: string;
}

export function useWelcomeMessage(): {
  welcomeMessage: WelcomeMessage | null;
  loading: boolean;
  error: string | null;
} {
  const { data: session, status } = useSession();
  const [welcomeMessage, setWelcomeMessage] = useState<WelcomeMessage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserData() {
      if (status === "loading" || !session?.user?.id) {
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/user/welcome-data`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch user data");
        }

        const userData: UserWelcomeData = await response.json();
        
        const message = getWelcomeMessage({
          createdAt: userData.createdAt,
          lastLoginAt: userData.lastLoginAt,
          firstName: userData.firstName || session.user.name?.split(' ')[0],
          role: userData.role || session.user.role
        });

        setWelcomeMessage(message);
      } catch (err) {
        console.error("Error fetching user welcome data:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        
        // Fallback to basic welcome message
        const fallbackMessage = getWelcomeMessage({
          createdAt: new Date().toISOString(), // This will show as "new user"
          firstName: session?.user?.name?.split(' ')[0],
          role: session?.user?.role
        });
        setWelcomeMessage(fallbackMessage);
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, [session, status]);

  return { welcomeMessage, loading, error };
}
