"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, AlertTriangle } from "lucide-react";

interface SubscriptionData {
  subscriptionType: string;
  subscriptionStartDate: string;
  subscriptionEndDate: string | null;
  jobPostLimit: number | null;
  jobsPostedCount: number;
}

interface Plan {
  name: string;
  jobLimit: number | null;
  durationDays: number;
  price: number;
}

interface SubscriptionStatusProps {
  onUpgrade?: () => void;
}

export function SubscriptionStatus({ onUpgrade }: SubscriptionStatusProps) {
  const { data: session } = useSession();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [plans, setPlans] = useState<Record<string, Plan>>({});
  const [canPostJob, setCanPostJob] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.id) {
      fetchSubscriptionData();
      checkJobPostingPermission();
    }
  }, [session]);

  const fetchSubscriptionData = async () => {
    try {
      const response = await fetch('/api/subscription');
      if (response.ok) {
        const data = await response.json();
        setSubscription(data.subscription);
        setPlans(data.plans);
      }
    } catch (error) {
      console.error('Error fetching subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkJobPostingPermission = async () => {
    try {
      const response = await fetch('/api/subscription/can-post-job');
      if (response.ok) {
        const data = await response.json();
        setCanPostJob(data.canPostJob);
      }
    } catch (error) {
      console.error('Error checking job posting permission:', error);
    }
  };

  const handleUpgrade = async (planType: string) => {
    try {
      const response = await fetch('/api/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subscriptionType: planType }),
      });

      if (response.ok) {
        const data = await response.json();
        window.location.href = data.checkoutUrl;
      } else {
        console.error('Error creating checkout session');
      }
    } catch (error) {
      console.error('Error upgrading subscription:', error);
    }
  };

  const getSubscriptionStatus = () => {
    if (!subscription) return null;

    const now = new Date();
    const startDate = new Date(subscription.subscriptionStartDate);
    const isTrialActive = subscription.subscriptionType === 'TRIAL';
    
    let endDate: Date;
    if (subscription.subscriptionEndDate) {
      endDate = new Date(subscription.subscriptionEndDate);
    } else if (isTrialActive) {
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 30); // 30-day trial
    } else {
      return null;
    }

    const isExpired = now > endDate;
    const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    return { isExpired, daysRemaining, endDate };
  };

  const getJobUsageProgress = () => {
    if (!subscription || subscription.jobPostLimit === null) return 100; // Unlimited
    return (subscription.jobsPostedCount / subscription.jobPostLimit) * 100;
  };

  if (loading) {
    return (
      <Card className="w-full max-w-2xl">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!subscription) {
    return (
      <Card className="w-full max-w-2xl">
        <CardContent className="p-6">
          <p className="text-gray-500">Unable to load subscription information.</p>
        </CardContent>
      </Card>
    );
  }

  const status = getSubscriptionStatus();
  const usageProgress = getJobUsageProgress();

  return (
    <div className="w-full max-w-4xl space-y-6">
      {/* Current Subscription Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Current Subscription
                {subscription.subscriptionType === 'TRIAL' ? (
                  <Badge variant="secondary">Trial</Badge>
                ) : (
                  <Badge variant="default">{subscription.subscriptionType}</Badge>
                )}
              </CardTitle>
              <CardDescription>
                Manage your job posting subscription
              </CardDescription>
            </div>
            {status && !status.isExpired ? (
              <CheckCircle className="h-6 w-6 text-green-500" />
            ) : (
              <AlertTriangle className="h-6 w-6 text-red-500" />
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Subscription Status */}
          {status && (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">
                  {status.isExpired ? 'Subscription Expired' : `${status.daysRemaining} days remaining`}
                </p>
                <p className="text-xs text-gray-500">
                  {status.isExpired ? 'Expired on' : 'Expires on'} {status.endDate.toLocaleDateString()}
                </p>
              </div>
              <Clock className="h-4 w-4 text-gray-400" />
            </div>
          )}

          {/* Job Usage */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">Job Posts Used</p>
              <p className="text-sm text-gray-500">
                {subscription.jobsPostedCount} / {subscription.jobPostLimit || '∞'}
              </p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${Math.min(usageProgress, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-4">
            {!canPostJob && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                  <p className="text-sm text-yellow-800">
                    {status?.isExpired 
                      ? "Your subscription has expired. Upgrade to continue posting jobs."
                      : "You've reached your job posting limit. Upgrade to post more jobs."
                    }
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Available Plans */}
      {subscription.subscriptionType === 'TRIAL' && (
        <Card>
          <CardHeader>
            <CardTitle>Upgrade Your Plan</CardTitle>
            <CardDescription>
              Choose a plan that fits your hiring needs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(plans).map(([key, plan]) => {
                if (key === 'TRIAL') return null;
                
                return (
                  <Card key={key} className="relative">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                      <div className="text-2xl font-bold">
                        ${plan.price}
                        <span className="text-sm font-normal text-gray-500">/month</span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-sm">
                        <p className="font-medium">
                          {plan.jobLimit === null ? 'Unlimited' : plan.jobLimit} job posts
                        </p>
                        <p className="text-gray-500">{plan.durationDays} days</p>
                      </div>
                      <Button 
                        onClick={() => handleUpgrade(key)}
                        className="w-full"
                        variant={key === 'UNLIMITED' ? 'default' : 'outline'}
                      >
                        Upgrade to {plan.name}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 