"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useProfile } from "@/providers/profile-provider";
import { UserRole } from "@/types";

export function Navbar() {
  const { data: session } = useSession();
  const { profile } = useProfile();
  const imageUrl = profile?.user?.image || null;

  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold text-blue-600">
                Bell Registry
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/dashboard"
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900"
              >
                Dashboard
              </Link>
              <Link
                href="/jobs"
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900"
              >
                Jobs
              </Link>
              {session?.user?.role === UserRole.EMPLOYER && (
                <Link
                  href="/post-job"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900"
                >
                  Post a Job
                </Link>
              )}
            </div>
          </div>
          
          {session ? (
            <div className="flex items-center space-x-4">
              <div className="flex items-center gap-3">
                <div className="relative w-8 h-8">
                  {imageUrl ? (
                    <div className="w-full h-full rounded-full overflow-hidden bg-gray-100">
                      <Image
                        src={imageUrl}
                        alt="Profile"
                        width={32}
                        height={32}
                        className="h-full w-full object-cover"
                        priority
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        aria-hidden="true"
                        className="h-8 w-8 text-gray-300"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                        />
                      </svg>
                    </div>
                  )}
                </div>
                <Link href="/dashboard/profile">
                  <button className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                    Profile
                  </button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <button className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                  Sign in
                </button>
              </Link>
              <Link href="/register">
                <button className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                  Sign up
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
} 