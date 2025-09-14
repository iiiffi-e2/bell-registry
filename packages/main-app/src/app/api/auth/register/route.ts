import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as z from "zod";
import { UserRole } from "@/types";
import bcrypt from "bcryptjs";
import { generateProfileSlug } from "@/lib/utils";
import { sendWelcomeEmail } from "@/lib/welcome-email-service";
import { getProfileApprovalFields } from "@bell-registry/shared/lib/profile-config";
import { initializeTrialSubscription } from "@/lib/subscription-service";

const registerSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["PROFESSIONAL", "EMPLOYER", "AGENCY", "ADMIN"]),
  membershipAccess: z.enum(["BELL_REGISTRY_REFERRAL", "PROFESSIONAL_REFERRAL", "NEW_APPLICANT", "EMPLOYER", "AGENCY"]).optional(),
  referralProfessionalName: z.string().optional().nullable(),
  companyName: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const body = registerSchema.parse(json);

    const exists = await prisma.user.findUnique({
      where: {
        email: body.email.toLowerCase(),
      },
    });

    if (exists) {
      return NextResponse.json(
        { message: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(body.password, 10);

    // Generate profile slug
    const profileSlug = await generateProfileSlug(body.firstName, body.lastName);

    const user = await prisma.user.create({
      data: {
        email: body.email.toLowerCase(),
        password: hashedPassword,
        firstName: body.firstName,
        lastName: body.lastName,
        role: body.role,
        profileSlug,
        membershipAccess: body.membershipAccess || "NEW_APPLICANT",
        referralProfessionalName: body.referralProfessionalName,
      },
    });

    // Create the appropriate profile based on user role
    if (body.role === "PROFESSIONAL") {
      const approvalFields = await getProfileApprovalFields();
      await prisma.candidateProfile.create({
        data: {
          userId: user.id,
          skills: [],
          certifications: [],
          experience: [],
          ...approvalFields,
        },
      });
    } else if (body.role === "EMPLOYER" || body.role === "AGENCY") {
      await prisma.employerProfile.create({
        data: {
          userId: user.id,
          companyName: body.companyName || (body.role === "AGENCY" ? "" : ""), // Set company name for agencies, empty for employers
        },
      });

      // Initialize trial subscription for new employers/agencies
      try {
        await initializeTrialSubscription(user.id, body.role);
        console.log(`Trial subscription initialized for ${body.role} ${user.id}`);
      } catch (trialError) {
        console.error(`Failed to initialize trial subscription for ${body.role} ${user.id}:`, trialError);
        // Don't fail the registration, just log the error
      }
    }

    // Send welcome email to the new user
    try {
      await sendWelcomeEmail({
        email: body.email,
        firstName: body.firstName,
        lastName: body.lastName,
        role: body.role as any, // Convert from string to UserRole enum
      });
      console.log(`Welcome email sent to ${body.email}`);
    } catch (emailError) {
      // Log email error but don't fail the registration
      console.error(`Failed to send welcome email to ${body.email}:`, emailError);
    }

    return NextResponse.json(
      { message: "User created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("[REGISTER]", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid request data", errors: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
} 