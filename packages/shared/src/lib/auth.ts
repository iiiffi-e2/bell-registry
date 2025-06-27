import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import { UserRole } from "@/types";
import { fromPrismaUserRole, toPrismaUserRole } from "./prisma-types";
import bcrypt from "bcryptjs";
import { sendWelcomeEmail } from "./welcome-email-service";
import { verifyTwoFactorSession } from "@/lib/2fa-session";

const ROLES = {
  PROFESSIONAL: UserRole.PROFESSIONAL,
  EMPLOYER: UserRole.EMPLOYER,
  AGENCY: UserRole.AGENCY,
  ADMIN: UserRole.ADMIN,
} as const;

declare module "next-auth" {
  interface User {
    id: string;
    role: UserRole;
    email: string;
    name?: string | null;
    image?: string | null;
  }

  interface Session {
    user: User & {
      id: string;
      role: UserRole;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    image?: string | null;
  }
}

function toPrismaRole(role: string): UserRole {
  const upperRole = role.toUpperCase();
  switch (upperRole) {
    case UserRole.PROFESSIONAL:
      return UserRole.PROFESSIONAL;
    case UserRole.EMPLOYER:
      return UserRole.EMPLOYER;
    case UserRole.AGENCY:
      return UserRole.AGENCY;
    case UserRole.ADMIN:
      return UserRole.ADMIN;
    default:
      return UserRole.PROFESSIONAL;
  }
}

function isProfessionalRole(role: UserRole): boolean {
  return role === UserRole.PROFESSIONAL;
}

function isEmployerOrAgencyRole(role: UserRole): boolean {
  return role === UserRole.EMPLOYER || role === UserRole.AGENCY;
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        // Handle 2FA-verified login
        if (credentials.password === "__2FA_VERIFIED__") {
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email
            }
          });

          if (!user) {
            throw new Error("No account found with this email address");
          }

          // Check if account is deleted
          if (user.isDeleted) {
            throw new Error("This account has been deleted");
          }

          return {
            id: user.id,
            email: user.email,
            role: fromPrismaUserRole(user.role),
            name: `${user.firstName} ${user.lastName}`.trim(),
            image: user.image,
          } as any;
        }

        // Normal credential verification
        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        });

        if (!user || !user.password) {
          throw new Error("No account found with this email address");
        }

        // Check if account is deleted
        if (user.isDeleted) {
          throw new Error("This account has been deleted");
        }

        const isCorrectPassword = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isCorrectPassword) {
          throw new Error("Incorrect password");
        }

        return {
          id: user.id,
          email: user.email,
          role: fromPrismaUserRole(user.role),
          name: `${user.firstName} ${user.lastName}`.trim(),
          image: user.image,
        } as any;
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
          include: {
            accounts: true
          }
        });

        // Check if existing user account is deleted
        if (existingUser?.isDeleted) {
          throw new Error("This account has been deleted");
        }

        if (existingUser && existingUser.accounts.length === 0) {
          await prisma.account.create({
            data: {
              userId: existingUser.id,
              type: account.type,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              access_token: account.access_token,
              token_type: account.token_type,
              scope: account.scope,
            },
          });

          user.id = existingUser.id;
          user.role = fromPrismaUserRole(existingUser.role);
          
          // Update last login time
          await prisma.user.update({
            where: { id: existingUser.id },
            data: { lastLoginAt: new Date() }
          });
          
          return true;
        }

        if (!existingUser) {
          const defaultRole = UserRole.PROFESSIONAL;
          const role = account.role ? toPrismaRole(account.role.toString()) : defaultRole;

          const newUser = await prisma.user.create({
            data: {
              email: user.email!,
              role: toPrismaUserRole(role),
              firstName: user.name?.split(" ")[0] || "",
              lastName: user.name?.split(" ").slice(1).join(" ") || "",
              image: user.image,
              lastLoginAt: new Date(),
              accounts: {
                create: {
                  type: account.type,
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                  access_token: account.access_token,
                  token_type: account.token_type,
                  scope: account.scope,
                }
              }
            }
          });

          if (role === UserRole.PROFESSIONAL) {
            await prisma.candidateProfile.create({
              data: {
                userId: newUser.id,
                skills: [],
                certifications: [],
                experience: [],
              }
            });
          } else if (role === UserRole.EMPLOYER || role === UserRole.AGENCY) {
            await prisma.employerProfile.create({
              data: {
                userId: newUser.id,
                companyName: "",
              }
            });
          }

          // Send welcome email to new Google OAuth user
          try {
            await sendWelcomeEmail({
              email: newUser.email,
              firstName: newUser.firstName || user.name?.split(" ")[0] || "",
              lastName: newUser.lastName || user.name?.split(" ").slice(1).join(" ") || "",
              role: role as any,
            });
            console.log(`Welcome email sent to Google OAuth user: ${newUser.email}`);
          } catch (emailError) {
            // Log email error but don't fail the authentication
            console.error(`Failed to send welcome email to Google OAuth user ${newUser.email}:`, emailError);
          }

          user.id = newUser.id;
          user.role = role;
        } else {
          user.id = existingUser.id;
          user.role = fromPrismaUserRole(existingUser.role);
          
          // Update last login time for existing user
          await prisma.user.update({
            where: { id: existingUser.id },
            data: { lastLoginAt: new Date() }
          });
        }
      }

      // Update last login time for any successful sign-in (including credentials)
      if (user.id) {
        try {
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() }
          });
        } catch (error) {
          console.error("Failed to update last login time:", error);
          // Don't fail the sign-in process for this
        }
      }
      
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.image = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.image = token.image;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
}; 