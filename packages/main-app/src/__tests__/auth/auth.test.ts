/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { authOptions } from "@/lib/auth";
import { UserRole } from "@/types";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import type { Account } from "next-auth";

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    candidateProfile: {
      create: vi.fn(),
    },
    employerProfile: {
      create: vi.fn(),
    },
  },
}));

// Mock bcrypt
vi.mock("bcryptjs", () => ({
  default: {
    compare: vi.fn(),
  },
  compare: vi.fn(),
}));

describe("Auth Configuration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Credentials Provider", () => {
    const mockUser = {
      id: "user-1",
      email: "test@example.com",
      password: "hashed_password",
      role: UserRole.PROFESSIONAL,
      firstName: "John",
      lastName: "Doe",
      image: null,
    };

    it("should successfully authenticate with valid credentials", async () => {
      // Mock successful password comparison
      vi.mocked(bcrypt.compare).mockResolvedValue(true);
      
      // Mock user found in database
      (prisma.user.findUnique as any).mockResolvedValue(mockUser);

      const credentialsProvider = authOptions.providers.find(p => p.id === "credentials");
      const authorize = credentialsProvider?.authorize;

      if (!authorize || typeof authorize !== 'function') {
        throw new Error("Credentials provider authorize function not found");
      }

      const result = await authorize({
        email: "test@example.com",
        password: "correct_password",
      }, { req: {} as any });

      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        name: "John Doe",
        image: null,
      });
    });

    it("should fail authentication with invalid credentials", async () => {
      // Mock failed password comparison
      vi.mocked(bcrypt.compare).mockResolvedValue(false);
      
      // Mock user found in database
      (prisma.user.findUnique as any).mockResolvedValue(mockUser);

      const credentialsProvider = authOptions.providers.find(p => p.id === "credentials");
      const authorize = credentialsProvider?.authorize;

      if (!authorize || typeof authorize !== 'function') {
        throw new Error("Credentials provider authorize function not found");
      }

      await expect(authorize({
        email: "test@example.com",
        password: "wrong_password",
      }, { req: {} as any })).rejects.toThrow("Invalid credentials");
    });
  });

  describe("Google Provider", () => {
    const mockGoogleUser = {
      id: "google-user-1",
      email: "google@example.com",
      name: "Google User",
      image: "https://example.com/avatar.jpg",
      role: UserRole.PROFESSIONAL,
    };

    const mockGoogleAccount: Account = {
      provider: "google",
      type: "oauth",
      providerAccountId: "google-123",
      access_token: "mock-token",
      token_type: "Bearer",
      scope: "openid profile email",
    };

    it("should create a new professional user on first Google sign in", async () => {
      // Mock user not found in database
      (prisma.user.findUnique as any).mockResolvedValue(null);

      // Mock user creation
      const newUser = {
        id: "new-user-1",
        ...mockGoogleUser,
        role: UserRole.PROFESSIONAL,
      };
      (prisma.user.create as any).mockResolvedValue(newUser);

      const signInResult = await authOptions.callbacks?.signIn?.({
        user: mockGoogleUser,
        account: mockGoogleAccount,
        profile: { sub: "123", name: "Google User", email: "google@example.com" },
        credentials: undefined,
      } as any);

      expect(signInResult).toBe(true);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: mockGoogleUser.email,
          role: UserRole.PROFESSIONAL,
        }),
      });
      expect(prisma.candidateProfile.create).toHaveBeenCalled();
    });
  });
}); 