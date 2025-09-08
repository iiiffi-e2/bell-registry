"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { RoleSelectionModal } from "@/components/modals/role-selection-modal";

const features = [
  {
    title: "Verified Employers",
    description:
      "Connect with legitimate employers in the luxury private service industry.",
    icon: ({ className }: { className?: string }) => (
      <svg
        className={className}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        />
      </svg>
    ),
  },
  {
    title: "Smart Matching",
    description:
      "Our intelligent system matches you with the most relevant opportunities.",
    icon: ({ className }: { className?: string }) => (
      <svg
        className={className}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
    ),
  },
  {
    title: "Premium Support",
    description:
      "Dedicated support team to help you navigate your career journey.",
    icon: ({ className }: { className?: string }) => (
      <svg
        className={className}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>
    ),
  },
];

export function HomePageClient() {
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

  const handleGetStartedClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsRoleModalOpen(true);
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <header className="fixed w-full bg-white/80 backdrop-blur-md z-50">
          <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-gray-900">
              <Image
                src="/images/brand/logo-full.png"
                alt="The Bell Registry"
                width={175}
                height={47}
                priority
                className="h-auto w-full"
              />
            </Link>
            <div className="space-x-4">
              <Link
                href="/login"
                className="px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                Sign In
              </Link>
              <button
                onClick={handleGetStartedClick}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Get Started
              </button>
            </div>
          </nav>
        </header>

        <main>
          {/* Hero Section */}
          <section className="pt-32 pb-20 px-4">
            <div className="container mx-auto text-center">
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
                The Premier Platform for
                <br />
                <span className="text-blue-600">Estate Service Professionals</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                Connect with top employers in the luxury private service industry.
                Find your next role or hire exceptional talent.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/register?role=professional"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Join as a Professional
                  <ArrowRightIcon className="w-5 h-5 ml-2" />
                </Link>
                <Link
                  href="/register?role=employer"
                  className="inline-flex items-center px-6 py-3 bg-white text-blue-600 border-2 border-blue-600 rounded-lg hover:bg-blue-50"
                >
                  Hire Talent
                  <ArrowRightIcon className="w-5 h-5 ml-2" />
                </Link>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section className="py-20 bg-gray-50">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold text-center mb-12">
                Why Choose The Bell Registry?
              </h2>
              <div className="grid md:grid-cols-3 gap-8">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
                  >
                    <feature.icon className="w-12 h-12 text-blue-600 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-20">
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-3xl font-bold mb-8">
                Ready to Transform Your Career?
              </h2>
              <button
                onClick={handleGetStartedClick}
                className="inline-flex items-center px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-lg"
              >
                Get Started Today
                <ArrowRightIcon className="w-6 h-6 ml-2" />
              </button>
            </div>
          </section>
        </main>

        <footer className="bg-gray-900 text-white py-16">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-8">
              <div>
                <h3 className="text-xl font-bold mb-4">The Bell Registry</h3>
                <p className="text-gray-400">
                  The premier platform for luxury private service professionals.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-4">For Professionals</h4>
                <ul className="space-y-2">
                  <li>
                    <Link href="/jobs" className="text-gray-400 hover:text-white">
                      Browse Jobs
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/resources"
                      className="text-gray-400 hover:text-white"
                    >
                      Career Resources
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">For Employers</h4>
                <ul className="space-y-2">
                  <li>
                    <Link
                      href="/post-job"
                      className="text-gray-400 hover:text-white"
                    >
                      Post a Job
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/pricing"
                      className="text-gray-400 hover:text-white"
                    >
                      Pricing
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Company</h4>
                <ul className="space-y-2">
                  <li>
                    <Link href="/about" className="text-gray-400 hover:text-white">
                      About Us
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/contact"
                      className="text-gray-400 hover:text-white"
                    >
                      Contact
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
              <p>&copy; {new Date().getFullYear()} The Bell Registry. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>

      <RoleSelectionModal 
        isOpen={isRoleModalOpen} 
        onClose={() => setIsRoleModalOpen(false)} 
      />
    </>
  );
} 