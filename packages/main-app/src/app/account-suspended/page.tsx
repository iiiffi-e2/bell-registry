"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ExclamationTriangleIcon, DocumentTextIcon, EnvelopeIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EMAIL_ADDRESSES } from '@/lib/constants';

interface SuspensionData {
  isSuspended: boolean;
  isBanned: boolean;
  suspensionReason?: string;
  suspensionNote?: string;
  suspendedAt?: string;
  suspendedBy?: string;
  suspendedByAdmin?: {
    name: string;
    email: string;
  } | null;
}

const APPEAL_REASONS = [
  { value: 'mistake', label: 'This was a mistake' },
  { value: 'unfair', label: 'The suspension is unfair' },
  { value: 'resolved', label: 'The issue has been resolved' },
  { value: 'first_time', label: 'This is my first violation' },
  { value: 'other', label: 'Other reason' },
];

export default function AccountSuspendedPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [suspensionData, setSuspensionData] = useState<SuspensionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [appealReason, setAppealReason] = useState('');
  const [appealDetails, setAppealDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const checkSuspensionStatus = async () => {
      if (status === 'loading') return;

      if (status === 'unauthenticated') {
        router.push('/login');
        return;
      }

      try {
        const response = await fetch('/api/auth/suspension-status');
        if (response.ok) {
          const data = await response.json();
          setSuspensionData(data);
          
          // If user is not suspended, redirect to dashboard
          if (!data.isSuspended && !data.isBanned) {
            router.push('/dashboard');
            return;
          }
          
          // If user is banned, redirect to login
          if (data.isBanned) {
            router.push('/login?error=banned');
            return;
          }
        }
      } catch (error) {
        console.error('Error checking suspension status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSuspensionStatus();
  }, [session, status, router]);

  const handleAppealSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!appealReason || !appealDetails.trim()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/suspension-appeal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: appealReason,
          details: appealDetails.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit appeal');
      }

      setIsSuccess(true);
    } catch (error) {
      console.error('Error submitting appeal:', error);
      alert('Failed to submit appeal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!suspensionData?.isSuspended) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 mb-4">
            <ExclamationTriangleIcon className="h-8 w-8 text-orange-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Account Suspended
          </h1>
          <p className="text-lg text-gray-600">
            Your account has been temporarily suspended. You can still view your profile and appeal this decision.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Suspension Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DocumentTextIcon className="h-5 w-5 mr-2" />
                Suspension Details
              </CardTitle>
              <CardDescription>
                Information about your account suspension
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {suspensionData.suspensionReason && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">Reason for Suspension</Label>
                  <p className="mt-1 text-sm text-gray-900 bg-orange-50 border border-orange-200 rounded-md p-3">
                    {suspensionData.suspensionReason}
                  </p>
                </div>
              )}

              {suspensionData.suspensionNote && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">Admin Note</Label>
                  <p className="mt-1 text-sm text-gray-900 bg-blue-50 border border-blue-200 rounded-md p-3">
                    {suspensionData.suspensionNote}
                  </p>
                </div>
              )}

              {suspensionData.suspendedAt && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">Suspended On</Label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(suspensionData.suspendedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              )}

              {suspensionData.suspendedByAdmin && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">Suspended By</Label>
                  <p className="mt-1 text-sm text-gray-900">
                    {suspensionData.suspendedByAdmin.name}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Appeal Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <EnvelopeIcon className="h-5 w-5 mr-2" />
                Appeal Suspension
              </CardTitle>
              <CardDescription>
                Submit an appeal to have your suspension reviewed
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isSuccess ? (
                <div className="text-center py-8">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mb-4">
                    <CheckCircleIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Appeal Submitted Successfully
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Thank you for submitting your appeal. We will review your case and get back to you within 2-3 business days.
                  </p>
                  <Button
                    onClick={() => router.push('/dashboard')}
                    className="w-full"
                  >
                    Return to Dashboard
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleAppealSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="appeal-reason" className="text-sm font-medium text-gray-700">
                      Appeal Reason <span className="text-red-500">*</span>
                    </Label>
                    <Select value={appealReason} onValueChange={setAppealReason}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select a reason for your appeal..." />
                      </SelectTrigger>
                      <SelectContent>
                        {APPEAL_REASONS.map((reason) => (
                          <SelectItem key={reason.value} value={reason.value}>
                            {reason.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="appeal-details" className="text-sm font-medium text-gray-700">
                      Additional Details <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="appeal-details"
                      placeholder="Please provide detailed information about why you believe your suspension should be lifted..."
                      value={appealDetails}
                      onChange={(e) => setAppealDetails(e.target.value)}
                      rows={4}
                      className="mt-1"
                      disabled={isSubmitting}
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Be specific and provide any relevant context or evidence that supports your appeal.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting || !appealReason || !appealDetails.trim()}
                    className="w-full"
                  >
                    {isSubmitting ? 'Submitting Appeal...' : 'Submit Appeal'}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Additional Information */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>What happens next?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-blue-600 text-xs font-medium">1</span>
                </div>
                <p>Your appeal will be reviewed by our support team within 2-3 business days.</p>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-blue-600 text-xs font-medium">2</span>
                </div>
                <p>We will contact you via email with our decision and any next steps.</p>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-blue-600 text-xs font-medium">3</span>
                </div>
                <p>If your appeal is approved, your account will be restored immediately.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Need immediate assistance? Contact us at{' '}
            <a 
              href={`mailto:${EMAIL_ADDRESSES.SUPPORT}?subject=Account Suspension - Urgent`}
              className="text-blue-600 hover:text-blue-500 font-medium"
            >
              {EMAIL_ADDRESSES.SUPPORT}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
} 