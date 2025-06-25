"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const phoneSchema = z.object({
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits")
    .regex(/^[\+]?[1-9][\d]{0,15}$/, "Invalid phone number format"),
});

const codeSchema = z.object({
  code: z.string().length(6, "Code must be 6 digits"),
});

type PhoneFormData = z.infer<typeof phoneSchema>;
type CodeFormData = z.infer<typeof codeSchema>;

interface TwoFactorSetupProps {
  onComplete?: () => void;
  className?: string;
}

export function TwoFactorSetup({ onComplete, className = "" }: TwoFactorSetupProps) {
  const [step, setStep] = useState<'setup' | 'verify' | 'complete'>('setup');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const phoneForm = useForm<PhoneFormData>({
    resolver: zodResolver(phoneSchema),
  });

  const codeForm = useForm<CodeFormData>({
    resolver: zodResolver(codeSchema),
  });

  const onSetupSubmit = async (data: PhoneFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/auth/2fa/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: data.phoneNumber }),
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error || 'Failed to send verification code');
        return;
      }

      setPhoneNumber(data.phoneNumber);
      setStep('verify');
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const onVerifySubmit = async (data: CodeFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/auth/2fa/verify-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: data.code,
          phoneNumber,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error || 'Invalid verification code');
        return;
      }

      setBackupCodes(result.backupCodes);
      setStep('complete');
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadBackupCodes = () => {
    const content = `Bell Registry - Two-Factor Authentication Backup Codes\n\nGenerated: ${new Date().toLocaleString()}\n\nBackup Codes (use these if you lose access to your phone):\n${backupCodes.map((code, i) => `${i + 1}. ${code}`).join('\n')}\n\n⚠️  Important: Store these codes in a safe place. Each code can only be used once.`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bell-registry-backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (step === 'complete') {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="bg-green-50 p-4 rounded-md border border-green-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                Two-Factor Authentication Enabled!
              </h3>
              <p className="text-sm text-green-700 mt-1">
                Your account is now protected with SMS verification.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 p-4 rounded-md border border-amber-200">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-amber-800">
                Save Your Backup Codes
              </h4>
              <p className="text-sm text-amber-700 mt-1 mb-3">
                Store these codes in a safe place. You can use them to access your account if you lose your phone.
              </p>
              <div className="grid grid-cols-2 gap-2 font-mono text-sm mb-4">
                {backupCodes.map((code, index) => (
                  <div key={index} className="bg-white p-2 rounded border text-center">
                    {code}
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={downloadBackupCodes}
                  className="text-sm bg-amber-100 text-amber-800 px-3 py-2 rounded hover:bg-amber-200 transition-colors"
                >
                  Download Codes
                </button>
                {onComplete && (
                  <button
                    onClick={onComplete}
                    className="text-sm bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 transition-colors"
                  >
                    Continue
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'verify') {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">Enter Verification Code</h3>
          <p className="text-sm text-gray-600 mt-1">
            We sent a 6-digit code to {phoneNumber}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 p-4 rounded-md border border-red-200">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={codeForm.handleSubmit(onVerifySubmit)} className="space-y-4">
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700">
              Verification Code
            </label>
            <input
              {...codeForm.register("code")}
              type="text"
              id="code"
              placeholder="Enter 6-digit code"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              maxLength={6}
            />
            {codeForm.formState.errors.code && (
              <p className="mt-1 text-sm text-red-600">
                {codeForm.formState.errors.code.message}
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep('setup')}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Verifying..." : "Verify Code"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div>
        <h3 className="text-lg font-medium text-gray-900">Enable Two-Factor Authentication</h3>
        <p className="text-sm text-gray-600 mt-1">
          Add an extra layer of security to your account with SMS verification.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 p-4 rounded-md border border-red-200">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={phoneForm.handleSubmit(onSetupSubmit)} className="space-y-4">
        <div>
          <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
            Phone Number
          </label>
          <input
            {...phoneForm.register("phoneNumber")}
            type="tel"
            id="phoneNumber"
            placeholder="+1 (555) 123-4567"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
          {phoneForm.formState.errors.phoneNumber && (
            <p className="mt-1 text-sm text-red-600">
              {phoneForm.formState.errors.phoneNumber.message}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Include country code (e.g., +1 for US/Canada)
          </p>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Sending..." : "Send Verification Code"}
        </button>
      </form>
    </div>
  );
} 