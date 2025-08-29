import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
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
          : 'The Bell Registry <noreply@thebellregistry.com>';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // If user doesn't exist, still return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({ success: true });
    }

    // Generate reset token
    const resetToken = randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now

    // Store reset token in database
    await prisma.user.update({
      where: { email: email.toLowerCase() },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    // Send reset email - use app URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;
    
    // In development, use Resend's test email address
    const toEmail = isDevelopment ? 'delivered@resend.dev' : email;
    
    const emailResponse = await getResendClient().emails.send({
      from: FROM_EMAIL,
      to: toEmail,
      subject: 'Reset Your Password - The Bell Registry',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Password Reset Request</h1>
          <p>You requested a password reset for your Bell Registry account.</p>
          <p>Click the link below to reset your password. This link will expire in 30 minutes.</p>
          <a href="${resetUrl}" style="display: inline-block; background-color: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 16px 0;">Reset Password</a>
          <p style="color: #666;">If you didn't request this change, you can safely ignore this email.</p>
          ${isDevelopment ? '<p style="color: #ff6b6b;">Development Mode: Email would be sent to ' + email + '</p>' : ''}
        </div>
      `,
    });

    if (isDevelopment) {
      return NextResponse.json({
        message: "Development mode: Reset email simulated. Check the console for details.",
        debug: {
          resetUrl,
          originalEmail: email,
          testEmail: toEmail,
          isDevelopment,
          hasResendKey: !!process.env.RESEND_API_KEY,
          emailResponse
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in forgot-password:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
} 