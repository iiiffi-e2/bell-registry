import { authOptions } from "@/lib/auth";
import NextAuth from "next-auth";

// Create handler without accessing headers/cookies directly
const handler = NextAuth(authOptions);

// Export in a way that works with Edge and Node.js runtimes
export const GET = handler;
export const POST = handler;