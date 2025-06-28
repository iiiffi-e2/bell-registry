import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import { UserRole } from "../types";

export const adminAuthOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: {
    strategy: "jwt",
    maxAge: 2 * 60 * 60, // 2 hours (shorter than main app)
  },
  jwt: {
    secret: process.env.ADMIN_JWT_SECRET, // Different from main app
    maxAge: 2 * 60 * 60, // 2 hours
  },
  // Remove custom cookie config to use NextAuth defaults
  // cookies: {
  //   sessionToken: {
  //     name: `admin.session-token`,
  //     options: {
  //       httpOnly: true,
  //       sameSite: 'strict',
  //       path: '/',
  //       secure: process.env.NODE_ENV === 'production',
  //       domain: process.env.NODE_ENV === 'production' ? '.bellregistry.com' : undefined
  //     }
  //   }
  // },
  providers: [
    CredentialsProvider({
      name: "Admin Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing credentials");
        }

        // Find user by email
        const user = await prisma.user.findUnique({
          where: { 
            email: credentials.email
          }
        });

        if (!user) {
          throw new Error("Invalid admin credentials");
        }

        if (!user.password) {
          throw new Error("Invalid admin credentials");
        }

        // Check if user has admin role
        if (user.role !== 'ADMIN') {
          throw new Error("Invalid admin credentials");
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
        if (!isPasswordValid) {
          throw new Error("Invalid admin credentials");
        }

        // Check if user is deleted or suspended
        if (user.isDeleted) {
          throw new Error("Admin account is disabled");
        }

        // Skip audit logging for now (table may not exist)

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() }
        });

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: UserRole.ADMIN, // Use enum value consistently
          image: user.image,
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Ensure only admin users get tokens
        if (user.role !== UserRole.ADMIN) {
          throw new Error("Admin access only");
        }
        token.role = user.role;
        token.userId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        // Double-check admin role
        if (token.role !== UserRole.ADMIN) {
          throw new Error("Admin access only");
        }
        
        session.user.id = token.userId as string;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
    async signIn({ user }) {
      // Final check: only allow admin users
      return user.role === UserRole.ADMIN;
    }
  },
  pages: {
    signIn: "/login",
    error: "/login"
  },
  events: {
    async signOut({ token }) {
      if (token?.userId) {
        // Log admin logout
        await prisma.adminAuditLog.create({
          data: {
            adminId: token.userId as string,
            action: "ADMIN_LOGOUT",
            details: {
              logoutTime: new Date()
            }
          }
        });
      }
    }
  }
};

// Admin-specific utilities
export async function validateAdminAccess(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });
  
  return user?.role === UserRole.ADMIN && !user.isDeleted;
}

export async function logAdminAction(
  adminId: string, 
  action: string, 
  details: Record<string, any> = {},
  ipAddress?: string,
  userAgent?: string
) {
  await prisma.adminAuditLog.create({
    data: {
      adminId,
      action,
      details,
      ipAddress,
      userAgent
    }
  });
} 