"use client";

import { Fragment } from "react";
import { usePathname } from "next/navigation";
import { Disclosure, Menu, Transition } from "@headlessui/react";
import {
  Bars3Icon,
  BellIcon,
  XMarkIcon,
  UserCircleIcon,
  BriefcaseIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  HomeIcon,
  BookmarkIcon,
  InboxIcon,
} from "@heroicons/react/24/outline";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { useProfile } from "@/providers/profile-provider";
import React from "react";

const ROLES = {
  PROFESSIONAL: "PROFESSIONAL",
  EMPLOYER: "EMPLOYER",
  AGENCY: "AGENCY",
  ADMIN: "ADMIN",
} as const;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { profile } = useProfile();
  const imageUrl = profile?.user?.image || null;
  const isProfessional = session?.user?.role === ROLES.PROFESSIONAL;

  const navigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: HomeIcon,
      current: pathname === "/dashboard",
    },
    {
      name: "Professionals",
      href: "/browse-professionals",
      icon: UserCircleIcon,
      current: pathname === "/browse-professionals",
    },
    {
      name: "Job Listings",
      href: "/dashboard/jobs",
      icon: BriefcaseIcon,
      current: pathname === "/dashboard/jobs",
    },
    {
      name: "Job Alerts",
      href: "/dashboard/job-alerts",
      icon: BellIcon,
      current: pathname === "/dashboard/job-alerts",
    },
    {
      name: "Applications",
      href: "/dashboard/applications",
      icon: DocumentTextIcon,
      current: pathname === "/dashboard/applications",
    },
    {
      name: "Profile",
      href: "/dashboard/profile",
      icon: UserCircleIcon,
      current: pathname === "/dashboard/profile",
    },
    {
      name: "Notifications",
      href: "/dashboard/notifications",
      icon: InboxIcon,
      current: pathname === "/dashboard/notifications",
    },
  ];

  const secondaryNav = [
    {
      name: "Help & Support",
      href: "/dashboard/help",
      icon: ChatBubbleLeftRightIcon,
    },
    {
      name: "Sign Out",
      href: "#",
      icon: XMarkIcon,
      action: () => signOut(),
    },
  ];

  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={
        `fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-white border-r border-gray-200 transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:inset-0`
      }>
        <div className="flex h-16 items-center px-6 pt-4 border-b border-gray-100">
          <Link href="/dashboard" className="hidden lg:block max-w-[175px]">
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
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-3 py-2 rounded-lg text-base font-medium transition-colors
                ${item.current ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'}
              `}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon className={`h-5 w-5 mr-3 ${item.current ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600'}`} />
              {item.name}
            </Link>
          ))}
        </nav>
        <div className="mt-auto px-4 py-6 space-y-2">
          {secondaryNav.map((item) => (
            item.name === 'Sign Out' ? (
              <button
                key={item.name}
                onClick={item.action}
                className="flex w-full items-center px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-red-600 transition-colors"
              >
                <item.icon className="h-5 w-5 mr-3 text-gray-400 group-hover:text-red-600" />
                {item.name}
              </button>
            ) : (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors"
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="h-5 w-5 mr-3 text-gray-400 group-hover:text-blue-600" />
                {item.name}
              </Link>
            )
          ))}
        </div>
      </div>
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black bg-opacity-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      {/* Hamburger button */}
      <button
        className="fixed top-4 left-4 z-50 p-2 rounded-md text-gray-500 bg-white shadow lg:hidden"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Open sidebar"
      >
        {sidebarOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
      </button>
      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <div className="flex items-center justify-between h-16 px-6 bg-white border-b border-gray-100">
          <div className="flex items-center">
            <h1 className="hidden md:block text-2xl font-bold text-gray-900">Dashboard</h1>
            <Link href="/dashboard" className="block lg:hidden max-w-[140px] ml-8">
              <Image
                src="/images/brand/logo-full.png"
                alt="The Bell Registry"
                width={140}
                height={37}
                priority
                className="h-auto w-full"
              />
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <button
              type="button"
              className="rounded-full bg-white p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <span className="sr-only">View notifications</span>
              <BellIcon className="h-6 w-6" aria-hidden="true" />
            </button>
            {/* Profile dropdown */}
            <Menu as="div" className="relative ml-3">
              <div>
                <Menu.Button className="flex rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                  <span className="sr-only">Open user menu</span>
                  {imageUrl ? (
                    <Image
                      className="h-8 w-8 rounded-full"
                      src={imageUrl}
                      alt=""
                      width={32}
                      height={32}
                    />
                  ) : (
                    <UserCircleIcon className="h-8 w-8 text-gray-400" />
                  )}
                </Menu.Button>
              </div>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-200"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <Menu.Item>
                    {({ active }) => (
                      <Link
                        href="/dashboard/profile"
                        className={`${active ? "bg-gray-100" : ""} block px-4 py-2 text-sm text-gray-700`}
                      >
                        Your Profile
                      </Link>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <Link
                        href="/dashboard/settings"
                        className={`${active ? "bg-gray-100" : ""} block px-4 py-2 text-sm text-gray-700`}
                      >
                        Settings
                      </Link>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => signOut()}
                        className={`${active ? "bg-gray-100" : ""} block w-full px-4 py-2 text-left text-sm text-gray-700`}
                      >
                        Sign out
                      </button>
                    )}
                  </Menu.Item>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
        </div>
        {/* Main content area */}
        <main className="flex-1 p-6 bg-gray-50 min-h-screen">{children}</main>
      </div>
    </div>
  );
} 