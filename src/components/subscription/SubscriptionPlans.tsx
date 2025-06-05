"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Star, Users, Briefcase } from "lucide-react";
import { PurchasePlanButton } from "./PurchasePlanButton";

interface Plan {
  id: 'SPOTLIGHT' | 'BUNDLE' | 'UNLIMITED' | 'NETWORK';
  name: string;
  price: number;
  jobLimit: number | null;
  duration: string;
  description: string;
  features: string[];
  popular?: boolean;
  icon: React.ReactNode;
}

const plans: Plan[] = [
  {
    id: 'SPOTLIGHT',
    name: 'Spotlight',
    price: 250,
    jobLimit: 1,
    duration: '30 days',
    description: 'Perfect for hiring a single key position',
    icon: <Star className="h-6 w-6" />,
    features: [
      '1 job post',
      '30-day listing duration',
      'Standard visibility',
      'Basic applicant management'
    ]
  },
  {
    id: 'BUNDLE',
    name: 'Hiring Bundle',
    price: 650,
    jobLimit: 3,
    duration: '30 days',
    description: 'Great for multiple positions or seasonal hiring',
    icon: <Briefcase className="h-6 w-6" />,
    popular: true,
    features: [
      '3 job posts',
      '30-day listing duration',
      'Enhanced visibility',
      'Priority applicant management',
      'Save $100 vs individual posts'
    ]
  },
  {
    id: 'UNLIMITED',
    name: 'Unlimited',
    price: 1250,
    jobLimit: null,
    duration: '60 days',
    description: 'Unlimited hiring power for growing teams',
    icon: <CheckCircle className="h-6 w-6" />,
    features: [
      'Unlimited job posts',
      '60-day access period',
      'Maximum visibility',
      'Advanced analytics',
      'Priority support'
    ]
  },
  {
    id: 'NETWORK',
    name: 'Network',
    price: 5000,
    jobLimit: 3,
    duration: '90 days',
    description: 'Exclusive access to our private candidate network',
    icon: <Users className="h-6 w-6" />,
    features: [
      '3 job posts',
      '90-day network access',
      'Private candidate database',
      'Direct candidate messaging',
      'Concierge placement service',
      'Premium candidate profiles'
    ]
  }
];

interface SubscriptionPlansProps {
  currentPlan?: string;
  showTrialInfo?: boolean;
}

export function SubscriptionPlans({ currentPlan, showTrialInfo = true }: SubscriptionPlansProps) {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-8">
      {showTrialInfo && currentPlan === 'TRIAL' && (
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Upgrade Your Account
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Choose the plan that best fits your hiring needs. All plans include our premium job board placement and candidate management tools.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => (
          <Card 
            key={plan.id} 
            className={`relative ${plan.popular ? 'ring-2 ring-blue-500 shadow-lg' : ''}`}
          >
            {plan.popular && (
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

            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-lg font-semibold">
                  {plan.jobLimit === null ? 'Unlimited' : plan.jobLimit} Job Post{plan.jobLimit !== 1 ? 's' : ''}
                </div>
                <div className="text-sm text-gray-500">
                  {plan.duration} access
                </div>
              </div>

              <ul className="space-y-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="pt-4">
                <PurchasePlanButton
                  planType={plan.id}
                  planName={plan.name}
                  price={plan.price}
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                  disabled={currentPlan === plan.id}
                >
                  {currentPlan === plan.id 
                    ? "Current Plan" 
                    : `Choose ${plan.name}`
                  }
                </PurchasePlanButton>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center text-sm text-gray-500 max-w-3xl mx-auto">
        <p className="mb-2">
          <strong>Secure Payment:</strong> All transactions are processed securely through Stripe. 
          Your payment information is never stored on our servers.
        </p>
        <p>
          <strong>Support:</strong> Need help choosing the right plan? Contact our team at support@bellregistry.com
        </p>
      </div>
    </div>
  );
} 