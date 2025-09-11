"use client";

import Link from "next/link";
import { LoginFormWith2FA } from "@/components/auth/login-form-with-2fa";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Wait for session to fully load before making any redirect decisions
    if (status === "loading") return;
    
    // If user is already authenticated, redirect to dashboard
    if (status === "authenticated" && session?.user?.role) {
      router.push("/dashboard");
    }
  }, [session, status, router]);

  // Show loading state while checking session
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If user is authenticated, show loading while redirecting
  if (status === "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFFF0] p-4 md:p-8">
      {/* Logo above container */}
      <div className="max-w-7xl mx-auto mb-8">
        <Link href="/" className="block max-w-[175px]">
          <Image
            src="/images/brand/logo-full-dark.png"
            alt="Bell Registry"
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
                    Welcome back
                  </h1>
                  <p className="mt-4 text-base text-gray-600">
                    Please sign in to continue.
                  </p>
                </div>
                <LoginFormWith2FA />
              </div>
            </div>

            {/* <div className="mt-8 text-center text-sm text-gray-500">
              <div className="flex items-center justify-center space-x-1">
                <span>★★★★★</span>
                <span>4.8/5 based on 2,000+ reviews</span>
              </div>
            </div> */}
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