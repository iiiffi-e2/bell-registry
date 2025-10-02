/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot Password - The Bell Registry",
  description: "Reset your Bell Registry account password",
};

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-[#FFFFF0] p-4 md:p-8">
      {/* Logo above container */}
      <div className="max-w-7xl mx-auto mb-8">
        <Link href="/" className="block max-w-[175px]">
          <Image
            src="/images/brand/logo-full-dark.png"
            alt="The Bell Registry"
            width={175}
            height={47}
            priority
            className="h-auto w-full"
            style={{ maxWidth: '190px' }}
          />
        </Link>
      </div>

      {/* Main container */}
      <div className="max-w-7xl mx-auto bg-white rounded-2xl border-[6px] border-[#d9d9d9] overflow-hidden">
        <div className="flex min-h-[680px]">
          {/* Left side - Form */}
          <div className="flex-1 flex flex-col justify-between p-8 lg:p-12">
            <div className="max-w-md w-full mx-auto">
              <div className="space-y-6">
                <div>
                  <h1 className="text-4xl font-bold tracking-tight text-gray-900">
                    Forgot Password
                  </h1>
                  <p className="mt-4 text-base text-gray-600">
                    Enter your email address and we&apos;ll send you a link to reset your password.
                  </p>
                </div>
                <ForgotPasswordForm />
              </div>
            </div>

          </div>

          {/* Right side - Image */}
          <div className="hidden lg:block relative w-0 flex-1">
            <div className="absolute inset-0">
              <Image
                src="/images/register-hero.png"
                alt="Luxury estate professional"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 