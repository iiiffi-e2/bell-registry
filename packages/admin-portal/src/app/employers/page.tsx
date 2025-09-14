'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  BuildingOfficeIcon, 
  MagnifyingGlassIcon,
  FlagIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  ChevronRightIcon,
  FunnelIcon,
  XMarkIcon,
  BriefcaseIcon
} from '@heroicons/react/24/outline';

interface EmployerProfile {
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
  };
  companyName: string | null;
  industry: string | null;
  location: string | null;
  subscriptionType: string | null;
  jobCredits: number;
  jobsPostedCount: number;
  hasNetworkAccess: boolean;
  createdAt: string;
  status?: 'APPROVED' | 'PENDING' | 'REJECTED' | 'SUSPENDED' | 'BANNED' | 'REMOVED';
  reportCount?: number;
  lastReportDate?: string;
}

interface EmployerFilters {
  status: string;
  search: string;
  hasReports: boolean;
  subscriptionType: string;
  hasNetworkAccess: boolean | null;
  sortBy: 'newest' | 'oldest' | 'mostJobs' | 'mostReported';
}

// Individual Suspension Modal Component
function IndividualSuspensionModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  employerName, 
  isLoading 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: (reason: string, note: string) => void; 
  employerName: string; 
  isLoading: boolean; 
}) {
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim()) {
      onConfirm(reason.trim(), note.trim());
    }
  };

  const handleClose = () => {
    setReason('');
    setNote('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Suspend Employer Account
            </h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          
          <p className="text-sm text-gray-600 mb-4">
            You are about to suspend the account for <strong>{employerName}</strong>. 
            This will restrict their access to the platform and prevent them from posting jobs.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                Suspension Reason *
              </label>
              <select
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
              >
                <option value="">Select a reason</option>
                <option value="Inappropriate job postings">Inappropriate job postings</option>
                <option value="Spam or harassment">Spam or harassment</option>
                <option value="Fake company or impersonation">Fake company or impersonation</option>
                <option value="Violation of terms of service">Violation of terms of service</option>
                <option value="Suspicious activity">Suspicious activity</option>
                <option value="Multiple reports">Multiple reports</option>
                <option value="Payment issues">Payment issues</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="mb-6">
              <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-2">
                Additional Note (Optional)
              </label>
              <textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Provide additional context or instructions for the employer..."
              />
              <p className="mt-1 text-xs text-gray-500">
                This note will be included in the suspension email sent to the employer.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50"
                disabled={isLoading || !reason.trim()}
              >
                {isLoading ? 'Suspending...' : 'Suspend Account'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Bulk Suspension Modal Component
function BulkSuspensionModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  selectedCount, 
  isLoading 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: (reason: string, note: string) => void; 
  selectedCount: number; 
  isLoading: boolean; 
}) {
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim()) {
      onConfirm(reason.trim(), note.trim());
    }
  };

  const handleClose = () => {
    setReason('');
    setNote('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Suspend Multiple Employers
            </h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          
          <p className="text-sm text-gray-600 mb-4">
            You are about to suspend <strong>{selectedCount} employer{selectedCount > 1 ? 's' : ''}</strong>. 
            This will restrict their access to the platform and prevent them from posting jobs.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                Suspension Reason *
              </label>
              <select
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
              >
                <option value="">Select a reason</option>
                <option value="Inappropriate job postings">Inappropriate job postings</option>
                <option value="Spam or harassment">Spam or harassment</option>
                <option value="Fake company or impersonation">Fake company or impersonation</option>
                <option value="Violation of terms of service">Violation of terms of service</option>
                <option value="Suspicious activity">Suspicious activity</option>
                <option value="Multiple reports">Multiple reports</option>
                <option value="Payment issues">Payment issues</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="mb-6">
              <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-2">
                Additional Note (Optional)
              </label>
              <textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Provide additional context or instructions for the employers..."
              />
              <p className="mt-1 text-xs text-gray-500">
                This note will be included in the suspension emails sent to all employers.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50"
                disabled={isLoading || !reason.trim()}
              >
                {isLoading ? 'Suspending...' : `Suspend ${selectedCount} Employer${selectedCount > 1 ? 's' : ''}`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function EmployerManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [employers, setEmployers] = useState<EmployerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEmployers, setSelectedEmployers] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showBulkSuspensionModal, setShowBulkSuspensionModal] = useState(false);
  const [showIndividualSuspensionModal, setShowIndividualSuspensionModal] = useState(false);
  const [selectedEmployerForSuspension, setSelectedEmployerForSuspension] = useState<EmployerProfile | null>(null);
  
  const [filters, setFilters] = useState<EmployerFilters>({
    status: 'all',
    search: '',
    hasReports: false,
    subscriptionType: 'all',
    hasNetworkAccess: null,
    sortBy: 'newest'
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
  }, [status, router]);

  // Fetch employers
  useEffect(() => {
    if (status !== 'authenticated') return;
    fetchEmployers();
  }, [status, filters]);

  const fetchEmployers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams = new URLSearchParams();
      if (filters.status !== 'all') queryParams.set('status', filters.status);
      if (filters.search) queryParams.set('search', filters.search);
      if (filters.hasReports) queryParams.set('hasReports', 'true');
      if (filters.subscriptionType !== 'all') queryParams.set('subscriptionType', filters.subscriptionType);
      if (filters.hasNetworkAccess !== null) queryParams.set('hasNetworkAccess', filters.hasNetworkAccess.toString());
      queryParams.set('sortBy', filters.sortBy);
      
      const response = await fetch(`/api/employers?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch employers');
      }
      
      const data = await response.json();
      setEmployers(data.employers || []);
    } catch (error) {
      console.error('Error fetching employers:', error);
      setError('Failed to load employers');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAction = async (action: 'approve' | 'suspend' | 'flag' | 'ban' | 'remove', reason?: string, note?: string) => {
    if (selectedEmployers.length === 0) return;
    
    setBulkActionLoading(true);
    try {
      const response = await fetch('/api/employers/bulk-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employerIds: selectedEmployers,
          action,
          reason: reason || undefined,
          note: note || undefined
        })
      });
      
      if (!response.ok) {
        throw new Error('Bulk action failed');
      }
      
      // Refresh employers and clear selection
      await fetchEmployers();
      setSelectedEmployers([]);
    } catch (error) {
      console.error('Bulk action error:', error);
      setError('Bulk action failed');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkSuspendClick = () => {
    setShowBulkSuspensionModal(true);
  };

  const handleBulkSuspendConfirm = (reason: string, note: string) => {
    handleBulkAction('suspend', reason, note);
    setShowBulkSuspensionModal(false);
  };

  const handleIndividualSuspendClick = (employer: EmployerProfile) => {
    setSelectedEmployerForSuspension(employer);
    setShowIndividualSuspensionModal(true);
  };

  const handleIndividualSuspendConfirm = (reason: string, note: string) => {
    if (selectedEmployerForSuspension) {
      handleEmployerAction(selectedEmployerForSuspension.user.id, 'suspend', reason, note);
      setShowIndividualSuspensionModal(false);
      setSelectedEmployerForSuspension(null);
    }
  };

  const handleEmployerAction = async (employerId: string, action: 'approve' | 'reject' | 'suspend' | 'flag' | 'ban' | 'remove', reason?: string, note?: string) => {
    try {
      const response = await fetch(`/api/employers/${employerId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action,
          reason: reason || undefined,
          note: note || undefined
        })
      });
      
      if (!response.ok) {
        throw new Error('Employer action failed');
      }
      
      // Refresh employers
      await fetchEmployers();
    } catch (error) {
      console.error('Employer action error:', error);
      setError('Employer action failed');
    }
  };

  const getStatusBadge = (status?: string, reportCount?: number) => {
    if (reportCount && reportCount > 0) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <FlagIcon className="h-3 w-3 mr-1" />
          {reportCount} Report{reportCount > 1 ? 's' : ''}
        </span>
      );
    }
    
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="h-3 w-3 mr-1" />
            Approved
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <ClockIcon className="h-3 w-3 mr-1" />
            Pending
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircleIcon className="h-3 w-3 mr-1" />
            Rejected
          </span>
        );
      case 'SUSPENDED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
            Suspended
          </span>
        );
      case 'BANNED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircleIcon className="h-3 w-3 mr-1" />
            Banned
          </span>
        );
      case 'REMOVED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <XCircleIcon className="h-3 w-3 mr-1" />
            Removed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="h-3 w-3 mr-1" />
            Active
          </span>
        );
    }
  };

  const getSubscriptionBadge = (subscriptionType: string | null) => {
    if (!subscriptionType) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
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
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[subscriptionType as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {subscriptionType}
      </span>
    );
  };

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

  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="px-4 sm:px-6 lg:max-w-7xl lg:mx-auto lg:px-8">
          <div className="py-6 md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:leading-9 sm:truncate">
                Employer Management
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Review, moderate, and manage employer accounts and companies
              </p>
            </div>
            <div className="mt-6 flex space-x-3 md:mt-0 md:ml-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <FunnelIcon className="h-4 w-4 mr-2" />
                Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {/* Filters */}
        {showFilters && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="all">All Statuses</option>
                  <option value="APPROVED">Approved</option>
                  <option value="PENDING">Pending</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="SUSPENDED">Suspended</option>
                  <option value="BANNED">Banned</option>
                  <option value="REMOVED">Removed</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    placeholder="Name, email, or company..."
                    className="block w-full pl-10 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subscription</label>
                <select
                  value={filters.subscriptionType}
                  onChange={(e) => setFilters({ ...filters, subscriptionType: e.target.value })}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="all">All Subscriptions</option>
                  <option value="BASIC">Basic</option>
                  <option value="PREMIUM">Premium</option>
                  <option value="ENTERPRISE">Enterprise</option>
                  <option value="none">No Subscription</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reports</label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.hasReports}
                    onChange={(e) => setFilters({ ...filters, hasReports: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-600">Has reports</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Network Access</label>
                <select
                  value={filters.hasNetworkAccess === null ? 'all' : filters.hasNetworkAccess.toString()}
                  onChange={(e) => setFilters({ 
                    ...filters, 
                    hasNetworkAccess: e.target.value === 'all' ? null : e.target.value === 'true'
                  })}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="all">All</option>
                  <option value="true">Has Network Access</option>
                  <option value="false">No Network Access</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as any })}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="mostJobs">Most Jobs Posted</option>
                  <option value="mostReported">Most Reported</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Actions */}
        {selectedEmployers.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-700">
                {selectedEmployers.length} employer{selectedEmployers.length > 1 ? 's' : ''} selected
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleBulkAction('approve')}
                  disabled={bulkActionLoading}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                >
                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                  Approve
                </button>
                <button
                  onClick={handleBulkSuspendClick}
                  disabled={bulkActionLoading}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50"
                >
                  <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                  Suspend
                </button>
                <button
                  onClick={() => handleBulkAction('ban')}
                  disabled={bulkActionLoading}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                >
                  <XMarkIcon className="h-4 w-4 mr-1" />
                  Ban
                </button>
                <button
                  onClick={() => handleBulkAction('remove')}
                  disabled={bulkActionLoading}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-gray-600 hover:bg-gray-700 disabled:opacity-50"
                >
                  <XMarkIcon className="h-4 w-4 mr-1" />
                  Remove
                </button>
                <button
                  onClick={() => handleBulkAction('flag')}
                  disabled={bulkActionLoading}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                >
                  <FlagIcon className="h-4 w-4 mr-1" />
                  Flag
                </button>
                <button
                  onClick={() => setSelectedEmployers([])}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Employer List */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading employers...</p>
            </div>
          ) : employers.length === 0 ? (
            <div className="p-12 text-center">
              <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No employers found</h3>
              <p className="mt-1 text-sm text-gray-500">Try adjusting your filters or search criteria.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {employers.map((employer) => (
                <li key={employer.id} className="hover:bg-gray-50">
                  <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <input
                          type="checkbox"
                          checked={selectedEmployers.includes(employer.user.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedEmployers([...selectedEmployers, employer.user.id]);
                            } else {
                              setSelectedEmployers(selectedEmployers.filter(id => id !== employer.user.id));
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        />
                        
                        <div className="flex-shrink-0">
                          {employer.user.image ? (
                            <img
                              className="h-10 w-10 rounded-full object-cover"
                              src={employer.user.image}
                              alt=""
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <BuildingOfficeIcon className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-3">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {employer.companyName || `${employer.user.firstName} ${employer.user.lastName}`}
                            </p>
                            {getStatusBadge(employer.status, employer.reportCount)}
                            {getSubscriptionBadge(employer.subscriptionType)}
                            {employer.hasNetworkAccess && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Network Access
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 mt-1">
                            <p className="text-sm text-gray-500">{employer.user.email}</p>
                            {employer.industry && (
                              <p className="text-sm text-gray-500">• {employer.industry}</p>
                            )}
                            {employer.location && (
                              <p className="text-sm text-gray-500">• {employer.location}</p>
                            )}
                            <p className="text-sm text-gray-500 flex items-center">
                              <BriefcaseIcon className="h-4 w-4 mr-1" />
                              {employer.jobsPostedCount} jobs posted
                            </p>
                            <p className="text-sm text-gray-500">
                              {employer.jobCredits} credits
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {employer.reportCount && employer.reportCount > 0 && (
                          <button
                            onClick={() => router.push(`/employers/${employer.user.id}/reports`)}
                            className="inline-flex items-center px-3 py-1.5 border border-red-300 text-xs font-medium rounded text-red-700 bg-red-50 hover:bg-red-100"
                          >
                            View Reports
                          </button>
                        )}
                        
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleEmployerAction(employer.user.id, 'approve')}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                            title="Approve"
                          >
                            <CheckCircleIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleIndividualSuspendClick(employer)}
                            className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded"
                            title="Suspend"
                          >
                            <ExclamationTriangleIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleEmployerAction(employer.user.id, 'ban')}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                            title="Ban"
                          >
                            <XMarkIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleEmployerAction(employer.user.id, 'remove')}
                            className="p-1.5 text-gray-600 hover:bg-gray-50 rounded"
                            title="Remove"
                          >
                            <XMarkIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleEmployerAction(employer.user.id, 'flag')}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                            title="Flag"
                          >
                            <FlagIcon className="h-5 w-5" />
                          </button>
                        </div>
                        
                        <button
                          onClick={() => router.push(`/employers/${employer.user.id}`)}
                          className="p-1.5 text-gray-400 hover:bg-gray-50 rounded"
                        >
                          <ChevronRightIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <BulkSuspensionModal
        isOpen={showBulkSuspensionModal}
        onClose={() => setShowBulkSuspensionModal(false)}
        onConfirm={handleBulkSuspendConfirm}
        selectedCount={selectedEmployers.length}
        isLoading={bulkActionLoading}
      />

      <IndividualSuspensionModal
        isOpen={showIndividualSuspensionModal}
        onClose={() => {
          setShowIndividualSuspensionModal(false);
          setSelectedEmployerForSuspension(null);
        }}
        onConfirm={handleIndividualSuspendConfirm}
        employerName={selectedEmployerForSuspension ? (selectedEmployerForSuspension.companyName || `${selectedEmployerForSuspension.user.firstName} ${selectedEmployerForSuspension.user.lastName}`) : ''}
        isLoading={false}
      />
    </div>
  );
}
