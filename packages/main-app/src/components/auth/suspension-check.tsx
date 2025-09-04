'use client';


import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ExclamationTriangleIcon, XMarkIcon, EnvelopeIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

interface SuspensionCheckProps {
  children: React.ReactNode;
  mode?: 'banner' | 'modal'; // banner shows dismissible warning, modal shows prominent overlay
}

interface SuspensionData {
  isSuspended: boolean;
  isBanned: boolean;
  suspensionReason?: string;
  suspensionNote?: string;
  suspendedAt?: string;
  suspendedBy?: string;
}

export default function SuspensionCheck({ children, mode = 'modal' }: SuspensionCheckProps) {
  
  const { data: session, status } = useSession();
  const router = useRouter();
  const [suspensionChecked, setSuspensionChecked] = useState(false);
  const [suspensionData, setSuspensionData] = useState<SuspensionData>({
    isSuspended: false,
    isBanned: false
  });
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [modalDismissed, setModalDismissed] = useState(false);


  useEffect(() => {
    const checkSuspensionStatus = async () => {
      if (status === 'loading' || !session?.user?.id) {
        return;
      }


      try {
        // Check user suspension/ban status from the API
        const response = await fetch('/api/auth/suspension-status');
        
        if (response.ok) {
          const data = await response.json();
          setSuspensionData(data);
          
          // Banned users should have been blocked at login, but double-check
          if (data.isBanned) {
            window.location.href = '/login?error=banned';
            return;
          }
          
          if (data.isSuspended) {
          } else {
          }
        } else {
          const errorText = await response.text();
          console.error('Error checking suspension status:', response.status, errorText);
        }
      } catch (error) {
        console.error('Error checking suspension status:', error);
      } finally {
        setSuspensionChecked(true);
      }
    };

    checkSuspensionStatus();
  }, [session, status, router]);

  // Show loading while checking suspension status
  if (!suspensionChecked && status !== 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }


  // If user is suspended, show appropriate UI based on mode
  if (suspensionData.isSuspended && !modalDismissed) {
    if (mode === 'modal') {
      return (
        <>
          {/* Suspension Modal Overlay */}
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900">
                    Account Suspended
                  </h3>
                </div>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-700 mb-3">
                  Your account has been temporarily suspended. You can still view your profile and appeal this decision.
                </p>
                
                {suspensionData.suspensionReason && (
                  <div className="bg-orange-50 border border-orange-200 rounded-md p-3 mb-3">
                    <h4 className="text-sm font-medium text-orange-800 mb-1">Reason:</h4>
                    <p className="text-sm text-orange-700">{suspensionData.suspensionReason}</p>
                  </div>
                )}
                
                {suspensionData.suspensionNote && (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-3">
                    <h4 className="text-sm font-medium text-blue-800 mb-1">Admin Note:</h4>
                    <p className="text-sm text-blue-700">{suspensionData.suspensionNote}</p>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href="/account-suspended"
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
                >
                  <DocumentTextIcon className="h-4 w-4 mr-2" />
                  Learn More
                </a>
                <a
                  href={`mailto:support@bellregistry.com?subject=Account Suspension Appeal - ${session?.user?.email}`}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <EnvelopeIcon className="h-4 w-4 mr-2" />
                  Appeal
                </a>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setModalDismissed(true)}
                  className="w-full text-center text-sm text-gray-500 hover:text-gray-700"
                >
                  Continue to Dashboard (Limited Access)
                </button>
              </div>
            </div>
          </div>
          
          {/* Render children behind modal */}
          <div className="blur-sm pointer-events-none">
            {children}
          </div>
        </>
      );
    }
  }

  // If in banner mode and user is suspended, show banner
  if (mode === 'banner' && suspensionData.isSuspended && !bannerDismissed) {
    return (
      <>
        <div className="bg-orange-50 border-l-4 border-orange-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-5 w-5 text-orange-400" aria-hidden="true" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm text-orange-700">
                <strong>Account Suspended:</strong> Your account has been temporarily suspended. 
                {suspensionData.suspensionReason && ` Reason: ${suspensionData.suspensionReason}`}
                {' '}
                <a 
                  href="/account-suspended" 
                  className="font-medium underline text-orange-700 hover:text-orange-600"
                >
                  Learn more & appeal
                </a>
              </p>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  type="button"
                  onClick={() => setBannerDismissed(true)}
                  className="inline-flex rounded-md bg-orange-50 p-1.5 text-orange-500 hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-orange-600 focus:ring-offset-2 focus:ring-offset-orange-50"
                >
                  <span className="sr-only">Dismiss</span>
                  <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>
        {children}
      </>
    );
  }

  // For non-suspended users or when modal/banner is dismissed, show children normally
  return <>{children}</>;
}

// Hook to check suspension status in components
export function useSuspensionStatus() {
  const { data: session } = useSession();
  const [suspensionData, setSuspensionData] = useState<SuspensionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      if (!session?.user?.id) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/auth/suspension-status');
        if (response.ok) {
          const data = await response.json();
          setSuspensionData(data);
        }
      } catch (error) {
        console.error('Error checking suspension status:', error);
        setSuspensionData({ isSuspended: false, isBanned: false });
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
  }, [session]);

  return { suspensionData, loading };
} 