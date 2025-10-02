/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { prisma } from "@/lib/prisma";
import { generateProfileSlug } from "@/lib/utils";
import { logValidationErrors } from "@/lib/validation-logger";
import { z } from "zod";

// Use static rendering by default, only opt into dynamic when needed
export const dynamic = 'force-dynamic';
export const revalidate = 30; // Revalidate every 30 seconds

// Validation schemas for server-side validation
const candidateProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  preferredRole: z.string().min(2, "Professional title is required"),
  location: z.string().min(2, "Current location is required"),
  bio: z.string().min(50, "Bio must be at least 50 characters"),
  phoneNumber: z.string().optional(),
  photoUrl: z.string().optional(),
  customInitials: z.string().regex(/^[A-Za-z]{2,3}$/, "Must be 2-3 letters only").optional().or(z.literal("")),
  yearsOfExperience: z.string().optional(),
  availability: z.string().optional(),
  employmentType: z.string().optional(),
  openToRelocation: z.boolean().default(false),
  openToWork: z.boolean().default(false),
  isAnonymous: z.boolean().default(false),
  dontContactMe: z.boolean().default(false),
  seekingOpportunities: z.array(z.string()).default([]),
  skills: z.array(z.string()).default([]).refine((skills) => skills.length <= 10, {
    message: "You can select a maximum of 10 skills"
  }),
  payRangeMin: z.string().optional(),
  payRangeMax: z.string().optional(),
  payType: z.string().default("Salary"),
  whatImSeeking: z.string().optional(),
  whyIEnjoyThisWork: z.string().optional(),
  whatSetsApartMe: z.string().optional(),
  idealEnvironment: z.string().optional(),
  workLocations: z.array(z.string()).optional().default([]),
  additionalPhotos: z.array(z.string()).optional(),
  mediaUrls: z.array(z.string()).optional(),
  certifications: z.string().optional(),
  experience: z.array(z.any()).optional(),
});

const employerProfileSchema = z.object({
  companyName: z.string().optional(),
  description: z.string().min(10, "Description must be at least 10 characters").optional(),
  website: z.string().url("Please enter a valid website URL").optional().or(z.literal("")),
  logoUrl: z.string().optional(),
  location: z.string().min(2, "Location is required").optional(),
  publicSlug: z.string().optional(),
});

const agencyProfileSchema = z.object({
  companyName: z.string().min(1, "Company name is required for agencies"),
  description: z.string().min(10, "Description must be at least 10 characters").optional(),
  website: z.string().url("Please enter a valid website URL").optional().or(z.literal("")),
  logoUrl: z.string().optional(),
  location: z.string().min(2, "Location is required").optional(),
  publicSlug: z.string().optional(),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (session.user.role === "EMPLOYER" || session.user.role === "AGENCY") {
      const profile = await prisma.employerProfile.findUnique({
        where: { userId: session.user.id },
      });
      return NextResponse.json({ employerProfile: profile });
    } else {
      const profile = await prisma.candidateProfile.findUnique({
        where: { userId: session.user.id },
        include: {
          user: true
        }
      });
      return NextResponse.json(profile);
    }
  } catch (error) {
    console.error("[PROFILE_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse(JSON.stringify({ error: "Your session has expired. Please log in again." }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await req.json();
    
    // Server-side validation with logging
    let validationResult;
    let profileType: 'candidate' | 'employer' | 'agency' = 'candidate';
    
    if (session.user.role === "EMPLOYER" || session.user.role === "AGENCY") {
      profileType = session.user.role === "AGENCY" ? 'agency' : 'employer';
      const schema = session.user.role === "AGENCY" ? agencyProfileSchema : employerProfileSchema;
      validationResult = schema.safeParse(body);
    } else {
      profileType = 'candidate';
      validationResult = candidateProfileSchema.safeParse(body);
    }
    
    // Log validation errors if they occur
    if (!validationResult.success) {
      logValidationErrors(
        session,
        validationResult.error.flatten().fieldErrors,
        body,
        req as NextRequest,
        {
          profileType,
          attemptNumber: 1, // Could be enhanced to track retry attempts
          timeOnPage: undefined, // Could be passed from frontend
          referrer: req.headers.get('referer') || undefined,
        }
      );
      
      return new NextResponse(JSON.stringify({ 
        error: "Validation failed",
        details: validationResult.error.flatten().fieldErrors 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (session.user.role === "EMPLOYER" || session.user.role === "AGENCY") {
      // Prepare data based on user role
      const profileData: any = {
        description: body.description || null,
        website: body.website || null,
        logoUrl: body.logoUrl || null,
        location: body.location || null,
        publicSlug: body.publicSlug || null,
      };

      // Handle companyName based on user role
      if (session.user.role === "AGENCY") {
        // For agencies, companyName is required
        if (!body.companyName || body.companyName.trim() === "") {
          return new NextResponse(JSON.stringify({ error: "Company name is required for agencies" }), { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        profileData.companyName = body.companyName.trim();
      } else {
        // For employers, set a default company name
        profileData.companyName = (body.companyName && body.companyName.trim() !== "") 
          ? body.companyName.trim() 
          : "Individual Employer";
      }

      // Use upsert to create or update the profile
      try {
        const updatedProfile = await prisma.employerProfile.upsert({
          where: { userId: session.user.id },
          update: profileData,
          create: {
            userId: session.user.id,
            ...profileData,
          },
        });

        return NextResponse.json(updatedProfile);
      } catch (error) {
        console.error("[PROFILE_PUT] Database error:", error);
        console.error("[PROFILE_PUT] Profile data:", profileData);
        console.error("[PROFILE_PUT] User role:", session.user.role);
        
        // Handle specific database errors
        if (error instanceof Error) {
          if (error.message.includes('unique constraint')) {
            return new NextResponse(JSON.stringify({ error: "A profile with this information already exists." }), { 
              status: 400,
              headers: { 'Content-Type': 'application/json' }
            });
          }
          if (error.message.includes('Data too long')) {
            return new NextResponse(JSON.stringify({ error: "Some of your profile data is too long. Please shorten your text fields." }), { 
              status: 413,
              headers: { 'Content-Type': 'application/json' }
            });
          }
        }
        
        throw error;
      }
    } else {
      // Update both user and candidate profile in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Check if names are being updated and regenerate slug if needed
        let profileSlug: string | undefined;
        if (body.firstName && body.lastName) {
          const currentUser = await tx.user.findUnique({
            where: { id: session.user.id },
            select: { firstName: true, lastName: true, profileSlug: true }
          });
          
          // Only regenerate slug if names are different
          if (currentUser && 
              (currentUser.firstName !== body.firstName || currentUser.lastName !== body.lastName)) {
            profileSlug = await generateProfileSlug(body.firstName, body.lastName);
          }
        }

        // Update user fields
        const updatedUser = await tx.user.update({
          where: { id: session.user.id },
          data: {
            firstName: body.firstName,
            lastName: body.lastName,
            phoneNumber: body.phoneNumber,
            isAnonymous: body.isAnonymous,
            customInitials: body.customInitials || null,
            dontContactMe: body.dontContactMe,
            ...(body.photoUrl && { image: body.photoUrl }),
            ...(profileSlug && { profileSlug })
          },
        });

        // Update candidate profile
        const updatedProfile = await tx.candidateProfile.update({
          where: { userId: session.user.id },
          data: {
            bio: body.bio,
            skills: Array.isArray(body.skills) ? body.skills : (body.skills ? body.skills.split(",").map((s: string) => s.trim()) : undefined),
            experience: body.experience,
            certifications: body.certifications ? body.certifications.split(",").map((c: string) => c.trim()) : undefined,
            availability: body.availability ? new Date(body.availability) : undefined,
            resumeUrl: body.resumeUrl,
            photoUrl: body.photoUrl,
            location: body.location,
            title: body.preferredRole,
            additionalPhotos: body.additionalPhotos,
            currentLocation: body.location,
            headshot: body.photoUrl,
            idealEnvironment: body.idealEnvironment,
            mediaUrls: body.mediaUrls,
            openToRelocation: body.openToRelocation,
            payType: body.payType,
            payRangeMax: body.payRangeMax ? parseFloat(body.payRangeMax) : undefined,
            payRangeMin: body.payRangeMin ? parseFloat(body.payRangeMin) : undefined,
            preferredRole: body.preferredRole,
            seekingOpportunities: body.seekingOpportunities,
            whatImSeeking: body.whatImSeeking,
            whatSetsApartMe: body.whatSetsApartMe,
            whyIEnjoyThisWork: body.whyIEnjoyThisWork,
            workLocations: body.workLocations,
            yearsOfExperience: body.yearsOfExperience ? parseInt(body.yearsOfExperience) : undefined,
            openToWork: body.openToWork,
            employmentType: body.employmentType,
          },
          include: {
            user: true
          }
        });

        return updatedProfile;
      });

      return NextResponse.json(result);
    }
  } catch (error) {
    console.error("[PROFILE_PUT]", error);
    
    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return new NextResponse(JSON.stringify({ error: "Invalid data format. Please try again." }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Handle request size errors
    if (error instanceof Error && error.message.includes('PayloadTooLargeError')) {
      return new NextResponse(JSON.stringify({ error: "Your profile data is too large. Please reduce image sizes or remove some media files." }), { 
        status: 413,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new NextResponse(JSON.stringify({ error: "An unexpected error occurred. Please try again later." }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 