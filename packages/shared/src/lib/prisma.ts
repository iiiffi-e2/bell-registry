import { PrismaClient, Prisma } from "@prisma/client";

const prismaClientSingleton = () => {
  return new PrismaClient();
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

// Export Prisma types and client class
export { Prisma, PrismaClient };

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
} 