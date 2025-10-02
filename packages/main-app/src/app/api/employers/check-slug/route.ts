/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json({ error: "Slug parameter required" }, { status: 400 });
    }

    // Check if slug already exists (excluding current user's slug)
    const existingProfile = await prisma.employerProfile.findFirst({
      where: {
        publicSlug: slug,
        userId: { not: session.user.id }
      }
    });

    const isAvailable = !existingProfile;
    
    // Generate suggestions if slug is taken
    let suggestions: string[] = [];
    if (!isAvailable) {
      suggestions = await generateSlugSuggestions(slug);
    }

    return NextResponse.json({
      available: isAvailable,
      suggestions
    });
  } catch (error) {
    console.error("Error checking slug availability:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function generateSlugSuggestions(baseSlug: string): Promise<string[]> {
  const suggestions: string[] = [];
  
  // Try with numbers
  for (let i = 1; i <= 3; i++) {
    const suggestion = `${baseSlug}-${i}`;
    const exists = await prisma.employerProfile.findFirst({
      where: { publicSlug: suggestion }
    });
    if (!exists) {
      suggestions.push(suggestion);
    }
  }
  
  // Try with year
  const currentYear = new Date().getFullYear();
  const yearSuggestion = `${baseSlug}-${currentYear}`;
  const yearExists = await prisma.employerProfile.findFirst({
    where: { publicSlug: yearSuggestion }
  });
  if (!yearExists && !suggestions.includes(yearSuggestion)) {
    suggestions.push(yearSuggestion);
  }
  
  // Try with common suffixes
  const suffixes = ['inc', 'corp', 'llc', 'ltd'];
  for (const suffix of suffixes) {
    if (suggestions.length >= 5) break;
    const suggestion = `${baseSlug}-${suffix}`;
    const exists = await prisma.employerProfile.findFirst({
      where: { publicSlug: suggestion }
    });
    if (!exists) {
      suggestions.push(suggestion);
    }
  }
  
  return suggestions.slice(0, 5); // Return max 5 suggestions
}