"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestSuspensionPage() {
  const [testResult, setTestResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

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
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Test Suspension Appeal System
          </h1>
          <p className="text-lg text-gray-600">
            This page allows you to test the suspension appeal functionality
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Test Appeal Submission</CardTitle>
            <CardDescription>
              Click the button below to test the appeal email functionality
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={testAppealSubmission}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Testing...' : 'Test Appeal Submission'}
            </Button>

            {testResult && (
              <div className="mt-6 p-4 bg-gray-50 rounded-md">
                <h3 className="font-medium text-gray-900 mb-2">Test Result:</h3>
                <pre className="text-sm text-gray-600 whitespace-pre-wrap">
                  {JSON.stringify(testResult, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Test Links</CardTitle>
            <CardDescription>
              Use these links to test different scenarios
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <a
              href="/account-suspended"
              className="block w-full text-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
            >
              View Suspension Page
            </a>
            <p className="text-xs text-gray-500 text-center">
              Note: You need to be suspended to see the full page
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 