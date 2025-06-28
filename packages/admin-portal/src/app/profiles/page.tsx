'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  UserGroupIcon, 
  MagnifyingGlassIcon,
  FlagIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  ChevronRightIcon,
  FunnelIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface Profile {
  id: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    createdAt: string;
    image: string | null;
    profileSlug: string | null;
  };
  preferredRole: string | null;
  location: string | null;
  profileViews: number;
  openToWork: boolean;
  createdAt: string;
  status?: 'APPROVED' | 'PENDING' | 'REJECTED' | 'SUSPENDED' | 'BANNED';
  reportCount?: number;
  lastReportDate?: string;
}

interface ProfileFilters {
  status: string;
  search: string;
  hasReports: boolean;
  openToWork: boolean | null;
  sortBy: 'newest' | 'oldest' | 'mostViewed' | 'mostReported';
}

export default function ProfileManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  const [filters, setFilters] = useState<ProfileFilters>({
    status: 'all',
    search: '',
    hasReports: false,
    openToWork: null,
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

  // Fetch profiles
  useEffect(() => {
    if (status !== 'authenticated') return;
    fetchProfiles();
  }, [status, filters]);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams = new URLSearchParams();
      if (filters.status !== 'all') queryParams.set('status', filters.status);
      if (filters.search) queryParams.set('search', filters.search);
      if (filters.hasReports) queryParams.set('hasReports', 'true');
      if (filters.openToWork !== null) queryParams.set('openToWork', filters.openToWork.toString());
      queryParams.set('sortBy', filters.sortBy);
      
      const response = await fetch(`/api/profiles?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch profiles');
      }
      
      const data = await response.json();
      setProfiles(data.profiles || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      setError('Failed to load profiles');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAction = async (action: 'approve' | 'suspend' | 'flag' | 'ban') => {
    if (selectedProfiles.length === 0) return;
    
    setBulkActionLoading(true);
    try {
      const response = await fetch('/api/profiles/bulk-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileIds: selectedProfiles,
          action
        })
      });
      
      if (!response.ok) {
        throw new Error('Bulk action failed');
      }
      
      // Refresh profiles and clear selection
      await fetchProfiles();
      setSelectedProfiles([]);
    } catch (error) {
      console.error('Bulk action error:', error);
      setError('Bulk action failed');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleProfileAction = async (profileId: string, action: 'approve' | 'reject' | 'suspend' | 'flag' | 'ban') => {
    try {
      const response = await fetch(`/api/profiles/${profileId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      
      if (!response.ok) {
        throw new Error('Profile action failed');
      }
      
      // Refresh profiles
      await fetchProfiles();
    } catch (error) {
      console.error('Profile action error:', error);
      setError('Profile action failed');
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
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="h-3 w-3 mr-1" />
            Active
          </span>
        );
    }
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
                Profile Management
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Review, moderate, and manage user profiles across the platform
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
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
                    placeholder="Name or email..."
                    className="block w-full pl-10 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Open to Work</label>
                <select
                  value={filters.openToWork === null ? 'all' : filters.openToWork.toString()}
                  onChange={(e) => setFilters({ 
                    ...filters, 
                    openToWork: e.target.value === 'all' ? null : e.target.value === 'true'
                  })}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="all">All</option>
                  <option value="true">Open to Work</option>
                  <option value="false">Not Open</option>
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
                  <option value="mostViewed">Most Viewed</option>
                  <option value="mostReported">Most Reported</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Actions */}
        {selectedProfiles.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-700">
                {selectedProfiles.length} profile{selectedProfiles.length > 1 ? 's' : ''} selected
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
                  onClick={() => handleBulkAction('suspend')}
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
                  onClick={() => handleBulkAction('flag')}
                  disabled={bulkActionLoading}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                >
                  <FlagIcon className="h-4 w-4 mr-1" />
                  Flag
                </button>
                <button
                  onClick={() => setSelectedProfiles([])}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Profile List */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading profiles...</p>
            </div>
          ) : profiles.length === 0 ? (
            <div className="p-12 text-center">
              <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No profiles found</h3>
              <p className="mt-1 text-sm text-gray-500">Try adjusting your filters or search criteria.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {profiles.map((profile) => (
                <li key={profile.id} className="hover:bg-gray-50">
                  <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <input
                          type="checkbox"
                          checked={selectedProfiles.includes(profile.user.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProfiles([...selectedProfiles, profile.user.id]);
                            } else {
                              setSelectedProfiles(selectedProfiles.filter(id => id !== profile.user.id));
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        />
                        
                        <div className="flex-shrink-0">
                          {profile.user.image ? (
                            <img
                              className="h-10 w-10 rounded-full object-cover"
                              src={profile.user.image}
                              alt=""
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <UserGroupIcon className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-3">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {profile.user.firstName} {profile.user.lastName}
                            </p>
                            {getStatusBadge(profile.status, profile.reportCount)}
                            {profile.openToWork && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Open to Work
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 mt-1">
                            <p className="text-sm text-gray-500">{profile.user.email}</p>
                            {profile.preferredRole && (
                              <p className="text-sm text-gray-500">• {profile.preferredRole}</p>
                            )}
                            {profile.location && (
                              <p className="text-sm text-gray-500">• {profile.location}</p>
                            )}
                            <p className="text-sm text-gray-500 flex items-center">
                              <EyeIcon className="h-4 w-4 mr-1" />
                              {profile.profileViews} views
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {profile.reportCount && profile.reportCount > 0 && (
                          <button
                            onClick={() => router.push(`/profiles/${profile.user.id}/reports`)}
                            className="inline-flex items-center px-3 py-1.5 border border-red-300 text-xs font-medium rounded text-red-700 bg-red-50 hover:bg-red-100"
                          >
                            View Reports
                          </button>
                        )}
                        
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleProfileAction(profile.user.id, 'approve')}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                            title="Approve"
                          >
                            <CheckCircleIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleProfileAction(profile.user.id, 'suspend')}
                            className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded"
                            title="Suspend"
                          >
                            <ExclamationTriangleIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleProfileAction(profile.user.id, 'ban')}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                            title="Ban"
                          >
                            <XMarkIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleProfileAction(profile.user.id, 'flag')}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                            title="Flag"
                          >
                            <FlagIcon className="h-5 w-5" />
                          </button>
                        </div>
                        
                        <button
                          onClick={() => router.push(`/profiles/${profile.user.id}`)}
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
    </div>
  );
} 