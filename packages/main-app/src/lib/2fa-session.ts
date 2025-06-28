import { randomBytes } from 'crypto';

// Store temporary 2FA session tokens (in production, use Redis or database)
const twoFactorSessions = new Map<string, { email: string; expiresAt: number }>();

// Helper function to verify 2FA session token
export function verifyTwoFactorSession(token: string): { valid: boolean; email?: string } {
  const session = twoFactorSessions.get(token);
  
  if (!session) {
    return { valid: false };
  }

  if (session.expiresAt < Date.now()) {
    twoFactorSessions.delete(token);
    return { valid: false };
  }

  return { valid: true, email: session.email };
}

// Helper function to create a 2FA session
export function createTwoFactorSession(email: string): { sessionToken: string; expiresAt: number } {
  const sessionToken = randomBytes(32).toString('hex');
  const expiresAt = Date.now() + (5 * 60 * 1000); // 5 minutes

  // Store the session token temporarily
  twoFactorSessions.set(sessionToken, {
    email,
    expiresAt
  });

  // Clean up expired sessions
  Array.from(twoFactorSessions.entries()).forEach(([token, session]) => {
    if (session.expiresAt < Date.now()) {
      twoFactorSessions.delete(token);
    }
  });

  return { sessionToken, expiresAt };
}

// Helper function to delete a 2FA session
export function deleteTwoFactorSession(token: string): void {
  twoFactorSessions.delete(token);
} 