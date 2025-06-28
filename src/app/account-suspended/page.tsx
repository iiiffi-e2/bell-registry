'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ExclamationTriangleIcon, EnvelopeIcon, DocumentTextIcon, UserIcon } from '@heroicons/react/24/outline';

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
  };
}

export default function AccountSuspendedPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [suspensionData, setSuspensionData] = useState<SuspensionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If user is not authenticated, redirect to login
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    // Fetch suspension details
    const fetchSuspensionData = async () => {
      try {
        const response = await fetch('/api/auth/suspension-status');
        if (response.ok) {
          const data = await response.json();
          setSuspensionData(data);
          
          // If user is not actually suspended, redirect to dashboard
          if (!data.isSuspended && !data.isBanned) {
            router.push('/dashboard');
          }
        }
      } catch (error) {
        console.error('Error fetching suspension data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchSuspensionData();
    }
  }, [status, router]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (!suspensionData || (!suspensionData.isSuspended && !suspensionData.isBanned)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  const isBanned = suspensionData.isBanned;
  const title = isBanned ? "Account Banned" : "Account Suspended";
  const description = isBanned 
    ? "Your Bell Registry account has been permanently banned"
    : "Your Bell Registry account has been temporarily suspended";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${isBanned ? 'bg-red-100' : 'bg-orange-100'}`}>
              <ExclamationTriangleIcon className={`h-6 w-6 ${isBanned ? 'text-red-600' : 'text-orange-600'}`} aria-hidden="true" />
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              {title}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {description}
            </p>
          </div>

          <div className="mt-8">
            {/* Suspension/Ban Details */}
            {(suspensionData.suspensionReason || suspensionData.suspensionNote) && (
              <div className="mb-6 space-y-4">
                {suspensionData.suspensionReason && (
                  <div className={`border rounded-md p-4 ${isBanned ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'}`}>
                    <h4 className={`text-sm font-medium ${isBanned ? 'text-red-800' : 'text-orange-800'} mb-2`}>
                      Reason:
                    </h4>
                    <p className={`text-sm ${isBanned ? 'text-red-700' : 'text-orange-700'}`}>
                      {suspensionData.suspensionReason}
                    </p>
                  </div>
                )}
                
                {suspensionData.suspensionNote && (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <h4 className="text-sm font-medium text-blue-800 mb-2">
                      Admin Note:
                    </h4>
                    <p className="text-sm text-blue-700">
                      {suspensionData.suspensionNote}
                    </p>
                  </div>
                )}

                {suspensionData.suspendedByAdmin && (
                  <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                    <div className="flex items-center text-xs text-gray-600">
                      <UserIcon className="h-4 w-4 mr-1" />
                      Actioned by: {suspensionData.suspendedByAdmin.name}
                      {suspensionData.suspendedAt && (
                        <span className="ml-2">
                          on {new Date(suspensionData.suspendedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className={`border rounded-md p-4 ${isBanned ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'}`}>
              <div className="flex">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className={`h-5 w-5 ${isBanned ? 'text-red-400' : 'text-orange-400'}`} aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <h3 className={`text-sm font-medium ${isBanned ? 'text-red-800' : 'text-orange-800'}`}>
                    What this means:
                  </h3>
                  <div className={`mt-2 text-sm ${isBanned ? 'text-red-700' : 'text-orange-700'}`}>
                    <ul className="list-disc list-inside space-y-1">
                      {isBanned ? (
                        <>
                          <li>Your account is permanently disabled</li>
                          <li>You cannot access any platform features</li>
                          <li>Your profile is permanently hidden</li>
                          <li>This action is typically final</li>
                        </>
                      ) : (
                        <>
                          <li>Your profile is temporarily hidden from search results</li>
                          <li>You have limited access to platform features</li>
                          <li>You can still view your profile and appeal this decision</li>
                          <li>This action can be reversed upon review</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Next Steps</h3>
              
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <h4 className="font-medium text-blue-900">1. Contact Support</h4>
                  <p className="text-sm text-blue-800 mt-1">
                    {isBanned 
                      ? "If you believe this ban was issued in error, contact our support team to appeal."
                      : "Reach out to our support team to understand the suspension and discuss resolution."
                    }
                  </p>
                  <div className="mt-3 flex space-x-4">
                    <a
                      href={`mailto:support@thebellregistry.com?subject=${isBanned ? 'Account Ban' : 'Account Suspension'} Appeal - ${session?.user?.email}`}
                      className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500"
                    >
                      <EnvelopeIcon className="h-4 w-4 mr-1" />
                      support@thebellregistry.com
                    </a>
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                  <h4 className="font-medium text-gray-900">2. Review Our Policies</h4>
                  <p className="text-sm text-gray-700 mt-1">
                    Familiarize yourself with our community guidelines and terms of service.
                  </p>
                  <div className="mt-3 space-x-4">
                    <a
                      href="/terms"
                      className="text-sm text-gray-600 hover:text-gray-500 underline"
                    >
                      Terms of Service
                    </a>
                    <a
                      href="/privacy"
                      className="text-sm text-gray-600 hover:text-gray-500 underline"
                    >
                      Privacy Policy
                    </a>
                  </div>
                </div>

                {!isBanned && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-4">
                    <h4 className="font-medium text-green-900">3. Account Restoration</h4>
                    <p className="text-sm text-green-800 mt-1">
                      Once the issue is resolved, your account will be restored and you'll receive an email confirmation.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 border-t border-gray-200 pt-6">
              <div className="text-center space-y-3">
                <button
                  onClick={() => window.location.href = `mailto:support@thebellregistry.com?subject=${isBanned ? 'Account Ban' : 'Account Suspension'} Appeal`}
                  className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    isBanned 
                      ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' 
                      : 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500'
                  }`}
                >
                  Contact Support Team
                </button>
                
                {!isBanned && (
                  <a
                    href="/dashboard"
                    className="block w-full text-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Return to Dashboard (Limited Access)
                  </a>
                )}
                
                <p className="text-xs text-gray-500">
                  Response time: We typically respond within 24 hours
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 