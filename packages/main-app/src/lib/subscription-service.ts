import { prisma } from "@/lib/prisma";
// import { SubscriptionType } from "@prisma/client";
import Stripe from "stripe";
import { createBillingRecord, updateBillingRecordStatus } from "@/lib/billing-service";

// Temporary enum - Prisma client not exporting the enum properly
export enum SubscriptionType {
  TRIAL = 'TRIAL',
  SPOTLIGHT = 'SPOTLIGHT',
  BUNDLE = 'BUNDLE',
  UNLIMITED = 'UNLIMITED',
  NETWORK = 'NETWORK',
  NETWORK_QUARTERLY = 'NETWORK_QUARTERLY'
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

// Subscription plan configurations
export const SUBSCRIPTION_PLANS = {
  TRIAL: {
    name: "30-Day Trial",
    jobLimit: 5, // This is for agencies only. Employers get 0 job credits.
    durationDays: 30,
    price: 0,
    stripeProductId: null,
    isCredits: false, // For agencies, this becomes credit-based (5 credits)
  },
  SPOTLIGHT: {
    name: "Spotlight",
    jobLimit: null, // Credits-based, no limit
    credits: 1, // Grants 1 job post credit
    durationDays: null, // One-time purchase, no expiration
    price: 250,
    stripeProductId: process.env.STRIPE_SPOTLIGHT_PRODUCT_ID,
    isCredits: true,
    listingDurationDays: 45,
  },
  BUNDLE: {
    name: "Hiring Bundle",
    jobLimit: null, // Credits-based, no limit
    credits: 4, // Grants 4 job post credits
    durationDays: null, // One-time purchase, no expiration
    price: 750,
    stripeProductId: process.env.STRIPE_BUNDLE_PRODUCT_ID,
    isCredits: true,
    listingDurationDays: 45,
  },
  UNLIMITED: {
    name: "Unlimited (Annual)",
    jobLimit: null, // Unlimited during active subscription
    durationDays: 365, // Annual subscription
    price: 1500,
    stripeProductId: process.env.STRIPE_UNLIMITED_PRODUCT_ID,
    isCredits: false,
    hasUnlimitedPosting: true,
    listingDurationDays: 45,
    autoRenew: true,
  },
  NETWORK: {
    name: "Network Access Membership (Annual)",
    jobLimit: null, // Unlimited during active subscription
    durationDays: 365, // Annual subscription
    price: 17500,
    stripeProductId: process.env.STRIPE_NETWORK_PRODUCT_ID,
    isCredits: false,
    hasNetworkAccess: true,
    hasUnlimitedPosting: true,
    listingDurationDays: 45,
    autoRenew: true,
  },
  NETWORK_QUARTERLY: {
    name: "Network Access Membership (Quarterly)",
    jobLimit: null, // Unlimited during active subscription
    durationDays: 90, // Quarterly subscription
    price: 5000,
    stripeProductId: process.env.STRIPE_NETWORK_QUARTERLY_PRODUCT_ID,
    isCredits: false,
    hasNetworkAccess: true,
    hasUnlimitedPosting: true,
    listingDurationDays: 45,
    autoRenew: true,
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
 * Check if an employer has active unlimited posting entitlement
 */
export async function hasActiveUnlimitedPosting(employerId: string): Promise<boolean> {
  try {
    const employer = await prisma.employerProfile.findUnique({
      where: { userId: employerId },
    });

    if (!employer) {
      return false;
    }

    const now = new Date();
    
    // Check if they have active Unlimited Annual subscription
    const unlimitedPostingEndDate = (employer as any).unlimitedPostingEndDate;
    if (unlimitedPostingEndDate && now <= unlimitedPostingEndDate) {
      return true;
    }

    // Check if they have active Network Access subscription (which includes unlimited posting)
    const networkAccessEndDate = (employer as any).networkAccessEndDate;
    if (networkAccessEndDate && now <= networkAccessEndDate) {
      return true;
    }

    return false;
  } catch (error) {
    console.error("Error checking unlimited posting status:", error);
    return false;
  }
}

/**
 * Check if an employer has active Network Access permissions
 */
export async function hasActiveNetworkAccess(employerId: string): Promise<boolean> {
  try {
    const employer = await prisma.employerProfile.findUnique({
      where: { userId: employerId },
    });

    if (!employer) {
      return false;
    }

    const now = new Date();
    const networkAccessEndDate = (employer as any).networkAccessEndDate;
    
    return networkAccessEndDate && now <= networkAccessEndDate;
  } catch (error) {
    console.error("Error checking network access status:", error);
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

    // Check if the organization has any active unlimited-posting entitlement
    const hasUnlimitedPosting = await hasActiveUnlimitedPosting(employerId);
    if (hasUnlimitedPosting) {
      return true; // Can post without consuming credits
    }

    // Check if they have credits available (this covers both agency free credits and purchased credits)
    const jobCredits = (employer as any).jobCredits || 0;
    if (jobCredits > 0) {
      return true;
    }

    // No credits and no unlimited posting means they cannot post
    return false;
  } catch (error) {
    console.error("Error checking job posting eligibility:", error);
    return false;
  }
}

/**
 * Get count of active jobs posted during the current subscription period
 * For paid subscriptions, this excludes trial jobs
 */
async function getActiveJobsCount(employerId: string, subscriptionStartDate: Date): Promise<number> {
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  // Get the employer's current subscription info
  const employer = await prisma.employerProfile.findUnique({
    where: { userId: employerId },
  });

  if (!employer) return 0;

  const subscriptionType = (employer as any).subscriptionType || SubscriptionType.TRIAL;
  
  // For TRIAL subscriptions, count all jobs from account creation
  if (subscriptionType === SubscriptionType.TRIAL) {
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

  // For PAID subscriptions, only count jobs posted AFTER the subscription started
  // This ensures trial jobs don't count against paid subscription limits
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
 * Handle job posting - consumes credits if no unlimited posting active
 */
export async function handleJobPosting(employerId: string): Promise<void> {
  try {
    const employer = await prisma.employerProfile.findUnique({
      where: { userId: employerId },
    });

    if (!employer) {
      throw new Error("Employer profile not found");
    }

    const hasUnlimitedPosting = await hasActiveUnlimitedPosting(employerId);
    const subscriptionType = (employer as any).subscriptionType || SubscriptionType.TRIAL;
    
    if (!hasUnlimitedPosting) {
      // Check if they have credits to consume
      const jobCredits = (employer as any).jobCredits || 0;
      if (jobCredits > 0) {
        // Consume 1 credit
        await prisma.$executeRaw`
          UPDATE "EmployerProfile" 
          SET "jobCredits" = "jobCredits" - 1 
          WHERE "userId" = ${employerId} AND "jobCredits" > 0
        `;
      } else {
        // No credits available and no unlimited posting subscription
        throw new Error("No credits available and no unlimited posting subscription");
      }
    }

    // Always increment the job post count for tracking
    await prisma.$executeRaw`
      UPDATE "EmployerProfile" 
      SET "jobsPostedCount" = "jobsPostedCount" + 1 
      WHERE "userId" = ${employerId}
    `;
  } catch (error) {
    console.error("Error handling job posting:", error);
    throw error;
  }
}

/**
 * Legacy function - kept for compatibility
 * @deprecated Use handleJobPosting instead
 */
export async function incrementJobPostCount(employerId: string): Promise<void> {
  return handleJobPosting(employerId);
}

/**
 * Get employer subscription details
 */
export async function getEmployerSubscription(employerId: string) {
  const employer = await prisma.employerProfile.findUnique({
    where: { userId: employerId },
  });
  
  if (!employer) return null;
  
  const subscriptionType = (employer as any).subscriptionType || SubscriptionType.TRIAL;
  const subscriptionStartDate = (employer as any).subscriptionStartDate || employer.createdAt;
  const subscriptionEndDate = (employer as any).subscriptionEndDate || null;
  
  // Get job limit from plan configuration instead of database field
  const plan = SUBSCRIPTION_PLANS[subscriptionType as keyof typeof SUBSCRIPTION_PLANS];
  const jobPostLimit = plan.jobLimit;
  
  // Calculate actual jobs posted in current subscription period
  const actualJobsPostedCount = await getActiveJobsCount(employerId, subscriptionStartDate);
  
  return {
    subscriptionType,
    subscriptionStartDate,
    subscriptionEndDate,
    jobPostLimit,
    jobsPostedCount: actualJobsPostedCount, // Use actual count instead of database field
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
  console.log('Updating employer subscription:', {
    employerId,
    subscriptionType,
    stripeCustomerId,
    stripeSessionId
  });

  const plan = SUBSCRIPTION_PLANS[subscriptionType];
  const startDate = new Date();

  console.log('Plan details:', {
    planName: plan.name,
    isCredits: plan.isCredits,
    credits: (plan as any).credits,
    hasUnlimitedPosting: (plan as any).hasUnlimitedPosting,
    hasNetworkAccess: (plan as any).hasNetworkAccess,
    durationDays: plan.durationDays,
    startDate
  });

  try {
    if (plan.isCredits) {
      // Handle credit-based purchases (Spotlight, Hiring Bundle)
      const credits = (plan as any).credits || 0;
      await prisma.$executeRaw`
        UPDATE "EmployerProfile" 
        SET 
          "jobCredits" = "jobCredits" + ${credits},
          "stripeCustomerId" = ${stripeCustomerId || null},
          "stripeSessionId" = ${stripeSessionId || null}
        WHERE "userId" = ${employerId}
      `;
    } else {
      // Handle subscription-based purchases (Unlimited, Network Access)
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + (plan.durationDays || 0));

      const hasUnlimitedPosting = (plan as any).hasUnlimitedPosting || false;
      const hasNetworkAccess = (plan as any).hasNetworkAccess || false;
      const autoRenew = (plan as any).autoRenew || false;

      let renewalPeriod = null;
      if (subscriptionType === SubscriptionType.NETWORK_QUARTERLY) {
        renewalPeriod = 'QUARTERLY';
      } else if (subscriptionType === SubscriptionType.NETWORK || subscriptionType === SubscriptionType.UNLIMITED) {
        renewalPeriod = 'ANNUAL';
      }

      await prisma.$executeRaw`
        UPDATE "EmployerProfile" 
        SET 
          "subscriptionType" = ${subscriptionType}::"SubscriptionType",
          "subscriptionStartDate" = ${startDate},
          "subscriptionEndDate" = ${endDate},
          "unlimitedPostingEndDate" = ${hasUnlimitedPosting ? endDate : null},
          "networkAccessEndDate" = ${hasNetworkAccess ? endDate : null},
          "hasNetworkAccess" = ${hasNetworkAccess},
          "autoRenew" = ${autoRenew},
          "renewalPeriod" = ${renewalPeriod},
          "stripeCustomerId" = ${stripeCustomerId || null},
          "stripeSessionId" = ${stripeSessionId || null}
        WHERE "userId" = ${employerId}
      `;
    }
    
    // Verify the update worked
    const updatedProfile = await prisma.employerProfile.findUnique({
      where: { userId: employerId },
    });
    
    console.log('Updated profile verification:', {
      subscriptionType: (updatedProfile as any)?.subscriptionType,
      jobCredits: (updatedProfile as any)?.jobCredits,
      unlimitedPostingEndDate: (updatedProfile as any)?.unlimitedPostingEndDate,
      networkAccessEndDate: (updatedProfile as any)?.networkAccessEndDate,
      autoRenew: (updatedProfile as any)?.autoRenew
    });
    
  } catch (error) {
    console.error('Error updating employer subscription:', error);
    throw error;
  }
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
      return "1 job post credit (45-day listings, no expiration)";
    case SubscriptionType.BUNDLE:
      return "4 job post credits (45-day listings, no expiration)";
    case SubscriptionType.UNLIMITED:
      return "Unlimited job posting for 1 year (45-day listings, auto-renew)";
    case SubscriptionType.NETWORK:
      return "Annual Network Access: Unlimited posting + full profiles + direct messaging (auto-renew)";
    case SubscriptionType.NETWORK_QUARTERLY:
      return "Quarterly Network Access: Unlimited posting + full profiles + direct messaging (auto-renew)";
    default:
      return plan.isCredits 
        ? `${(plan as any).credits} job post credits (45-day listings, no expiration)`
        : `${plan.jobLimit === null ? "Unlimited" : plan.jobLimit} job posts for ${plan.durationDays} days`;
  }
}

/**
 * Handle successful Stripe payment
 */
export async function handleSuccessfulPayment(sessionId: string): Promise<void> {
  console.log('Processing successful payment for session:', sessionId);
  
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    console.log('Retrieved session:', {
      id: session.id,
      payment_status: session.payment_status,
      metadata: session.metadata,
      customer: session.customer
    });
    
    if (session.payment_status === "paid" && session.metadata) {
      const { employerId, subscriptionType } = session.metadata;
      
      console.log('Processing subscription update:', {
        employerId,
        subscriptionType,
        customer: session.customer,
        sessionId
      });
      
      if (!employerId || !subscriptionType) {
        console.error('Missing employerId or subscriptionType in session metadata:', session.metadata);
        throw new Error('Missing required metadata in session');
      }

      // Get employer profile to create billing record
      const employerProfile = await prisma.employerProfile.findUnique({
        where: { userId: employerId },
      });

      if (!employerProfile) {
        throw new Error('Employer profile not found');
      }

      // Get plan details for billing record
      const plan = SUBSCRIPTION_PLANS[subscriptionType as keyof typeof SUBSCRIPTION_PLANS];
      const description = `${plan.name} - ${getPackageDescription(subscriptionType as SubscriptionType, plan)}`;

      // Create billing record
      const billingRecord = await createBillingRecord(
        employerProfile.id,
        plan.price,
        description,
        subscriptionType as any, // Using any to avoid type issues temporarily
        sessionId
      );

      console.log('Created billing record:', billingRecord.id);
      
      await updateEmployerSubscription(
        employerId,
        subscriptionType as SubscriptionType,
        session.customer as string,
        sessionId
      );

      // Update billing record status to completed
      await updateBillingRecordStatus(sessionId, 'COMPLETED' as any);
      
      console.log('Successfully updated subscription and billing for employer:', employerId);
    } else {
      console.log('Payment not processed - status:', session.payment_status, 'has metadata:', !!session.metadata);
    }
  } catch (error) {
    console.error('Error processing successful payment:', error);
    
    // If there was an error, try to mark the billing record as failed
    try {
      await updateBillingRecordStatus(sessionId, 'FAILED' as any);
    } catch (billingError) {
      console.error('Error updating billing record status to failed:', billingError);
    }
    
    throw error;
  }
}

/**
 * Initialize trial subscription for new employer/agency
 * Business Rules:
 * - EMPLOYER: No free trial, no free job posts (starts with 0 job credits)
 * - AGENCY: Free trial with 5 job credits that can be used anytime
 */
export async function initializeTrialSubscription(employerId: string, userRole?: string): Promise<void> {
  const existingProfile = await prisma.employerProfile.findUnique({
    where: { userId: employerId },
  });

  if (!existingProfile) {
    throw new Error("Employer profile not found");
  }

  // Get user role if not provided
  let role = userRole;
  if (!role) {
    const user = await prisma.user.findUnique({
      where: { id: employerId },
      select: { role: true }
    });
    role = user?.role;
  }

  // Apply different business rules based on role
  if (role === 'EMPLOYER') {
    // Employers get no free trial or free job posts
    await prisma.$executeRaw`
      UPDATE "EmployerProfile" 
      SET 
        "subscriptionType" = ${SubscriptionType.TRIAL},
        "subscriptionStartDate" = ${new Date()},
        "jobPostLimit" = 0,
        "jobsPostedCount" = 0,
        "jobCredits" = 0
      WHERE "userId" = ${employerId}
    `;
  } else if (role === 'AGENCY') {
    // Agencies get 5 job credits that stack with purchased bundles
    await prisma.$executeRaw`
      UPDATE "EmployerProfile" 
      SET 
        "subscriptionType" = ${SubscriptionType.TRIAL},
        "subscriptionStartDate" = ${new Date()},
        "jobPostLimit" = 5,
        "jobsPostedCount" = 0,
        "jobCredits" = 5
      WHERE "userId" = ${employerId}
    `;
  } else {
    // Fallback to old behavior for backward compatibility
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
}

/**
 * Process subscription renewals for auto-renewing subscriptions
 */
export async function processSubscriptionRenewals(): Promise<{ renewedCount: number; failedCount: number }> {
  try {
    const now = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    // Find subscriptions that need renewal in the next 3 days
    const subscriptionsToRenew = await prisma.employerProfile.findMany({
      where: {
        autoRenew: true,
        OR: [
          {
            unlimitedPostingEndDate: {
              gte: now,
              lte: threeDaysFromNow,
            },
          },
          {
            networkAccessEndDate: {
              gte: now,
              lte: threeDaysFromNow,
            },
          },
        ],
      },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    let renewedCount = 0;
    let failedCount = 0;

    for (const employer of subscriptionsToRenew) {
      try {
        await renewSubscription(employer.userId);
        renewedCount++;
      } catch (error) {
        console.error(`Failed to renew subscription for employer ${employer.userId}:`, error);
        failedCount++;
      }
    }

    return { renewedCount, failedCount };
  } catch (error) {
    console.error("Error processing subscription renewals:", error);
    throw error;
  }
}

/**
 * Renew a subscription for a specific employer
 */
export async function renewSubscription(employerId: string): Promise<void> {
  try {
    const employer = await prisma.employerProfile.findUnique({
      where: { userId: employerId },
    });

    if (!employer || !employer.autoRenew) {
      throw new Error("Employer not found or auto-renew not enabled");
    }

    const subscriptionType = (employer as any).subscriptionType;
    const plan = SUBSCRIPTION_PLANS[subscriptionType as keyof typeof SUBSCRIPTION_PLANS];

    if (!plan || plan.isCredits) {
      throw new Error("Cannot renew credit-based plans");
    }

    const now = new Date();
    const newEndDate = new Date();
    newEndDate.setDate(newEndDate.getDate() + (plan.durationDays || 0));

    // Update the subscription end dates
    const hasUnlimitedPosting = (plan as any).hasUnlimitedPosting || false;
    const hasNetworkAccess = (plan as any).hasNetworkAccess || false;

    await prisma.$executeRaw`
      UPDATE "EmployerProfile" 
      SET 
        "subscriptionEndDate" = ${newEndDate},
        "unlimitedPostingEndDate" = ${hasUnlimitedPosting ? newEndDate : null},
        "networkAccessEndDate" = ${hasNetworkAccess ? newEndDate : null}
      WHERE "userId" = ${employerId}
    `;

    // Create billing record for the renewal
    const description = `${plan.name} - Renewal`;
    await createBillingRecord(
      employer.id,
      plan.price,
      description,
      subscriptionType as any,
      null // No Stripe session for auto-renewal
    );

    console.log(`Successfully renewed subscription for employer ${employerId}`);
  } catch (error) {
    console.error(`Error renewing subscription for employer ${employerId}:`, error);
    throw error;
  }
}

/**
 * Cancel a subscription (prevents auto-renewal, benefits continue until end of term)
 */
export async function cancelSubscription(employerId: string): Promise<void> {
  try {
    await prisma.$executeRaw`
      UPDATE "EmployerProfile" 
      SET "autoRenew" = false
      WHERE "userId" = ${employerId}
    `;

    console.log(`Cancelled auto-renewal for employer ${employerId}`);
  } catch (error) {
    console.error(`Error cancelling subscription for employer ${employerId}:`, error);
    throw error;
  }
}

/**
 * Get subscription status including renewal information
 */
export async function getSubscriptionStatus(employerId: string): Promise<{
  hasUnlimitedPosting: boolean;
  hasNetworkAccess: boolean;
  jobCredits: number;
  subscriptionType: string;
  unlimitedPostingEndDate: Date | null;
  networkAccessEndDate: Date | null;
  autoRenew: boolean;
  renewalPeriod: string | null;
  daysUntilExpiry: number | null;
}> {
  try {
    const employer = await prisma.employerProfile.findUnique({
      where: { userId: employerId },
    });

    if (!employer) {
      throw new Error("Employer not found");
    }

    const now = new Date();
    const hasUnlimitedPosting = await hasActiveUnlimitedPosting(employerId);
    const hasNetworkAccess = await hasActiveNetworkAccess(employerId);

    const unlimitedPostingEndDate = (employer as any).unlimitedPostingEndDate;
    const networkAccessEndDate = (employer as any).networkAccessEndDate;

    // Calculate days until expiry (earliest of the two dates)
    let daysUntilExpiry = null;
    const earliestEndDate = [unlimitedPostingEndDate, networkAccessEndDate]
      .filter(date => date && date > now)
      .sort((a, b) => a.getTime() - b.getTime())[0];

    if (earliestEndDate) {
      const timeDiff = earliestEndDate.getTime() - now.getTime();
      daysUntilExpiry = Math.ceil(timeDiff / (1000 * 3600 * 24));
    }

    return {
      hasUnlimitedPosting,
      hasNetworkAccess,
      jobCredits: (employer as any).jobCredits || 0,
      subscriptionType: (employer as any).subscriptionType || 'TRIAL',
      unlimitedPostingEndDate,
      networkAccessEndDate,
      autoRenew: (employer as any).autoRenew || false,
      renewalPeriod: (employer as any).renewalPeriod || null,
      daysUntilExpiry,
    };
  } catch (error) {
    console.error("Error getting subscription status:", error);
    throw error;
  }
}

export { stripe }; 