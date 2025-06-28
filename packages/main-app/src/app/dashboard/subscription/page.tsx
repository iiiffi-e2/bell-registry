"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SubscriptionPlans } from "@/components/subscription/SubscriptionPlans";
import { CheckCircle, Clock, AlertTriangle, Loader2 } from "lucide-react";

interface SubscriptionData {
  subscriptionType: string;
  subscriptionStartDate: string;
  subscriptionEndDate: string | null;
  jobPostLimit: number | null;
  jobsPostedCount: number;
  hasNetworkAccess?: boolean;
  stripeCustomerId?: string;
}

export default function SubscriptionPage() {
  const { data: session } = useSession();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.id) {
      fetchSubscriptionData();
    }
  }, [session]);

  const fetchSubscriptionData = async () => {
    try {
      const response = await fetch('/api/subscription');
      if (response.ok) {
        const data = await response.json();
        setSubscription(data.subscription);
      }
    } catch (error) {
      console.error('Error fetching subscription data:', error);
    } finally {
      setLoading(false);
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
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500 mb-4" />
              <p>Loading subscription information...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">Unable to load subscription information.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const status = getSubscriptionStatus();
  const usageProgress = getJobUsageProgress();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Subscription Management</h1>
          <p className="text-gray-600 mt-2">
            Manage your job posting subscription and billing
          </p>
        </div>

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
                  Your active subscription details and usage
                </CardDescription>
              </div>
              {status && !status.isExpired ? (
                <CheckCircle className="h-6 w-6 text-green-500" />
              ) : (
                <AlertTriangle className="h-6 w-6 text-red-500" />
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Subscription Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Status */}
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <Clock className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="font-medium">Status</span>
                </div>
                {status && (
                  <div>
                    <p className="text-lg font-semibold">
                      {status.isExpired ? 'Expired' : 'Active'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {status.isExpired 
                        ? `Expired ${status.endDate.toLocaleDateString()}`
                        : `${status.daysRemaining} days remaining`
                      }
                    </p>
                  </div>
                )}
              </div>

              {/* Job Usage */}
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <CheckCircle className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="font-medium">Job Posts</span>
                </div>
                <p className="text-lg font-semibold">
                  {subscription.jobsPostedCount} / {subscription.jobPostLimit || '∞'}
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${Math.min(usageProgress, 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Special Features */}
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <CheckCircle className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="font-medium">Access</span>
                </div>
                <p className="text-lg font-semibold">
                  {subscription.hasNetworkAccess ? 'Network' : 'Standard'}
                </p>
                <p className="text-sm text-gray-500">
                  {subscription.hasNetworkAccess 
                    ? 'Private candidate network'
                    : 'Public job board'
                  }
                </p>
              </div>
            </div>

            {/* Action Messages */}
            {status && status.isExpired && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                  <p className="text-sm text-red-800">
                    Your subscription has expired. Upgrade to continue posting jobs.
                  </p>
                </div>
              </div>
            )}

            {status && !status.isExpired && status.daysRemaining <= 7 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-yellow-600 mr-2" />
                  <p className="text-sm text-yellow-800">
                    Your subscription expires in {status.daysRemaining} day{status.daysRemaining !== 1 ? 's' : ''}. 
                    Consider upgrading to avoid interruption.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Available Plans */}
        <SubscriptionPlans 
          currentPlan={subscription.subscriptionType}
          showTrialInfo={subscription.subscriptionType === 'TRIAL'}
        />
      </div>
    </div>
  );
} 