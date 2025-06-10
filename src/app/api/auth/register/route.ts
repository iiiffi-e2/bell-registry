import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as z from "zod";
import { UserRole } from "@/types";
import bcrypt from "bcryptjs";
import { generateProfileSlug } from "@/lib/utils";
import { sendWelcomeEmail } from "@/lib/welcome-email-service";

const registerSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["PROFESSIONAL", "EMPLOYER", "AGENCY", "ADMIN"]),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const body = registerSchema.parse(json);

    const exists = await prisma.user.findUnique({
      where: {
        email: body.email,
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
        email: body.email,
        password: hashedPassword,
        firstName: body.firstName,
        lastName: body.lastName,
        role: body.role,
        profileSlug,
      },
    });

    // Create the appropriate profile based on user role
    if (body.role === "PROFESSIONAL") {
      await prisma.candidateProfile.create({
        data: {
          userId: user.id,
          skills: [],
          certifications: [],
          experience: [],
        },
      });
    } else if (body.role === "EMPLOYER" || body.role === "AGENCY") {
      await prisma.employerProfile.create({
        data: {
          userId: user.id,
          companyName: "", // Will be set during onboarding
        },
      });
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