import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { 
  getEmployerSubscription, 
  createCheckoutSession,
  SubscriptionType,
  SUBSCRIPTION_PLANS
} from "@/lib/subscription-service";
import { isEmployerOrAgencyRole } from "@/lib/roles";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isEmployerOrAgencyRole(session.user.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const subscription = await getEmployerSubscription(session.user.id);
    
    if (!subscription) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    return NextResponse.json({
      subscription,
      plans: SUBSCRIPTION_PLANS,
    });
  } catch (error) {
    console.error("Error fetching subscription:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isEmployerOrAgencyRole(session.user.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await request.json();
    const { subscriptionType } = body;

    if (!subscriptionType || !Object.values(SubscriptionType).includes(subscriptionType)) {
      return NextResponse.json({ error: "Invalid subscription type" }, { status: 400 });
    }

    if (subscriptionType === SubscriptionType.TRIAL) {
      return NextResponse.json({ error: "Cannot purchase trial subscription" }, { status: 400 });
    }

    const origin = request.headers.get("origin") || process.env.NEXTAUTH_URL || "http://localhost:3000";
    const successUrl = `${origin}/dashboard/subscription/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/dashboard/subscription`;

    const checkoutUrl = await createCheckoutSession(
      session.user.id,
      subscriptionType,
      successUrl,
      cancelUrl
    );

    return NextResponse.json({ checkoutUrl });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 