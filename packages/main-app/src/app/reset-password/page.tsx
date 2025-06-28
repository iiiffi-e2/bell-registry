import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = {
  title: "Reset Password - The Bell Registry",
  description: "Set your new Bell Registry account password",
};

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  if (!searchParams.token) {
    return (
      <div className="min-h-screen bg-[#FFFFF0] p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl border-[6px] border-[#d9d9d9] p-8 text-center">
            <h1 className="text-2xl font-bold text-red-600">Invalid or expired reset link</h1>
            <p className="mt-4 text-gray-600">
              The password reset link is invalid or has expired. Please request a new password reset link.
            </p>
            <Link
              href="/forgot-password"
              className="mt-6 inline-block text-blue-600 hover:text-blue-500"
            >
              Request new reset link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFFF0] p-4 md:p-8">
      {/* Logo above container */}
      <div className="max-w-7xl mx-auto mb-8">
        <Link href="/" className="block max-w-[175px]">
          <Image
            src="/images/brand/logo-full.png"
            alt="The Bell Registry"
            width={175}
            height={47}
            priority
            className="h-auto w-full"
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
                    Reset Password
                  </h1>
                  <p className="mt-4 text-base text-gray-600">
                    Enter your new password below.
                  </p>
                </div>
                <ResetPasswordForm token={searchParams.token} />
              </div>
            </div>

            <div className="mt-8 text-center text-sm text-gray-500">
              <div className="flex items-center justify-center space-x-1">
                <span>★★★★★</span>
                <span>4.7/5 based on 2,000+ reviews</span>
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