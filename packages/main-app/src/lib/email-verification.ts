import { prisma } from "./prisma";

export async function verifyEmailChange(token: string, userId: string) {
  try {
    // Find the email change request with explicit timestamptz handling
    const emailChangeRequest = await prisma.$queryRaw`
      SELECT 
        ecr.id,
        ecr."userId",
        ecr."newEmail",
        ecr.token,
        ecr.expires,
        u.email as current_email
      FROM "EmailChangeRequest" ecr
      JOIN "User" u ON u.id = ecr."userId"
      WHERE ecr.token = ${token}
      AND ecr."userId" = ${userId}
      LIMIT 1
    `;

    if (!emailChangeRequest || !Array.isArray(emailChangeRequest) || emailChangeRequest.length === 0) {
      throw new Error("Invalid token");
    }

    const request = emailChangeRequest[0];
    const expiresUtc = new Date(request.expires);
    const nowUtc = new Date();

    // Check if token is expired
    if (expiresUtc < nowUtc) {
      // Delete expired token
      await prisma.$executeRaw`
        DELETE FROM "EmailChangeRequest"
        WHERE id = ${request.id}
      `;
      throw new Error("Token has expired");
    }

    // Start a transaction to ensure all updates happen together
    await prisma.$transaction([
      // Update user's email
      prisma.$executeRaw`
        UPDATE "User"
        SET email = ${request.newEmail},
            "emailVerified" = NOW()::timestamptz
        WHERE id = ${userId}
      `,

      // Update any OAuth accounts
      prisma.$executeRaw`
        UPDATE "Account"
        SET "providerAccountId" = ${request.newEmail}
        WHERE "userId" = ${userId}
        AND provider = 'email'
      `,

      // Delete all sessions for this user
      prisma.$executeRaw`
        DELETE FROM "Session"
        WHERE "userId" = ${userId}
      `,

      // Delete all verification tokens for this user
      prisma.$executeRaw`
        DELETE FROM "VerificationToken"
        WHERE identifier = ${request.current_email}
        OR identifier = ${request.newEmail}
      `,

      // Delete the change request
      prisma.$executeRaw`
        DELETE FROM "EmailChangeRequest"
        WHERE id = ${request.id}
      `
    ]);

    return {
      success: true,
      oldEmail: request.current_email,
      newEmail: request.newEmail
    };
  } catch (error) {
    console.error("Email verification error:", error);
    throw error;
  }
} 