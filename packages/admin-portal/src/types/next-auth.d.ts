import { UserRole } from "@bell-registry/shared";
import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string;
      image?: string;
      role: UserRole;
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string;
    image?: string;
    role: UserRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: UserRole;
    userId: string;
  }
} 