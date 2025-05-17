import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Register - Bell Registry",
  description: "Create your Bell Registry account",
};

export default function RegisterPage() {
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
                    Sign up for BellRegistry —
                    <br />
                    <span className="text-gray-500">free forever</span>
                  </h1>
                  <p className="mt-4 text-base text-gray-600">
                    Find, connect, and secure your ideal position in luxury private service. Join the premier platform for estate professionals.
                  </p>
                </div>
                <RegisterForm />
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