"use client";

import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { RegisterForm } from "@/components/auth/register-form";
import { RoleSelection } from "@/components/auth/role-selection";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function RegisterPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const userRole = searchParams?.get("role")?.toUpperCase();
  const isEmployerRoute = userRole === "EMPLOYER";
  const isAgencyRoute = userRole === "AGENCY";
  const isProfessionalRoute = userRole === "PROFESSIONAL";
  const isEmployerOrAgency = isEmployerRoute || isAgencyRoute;
  
  // If no role parameter is provided, show role selection
  const hasRoleParam = userRole && (isEmployerRoute || isAgencyRoute || isProfessionalRoute);
  
  // Determine which hero image to use
  const heroImage = isEmployerOrAgency ? "/images/register-hero-employer.jpg" : "/images/register-hero.png";
  const heroAlt = isEmployerOrAgency ? "Luxury estate employer" : "Luxury estate professional";

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
                    {isEmployerOrAgency ? (
                      <>
                        Bell Registry —
                        <br />
                        <span className="text-gray-500">free to get started</span>
                      </>
                    ) : (
                      <>
                        Sign up for Bell Registry —
                        <br />
                        <span className="text-gray-500">free forever</span>
                      </>
                    )}
                  </h1>
                  <p className="mt-4 text-base text-gray-600">
                    {isEmployerOrAgency 
                      ? "Find, connect with, and hire top-tier estate professionals. Join the premier platform trusted by discerning employers in luxury private service."
                      : "Find, connect, and secure your ideal position in luxury private service. Join the premier platform for estate professionals."
                    }
                  </p>
                </div>
                {hasRoleParam ? <RegisterForm /> : <RoleSelection />}
              </div>
            </div>

            {/* <div className="mt-8 text-center text-sm text-gray-500">
              <div className="flex items-center justify-center space-x-1">
                <span>★★★★★</span>
                <span>4.7/5 based on 2,000+ reviews</span>
              </div>
            </div> */}
          </div>

          {/* Right side - Image */}
          <div className="hidden lg:block relative w-0 flex-1">
            <div className="absolute inset-0">
              <Image
                src={heroImage}
                alt={heroAlt}
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