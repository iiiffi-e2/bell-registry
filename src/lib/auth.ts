import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import { UserRole } from "@/types";
import { fromPrismaUserRole, toPrismaUserRole } from "./prisma-types";
import bcrypt from "bcryptjs";

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

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        });

        if (!user || !user.password) {
          throw new Error("No account found with this email address");
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

          user.id = newUser.id;
          user.role = role;
        } else {
          user.id = existingUser.id;
          user.role = fromPrismaUserRole(existingUser.role);
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