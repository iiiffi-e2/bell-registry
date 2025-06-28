"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, CreditCard, CheckCircle, Loader2 } from "lucide-react";
import Link from "next/link";

interface SubscriptionData {
  subscriptionType: string;
  subscriptionStartDate: string;
  subscriptionEndDate: string | null;
  jobPostLimit: number | null;
  jobsPostedCount: number;
  hasNetworkAccess?: boolean;
  stripeCustomerId?: string;
}

interface SubscriptionAlertProps {
  /**
   * Show compact version for smaller spaces
   */
  compact?: boolean;
  /**
   * Hide if subscription is healthy (no issues)
   */
  hideWhenHealthy?: boolean;
}

export function SubscriptionAlert({ compact = false, hideWhenHealthy = false }: SubscriptionAlertProps) {
  const { data: session } = useSession();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [canPostJob, setCanPostJob] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.id && (session.user.role === 'EMPLOYER' || session.user.role === 'AGENCY')) {
      fetchSubscriptionData();
    } else {
      setLoading(false);
    }
  }, [session]);

  const fetchSubscriptionData = async () => {
    try {
      const [subscriptionResponse, canPostResponse] = await Promise.all([
        fetch('/api/subscription'),
        fetch('/api/subscription/can-post-job')
      ]);

      if (subscriptionResponse.ok && canPostResponse.ok) {
        const subscriptionData = await subscriptionResponse.json();
        const canPostData = await canPostResponse.json();
        
        setSubscription(subscriptionData.subscription);
        setCanPostJob(canPostData.canPostJob);
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
    if (!subscription || subscription.jobPostLimit === null) return 0; // Unlimited
    return (subscription.jobsPostedCount / subscription.jobPostLimit) * 100;
  };

  if (loading) {
    return compact ? (
      <div className="flex items-center text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Checking subscription...
      </div>
    ) : null;
  }

  // Don't show for non-employers/agencies
  if (!session?.user || (session.user.role !== 'EMPLOYER' && session.user.role !== 'AGENCY')) {
    return null;
  }

  if (!subscription) {
    return null;
  }

  const status = getSubscriptionStatus();
  const usageProgress = getJobUsageProgress();
  const isNearLimit = subscription.jobPostLimit && subscription.jobsPostedCount >= subscription.jobPostLimit * 0.8;
  const isExpired = status?.isExpired;
  const isExpiringSoon = status && !status.isExpired && status.daysRemaining <= 7;

  // Hide if healthy and hideWhenHealthy is true
  if (hideWhenHealthy && canPostJob && !isExpiringSoon && !isNearLimit) {
    return null;
  }

  // Determine alert type and content
  let alertType: 'error' | 'warning' | 'info' = 'info';
  let icon = CheckCircle;
  let title = 'Subscription Active';
  let message = '';
  let showUpgradeButton = false;

  if (isExpired || !canPostJob) {
    alertType = 'error';
    icon = AlertTriangle;
    title = 'Action Required';
    message = isExpired 
      ? 'Your subscription has expired. Upgrade to continue posting jobs.'
      : 'You&apos;ve reached your job posting limit. Upgrade to post more jobs.';
    showUpgradeButton = true;
  } else if (isExpiringSoon || isNearLimit) {
    alertType = 'warning';
    icon = Clock;
    title = 'Heads Up';
    if (isExpiringSoon && isNearLimit) {
      message = `Your subscription expires in ${status.daysRemaining} day${status.daysRemaining !== 1 ? 's' : ''} and you&apos;re near your job posting limit.`;
    } else if (isExpiringSoon) {
      message = `Your subscription expires in ${status.daysRemaining} day${status.daysRemaining !== 1 ? 's' : ''}.`;
    } else {
      message = `You&apos;ve used ${subscription.jobsPostedCount} of ${subscription.jobPostLimit} job posts.`;
    }
    showUpgradeButton = true;
  } else {
    // For healthy subscriptions, show clean format
    title = `Subscription Active - ${subscription.subscriptionType}`;
    message = ''; // Remove usage from message since it's shown in progress bar
  }

  const IconComponent = icon;

  if (compact) {
    return (
      <div className={`flex items-center justify-between p-3 rounded-lg border ${
        alertType === 'error' ? 'bg-red-50 border-red-200' :
        alertType === 'warning' ? 'bg-yellow-50 border-yellow-200' :
        'bg-blue-50 border-blue-200'
      }`}>
        <div className="flex items-center">
          <IconComponent className={`h-4 w-4 mr-2 ${
            alertType === 'error' ? 'text-red-600' :
            alertType === 'warning' ? 'text-yellow-600' :
            'text-blue-600'
          }`} />
          <span className={`text-sm font-medium ${
            alertType === 'error' ? 'text-red-800' :
            alertType === 'warning' ? 'text-yellow-800' :
            'text-blue-800'
          }`}>
            {/* For compact view, show message if exists, otherwise show title */}
            {message || title}
          </span>
        </div>
        {showUpgradeButton && (
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/subscription">
              <CreditCard className="h-3 w-3 mr-1" />
              Upgrade
            </Link>
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className={`border-l-4 ${
      alertType === 'error' ? 'border-l-red-500 bg-red-50' :
      alertType === 'warning' ? 'border-l-yellow-500 bg-yellow-50' :
      'border-l-blue-500 bg-blue-50'
    }`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start">
            <IconComponent className={`h-5 w-5 mr-3 mt-0.5 ${
              alertType === 'error' ? 'text-red-600' :
              alertType === 'warning' ? 'text-yellow-600' :
              'text-blue-600'
            }`} />
            <div>
              <h3 className={`font-medium ${
                alertType === 'error' ? 'text-red-800' :
                alertType === 'warning' ? 'text-yellow-800' :
                'text-blue-800'
              }`}>
                {title}
              </h3>
              {message && (
                <p className={`text-sm mt-1 ${
                  alertType === 'error' ? 'text-red-700' :
                  alertType === 'warning' ? 'text-yellow-700' :
                  'text-blue-700'
                }`}>
                  {message}
                </p>
              )}

              {/* Usage progress bar for non-error states */}
              {!isExpired && subscription.jobPostLimit && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className={
                      alertType === 'error' ? 'text-red-600' :
                      alertType === 'warning' ? 'text-yellow-600' :
                      'text-blue-600'
                    }>
                      Job Posts Used
                    </span>
                    <span className={
                      alertType === 'error' ? 'text-red-600' :
                      alertType === 'warning' ? 'text-yellow-600' :
                      'text-blue-600'
                    }>
                      {subscription.jobsPostedCount} / {subscription.jobPostLimit}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        alertType === 'error' ? 'bg-red-500' :
                        alertType === 'warning' ? 'bg-yellow-500' :
                        'bg-blue-500'
                      }`}
                      style={{ width: `${Math.min(usageProgress, 100)}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {showUpgradeButton && (
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/subscription" className="flex items-center">
                <CreditCard className="h-4 w-4 mr-2" />
                {alertType === 'error' ? 'Upgrade Now' : 'View Plans'}
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 