"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SubscriptionPlans } from "@/components/subscription/SubscriptionPlans";
import { CheckCircle, Clock, AlertTriangle, Loader2, X } from "lucide-react";
import { toast } from "sonner";

interface SubscriptionData {
  subscriptionType: string;
  subscriptionStartDate: string;
  subscriptionEndDate: string | null;
  jobPostLimit: number | null;
  jobsPostedCount: number;
  hasNetworkAccess?: boolean;
  stripeCustomerId?: string;
  autoRenew?: boolean;
}

export default function SubscriptionPage() {
  const { data: session } = useSession();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

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

  const handleCancelClick = () => {
    setShowCancelModal(true);
  };

  const handleCancelConfirm = async () => {
    try {
      setCancelling(true);
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.success) {
        toast.success('Subscription cancelled. Your benefits will continue until the end of your current billing period.');
        await fetchSubscriptionData(); // Refresh subscription data
        setShowCancelModal(false);
      } else {
        toast.error(data.error || 'Failed to cancel subscription');
      }
    } catch (error) {
      toast.error('Failed to cancel subscription');
    } finally {
      setCancelling(false);
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

  const isAutoRenewingSubscription = () => {
    if (!subscription) return false;
    return subscription.subscriptionType === 'UNLIMITED' || 
           subscription.subscriptionType === 'NETWORK' || 
           subscription.subscriptionType === 'NETWORK_QUARTERLY';
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
              <div className="flex items-center gap-3">
                {isAutoRenewingSubscription() && status && !status.isExpired && subscription.autoRenew !== false && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelClick}
                    disabled={cancelling}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {cancelling ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Cancelling...
                      </>
                    ) : (
                      <>
                        <X className="h-4 w-4 mr-2" />
                        Cancel Subscription
                      </>
                    )}
                  </Button>
                )}
                {status && !status.isExpired ? (
                  <CheckCircle className="h-6 w-6 text-green-500" />
                ) : (
                  <AlertTriangle className="h-6 w-6 text-red-500" />
                )}
              </div>
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

            {isAutoRenewingSubscription() && subscription.autoRenew === false && status && !status.isExpired && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center">
                  <X className="h-5 w-5 text-orange-600 mr-2" />
                  <p className="text-sm text-orange-800">
                    Your subscription has been cancelled and will not renew. You can continue using your benefits until {status.endDate.toLocaleDateString()}.
                  </p>
                </div>
              </div>
            )}

            {status && !status.isExpired && status.daysRemaining <= 7 && subscription.autoRenew !== false && (
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

        {/* Cancel Subscription Modal */}
        <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Cancel Subscription
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to cancel your subscription?
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">What happens when you cancel:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Your subscription will not auto-renew</li>
                  <li>• You&apos;ll keep all benefits until your current period ends</li>
                  {status && !status.isExpired && (
                    <li className="font-medium">
                      • Benefits continue until: {status.endDate.toLocaleDateString()} 
                      ({status.daysRemaining} day{status.daysRemaining !== 1 ? 's' : ''} remaining)
                    </li>
                  )}
                  <li>• You can resubscribe anytime</li>
                </ul>
              </div>

              {subscription.subscriptionType === 'NETWORK' || subscription.subscriptionType === 'NETWORK_QUARTERLY' ? (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h4 className="font-medium text-amber-900 mb-2">Network Access Benefits You&apos;ll Lose:</h4>
                  <ul className="text-sm text-amber-800 space-y-1">
                    <li>• Full profile visibility</li>
                    <li>• Direct candidate messaging</li>
                    <li>• Access to vetted professionals</li>
                    <li>• Unlimited job posting</li>
                  </ul>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h4 className="font-medium text-amber-900 mb-2">Unlimited Benefits You&apos;ll Lose:</h4>
                  <ul className="text-sm text-amber-800 space-y-1">
                    <li>• Unlimited job posting</li>
                    <li>• You&apos;ll need to purchase credits to post new jobs</li>
                  </ul>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setShowCancelModal(false)}
                disabled={cancelling}
              >
                Keep Subscription
              </Button>
              <Button
                variant="destructive"
                onClick={handleCancelConfirm}
                disabled={cancelling}
              >
                {cancelling ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  'Yes, Cancel Subscription'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
} 