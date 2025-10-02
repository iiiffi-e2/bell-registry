/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  BuildingOfficeIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  FlagIcon,
  ClockIcon,
  MapPinIcon,
  EnvelopeIcon,
  BriefcaseIcon,
  CurrencyDollarIcon,
  UserIcon,
  CalendarIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import AdminNotes from '../../../components/AdminNotes';

interface EmployerDetail {
  id: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    createdAt: string;
    image: string | null;
    membershipAccess: string | null;
    role: string;
    isSuspended: boolean;
    isBanned: boolean;
    suspensionReason: string | null;
    suspensionNote: string | null;
  };
  companyName: string | null;
  industry: string | null;
  location: string | null;
  subscriptionType: string | null;
  subscriptionStartDate: string | null;
  subscriptionEndDate: string | null;
  jobCredits: number;
  jobsPostedCount: number;
  hasNetworkAccess: boolean;
  stripeCustomerId: string | null;
  logoUrl: string | null;
  website: string | null;
  description: string | null;
  createdAt: string;
  postedJobs: Array<{
    id: string;
    title: string;
    status: string;
    createdAt: string;
  }>;
  reportCount: number;
  reports: Array<{
    id: string;
    reason: string;
    details: string;
    status: string;
    createdAt: string;
    reporter: {
      firstName: string;
      lastName: string;
      email: string;
    };
  }>;
  adminNotes?: any[];
}

interface EmployerDetailPageProps {
  params: { id: string };
}

export default function EmployerDetailPage({ params }: EmployerDetailPageProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [employer, setEmployer] = useState<EmployerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
  }, [status, router]);

  // Fetch employer details
  useEffect(() => {
    if (status !== 'authenticated') return;
    fetchEmployerDetails();
  }, [status, params.id]);

  const fetchEmployerDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/employers/${params.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch employer details');
      }
      
      const data = await response.json();
      setEmployer(data.employer);
    } catch (error) {
      console.error('Error fetching employer details:', error);
      setError('Failed to load employer details');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: 'approve' | 'reject' | 'suspend' | 'flag' | 'ban' | 'delete', reason?: string, note?: string) => {
    if (!employer) return;
    
    setActionLoading(true);
    try {
      const response = await fetch(`/api/employers/${params.id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action,
          reason: reason || undefined,
          note: note || undefined
        })
      });
      
      if (!response.ok) {
        throw new Error('Action failed');
      }
      
      // If employer was deleted, redirect back to employers list
      if (action === 'delete') {
        router.push('/employers');
        return;
      }
      
      // Refresh employer details
      await fetchEmployerDetails();
    } catch (error) {
      console.error('Action error:', error);
      setError('Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (!employer) return null;
    
    if (employer.reportCount > 0) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
          <FlagIcon className="h-4 w-4 mr-1" />
          {employer.reportCount} Report{employer.reportCount > 1 ? 's' : ''}
        </span>
      );
    }
    
    if (employer.user.isBanned) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
          <XCircleIcon className="h-4 w-4 mr-1" />
          Banned
        </span>
      );
    }
    
    if (employer.user.isSuspended) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
          <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
          Suspended
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
        <CheckCircleIcon className="h-4 w-4 mr-1" />
        Active
      </span>
    );
  };

  const getSubscriptionBadge = (subscriptionType: string | null) => {
    if (!subscriptionType) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          No Subscription
        </span>
      );
    }

    const colors = {
      'BASIC': 'bg-blue-100 text-blue-800',
      'PREMIUM': 'bg-purple-100 text-purple-800',
      'ENTERPRISE': 'bg-yellow-100 text-yellow-800',
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors[subscriptionType as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {subscriptionType}
      </span>
    );
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading employer details...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Error</h3>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!employer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Employer not found</h3>
          <p className="mt-1 text-sm text-gray-500">The requested employer could not be found.</p>
          <button
            onClick={() => router.back()}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="px-4 sm:px-6 lg:max-w-7xl lg:mx-auto lg:px-8">
          <div className="py-6">
            <div className="flex items-center space-x-4 mb-4">
              <button
                onClick={() => router.back()}
                className="inline-flex items-center text-gray-500 hover:text-gray-700"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-1" />
                Back
              </button>
            </div>
            
            <div className="md:flex md:items-center md:justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-4">
                  {employer.logoUrl ? (
                    <img
                      className="h-16 w-16 rounded-lg object-cover"
                      src={employer.logoUrl}
                      alt="Company logo"
                    />
                  ) : employer.user.image ? (
                    <img
                      className="h-16 w-16 rounded-full object-cover"
                      src={employer.user.image}
                      alt="Profile"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-lg bg-gray-200 flex items-center justify-center">
                      <BuildingOfficeIcon className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  
                  <div>
                    <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:leading-9 sm:truncate">
                      {employer.companyName || `${employer.user.firstName} ${employer.user.lastName}`}
                    </h1>
                    <div className="mt-1 flex items-center space-x-3">
                      <p className="text-sm text-gray-500">{employer.user.email}</p>
                      {getStatusBadge()}
                      {getSubscriptionBadge(employer.subscriptionType)}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex space-x-3 md:mt-0 md:ml-4">
                <button
                  onClick={() => handleAction('approve')}
                  disabled={actionLoading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                >
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  Approve
                </button>
                <button
                  onClick={() => handleAction('suspend', 'Suspended by admin')}
                  disabled={actionLoading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50"
                >
                  <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
                  Suspend
                </button>
                <button
                  onClick={() => handleAction('ban', 'Banned by admin')}
                  disabled={actionLoading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                >
                  <XCircleIcon className="h-4 w-4 mr-2" />
                  Ban
                </button>
                <button
                  onClick={() => handleAction('flag', 'Flagged by admin')}
                  disabled={actionLoading}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  <FlagIcon className="h-4 w-4 mr-2" />
                  Flag
                </button>
                <button
                  onClick={() => handleAction('delete')}
                  disabled={actionLoading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-700 hover:bg-red-800 disabled:opacity-50"
                >
                  <XMarkIcon className="h-4 w-4 mr-2" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Basic Information */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Basic Information
              </h3>
              
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <UserIcon className="h-4 w-4 mr-1" />
                    Contact Person
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {employer.user.firstName} {employer.user.lastName}
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <EnvelopeIcon className="h-4 w-4 mr-1" />
                    Email
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">{employer.user.email}</dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <BuildingOfficeIcon className="h-4 w-4 mr-1" />
                    Company
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {employer.companyName || 'Not specified'}
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Industry</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {employer.industry || 'Not specified'}
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <MapPinIcon className="h-4 w-4 mr-1" />
                    Location
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {employer.location || 'Not specified'}
                  </dd>
                </div>
                
                {employer.website && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Website</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      <a 
                        href={employer.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {employer.website}
                      </a>
                    </dd>
                  </div>
                )}
                
                <div>
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    Account Created
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(employer.user.createdAt).toLocaleDateString()}
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Role</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {employer.user.role}
                  </dd>
                </div>
              </dl>
              
              {employer.description && (
                <div className="mt-6">
                  <dt className="text-sm font-medium text-gray-500">Description</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {employer.description}
                  </dd>
                </div>
              )}
            </div>

            {/* Recent Job Postings */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Recent Job Postings
              </h3>
              
              {employer.postedJobs.length > 0 ? (
                <div className="space-y-4">
                  {employer.postedJobs.map((job) => (
                    <div key={job.id} className="border-l-4 border-blue-400 pl-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900">{job.title}</h4>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          job.status === 'ACTIVE' 
                            ? 'bg-green-100 text-green-800' 
                            : job.status === 'PENDING'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {job.status}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        Posted {new Date(job.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No job postings yet.</p>
              )}
            </div>

            {/* Reports */}
            {employer.reports.length > 0 && (
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Reports ({employer.reports.length})
                </h3>
                
                <div className="space-y-4">
                  {employer.reports.map((report) => (
                    <div key={report.id} className="border border-red-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-red-800">
                          {report.reason}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          report.status === 'PENDING'
                            ? 'bg-yellow-100 text-yellow-800'
                            : report.status === 'RESOLVED'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {report.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{report.details}</p>
                      <div className="text-xs text-gray-500">
                        Reported by {report.reporter.firstName} {report.reporter.lastName} on{' '}
                        {new Date(report.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Account Status */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Account Status
              </h3>
              
              <div className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1">
                    {getStatusBadge()}
                  </dd>
                </div>
                
                {employer.user.isSuspended && employer.user.suspensionReason && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Suspension Reason</dt>
                    <dd className="mt-1 text-sm text-gray-900">{employer.user.suspensionReason}</dd>
                  </div>
                )}
                
                {employer.user.isSuspended && employer.user.suspensionNote && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Admin Note</dt>
                    <dd className="mt-1 text-sm text-gray-900">{employer.user.suspensionNote}</dd>
                  </div>
                )}
              </div>
            </div>

            {/* Subscription & Stats */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Subscription & Stats
              </h3>
              
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Subscription</dt>
                  <dd className="mt-1">
                    {getSubscriptionBadge(employer.subscriptionType)}
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                    Job Credits
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">{employer.jobCredits}</dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <BriefcaseIcon className="h-4 w-4 mr-1" />
                    Jobs Posted
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">{employer.jobsPostedCount}</dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Network Access</dt>
                  <dd className="mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      employer.hasNetworkAccess 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {employer.hasNetworkAccess ? 'Active' : 'Inactive'}
                    </span>
                  </dd>
                </div>
                
                {employer.stripeCustomerId && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Stripe Customer</dt>
                    <dd className="mt-1 text-xs text-gray-900 font-mono">
                      {employer.stripeCustomerId}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Quick Actions */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Quick Actions
              </h3>
              
              <div className="space-y-3">
                <button
                  onClick={() => router.push(`/billing/${employer.user.id}`)}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <CurrencyDollarIcon className="h-4 w-4 mr-2" />
                  View Billing
                </button>
                
                <button
                  onClick={() => window.open(`mailto:${employer.user.email}`, '_blank')}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <EnvelopeIcon className="h-4 w-4 mr-2" />
                  Send Email
                </button>
              </div>
            </div>

            {/* Admin Notes */}
            {session?.user && (
              <AdminNotes
                userId={employer.user.id}
                notes={employer.adminNotes || []}
                currentAdminId={session.user.id}
                onNotesUpdate={fetchEmployerDetails}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
