import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { Resend } from 'resend';

// Lazy initialization of Resend client
let resend: Resend | null = null;

function getResendClient(): Resend {
  if (!resend) {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured');
    }
    resend = new Resend(RESEND_API_KEY);
  }
  return resend;
}

const isDevelopment = process.env.NODE_ENV === 'development';

// Use Resend's development domain in dev mode
const FROM_EMAIL = isDevelopment 
  ? 'onboarding@resend.dev'
  : `Bell Registry <${process.env.FROM_EMAIL || 'noreply@bellregistry.com'}>`;

export async function PUT(request: NextRequest) {
  try {
    console.log("[EMAIL_UPDATE] Starting email update process");
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      console.log("[EMAIL_UPDATE] No session or email found");
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { email: newEmail } = await request.json();
    console.log("[EMAIL_UPDATE] New email requested:", newEmail);

    if (!newEmail) {
      console.log("[EMAIL_UPDATE] No email provided");
      return new NextResponse("Email is required", { status: 400 });
    }

    // Check if email is already in use
    const existingUser = await prisma.$queryRaw`
      SELECT id FROM "User"
      WHERE email = ${newEmail}
      AND id != ${session.user.id}
      LIMIT 1
    `;

    if (existingUser && Array.isArray(existingUser) && existingUser.length > 0) {
      console.log("[EMAIL_UPDATE] Email already in use");
      return new NextResponse("Email is already in use", { status: 400 });
    }

    // Generate verification token
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now

    console.log("[EMAIL_UPDATE] Token creation:", {
      expiresAt: expires.toISOString(),
      createdAt: new Date().toISOString(),
      timeUntilExpiry: Math.floor((expires.getTime() - Date.now()) / 1000 / 60) + ' minutes'
    });

    console.log("[EMAIL_UPDATE] Creating email change request");
    // Store the verification request with explicit timestamptz handling
    try {
      await prisma.$executeRaw`
        INSERT INTO "EmailChangeRequest" (id, "userId", "newEmail", token, expires, "createdAt")
        VALUES (
          gen_random_uuid(),
          ${session.user.id},
          ${newEmail},
          ${token},
          ${expires}::timestamptz,
          NOW()::timestamptz
        )
      `;
      console.log("[EMAIL_UPDATE] Email change request created successfully");
    } catch (dbError) {
      console.error("[EMAIL_UPDATE] Database error:", dbError);
      throw new Error("Failed to create email change request");
    }

    // Generate verification URL - use app URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const verificationUrl = `${appUrl}/api/settings/email/verify?token=${token}`;
    console.log("[EMAIL_UPDATE] Verification URL:", verificationUrl);

    try {
      // In development, use Resend's test email address
      const toEmail = isDevelopment ? 'delivered@resend.dev' : newEmail;
      console.log("[EMAIL_UPDATE] Attempting to send email:", {
        from: FROM_EMAIL,
        to: toEmail,
        isDevelopment,
        hasResendKey: !!process.env.RESEND_API_KEY
      });
      
      const emailResponse = await getResendClient().emails.send({
        from: FROM_EMAIL,
        to: toEmail,
        subject: 'Confirm your new email address',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">Email Change Confirmation</h1>
            <p>Click the link below to confirm your new email address. This link will expire in 30 minutes.</p>
            <a href="${verificationUrl}" style="display: inline-block; background-color: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 16px 0;">Confirm Email Change</a>
            <p style="color: #666;">If you didn't request this change, you can safely ignore this email.</p>
            ${isDevelopment ? '<p style="color: #ff6b6b;">Development Mode: Email would be sent to ' + newEmail + '</p>' : ''}
          </div>
        `,
      });

      console.log('[EMAIL_UPDATE] Email sent successfully:', emailResponse);

      if (isDevelopment) {
        return NextResponse.json({
          message: "Development mode: Verification email simulated. Check the console for details.",
          debug: {
            verificationUrl,
            originalEmail: newEmail,
            testEmail: toEmail,
            isDevelopment,
            hasResendKey: !!process.env.RESEND_API_KEY,
            emailResponse
          }
        });
      }

      return new NextResponse("Verification email sent to new address");
    } catch (emailError) {
      const error = emailError as Error;
      console.error("[EMAIL_UPDATE] Failed to send email:", {
        error: emailError,
        message: error.message,
        code: (error as any).code,
        name: error.name
      });
      
      // Delete the email change request since email failed
      console.log("[EMAIL_UPDATE] Deleting failed email change request");
      try {
        await prisma.$executeRaw`
          DELETE FROM "EmailChangeRequest"
          WHERE token = ${token}
        `;
        console.log("[EMAIL_UPDATE] Failed email change request deleted");
      } catch (deleteError) {
        console.error("[EMAIL_UPDATE] Failed to delete email change request:", deleteError);
      }

      throw new Error(`Failed to send verification email: ${error.message}`);
    }
  } catch (error) {
    const err = error as Error;
    console.error("[EMAIL_UPDATE] Error:", {
      error,
      message: err.message,
      stack: err.stack
    });
    return new NextResponse(
      err instanceof Error ? err.message : "Internal error", 
      { status: 500 }
    );
  }
} 