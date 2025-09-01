"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, CreditCard, Calendar, Zap } from "lucide-react";

interface SubscriptionStatusData {
  hasUnlimitedPosting: boolean;
  hasNetworkAccess: boolean;
  jobCredits: number;
  subscriptionType: string;
  unlimitedPostingEndDate: string | null;
  networkAccessEndDate: string | null;
  autoRenew: boolean;
  renewalPeriod: string | null;
  daysUntilExpiry: number | null;
}

interface SubscriptionStatusProps {
  onUpgrade?: () => void;
  onCancel?: () => void;
}

export function SubscriptionStatus({ onUpgrade, onCancel }: SubscriptionStatusProps) {
  const [status, setStatus] = useState<SubscriptionStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/subscription/status');
      const data = await response.json();
      
      if (data.success) {
        setStatus(data.status);
      } else {
        setError(data.error || 'Failed to fetch status');
      }
    } catch (err) {
      setError('Failed to fetch subscription status');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    try {
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.success) {
        await fetchStatus(); // Refresh status
        if (onCancel) onCancel();
      } else {
        setError(data.error || 'Failed to cancel subscription');
      }
    } catch (err) {
      setError('Failed to cancel subscription');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!status) return null;

  const getStatusBadge = () => {
    if (status.hasUnlimitedPosting || status.hasNetworkAccess) {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Active Subscription
        </Badge>
      );
    }
    if (status.jobCredits > 0) {
      return (
        <Badge className="bg-blue-100 text-blue-800 border-blue-200">
          <CreditCard className="h-3 w-3 mr-1" />
          {status.jobCredits} Credit{status.jobCredits !== 1 ? 's' : ''} Available
        </Badge>
      );
    }
    return (
      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
        <AlertTriangle className="h-3 w-3 mr-1" />
        No Active Subscription
      </Badge>
    );
  };

  const getExpiryWarning = () => {
    if (status.daysUntilExpiry && status.daysUntilExpiry <= 7) {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-yellow-800">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-medium">
              Subscription expires in {status.daysUntilExpiry} day{status.daysUntilExpiry !== 1 ? 's' : ''}
            </span>
          </div>
          {!status.autoRenew && (
            <p className="text-sm text-yellow-700 mt-2">
              Auto-renewal is disabled. Your subscription will not renew automatically.
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Subscription Status
            </CardTitle>
            {getStatusBadge()}
          </div>
          <CardDescription>
            Current plan and usage information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {getExpiryWarning()}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">
                {status.jobCredits}
              </div>
              <div className="text-sm text-gray-600">Job Credits</div>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">
                {status.hasUnlimitedPosting ? '∞' : '0'}
              </div>
              <div className="text-sm text-gray-600">Unlimited Posting</div>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">
                {status.hasNetworkAccess ? '✓' : '✗'}
              </div>
              <div className="text-sm text-gray-600">Network Access</div>
            </div>
          </div>

          {(status.hasUnlimitedPosting || status.hasNetworkAccess) && (
            <div className="space-y-2">
              {status.unlimitedPostingEndDate && (
                <div className="flex items-center justify-between text-sm">
                  <span>Unlimited Posting Until:</span>
                  <span className="font-medium">
                    {new Date(status.unlimitedPostingEndDate).toLocaleDateString()}
                  </span>
                </div>
              )}
              {status.networkAccessEndDate && (
                <div className="flex items-center justify-between text-sm">
                  <span>Network Access Until:</span>
                  <span className="font-medium">
                    {new Date(status.networkAccessEndDate).toLocaleDateString()}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span>Auto-Renewal:</span>
                <span className={`font-medium ${status.autoRenew ? 'text-green-600' : 'text-gray-600'}`}>
                  {status.autoRenew ? `Enabled (${status.renewalPeriod})` : 'Disabled'}
                </span>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button 
              onClick={onUpgrade}
              className="flex-1"
            >
              {status.jobCredits === 0 && !status.hasUnlimitedPosting 
                ? 'Purchase Credits or Subscription' 
                : 'Upgrade Plan'
              }
            </Button>
            
            {(status.hasUnlimitedPosting || status.hasNetworkAccess) && status.autoRenew && (
              <Button 
                variant="outline"
                onClick={handleCancel}
              >
                Cancel Auto-Renewal
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}