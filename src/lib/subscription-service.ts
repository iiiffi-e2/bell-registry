import { prisma } from "@/lib/prisma";
// import { SubscriptionType } from "@prisma/client";
import Stripe from "stripe";

// Temporary enum - Prisma client not exporting the enum properly
export enum SubscriptionType {
  TRIAL = 'TRIAL',
  SPOTLIGHT = 'SPOTLIGHT',
  BUNDLE = 'BUNDLE',
  UNLIMITED = 'UNLIMITED',
  NETWORK = 'NETWORK'
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

// Subscription plan configurations
export const SUBSCRIPTION_PLANS = {
  TRIAL: {
    name: "30-Day Trial",
    jobLimit: 5,
    durationDays: 30,
    price: 0,
    stripeProductId: null,
  },
  SPOTLIGHT: {
    name: "Spotlight",
    jobLimit: 1,
    durationDays: 30,
    price: 250,
    stripeProductId: process.env.STRIPE_SPOTLIGHT_PRODUCT_ID,
  },
  BUNDLE: {
    name: "Hiring Bundle",
    jobLimit: 3,
    durationDays: 30,
    price: 650,
    stripeProductId: process.env.STRIPE_BUNDLE_PRODUCT_ID,
  },
  UNLIMITED: {
    name: "Unlimited",
    jobLimit: null, // null means unlimited
    durationDays: 60,
    price: 1250,
    stripeProductId: process.env.STRIPE_UNLIMITED_PRODUCT_ID,
  },
  NETWORK: {
    name: "Network",
    jobLimit: 3,
    durationDays: 90,
    price: 5000,
    stripeProductId: process.env.STRIPE_NETWORK_PRODUCT_ID,
    hasNetworkAccess: true,
  },
} as const;

/**
 * Check if an employer has an active subscription
 */
export async function hasActiveSubscription(employerId: string): Promise<boolean> {
  try {
    const employer = await prisma.employerProfile.findUnique({
      where: { userId: employerId },
    });

    if (!employer) {
      return false;
    }

    const now = new Date();
    
    // Trial subscription logic
    if ((employer as any).subscriptionType === SubscriptionType.TRIAL) {
      const trialEndDate = new Date((employer as any).subscriptionStartDate || employer.createdAt);
      trialEndDate.setDate(trialEndDate.getDate() + 30); // 30-day trial
      return now <= trialEndDate;
    }

    // Paid subscription logic
    if ((employer as any).subscriptionEndDate) {
      return now <= (employer as any).subscriptionEndDate;
    }

    return false;
  } catch (error) {
    console.error("Error checking subscription status:", error);
    return false;
  }
}

/**
 * Check if an employer can post a job
 */
export async function canPostJob(employerId: string): Promise<boolean> {
  try {
    const employer = await prisma.employerProfile.findUnique({
      where: { userId: employerId },
    });

    if (!employer) {
      return false;
    }

    // First check if subscription is active
    const hasActive = await hasActiveSubscription(employerId);
    if (!hasActive) {
      return false;
    }

    // Check job posting limits
    const subscriptionType = (employer as any).subscriptionType || SubscriptionType.TRIAL;
    const plan = SUBSCRIPTION_PLANS[subscriptionType as keyof typeof SUBSCRIPTION_PLANS];
    
    // Unlimited plans (UNLIMITED, NETWORK)
    if (plan.jobLimit === null) {
      return true;
    }

    // Count active (non-expired) jobs posted in the current subscription period
    const subscriptionStartDate = (employer as any).subscriptionStartDate || employer.createdAt;
    const activeJobsCount = await getActiveJobsCount(employerId, subscriptionStartDate);
    
    return activeJobsCount < plan.jobLimit;
  } catch (error) {
    console.error("Error checking job posting eligibility:", error);
    return false;
  }
}

/**
 * Get count of active jobs (jobs that haven't expired after 60 days)
 */
async function getActiveJobsCount(employerId: string, subscriptionStartDate: Date): Promise<number> {
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  const activeJobs = await prisma.job.count({
    where: {
      employerId: employerId,
      createdAt: {
        gte: subscriptionStartDate,
      },
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
        { 
          AND: [
            { expiresAt: null },
            { createdAt: { gte: sixtyDaysAgo } }
          ]
        }
      ],
      status: {
        in: ["ACTIVE", "FILLED"],
      },
    },
  });

  return activeJobs;
}

/**
 * Increment job post count for an employer
 */
export async function incrementJobPostCount(employerId: string): Promise<void> {
  try {
    // Use raw SQL for now to avoid type issues
    await prisma.$executeRaw`
      UPDATE "EmployerProfile" 
      SET "jobsPostedCount" = "jobsPostedCount" + 1 
      WHERE "userId" = ${employerId}
    `;
  } catch (error) {
    console.error("Error incrementing job post count:", error);
    throw error;
  }
}

/**
 * Get employer subscription details
 */
export async function getEmployerSubscription(employerId: string) {
  const employer = await prisma.employerProfile.findUnique({
    where: { userId: employerId },
  });
  
  if (!employer) return null;
  
  return {
    subscriptionType: (employer as any).subscriptionType || SubscriptionType.TRIAL,
    subscriptionStartDate: (employer as any).subscriptionStartDate || employer.createdAt,
    subscriptionEndDate: (employer as any).subscriptionEndDate || null,
    jobPostLimit: (employer as any).jobPostLimit || 5,
    jobsPostedCount: (employer as any).jobsPostedCount || 0,
    hasNetworkAccess: (employer as any).hasNetworkAccess || false,
    stripeCustomerId: (employer as any).stripeCustomerId || null,
  };
}

/**
 * Update employer subscription after successful payment
 */
export async function updateEmployerSubscription(
  employerId: string,
  subscriptionType: SubscriptionType,
  stripeCustomerId?: string,
  stripeSessionId?: string
): Promise<void> {
  const plan = SUBSCRIPTION_PLANS[subscriptionType];
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + plan.durationDays);

  // Use raw SQL for now to avoid type issues
  await prisma.$executeRaw`
    UPDATE "EmployerProfile" 
    SET 
      "subscriptionType" = ${subscriptionType},
      "subscriptionStartDate" = ${startDate},
      "subscriptionEndDate" = ${endDate},
      "jobPostLimit" = ${plan.jobLimit},
      "jobsPostedCount" = 0,
      "stripeCustomerId" = ${stripeCustomerId || null},
      "stripeSessionId" = ${stripeSessionId || null},
      "hasNetworkAccess" = ${subscriptionType === SubscriptionType.NETWORK}
    WHERE "userId" = ${employerId}
  `;
}

/**
 * Create Stripe checkout session for subscription
 */
export async function createCheckoutSession(
  employerId: string,
  subscriptionType: SubscriptionType,
  successUrl: string,
  cancelUrl: string
): Promise<string> {
  const plan = SUBSCRIPTION_PLANS[subscriptionType];
  
  if (plan.price === 0) {
    throw new Error('Cannot create checkout session for free plan');
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: plan.name,
            description: getPackageDescription(subscriptionType, plan),
          },
          unit_amount: Math.round(plan.price * 100),
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      employerId,
      subscriptionType,
    },
  });

  return session.url!;
}

/**
 * Get package description for Stripe checkout
 */
function getPackageDescription(subscriptionType: SubscriptionType, plan: any): string {
  switch (subscriptionType) {
    case SubscriptionType.SPOTLIGHT:
      return "1 job post for 30 days";
    case SubscriptionType.BUNDLE:
      return "3 job posts for 30 days";
    case SubscriptionType.UNLIMITED:
      return "Unlimited job posts for 60 days";
    case SubscriptionType.NETWORK:
      return "90-day access to private candidate network + 3 job posts";
    default:
      return `${plan.jobLimit === null ? "Unlimited" : plan.jobLimit} job posts for ${plan.durationDays} days`;
  }
}

/**
 * Handle successful Stripe payment
 */
export async function handleSuccessfulPayment(sessionId: string): Promise<void> {
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  
  if (session.payment_status === "paid" && session.metadata) {
    const { employerId, subscriptionType } = session.metadata;
    
    await updateEmployerSubscription(
      employerId,
      subscriptionType as SubscriptionType,
      session.customer as string,
      sessionId
    );
  }
}

/**
 * Initialize trial subscription for new employer
 */
export async function initializeTrialSubscription(employerId: string): Promise<void> {
  const existingProfile = await prisma.employerProfile.findUnique({
    where: { userId: employerId },
  });

  if (!existingProfile) {
    throw new Error("Employer profile not found");
  }

  // Use raw SQL to initialize trial
  await prisma.$executeRaw`
    UPDATE "EmployerProfile" 
    SET 
      "subscriptionType" = ${SubscriptionType.TRIAL},
      "subscriptionStartDate" = ${new Date()},
      "jobPostLimit" = 5,
      "jobsPostedCount" = 0
    WHERE "userId" = ${employerId}
  `;
}

export { stripe }; 