/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

"use client";

import { useState } from 'react';

export default function TestNotificationsPage() {
  const [testResult, setTestResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state for custom testing
  const [testData, setTestData] = useState({
    userEmail: 'test@example.com',
    userName: 'Test User',
    userRole: 'PROFESSIONAL',
    suspensionReason: 'Test suspension for email verification',
    suspensionNote: 'This is a test suspension to verify email functionality'
  });

  const testNotificationEmail = async (type: 'suspension' | 'ban' | 'unsuspension', customData?: any) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/test-suspension-notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          ...testData,
          ...customData
        }),
      });

      const result = await response.json();
      setTestResult(result);
    } catch (error) {
      console.error('Test failed:', error);
      setTestResult({ error: 'Test failed', details: error });
    } finally {
      setIsLoading(false);
    }
  };

  const testAppealSubmission = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/test-suspension-appeal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: 'mistake',
          details: 'This is a test appeal to verify the email functionality works correctly.',
        }),
      });

      const result = await response.json();
      setTestResult(result);
    } catch (error) {
      console.error('Test failed:', error);
      setTestResult({ error: 'Test failed', details: error });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Test Notification System
          </h1>
          <p className="text-lg text-gray-600">
            Admin testing interface for suspension and ban email notifications
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Quick Tests */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Test Emails</h3>
            <p className="text-sm text-gray-600 mb-4">Test notification emails with default data</p>
            <div className="space-y-3">
              <button
                onClick={() => testNotificationEmail('suspension')}
                disabled={isLoading}
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                {isLoading ? 'Sending...' : 'Test Suspension Email'}
              </button>
              <button
                onClick={() => testNotificationEmail('ban')}
                disabled={isLoading}
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                {isLoading ? 'Sending...' : 'Test Ban Email'}
              </button>
              <button
                onClick={() => testNotificationEmail('unsuspension')}
                disabled={isLoading}
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                {isLoading ? 'Sending...' : 'Test Unsuspension Email'}
              </button>
            </div>
          </div>

          {/* Custom Test Data */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Custom Test Data</h3>
            <p className="text-sm text-gray-600 mb-4">Customize the test data for email notifications</p>
            <div className="space-y-4">
              <div>
                <label htmlFor="userEmail" className="block text-sm font-medium text-gray-700">
                  User Email
                </label>
                <input
                  id="userEmail"
                  type="email"
                  value={testData.userEmail}
                  onChange={(e) => setTestData({ ...testData, userEmail: e.target.value })}
                  placeholder="test@example.com"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="userName" className="block text-sm font-medium text-gray-700">
                  User Name
                </label>
                <input
                  id="userName"
                  value={testData.userName}
                  onChange={(e) => setTestData({ ...testData, userName: e.target.value })}
                  placeholder="Test User"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="userRole" className="block text-sm font-medium text-gray-700">
                  User Role
                </label>
                <select 
                  id="userRole"
                  value={testData.userRole} 
                  onChange={(e) => setTestData({ ...testData, userRole: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="PROFESSIONAL">Professional</option>
                  <option value="EMPLOYER">Employer</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              <div>
                <label htmlFor="suspensionReason" className="block text-sm font-medium text-gray-700">
                  Suspension Reason
                </label>
                <input
                  id="suspensionReason"
                  value={testData.suspensionReason}
                  onChange={(e) => setTestData({ ...testData, suspensionReason: e.target.value })}
                  placeholder="Reason for suspension..."
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="suspensionNote" className="block text-sm font-medium text-gray-700">
                  Admin Note
                </label>
                <textarea
                  id="suspensionNote"
                  value={testData.suspensionNote}
                  onChange={(e) => setTestData({ ...testData, suspensionNote: e.target.value })}
                  placeholder="Additional notes from admin..."
                  rows={3}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <button
                onClick={() => testNotificationEmail('suspension', testData)}
                disabled={isLoading}
                className="w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                Send Custom Suspension Email
              </button>
            </div>
          </div>
        </div>

        {/* Appeal System Test */}
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Test Appeal System</h3>
          <p className="text-sm text-gray-600 mb-4">Test the suspension appeal submission functionality</p>
          <button
            onClick={testAppealSubmission}
            disabled={isLoading}
            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            {isLoading ? 'Testing...' : 'Test Appeal Submission'}
          </button>
        </div>

        {/* Admin Links */}
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Admin Tools</h3>
          <p className="text-sm text-gray-600 mb-4">Access admin functionality and related pages</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <a
              href="/profiles"
              className="block w-full text-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Manage User Profiles
            </a>
            <a
              href="/dashboard"
              className="block w-full text-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Admin Dashboard
            </a>
          </div>
          <p className="text-xs text-gray-500 text-center mt-2">
            Use these links to access the actual admin functionality
          </p>
        </div>

        {/* Test Results */}
        {testResult && (
          <div className="bg-white rounded-lg shadow p-6 mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Test Results</h3>
            <p className="text-sm text-gray-600 mb-4">Output from the last test operation</p>
            <div className="bg-gray-50 rounded-md p-4">
              <pre className="text-sm text-gray-600 whitespace-pre-wrap overflow-auto max-h-96">
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </div>
            <button
              onClick={() => setTestResult(null)}
              className="mt-3 px-3 py-1 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50"
            >
              Clear Results
            </button>
          </div>
        )}

        {/* Development Info */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-medium text-yellow-800 mb-4">Development Mode</h3>
          <p className="text-sm text-yellow-700 mb-4">This testing interface is only available in development</p>
          <div className="text-sm text-yellow-800 space-y-1">
            <p>• Test emails are sent to safe development addresses</p>
            <p>• In production, emails would go to real user addresses</p>
            <p>• All email operations are logged for debugging</p>
            <p>• Check the browser console and server logs for detailed information</p>
          </div>
        </div>
      </div>
    </div>
  );
} 