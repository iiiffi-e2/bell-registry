'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  CurrencyDollarIcon,
  BuildingOfficeIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UserIcon,
  CreditCardIcon,
  DocumentTextIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import { formatSubscriptionType } from '@/lib/subscription-utils';

interface BillingRecord {
  id: string;
  amount: number;
  currency: string;
  description: string;
  subscriptionType: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  stripeSessionId: string | null;
  stripeInvoiceId: string | null;
}

interface EmployerInfo {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  companyName: string;
  industry: string | null;
  location: string | null;
  subscriptionType: string;
  subscriptionStartDate: string;
  subscriptionEndDate: string | null;
  jobCredits: number;
  jobsPostedCount: number;
  hasNetworkAccess: boolean;
  stripeCustomerId: string | null;
  createdAt: string;
}

interface EmployerBillingResponse {
  employer: EmployerInfo;
  billingRecords: BillingRecord[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  summary: {
    totalSpent: number;
    completedPurchases: number;
    lastPurchaseDate: string | null;
  };
}

interface EmployerBillingPageProps {
  params: { employerId: string };
}

export default function EmployerBillingPage({ params }: EmployerBillingPageProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [employer, setEmployer] = useState<EmployerInfo | null>(null);
  const [billingRecords, setBillingRecords] = useState<BillingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [summary, setSummary] = useState({
    totalSpent: 0,
    completedPurchases: 0,
    lastPurchaseDate: null as string | null
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
  }, [status, router]);

  // Fetch employer billing data
  const fetchEmployerBilling = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });
      
      const response = await fetch(`/api/billing/${params.employerId}?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch employer billing data');
      }
      
      const data: EmployerBillingResponse = await response.json();
      setEmployer(data.employer);
      setBillingRecords(data.billingRecords);
      setCurrentPage(data.pagination.page);
      setTotalPages(data.pagination.totalPages);
      setTotalCount(data.pagination.totalCount);
      setSummary(data.summary);
    } catch (error) {
      console.error('Error fetching employer billing:', error);
      setError('Failed to load employer billing data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated' && params.employerId) {
      fetchEmployerBilling();
    }
  }, [status, params.employerId]);

  const handlePageChange = (page: number) => {
    fetchEmployerBilling(page);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <ClockIcon className="w-3 h-3 mr-1" />
            Pending
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="w-3 h-3 mr-1" />
            Completed
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircleIcon className="w-3 h-3 mr-1" />
            Failed
          </span>
        );
      case 'REFUNDED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <DocumentTextIcon className="w-3 h-3 mr-1" />
            Refunded
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  const getSubscriptionTypeBadge = (subscriptionType: string) => {
    const colors: { [key: string]: string } = {
      'TRIAL': 'bg-gray-100 text-gray-800',
      'SPOTLIGHT': 'bg-blue-100 text-blue-800',
      'BUNDLE': 'bg-purple-100 text-purple-800',
      'UNLIMITED': 'bg-green-100 text-green-800',
      'NETWORK': 'bg-indigo-100 text-indigo-800',
      'NETWORK_QUARTERLY': 'bg-indigo-100 text-indigo-800'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[subscriptionType] || 'bg-gray-100 text-gray-800'}`}>
        {formatSubscriptionType(subscriptionType)}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount);
  };

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="px-4 sm:px-6 lg:max-w-6xl lg:mx-auto lg:px-8">
          <div className="py-6 md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center">
                <button
                  onClick={() => router.push('/billing')}
                  className="mr-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
                >
                  <ChevronLeftIcon className="w-5 h-5" />
                </button>
                <div>
                  <div className="flex items-center">
                    <CurrencyDollarIcon className="w-6 h-6 text-gray-600 mr-2" />
                    <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:leading-9 sm:truncate">
                      {employer ? (employer.companyName || `${employer.firstName || ''} ${employer.lastName || ''}`.trim() || employer.email) : 'Loading...'}
                    </h1>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Billing history and account details
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {loading ? (
          <div className="animate-pulse space-y-6">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          </div>
        ) : employer ? (
          <>
            {/* Employer Info Card */}
            <div className="bg-white shadow rounded-lg p-6 mb-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Account Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center">
                    <UserIcon className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {employer.firstName || employer.lastName 
                          ? `${employer.firstName || ''} ${employer.lastName || ''}`.trim()
                          : 'Name not provided'
                        }
                      </p>
                      <p className="text-sm text-gray-500">{employer.role}</p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <EnvelopeIcon className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{employer.email}</p>
                      <p className="text-sm text-gray-500">Email Address</p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <BuildingOfficeIcon className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{employer.companyName}</p>
                      <p className="text-sm text-gray-500">{employer.industry || 'Industry not specified'}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Current Subscription</p>
                    <div className="mt-1">
                      {getSubscriptionTypeBadge(employer.subscriptionType)}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-900">Job Credits</p>
                    <p className="text-sm text-gray-500">{employer.jobCredits} credits remaining</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-900">Jobs Posted</p>
                    <p className="text-sm text-gray-500">{employer.jobsPostedCount} total jobs</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-900">Network Access</p>
                    <p className="text-sm text-gray-500">
                      {employer.hasNetworkAccess ? 'Active' : 'Not active'}
                    </p>
                  </div>
                </div>
              </div>

              {employer.stripeCustomerId && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Stripe Customer ID: {employer.stripeCustomerId}
                  </p>
                </div>
              )}
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Total Spent
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {formatCurrency(summary.totalSpent)}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <CheckCircleIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Completed Purchases
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {summary.completedPurchases}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <CalendarDaysIcon className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Last Purchase
                        </dt>
                        <dd className="text-sm font-medium text-gray-900">
                          {summary.lastPurchaseDate 
                            ? formatDate(summary.lastPurchaseDate)
                            : 'No purchases'
                          }
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Billing History */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Billing History ({totalCount} records)
                </h3>
              </div>

              {billingRecords.length === 0 ? (
                <div className="p-12 text-center">
                  <CurrencyDollarIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No billing records</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    This employer hasn't made any purchases yet.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {billingRecords.map((record) => (
                    <div key={record.id} className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center mb-2">
                            <h4 className="text-lg font-medium text-gray-900 mr-3">
                              {formatCurrency(record.amount, record.currency)}
                            </h4>
                            {getStatusBadge(record.status)}
                            <div className="ml-2">
                              {getSubscriptionTypeBadge(record.subscriptionType)}
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-2">{record.description}</p>
                          
                          <div className="flex items-center text-sm text-gray-500">
                            <CalendarDaysIcon className="w-4 h-4 mr-1" />
                            <span className="mr-4">{formatDate(record.createdAt)}</span>
                            {record.stripeSessionId && (
                              <>
                                <CreditCardIcon className="w-4 h-4 mr-1" />
                                <span>Stripe Payment</span>
                              </>
                            )}
                          </div>

                          {record.stripeSessionId && (
                            <div className="mt-2 text-xs text-gray-500">
                              Session ID: {record.stripeSessionId}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 flex justify-between sm:hidden">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                      >
                        Next
                      </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Showing{' '}
                          <span className="font-medium">{(currentPage - 1) * 10 + 1}</span>
                          {' '}to{' '}
                          <span className="font-medium">
                            {Math.min(currentPage * 10, totalCount)}
                          </span>
                          {' '}of{' '}
                          <span className="font-medium">{totalCount}</span>
                          {' '}results
                        </p>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                          <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                          >
                            <ChevronLeftIcon className="h-5 w-5" />
                          </button>
                          
                          {/* Page numbers */}
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }
                            
                            return (
                              <button
                                key={pageNum}
                                onClick={() => handlePageChange(pageNum)}
                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                  pageNum === currentPage
                                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                          
                          <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                          >
                            <ChevronRightIcon className="h-5 w-5" />
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
