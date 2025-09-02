"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Star, Users, Briefcase } from "lucide-react";
import { PurchasePlanButton } from "./PurchasePlanButton";

interface Plan {
  id: 'SPOTLIGHT' | 'BUNDLE' | 'UNLIMITED' | 'NETWORK' | 'NETWORK_QUARTERLY';
  name: string;
  price: number;
  jobLimit: number | null;
  credits?: number;
  duration: string;
  description: string;
  features: string[];
  popular?: boolean;
  icon: React.ReactNode;
  isCredits?: boolean;
  renewalType?: string;
}

// Main subscription plans (shown in row)
const mainPlans: Plan[] = [
  {
    id: 'SPOTLIGHT',
    name: 'Spotlight',
    price: 250,
    jobLimit: null,
    credits: 1,
    duration: 'One-time',
    description: 'Perfect for hiring a single key position',
    icon: <Star className="h-6 w-6" />,
    isCredits: true,
    features: [
      '1 job post',
      '45-day listing duration',
      'Job posts never expire',
      'Standard visibility'
    ]
  },
  {
    id: 'BUNDLE',
    name: 'Hiring Bundle',
    price: 750,
    jobLimit: null,
    credits: 4,
    duration: 'One-time',
    description: 'Great for multiple positions or seasonal hiring',
    icon: <Briefcase className="h-6 w-6" />,
    popular: true,
    isCredits: true,
    features: [
      '4 job posts',
      '45-day listing duration',
      'Job posts never expire',
      'Standard visibility',
      'Save $250 vs individual posts'
    ]
  },
  {
    id: 'UNLIMITED',
    name: 'Unlimited (Annual)',
    price: 1500,
    jobLimit: null,
    duration: '1 year',
    description: 'Unlimited hiring power for growing teams',
    icon: <CheckCircle className="h-6 w-6" />,
    renewalType: 'Annual',
    features: [
      'Unlimited job posting',
      '45-day listing duration',
      'Auto-renews annually',
      'Cancel anytime',
      'Standard visibility'
    ]
  }
];

// Network access plans (quarterly and annual)
const networkPlans = {
  quarterly: {
    id: 'NETWORK_QUARTERLY' as const,
    name: 'Network Access',
    price: 5000,
    duration: '3 months',
    renewalType: 'Quarterly',
    features: [
      'Unlimited job posting',
      '45-day listing duration',
      'Full profile visibility',
      'Direct candidate messaging',
      'Auto-renews quarterly',
      'Cancel anytime'
    ]
  },
  annual: {
    id: 'NETWORK' as const,
    name: 'Network Access',
    price: 17500,
    duration: '1 year',
    renewalType: 'Annual',
    features: [
      'Unlimited job posting',
      '45-day listing duration',
      'Full profile visibility',
      'Direct candidate messaging',
      'Auto-renews annually',
      'Cancel anytime',
      'Save $2,500 vs quarterly'
    ]
  }
};

interface SubscriptionPlansProps {
  currentPlan?: string;
  showTrialInfo?: boolean;
}

export function SubscriptionPlans({ currentPlan, showTrialInfo = true }: SubscriptionPlansProps) {
  const [networkPeriod, setNetworkPeriod] = useState<'quarterly' | 'annual'>('quarterly');
  const selectedNetworkPlan = networkPlans[networkPeriod];
  
  // Check if user has any Network Access plan (which includes unlimited posting)
  const hasNetworkAccess = currentPlan === 'NETWORK' || currentPlan === 'NETWORK_QUARTERLY';
  const hasAnnualNetwork = currentPlan === 'NETWORK';
  const hasQuarterlyNetwork = currentPlan === 'NETWORK_QUARTERLY';

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8">
      {showTrialInfo && currentPlan === 'TRIAL' && (
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Select the plan that best fits your hiring needs. All plans include our premium job board placement and candidate management tools.
          </p>
        </div>
      )}

      {/* Network Access Notice */}
      {hasNetworkAccess && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 text-purple-800 mb-2">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">You have Network Access</span>
          </div>
          <p className="text-purple-700 text-sm">
            Your Network Access membership already includes unlimited job posting, so you don&apos;t need to purchase additional credits or plans.{' '}
            {hasQuarterlyNetwork && (
              <span>You can upgrade to annual billing below to save $2,500.</span>
            )}
            {hasAnnualNetwork && (
              <span>You have our best plan with annual savings!</span>
            )}
          </p>
        </div>
      )}

      {/* Main Plans Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {mainPlans.map((plan) => (
          <Card 
            key={plan.id} 
            className={`relative flex flex-col ${
              plan.popular ? 'ring-2 ring-blue-500 shadow-lg' : ''
            } ${
              hasNetworkAccess ? 'opacity-60' : ''
            }`}
          >
            {plan.popular && !hasNetworkAccess && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-blue-500 text-white px-3 py-1">
                  Most Popular
                </Badge>
              </div>
            )}

            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit">
                {plan.icon}
              </div>
              <CardTitle className="text-xl mb-2">{plan.name}</CardTitle>
              <div className="text-3xl font-bold text-gray-900">
                ${plan.price.toLocaleString()}
              </div>
              <CardDescription className="text-sm">
                {plan.description}
              </CardDescription>
            </CardHeader>

            <CardContent className="flex flex-col flex-grow">
              <div className="text-center mb-4">
                <div className="text-lg font-semibold">
                  {plan.isCredits 
                    ? `${plan.credits} Job Post${plan.credits !== 1 ? 's' : ''}` 
                    : 'Unlimited Job Posts'
                  }
                </div>
                <div className="text-sm text-gray-500">
                  {plan.duration} {plan.renewalType ? `(${plan.renewalType} renewal)` : ''}
                </div>
              </div>

              <ul className="space-y-2 flex-grow mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto">
                <PurchasePlanButton
                  planType={plan.id}
                  planName={plan.name}
                  price={plan.price}
                  className="w-full"
                  variant={plan.popular && !hasNetworkAccess ? "default" : "outline"}
                  disabled={currentPlan === plan.id || hasNetworkAccess}
                >
                  {currentPlan === plan.id 
                    ? "Current Plan"
                    : hasNetworkAccess
                    ? "Included in Network Access"
                    : `Choose ${plan.name}`
                  }
                </PurchasePlanButton>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Network Access Section */}
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Network Access Membership
          </h3>
          <p className="text-gray-600">
            Exclusive access to our private candidate network with full profile visibility and direct messaging
          </p>
        </div>

        {/* Network Access Toggle */}
        <div className="flex justify-center">
          <div className="bg-gray-100 p-1 rounded-lg">
            <Button
              variant={networkPeriod === 'quarterly' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setNetworkPeriod('quarterly')}
              className="px-6"
            >
              Quarterly
            </Button>
            <Button
              variant={networkPeriod === 'annual' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setNetworkPeriod('annual')}
              className="px-6"
            >
              Annual
              <Badge className="ml-2 bg-green-100 text-green-800 text-xs">
                Save $2,500
              </Badge>
            </Button>
          </div>
        </div>

        {/* Network Access Card */}
        <Card className="relative border-2 border-purple-200 shadow-lg">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 p-3 bg-purple-100 rounded-full w-fit">
              <Users className="h-8 w-8 text-purple-600" />
            </div>
            <CardTitle className="text-2xl mb-2">{selectedNetworkPlan.name}</CardTitle>
            <div className="text-4xl font-bold text-gray-900 mb-2">
              ${selectedNetworkPlan.price.toLocaleString()}
            </div>
            <div className="text-lg text-gray-600">
              {selectedNetworkPlan.duration} • {selectedNetworkPlan.renewalType} billing
            </div>
            <CardDescription className="text-base mt-4">
              Premium access to our exclusive network of vetted professionals
            </CardDescription>
          </CardHeader>

          <CardContent className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Job Posting Benefits</h4>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Unlimited job posting</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>45-day listing duration</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Auto-renews {networkPeriod === 'quarterly' ? 'quarterly' : 'annually'}</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Cancel anytime</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Network Access Benefits</h4>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Full profile visibility</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Direct candidate messaging</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Access to vetted professionals</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Priority candidate matching</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="max-w-md mx-auto">
              {/* Show upgrade message for annual users trying to select quarterly */}
              {hasAnnualNetwork && networkPeriod === 'quarterly' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <p className="text-yellow-800 text-sm text-center">
                    You can&apos;t downgrade from annual to quarterly billing. Your annual plan continues until you cancel.
                  </p>
                </div>
              )}
              
              <PurchasePlanButton
                planType={selectedNetworkPlan.id}
                planName={selectedNetworkPlan.name}
                price={selectedNetworkPlan.price}
                className="w-full text-lg py-4"
                variant="default"
                disabled={
                  currentPlan === selectedNetworkPlan.id || 
                  (hasAnnualNetwork && networkPeriod === 'quarterly')
                }
              >
                {currentPlan === selectedNetworkPlan.id 
                  ? "Current Plan" 
                  : hasAnnualNetwork && networkPeriod === 'quarterly'
                  ? "Downgrade Not Available"
                  : hasQuarterlyNetwork && networkPeriod === 'annual'
                  ? `Upgrade to Annual Billing`
                  : `Choose Network Access - ${selectedNetworkPlan.renewalType}`
                }
              </PurchasePlanButton>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="text-center text-sm text-gray-500 max-w-3xl mx-auto">
        <p className="mb-2">
          <strong>Secure Payment:</strong> All transactions are processed securely through Stripe. 
          Your payment information is never stored on our servers.
        </p>
        <p>
          <strong>Support:</strong> Need help choosing the right plan? Contact our team at support@thebellregistry.com
        </p>
      </div>
    </div>
  );
} 