/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Download, 
  Receipt, 
  Loader2, 
  Calendar, 
  DollarSign,
  FileText,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";

interface BillingHistoryItem {
  id: string;
  amount: number;
  currency: string;
  description: string;
  subscriptionType: string;
  status: string;
  createdAt: string;
  stripeInvoiceId: string | null;
  stripeSessionId: string | null;
}

export default function BillingPage() {
  const { data: session } = useSession();
  const [billingHistory, setBillingHistory] = useState<BillingHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingInvoices, setDownloadingInvoices] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (session?.user?.id) {
      fetchBillingHistory();
    }
  }, [session]);

  const fetchBillingHistory = async () => {
    try {
      const response = await fetch('/api/billing');
      if (response.ok) {
        const data = await response.json();
        setBillingHistory(data.billingHistory);
      } else {
        toast.error('Failed to load billing history');
      }
    } catch (error) {
      console.error('Error fetching billing history:', error);
      toast.error('Error loading billing history');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = async (billingRecordId: string) => {
    setDownloadingInvoices(prev => new Set(prev).add(billingRecordId));
    
    try {
      const response = await fetch('/api/billing/invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ billingRecordId }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.downloadUrl) {
          // Open the invoice PDF in a new tab
          window.open(data.downloadUrl, '_blank');
          toast.success('Invoice opened in new tab');
        } else {
          toast.error('Invoice download URL not available');
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to generate invoice');
      }
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast.error('Error downloading invoice');
    } finally {
      setDownloadingInvoices(prev => {
        const newSet = new Set(prev);
        newSet.delete(billingRecordId);
        return newSet;
      });
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      COMPLETED: { variant: "default" as const, label: "Completed" },
      PENDING: { variant: "secondary" as const, label: "Pending" },
      FAILED: { variant: "destructive" as const, label: "Failed" },
      REFUNDED: { variant: "outline" as const, label: "Refunded" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || 
                   { variant: "secondary" as const, label: status };

    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getSubscriptionTypeLabel = (type: string) => {
    const typeLabels = {
      SPOTLIGHT: "Spotlight Plan",
      BUNDLE: "Hiring Bundle",
      UNLIMITED: "Unlimited Plan",
      NETWORK: "Network Access",
      TRIAL: "Trial",
    };

    return typeLabels[type as keyof typeof typeLabels] || type;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500 mb-4" />
              <p>Loading billing history...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Billing History</h1>
            <p className="text-gray-600 mt-2">
              View your billing history and download invoices
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Receipt className="h-4 w-4" />
            <span>{billingHistory.length} transaction{billingHistory.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Billing Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(
                  billingHistory
                    .filter(item => item.status === 'COMPLETED')
                    .reduce((sum, item) => sum + item.amount, 0)
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                From {billingHistory.filter(item => item.status === 'COMPLETED').length} completed transactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Transaction</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {billingHistory.length > 0 
                  ? formatDate(billingHistory[0].createdAt)
                  : 'No transactions'
                }
              </div>
              <p className="text-xs text-muted-foreground">
                {billingHistory.length > 0 
                  ? getSubscriptionTypeLabel(billingHistory[0].subscriptionType)
                  : 'No billing history available'
                }
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Invoices</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {billingHistory.filter(item => item.status === 'COMPLETED').length}
              </div>
              <p className="text-xs text-muted-foreground">
                Ready for download
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Billing History Table */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>
              Complete list of your billing transactions and invoices
            </CardDescription>
          </CardHeader>
          <CardContent>
            {billingHistory.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No billing history</h3>
                <p className="text-gray-500">
                  Your billing transactions will appear here once you make a purchase.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Plan Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Invoice</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {billingHistory.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {formatDate(item.createdAt)}
                        </TableCell>
                        <TableCell>{item.description}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {getSubscriptionTypeLabel(item.subscriptionType)}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(item.amount, item.currency)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(item.status)}
                        </TableCell>
                        <TableCell>
                          {item.status === 'COMPLETED' ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDownloadInvoice(item.id)}
                              disabled={downloadingInvoices.has(item.id)}
                              className="h-8 px-2"
                            >
                              {downloadingInvoices.has(item.id) ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Download className="h-4 w-4" />
                              )}
                              <span className="ml-1 text-xs">Download</span>
                            </Button>
                          ) : (
                            <span className="text-sm text-gray-500">N/A</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 