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
  CogIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface SystemSetting {
  id: string;
  settingKey: string;
  settingValue: string;
  description: string;
  updatedBy: string;
  updatedAt: string;
  admin: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [defaultProfileStatus, setDefaultProfileStatus] = useState<'APPROVED' | 'PENDING'>('APPROVED');
  
  // Demo data management states
  const [demoJobsCount, setDemoJobsCount] = useState<number>(0);
  const [demoUsersCount, setDemoUsersCount] = useState<number>(0);
  const [loadingDemoInfo, setLoadingDemoInfo] = useState(false);
  const [removingDemoJobs, setRemovingDemoJobs] = useState(false);
  const [removingDemoUsers, setRemovingDemoUsers] = useState(false);

  // Redirect if not admin
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      router.push('/login');
      return;
    }
    
    fetchSettings();
    fetchDemoInfo();
  }, [session, status, router]);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        
        // Find the default profile status setting
        const profileStatusSetting = data.find((s: SystemSetting) => s.settingKey === 'DEFAULT_PROFILE_STATUS');
        if (profileStatusSetting) {
          setDefaultProfileStatus(profileStatusSetting.settingValue as 'APPROVED' | 'PENDING');
        }
      } else {
        throw new Error('Failed to fetch settings');
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const fetchDemoInfo = async () => {
    setLoadingDemoInfo(true);
    try {
      // Fetch demo jobs count
      const jobsResponse = await fetch('/api/demo/jobs');
      if (jobsResponse.ok) {
        const jobsData = await jobsResponse.json();
        setDemoJobsCount(jobsData.demoJobCount || 0);
      }

      // Fetch demo users count
      const usersResponse = await fetch('/api/demo/users');
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setDemoUsersCount(usersData.demoUserCount || 0);
      }
    } catch (error) {
      console.error('Error fetching demo info:', error);
    } finally {
      setLoadingDemoInfo(false);
    }
  };

  const saveProfileStatusSetting = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settingKey: 'DEFAULT_PROFILE_STATUS',
          settingValue: defaultProfileStatus,
          description: 'Default status for new professional profiles'
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save setting');
      }
      
      setSuccess('Profile status setting saved successfully!');
      await fetchSettings(); // Refresh the list
    } catch (error) {
      console.error('Error saving setting:', error);
      setError('Failed to save setting');
    } finally {
      setSaving(false);
    }
  };

  const removeDemoJobs = async () => {
    if (!confirm(`Are you sure you want to remove all ${demoJobsCount} demo jobs? This action cannot be undone.`)) {
      return;
    }

    setRemovingDemoJobs(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/demo/jobs', {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to remove demo jobs');
      }

      const result = await response.json();
      setSuccess(result.message);
      await fetchDemoInfo(); // Refresh the counts
    } catch (error) {
      console.error('Error removing demo jobs:', error);
      setError('Failed to remove demo jobs');
    } finally {
      setRemovingDemoJobs(false);
    }
  };

  const removeDemoUsers = async () => {
    if (!confirm(`Are you sure you want to remove all ${demoUsersCount} demo users? This will also remove their associated jobs, profiles, and other data. This action cannot be undone.`)) {
      return;
    }

    setRemovingDemoUsers(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/demo/users', {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to remove demo users');
      }

      const result = await response.json();
      setSuccess(result.message);
      await fetchDemoInfo(); // Refresh the counts
    } catch (error) {
      console.error('Error removing demo users:', error);
      setError('Failed to remove demo users');
    } finally {
      setRemovingDemoUsers(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center">
          <CogIcon className="h-8 w-8 text-gray-400 mr-3" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
            <p className="mt-1 text-sm text-gray-500">
              Configure platform-wide settings and preferences
            </p>
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-6 rounded-md bg-green-50 p-4">
          <div className="flex">
            <CheckCircleIcon className="h-5 w-5 text-green-400" />
            <div className="ml-3">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Profile Status Setting */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Profile Approval Settings</h3>
          <p className="mt-1 text-sm text-gray-500">
            Control how new professional profiles are handled when users register
          </p>
        </div>
        
        <div className="px-6 py-4">
          <div className="space-y-4">
            <div>
              <label className="text-base font-medium text-gray-900">
                Default Profile Status
              </label>
              <p className="text-sm text-gray-500">
                Choose whether new professional profiles are automatically approved or require manual review
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  id="approved"
                  name="profileStatus"
                  type="radio"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  checked={defaultProfileStatus === 'APPROVED'}
                  onChange={() => setDefaultProfileStatus('APPROVED')}
                />
                <label htmlFor="approved" className="ml-3 block text-sm">
                  <span className="font-medium text-gray-900">Auto-Approve</span>
                  <span className="text-gray-500 block">
                    New profiles are immediately visible to employers and in search results.
                    Best for trusted environments.
                  </span>
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  id="pending"
                  name="profileStatus"
                  type="radio"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  checked={defaultProfileStatus === 'PENDING'}
                  onChange={() => setDefaultProfileStatus('PENDING')}
                />
                <label htmlFor="pending" className="ml-3 block text-sm">
                  <span className="font-medium text-gray-900">Manual Approval Required</span>
                  <span className="text-gray-500 block">
                    New profiles remain hidden until manually approved by an admin.
                    Provides quality control and content moderation.
                  </span>
                </label>
              </div>
            </div>
            
            <div className="pt-4">
              <button
                onClick={saveProfileStatusSetting}
                disabled={saving}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  'Save Setting'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Data Management */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Demo Data Management</h3>
          <p className="mt-1 text-sm text-gray-500">
            Remove test/demo data from the production database
          </p>
        </div>
        
        <div className="px-6 py-4">
          <div className="space-y-6">
            {/* Demo Jobs Section */}
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900">Demo Jobs</h4>
                <p className="text-sm text-gray-500 mt-1">
                  {loadingDemoInfo ? (
                    <span className="animate-pulse">Loading...</span>
                  ) : (
                    `${demoJobsCount} demo jobs found in database`
                  )}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Jobs marked with isDemo = true will be permanently removed
                </p>
              </div>
              <button
                onClick={removeDemoJobs}
                disabled={removingDemoJobs || demoJobsCount === 0 || loadingDemoInfo}
                className={`ml-4 inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  demoJobsCount > 0 && !loadingDemoInfo
                    ? 'border-red-300 text-red-700 bg-red-50 hover:bg-red-100 focus:ring-red-500'
                    : 'border-gray-300 text-gray-400 bg-gray-50 cursor-not-allowed'
                }`}
              >
                {removingDemoJobs ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                    Removing...
                  </>
                ) : (
                  `Remove ${demoJobsCount} Demo Jobs`
                )}
              </button>
            </div>

            {/* Demo Users Section */}
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900">Demo Users</h4>
                <p className="text-sm text-gray-500 mt-1">
                  {loadingDemoInfo ? (
                    <span className="animate-pulse">Loading...</span>
                  ) : (
                    `${demoUsersCount} demo users found in database`
                  )}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Users marked with isDemo = true and all their associated data will be permanently removed
                </p>
              </div>
              <button
                onClick={removeDemoUsers}
                disabled={removingDemoUsers || demoUsersCount === 0 || loadingDemoInfo}
                className={`ml-4 inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  demoUsersCount > 0 && !loadingDemoInfo
                    ? 'border-red-300 text-red-700 bg-red-50 hover:bg-red-100 focus:ring-red-500'
                    : 'border-gray-300 text-gray-400 bg-gray-50 cursor-not-allowed'
                }`}
              >
                {removingDemoUsers ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                    Removing...
                  </>
                ) : (
                  `Remove ${demoUsersCount} Demo Users`
                )}
              </button>
            </div>

            {/* Warning Notice */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Warning: Irreversible Action
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      Removing demo data is permanent and cannot be undone. Make sure you want to delete this data before proceeding.
                      Demo users removal will also cascade delete all associated jobs, profiles, applications, and other related data.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Current Settings List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Current Settings</h3>
          <p className="mt-1 text-sm text-gray-500">
            All system configuration settings and their current values
          </p>
        </div>
        
        <div className="px-6 py-4">
          {settings.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              No settings configured yet
            </p>
          ) : (
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Setting
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Value
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Updated
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Updated By
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {settings.map((setting) => (
                    <tr key={setting.id}>
                      <td className="px-3 py-2 text-sm">
                        <div>
                          <p className="font-medium text-gray-900">{setting.settingKey}</p>
                          {setting.description && (
                            <p className="text-gray-500 text-xs">{setting.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {setting.settingValue}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-500">
                        <div className="flex items-center">
                          <ClockIcon className="h-4 w-4 mr-1" />
                          {new Date(setting.updatedAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-500">
                        {setting.admin.firstName} {setting.admin.lastName}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 