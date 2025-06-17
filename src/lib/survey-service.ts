import { prisma } from "./prisma";

export interface SurveyStatus {
  shouldShowSurvey: boolean;
  shouldShowBanner: boolean;
  daysSinceSignup: number;
}

export async function getSurveyStatus(userId: string): Promise<SurveyStatus> {
  try {
    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        createdAt: true,
        lastLoginAt: true,
      }
    });

    if (!user) {
      return {
        shouldShowSurvey: false,
        shouldShowBanner: false,
        daysSinceSignup: 0,
      };
    }

    const now = new Date();
    const signupDate = new Date(user.createdAt);
    const daysSinceSignup = Math.floor((now.getTime() - signupDate.getTime()) / (1000 * 60 * 60 * 24));

    // For now, disable survey functionality since the database field was removed
    // You can re-enable this by checking localStorage or implementing a different tracking method
    const shouldShowSurvey = false;

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
    // Since the database field was removed, we could implement this using:
    // 1. localStorage on the frontend
    // 2. A separate table for survey dismissals
    // 3. Re-add the field to the database
    // For now, this is a no-op
    console.log("[SURVEY_SERVICE] Survey dismissal requested for user:", userId);
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