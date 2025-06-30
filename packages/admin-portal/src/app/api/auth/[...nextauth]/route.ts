import NextAuth from "next-auth";
import { adminAuthOptions } from "@bell-registry/shared";

const handler = NextAuth(adminAuthOptions);

export { handler as GET, handler as POST }; 