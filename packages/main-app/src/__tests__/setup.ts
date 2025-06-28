import { vi } from "vitest";

// Mock environment variables
process.env.NEXTAUTH_URL = "http://localhost:3000";
process.env.NEXTAUTH_SECRET = "test-secret";
process.env.GOOGLE_CLIENT_ID = "test-client-id";
process.env.GOOGLE_CLIENT_SECRET = "test-client-secret";

// Mock next/auth
vi.mock("next-auth", () => {
  return {
    default: vi.fn(),
  };
}); 