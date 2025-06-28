"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { DeleteAccountModal } from "@/components/modals/DeleteAccountModal";
import { TwoFactorSetup } from "@/components/auth/two-factor-setup";
import { TrustedDevicesManager } from "@/components/auth/trusted-devices-manager";

interface ChangePasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface ChangeEmailForm {
  newEmail: string;
}

export default function SettingsPage() {
  const { data: session, update: updateSession, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [emailForm, setEmailForm] = useState<ChangeEmailForm>({ newEmail: "" });
  const [passwordForm, setPasswordForm] = useState<ChangePasswordForm>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [emailMessage, setEmailMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState<boolean>(false);
  const [twoFactorPhone, setTwoFactorPhone] = useState<string>("");
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const [twoFactorMessage, setTwoFactorMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Force session refresh when component mounts if email was just verified
  useEffect(() => {
    const forceSessionRefresh = async () => {
      const emailVerified = searchParams.get('emailVerified') === 'true';
      
      if (emailVerified && !isUpdating) {
        setIsUpdating(true);
        console.log('[SETTINGS] Email verification detected, forcing session refresh');
        
        try {
          setEmailMessage({ 
            type: "info", 
            text: "Email updated successfully. Refreshing your session..." 
          });

          // Update the session
          await updateSession();
          
          // Remove query parameters without causing a refresh
          window.history.replaceState({}, '', window.location.pathname);
          
          setEmailMessage({ 
            type: "success", 
            text: "Your email has been successfully updated!" 
          });

        } catch (error) {
          console.error('[SETTINGS] Error updating session:', error);
          setEmailMessage({ 
            type: "error", 
            text: "Your email was updated but there was an issue refreshing the session. Please refresh the page manually." 
          });
        } finally {
          setIsUpdating(false);
        }
      }
    };

    forceSessionRefresh();
  }, [searchParams, updateSession, isUpdating]);

  // Monitor session changes and update UI accordingly
  useEffect(() => {
    if (session?.user?.email) {
      console.log('[SETTINGS] Session updated with email:', session.user.email);
      setEmailForm({ newEmail: "" }); // Reset form when session changes
    }
  }, [session?.user?.email]);

  // Monitor session changes
  useEffect(() => {
    console.log('[SETTINGS] Session updated:', {
      email: session?.user?.email,
      status
    });
  }, [session, status]);

  // Fetch 2FA status
  useEffect(() => {
    const fetchTwoFactorStatus = async () => {
      if (session?.user?.id) {
        try {
          const response = await fetch('/api/auth/2fa/status');
          if (response.ok) {
            const data = await response.json();
            setTwoFactorEnabled(data.enabled);
            setTwoFactorPhone(data.phone || "");
          }
        } catch (error) {
          console.error('Failed to fetch 2FA status:', error);
        }
      }
    };

    fetchTwoFactorStatus();
  }, [session?.user?.id]);

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailMessage(null);

    try {
      const response = await fetch("/api/settings/email", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailForm.newEmail }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      setEmailMessage({ 
        type: "info", 
        text: "A verification email has been sent to your new email address. Please check your inbox and click the verification link to complete the change." 
      });
      setEmailForm({ newEmail: "" });
    } catch (error) {
      setEmailMessage({ 
        type: "error", 
        text: error instanceof Error ? error.message : "Failed to update email" 
      });
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage({ type: "error", text: "New passwords do not match" });
      return;
    }

    try {
      const response = await fetch("/api/settings/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      setPasswordMessage({ type: "success", text: "Password updated successfully" });
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      setPasswordMessage({ 
        type: "error", 
        text: error instanceof Error ? error.message : "Failed to update password" 
      });
    }
  };

  const handleDisableTwoFactor = async () => {
    if (!confirm("Are you sure you want to disable two-factor authentication? This will make your account less secure.")) {
      return;
    }

    setTwoFactorMessage(null);

    try {
      const response = await fetch("/api/auth/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      setTwoFactorEnabled(false);
      setTwoFactorPhone("");
      setTwoFactorMessage({ 
        type: "success", 
        text: "Two-factor authentication has been disabled" 
      });
    } catch (error) {
      setTwoFactorMessage({ 
        type: "error", 
        text: error instanceof Error ? error.message : "Failed to disable two-factor authentication" 
      });
    }
  };

  const handleTwoFactorSetupComplete = () => {
    setShowTwoFactorSetup(false);
    setTwoFactorEnabled(true);
    setTwoFactorMessage({ 
      type: "success", 
      text: "Two-factor authentication has been enabled successfully!" 
    });
    // Refresh 2FA status
    fetch('/api/auth/2fa/status')
      .then(res => res.json())
      .then(data => {
        setTwoFactorPhone(data.phone || "");
      })
      .catch(console.error);
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Account Settings</h1>

        {/* Change Email Section */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Change Email Address</h2>
            <form onSubmit={handleEmailChange} className="space-y-4">
              <div>
                <label htmlFor="current-email" className="block text-sm font-medium text-gray-700">
                  Current Email
                </label>
                <div className="mt-1">
                  <input
                    type="email"
                    id="current-email"
                    value={session?.user?.email || ""}
                    disabled
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 sm:text-sm"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="new-email" className="block text-sm font-medium text-gray-700">
                  New Email
                </label>
                <div className="mt-1">
                  <input
                    type="email"
                    id="new-email"
                    value={emailForm.newEmail}
                    onChange={(e) => setEmailForm({ newEmail: e.target.value })}
                    required
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>
              {emailMessage && (
                <div 
                  className={`mt-2 text-sm ${
                    emailMessage.type === "success" 
                      ? "text-green-600" 
                      : emailMessage.type === "error"
                      ? "text-red-600"
                      : "text-blue-600"
                  }`}
                >
                  {emailMessage.text}
                </div>
              )}
              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Send Verification Email
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Change Password Section */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Change Password</h2>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label htmlFor="current-password" className="block text-sm font-medium text-gray-700">
                  Current Password
                </label>
                <div className="mt-1">
                  <input
                    type="password"
                    id="current-password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    required
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">
                  New Password
                </label>
                <div className="mt-1">
                  <input
                    type="password"
                    id="new-password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    required
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                  Confirm New Password
                </label>
                <div className="mt-1">
                  <input
                    type="password"
                    id="confirm-password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    required
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>
              {passwordMessage && (
                <div className={`mt-2 text-sm ${passwordMessage.type === "success" ? "text-green-600" : "text-red-600"}`}>
                  {passwordMessage.text}
                </div>
              )}
              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Two-Factor Authentication Section */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Two-Factor Authentication</h2>
            
            {!showTwoFactorSetup && (
              <>
                <div className="mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">
                        Add an extra layer of security to your account with SMS verification.
                      </p>
                      {twoFactorEnabled && twoFactorPhone && (
                        <p className="text-sm text-green-600">
                          ✓ Enabled for {twoFactorPhone}
                        </p>
                      )}
                      {!twoFactorEnabled && (
                        <p className="text-sm text-gray-500">
                          Not enabled
                        </p>
                      )}
                    </div>
                    <div className="ml-4">
                      {twoFactorEnabled ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Enabled
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Disabled
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {twoFactorMessage && (
                  <div className={`mb-4 text-sm ${twoFactorMessage.type === "success" ? "text-green-600" : "text-red-600"}`}>
                    {twoFactorMessage.text}
                  </div>
                )}

                <div className="flex gap-3">
                  {!twoFactorEnabled ? (
                    <button
                      onClick={() => setShowTwoFactorSetup(true)}
                      className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Enable Two-Factor Authentication
                    </button>
                  ) : (
                    <button
                      onClick={handleDisableTwoFactor}
                      className="flex-1 flex justify-center py-2 px-4 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      Disable Two-Factor Authentication
                    </button>
                  )}
                </div>
              </>
            )}

            {showTwoFactorSetup && (
              <div>
                <TwoFactorSetup onComplete={handleTwoFactorSetupComplete} />
                <div className="mt-4">
                  <button
                    onClick={() => setShowTwoFactorSetup(false)}
                    className="text-sm text-gray-600 hover:text-gray-500"
                  >
                    Cancel Setup
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Trusted Devices Section */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Trusted Devices</h2>
            <TrustedDevicesManager />
          </div>
        </div>

        {/* Delete Account Section */}
        <div className="bg-white shadow rounded-lg mb-6 border-red-200">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-red-900 mb-4">Delete Account</h2>
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Permanently delete your account
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>
                      Once you delete your account, there is no going back. Please be certain.
                      All of your data will be permanently removed from our servers after 30 days.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="w-full flex justify-center py-2 px-4 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Delete My Account
            </button>
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      <DeleteAccountModal 
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
      />
    </div>
  );
} 