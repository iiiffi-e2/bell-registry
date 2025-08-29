"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import * as z from "zod";
import Link from "next/link";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const twoFactorSchema = z.object({
  code: z.string().min(4, "Code must be at least 4 characters"),
  trustDevice: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;
type TwoFactorData = z.infer<typeof twoFactorSchema>;

type LoginStep = 'credentials' | '2fa' | 'complete';

export function LoginFormWith2FA() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<LoginStep>('credentials');
  const [email, setEmail] = useState('');
  const [maskedPhone, setMaskedPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showBackupCode, setShowBackupCode] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const twoFactorForm = useForm<TwoFactorData>({
    resolver: zodResolver(twoFactorSchema),
    defaultValues: {
      trustDevice: false,
    },
  });

  // Check for email update success message
  useEffect(() => {
    if (searchParams.get('emailUpdated') === 'true') {
      setSuccessMessage('Your email has been updated successfully. Please sign in with your new email address.');
    }
    if (searchParams.get('passwordReset') === 'true') {
      setSuccessMessage('Your password has been reset successfully. Please sign in with your new password.');
    }
  }, [searchParams]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const checkUserHas2FA = async (email: string): Promise<{ has2FA: boolean; phone?: string }> => {
    try {
      const response = await fetch('/api/auth/check-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      if (response.ok) {
        const data = await response.json();
        return { has2FA: data.has2FA, phone: data.phone };
      }
      return { has2FA: false };
    } catch (error) {
      console.error('Error checking 2FA status:', error);
      return { has2FA: false };
    }
  };

  const checkTrustedDevice = async (email: string): Promise<{ isTrusted: boolean; requires2FA: boolean }> => {
    try {
      const response = await fetch('/api/auth/check-trusted-device', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      if (response.ok) {
        const data = await response.json();
        return { isTrusted: data.isTrusted, requires2FA: data.requires2FA };
      }
      return { isTrusted: false, requires2FA: true };
    } catch (error) {
      console.error('Error checking trusted device:', error);
      return { isTrusted: false, requires2FA: true };
    }
  };

  const sendVerificationCode = async (email: string) => {
    try {
      const response = await fetch('/api/auth/2fa/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to send verification code');
      }
      
      setResendCooldown(60); // 60 second cooldown
      return true;
    } catch (error: any) {
      setError(error.message);
      return false;
    }
  };

  const onLoginSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccessMessage(null);

      // First, check if user has 2FA enabled
      const normalizedEmail = data.email.toLowerCase();
      const { has2FA, phone } = await checkUserHas2FA(normalizedEmail);

      if (has2FA) {
        // Check if this device is trusted
        const { isTrusted } = await checkTrustedDevice(normalizedEmail);
        
        // Verify credentials without logging in
        const credentialCheck = await fetch('/api/auth/verify-credentials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: normalizedEmail,
            password: data.password,
          }),
        });

        const credentialResult = await credentialCheck.json();
        if (!credentialResult.success) {
          setError(credentialResult.error || 'Invalid credentials');
          return;
        }

        // If device is trusted, skip 2FA
        if (isTrusted) {
          // Complete login directly
          const result = await signIn("credentials", {
            redirect: false,
            email: normalizedEmail,
            password: data.password,
          });

          if (result?.error) {
            setError(result.error);
            return;
          }

          router.push("/dashboard");
          return;
        }

        // Device not trusted, proceed with 2FA
        const codeSent = await sendVerificationCode(normalizedEmail);
        if (codeSent) {
          setEmail(normalizedEmail);
          setMaskedPhone(phone || '***-***-****');
          setStep('2fa');
        }
      } else {
        // Normal login without 2FA
        const result = await signIn("credentials", {
          redirect: false,
          email: normalizedEmail,
          password: data.password,
        });

        if (result?.error) {
          setError(result.error);
          return;
        }

        router.push("/dashboard");
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const onTwoFactorSubmit = async (data: TwoFactorData) => {
    try {
      setIsLoading(true);
      setError(null);

      // Verify the 2FA code and optionally trust the device
      const response = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          code: data.code,
          trustDevice: data.trustDevice,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error || 'Invalid verification code');
        return;
      }

      // Complete login with 2FA verification
      const signInResult = await signIn('credentials', {
        redirect: false,
        email,
        password: '__2FA_VERIFIED__', // Special flag
      });

      if (signInResult?.ok) {
        if (result.deviceTrusted) {
          setSuccessMessage('Device trusted for 30 days. You won\'t need 2FA on this device.');
        }
        router.push("/dashboard");
      } else {
        setError("Failed to complete login. Please try again.");
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    
    setIsLoading(true);
    await sendVerificationCode(email);
    setIsLoading(false);
  };

  const handleGoogleSignIn = () => {
    setIsLoading(true);
    signIn("google", { callbackUrl: "/dashboard" });
  };

  if (step === '2fa') {
    return (
      <div className="mt-8 space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Two-Factor Authentication</h2>
          <p className="text-sm text-gray-600 mt-1">
            We sent a verification code to your phone ending in {maskedPhone}
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="rounded-md bg-green-50 p-4">
            <p className="text-sm text-green-800">{successMessage}</p>
          </div>
        )}

        <form onSubmit={twoFactorForm.handleSubmit(onTwoFactorSubmit)} className="space-y-4">
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700">
              {showBackupCode ? 'Backup Code' : 'Verification Code'}
            </label>
            <input
              {...twoFactorForm.register("code")}
              type="text"
              id="code"
              placeholder={showBackupCode ? "Enter backup code" : "Enter verification code"}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-center text-lg tracking-widest"
              maxLength={showBackupCode ? 10 : 6}
              autoComplete="one-time-code"
            />
            {twoFactorForm.formState.errors.code && (
              <p className="mt-1 text-sm text-red-600">
                {twoFactorForm.formState.errors.code.message}
              </p>
            )}
          </div>

          {!showBackupCode && (
            <div className="flex items-center">
              <input
                {...twoFactorForm.register("trustDevice")}
                id="trustDevice"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="trustDevice" className="ml-2 block text-sm text-gray-700">
                Trust this device for 30 days
              </label>
            </div>
          )}

          {!showBackupCode && (
            <div className="rounded-md bg-amber-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-amber-700">
                    Only check this on your personal devices. You&apos;ll still need your password to sign in.
                  </p>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isLoading ? "Verifying..." : "Verify Code"}
          </button>
        </form>

        <div className="flex flex-col space-y-2 text-sm text-center">
          {!showBackupCode ? (
            <>
              <button
                type="button"
                onClick={handleResendCode}
                disabled={resendCooldown > 0 || isLoading}
                className="text-blue-600 hover:text-blue-500 disabled:text-gray-400"
              >
                {resendCooldown > 0 
                  ? `Resend code in ${resendCooldown}s` 
                  : "Resend verification code"
                }
              </button>
              <button
                type="button"
                onClick={() => setShowBackupCode(true)}
                className="text-blue-600 hover:text-blue-500"
              >
                Can&apos;t access your phone? Use a backup code
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setShowBackupCode(false)}
              className="text-blue-600 hover:text-blue-500"
            >
              Use SMS verification code instead
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setStep('credentials');
              setError(null);
              twoFactorForm.reset();
            }}
            className="text-gray-600 hover:text-gray-500"
          >
            Back to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-6">
      {successMessage && (
        <div className="rounded-md bg-green-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">{successMessage}</h3>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-md bg-red-50 p-4 mb-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-6">
        <div className="rounded-md shadow-sm -space-y-px">
          <div>
            <label htmlFor="email" className="sr-only">
              Email address
            </label>
            <input
              {...loginForm.register("email")}
              id="email"
              type="email"
              autoComplete="email"
              required
              className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="Email address"
            />
            {loginForm.formState.errors.email && (
              <p className="mt-1 text-sm text-red-600">{loginForm.formState.errors.email.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <input
              {...loginForm.register("password")}
              id="password"
              type="password"
              autoComplete="current-password"
              required
              className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="Password"
            />
            {loginForm.formState.errors.password && (
              <p className="mt-1 text-sm text-red-600">{loginForm.formState.errors.password.message}</p>
            )}
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </button>
        </div>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or continue with</span>
        </div>
      </div>

      <div>
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Sign in with Google
        </button>
      </div>

      <div className="text-center">
        <Link href="/forgot-password" className="text-sm font-medium text-blue-600 hover:text-blue-500">
          Forgot your password?
        </Link>
      </div>

      <div className="text-center">
        <p className="text-sm text-gray-600">
          Not a member yet?{" "}
          <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500">
            Create your account
          </Link>
        </p>
      </div>
    </div>
  );
} 