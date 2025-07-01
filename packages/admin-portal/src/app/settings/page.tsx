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

  // Redirect if not admin
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      router.push('/login');
      return;
    }
    
    fetchSettings();
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