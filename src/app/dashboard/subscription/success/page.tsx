"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function SubscriptionSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (sessionId) {
      // The webhook should have already processed the payment,
      // but we can verify the session was successful
      verifySession();
    } else {
      setError("No session ID found");
      setLoading(false);
    }
  }, [sessionId]);

  const verifySession = async () => {
    try {
      // Give the webhook a moment to process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Fetch updated subscription status
      const response = await fetch('/api/subscription');
      if (response.ok) {
        const data = await response.json();
        if (data.subscription.subscriptionType !== 'TRIAL') {
          toast.success("Subscription activated successfully!");
        }
      }
    } catch (error) {
      console.error('Error verifying session:', error);
      setError("Error verifying payment status");
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    router.push('/dashboard');
  };

  const handleViewSubscription = () => {
    router.push('/dashboard/subscription');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-500 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Processing Your Payment</h2>
              <p className="text-gray-600">
                Please wait while we confirm your subscription...
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-red-500 mb-4">
                <svg className="h-12 w-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-2 text-red-700">Payment Verification Failed</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <div className="space-x-4">
                <Button onClick={handleContinue} variant="outline">
                  Continue to Dashboard
                </Button>
                <Button onClick={handleViewSubscription}>
                  Check Subscription Status
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl text-green-700">
              Payment Successful!
            </CardTitle>
            <CardDescription className="text-lg">
              Your subscription has been activated and you can now start posting jobs.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="text-center space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-medium text-green-800 mb-2">What&apos;s Next?</h3>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Your job posting limits have been updated</li>
                <li>• You can now post jobs according to your plan</li>
                <li>• Check your subscription status anytime in settings</li>
                <li>• Need help? Contact our support team</li>
              </ul>
            </div>

            <div className="space-x-4">
              <Button onClick={handleContinue} className="px-8">
                Start Posting Jobs
              </Button>
              <Button onClick={handleViewSubscription} variant="outline">
                View Subscription Details
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 