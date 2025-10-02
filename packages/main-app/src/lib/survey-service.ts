/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

import { prisma } from "./prisma";

export interface SurveyStatus {
  shouldShowSurvey: boolean;
  shouldShowBanner: boolean;
  daysSinceSignup: number;
}

export async function getSurveyStatus(userId: string): Promise<SurveyStatus> {
  try {
    // Get user data using raw query to handle the new field
    const userResult = await prisma.$queryRaw`
      SELECT 
        "createdAt",
        "surveyDismissedAt",
        "lastLoginAt"
      FROM "User" 
      WHERE id = ${userId}
      LIMIT 1
    `;

    if (!userResult || !Array.isArray(userResult) || userResult.length === 0) {
      return {
        shouldShowSurvey: false,
        shouldShowBanner: false,
        daysSinceSignup: 0,
      };
    }

    const user = userResult[0] as {
      createdAt: Date;
      surveyDismissedAt: Date | null;
      lastLoginAt: Date | null;
    };

    const now = new Date();
    const signupDate = new Date(user.createdAt);
    const daysSinceSignup = Math.floor((now.getTime() - signupDate.getTime()) / (1000 * 60 * 60 * 24));

    // Don't show survey if permanently dismissed (took survey)
    if (user.surveyDismissedAt) {
      return {
        shouldShowSurvey: false,
        shouldShowBanner: false,
        daysSinceSignup,
      };
    }

    // Show survey on every fresh page load unless permanently dismissed
    const shouldShowSurvey = true;

    return {
      shouldShowSurvey,
      shouldShowBanner: shouldShowSurvey,
      daysSinceSignup,
    };
  } catch (error) {
    console.error("[SURVEY_SERVICE] Error checking survey status:", error);
    return {
      shouldShowSurvey: false,
      shouldShowBanner: false,
      daysSinceSignup: 0,
    };
  }
}

export async function dismissSurveyPermanently(userId: string): Promise<void> {
  try {
    await prisma.$executeRaw`
      UPDATE "User" 
      SET "surveyDismissedAt" = NOW()::timestamptz 
      WHERE id = ${userId}
    `;
  } catch (error) {
    console.error("[SURVEY_SERVICE] Error permanently dismissing survey:", error);
    throw error;
  }
}

export async function dismissSurveyTemporarily(userId: string): Promise<void> {
  try {
    // For temporary dismissal, we use client-side sessionStorage
    // This function exists to keep the API consistent
  } catch (error) {
    console.error("[SURVEY_SERVICE] Error temporarily dismissing survey:", error);
    throw error;
  }
}

// Helper function to reset lastLoginAt to null for testing
export async function resetSurveyForNextLogin(userId: string): Promise<void> {
  try {
    await prisma.$executeRaw`
      UPDATE "User" 
      SET "lastLoginAt" = NULL 
      WHERE id = ${userId}
    `;
  } catch (error) {
    console.error("[SURVEY_SERVICE] Error resetting survey:", error);
    throw error;
  }
} 