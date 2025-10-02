"use client";

console.log('🚀 Main-App Dashboard Layout loaded!');

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
  UsersIcon,
  BuildingOfficeIcon,
  CreditCardIcon,
  ReceiptPercentIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import { ChevronDown } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { useProfile } from "@/providers/profile-provider";
import React from "react";
import { NotificationBadge } from "@/components/messaging/NotificationBadge";
import { MessagesMenuBadge } from "@/components/messaging/MessagesMenuBadge";
import { FeedbackModal } from "@/components/modals/feedback-modal";
import { SurveyBanner } from "@/components/survey/survey-banner";
import { useSurvey } from "@/hooks/use-survey";
import SuspensionCheck from "@/components/auth/suspension-check";
import OAuthCompletion from "@/components/auth/oauth-completion";
import { FooterCopyright } from "@/components/ui/footer-copyright";

const ROLES = {
  PROFESSIONAL: "PROFESSIONAL",
  EMPLOYER: "EMPLOYER",
  AGENCY: "AGENCY",
  ADMIN: "ADMIN",
} as const;

type NavigationItem = {
  name: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  submenu?: {
    name: string;
    href: string;
  }[];
};

const professionalNavigation: NavigationItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: HomeIcon },
  { name: "Professionals", href: "/dashboard/browse-professionals", icon: UserCircleIcon },
  { name: "Job Listings", href: "/dashboard/jobs", icon: BriefcaseIcon },
  { name: "Job Alerts", href: "/dashboard/job-alerts", icon: BellIcon },
  { name: "Saved Jobs", href: "/dashboard/saved-jobs", icon: BookmarkIcon },
  { name: "Messages", href: "/dashboard/messages", icon: ChatBubbleLeftRightIcon },
  { name: "Message Board", href: "/dashboard/message-board", icon: DocumentTextIcon },
  { name: "Profile", href: "/dashboard/profile", icon: UserCircleIcon },
  { name: "Resource Center", href: "#", icon: DocumentTextIcon },
];

const employerNavigation: NavigationItem[] = [
  { name: "Dashboard", href: "/dashboard/employer", icon: HomeIcon },
  { 
    name: "Job Listings", 
    href: "#", 
    icon: BriefcaseIcon,
    submenu: [
      { name: "Browse All", href: "/dashboard/jobs" },
      { name: "View My Jobs", href: "/dashboard/employer/jobs" }
    ]
  },
  { 
    name: "Professionals", 
    href: "#", 
    icon: UsersIcon,
    submenu: [
      { name: "Browse All", href: "/dashboard/browse-professionals" },
      { name: "View Saved", href: "/dashboard/employer/saved-professionals" }
    ]
  },
  { name: "Applications", href: "/dashboard/employer/applications", icon: DocumentTextIcon },
  { name: "Messages", href: "/dashboard/messages", icon: ChatBubbleLeftRightIcon },
  { name: "Subscription", href: "/dashboard/subscription", icon: CreditCardIcon },
  { name: "Billing", href: "/dashboard/billing", icon: ReceiptPercentIcon },
  { name: "Employer Profile", href: "/dashboard/employer/profile", icon: BuildingOfficeIcon },
  { name: "Resource Center", href: "#", icon: DocumentTextIcon },
];

const agencyNavigation: NavigationItem[] = [
  { name: "Dashboard", href: "/dashboard/employer", icon: HomeIcon },
  { 
    name: "Job Listings", 
    href: "#", 
    icon: BriefcaseIcon,
    submenu: [
      { name: "Browse All", href: "/dashboard/jobs" },
      { name: "View My Jobs", href: "/dashboard/employer/jobs" }
    ]
  },
  { 
    name: "Professionals", 
    href: "#", 
    icon: UsersIcon,
    submenu: [
      { name: "Browse All", href: "/dashboard/browse-professionals" },
      { name: "View Saved", href: "/dashboard/employer/saved-professionals" }
    ]
  },
  { name: "Applications", href: "/dashboard/employer/applications", icon: DocumentTextIcon },
  { name: "Messages", href: "/dashboard/messages", icon: ChatBubbleLeftRightIcon },
  { name: "Subscription", href: "/dashboard/subscription", icon: CreditCardIcon },
  { name: "Billing", href: "/dashboard/billing", icon: ReceiptPercentIcon },
  { name: "Agency Profile", href: "/dashboard/employer/profile", icon: BuildingOfficeIcon },
  { name: "Resource Center", href: "#", icon: DocumentTextIcon },
];

const adminNavigation: NavigationItem[] = [
  { name: "Dashboard", href: "/dashboard/admin", icon: HomeIcon },
  { name: "Users", href: "/dashboard/admin/users", icon: UsersIcon },
  { name: "Jobs", href: "/dashboard/admin/jobs", icon: BriefcaseIcon },
  { name: "Messages", href: "/dashboard/messages", icon: ChatBubbleLeftRightIcon },
  { name: "Resource Center", href: "#", icon: DocumentTextIcon },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const { profile } = useProfile();
  const imageUrl = profile?.user?.image || null;

  // Role-based navigation
  let navigation = professionalNavigation;
  if (session?.user?.role === ROLES.EMPLOYER) navigation = employerNavigation;
  else if (session?.user?.role === ROLES.AGENCY) navigation = agencyNavigation;
  else if (session?.user?.role === ROLES.ADMIN) navigation = adminNavigation;

  const secondaryNav = [
    // {
    //   name: "Help & Support",
    //   href: "/dashboard/help",
    //   icon: ChatBubbleLeftRightIcon,
    // },
    {
      name: "Feedback",
      href: "#",
      icon: ExclamationCircleIcon,
      action: () => setIsFeedbackModalOpen(true),
    },
    {
      name: "Sign Out",
      href: "#",
      icon: XMarkIcon,
      action: () => signOut({ callbackUrl: "/login" }),
    },
  ];

  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [openSubmenu, setOpenSubmenu] = React.useState<string | null>(null);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = React.useState(false);
  
  // Survey state
  const {
    surveyStatus,
    isLoading: isSurveyLoading,
    dismissSurveyPermanently,
    dismissSurveyTemporarily,
  } = useSurvey();

  return (
    <SuspensionCheck>
      <div className="flex min-h-screen bg-slate-50">
        {/* Sidebar */}
        <div className={
          `fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-slate-800 border-r border-slate-700 transition-transform duration-200 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0`
        }>
          {/* Header - Fixed at top */}
          <div className="flex h-16 items-center px-6 pt-4 flex-shrink-0">
            <Link href="/dashboard" className="block max-w-[175px]">
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
          
          {/* Scrollable Navigation Area */}
          <div className="flex-1 overflow-y-auto">
            <nav className="px-4 py-6 space-y-2">
              {status === "loading" ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                </div>
              ) : (
                navigation.map((item) => (
                  <div key={item.name}>
                    {item.submenu ? (
                      <div>
                        <button
                          type="button"
                          onClick={() => setOpenSubmenu(openSubmenu === item.name ? null : item.name)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-base font-medium transition-colors
                            ${pathname?.startsWith(item.href) ? 'bg-slate-700 text-blue-300' : 'text-slate-300 hover:bg-slate-700 hover:text-blue-300'}
                          `}
                        >
                          <div className="flex items-center">
                            <item.icon className={`h-5 w-5 mr-3 ${pathname?.startsWith(item.href) ? 'text-blue-400' : 'text-slate-400 group-hover:text-blue-400'}`} />
                            {item.name}
                          </div>
                          <ChevronDown
                            className={`h-5 w-5 transition-transform duration-200 ${
                              openSubmenu === item.name ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                        {openSubmenu === item.name && (
                          <div className="mt-1 ml-8 space-y-1">
                            {item.submenu.map((subItem) => (
                              <Link
                                key={subItem.name}
                                href={subItem.href}
                                className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors
                                  ${pathname === subItem.href ? 'bg-slate-700 text-blue-300' : 'text-slate-300 hover:bg-slate-700 hover:text-blue-300'}
                                `}
                                onClick={() => setSidebarOpen(false)}
                              >
                                {subItem.name}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <Link
                        href={item.href}
                        className={`flex flex-col px-3 py-2 rounded-lg text-base font-medium transition-colors
                          ${pathname === item.href ? 'bg-slate-700 text-blue-300' : 'text-slate-300 hover:bg-slate-700 hover:text-blue-300'}
                        `}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <item.icon className={`h-5 w-5 mr-3 ${pathname === item.href ? 'text-blue-400' : 'text-slate-400 group-hover:text-blue-400'}`} />
                            {item.name}
                          </div>
                          {item.name === 'Messages' && <MessagesMenuBadge />}
                        </div>
                        {item.name === 'Resource Center' && (
                          <div className="mt-1 ml-8">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Coming Soon
                            </span>
                          </div>
                        )}
                      </Link>
                    )}
                  </div>
                ))
              )}
            </nav>
          </div>
          
          {/* Fixed Bottom Section - Feedback and Sign Out */}
          <div className="px-4 py-6 space-y-2 border-t border-slate-700 flex-shrink-0">
            {secondaryNav.map((item) => (
              item.action ? (
                <button
                  key={item.name}
                  onClick={item.action}
                  className={`flex w-full items-center px-3 py-2 rounded-lg text-base font-medium transition-colors ${
                    item.name === 'Sign Out' 
                      ? 'text-slate-300 hover:bg-slate-700 hover:text-red-400' 
                      : 'text-slate-300 hover:bg-slate-700 hover:text-blue-300'
                  }`}
                >
                  <item.icon className={`h-5 w-5 mr-3 ${
                    item.name === 'Sign Out' 
                      ? 'text-slate-400 group-hover:text-red-400' 
                      : 'text-slate-400 group-hover:text-blue-400'
                  }`} />
                  {item.name}
                </button>
              ) : (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center px-3 py-2 rounded-lg text-base font-medium text-slate-300 hover:bg-slate-700 hover:text-blue-300 transition-colors"
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="h-5 w-5 mr-3 text-slate-400 group-hover:text-blue-400" />
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
          className="fixed top-4 left-4 z-50 p-2 rounded-md text-white bg-[#1e293b] shadow-lg lg:hidden"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Open sidebar"
        >
          {sidebarOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
        </button>
        {/* Main content */}
        <div className="flex-1 flex flex-col min-h-screen lg:ml-64">
          {/* Top bar */}
          <div className="flex items-center justify-between h-16 px-6 bg-[#1e293b] border-b border-slate-200 shadow-sm">
            <div className="flex items-center">
              <h1 className="hidden md:block text-2xl font-bold text-white">Dashboard</h1>
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
            
            {/* Subscription Status for Employers/Agencies */}
            <div className="flex-1 max-w-md mx-4">
              {/* Subscription alert removed - no longer showing in header */}
            </div>

            <div className="flex items-center space-x-4">
              <button
                type="button"
                className="rounded-full bg-white p-1 text-slate-500 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm hidden"
              >
                <span className="sr-only">View notifications</span>
                <BellIcon className="h-6 w-6" aria-hidden="true" />
              </button>
              {/* Profile dropdown */}
              <Menu as="div" className="relative ml-3">
                <div>
                  <Menu.Button className="flex rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm">
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
                      <UserCircleIcon className="h-8 w-8 text-slate-400" />
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
                  <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none border border-slate-200">
                                                <Menu.Item>
                              {({ active }) => (
                                <Link
                                  href={
                                    session?.user?.role === ROLES.PROFESSIONAL 
                                      ? "/dashboard/profile" 
                                      : "/dashboard/employer/profile"
                                  }
                                  className={`${active ? "bg-slate-50" : ""} block px-4 py-2 text-sm text-slate-700`}
                                >
                                  Your Profile
                                </Link>
                              )}
                            </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          href="/dashboard/settings"
                          className={`${active ? "bg-slate-50" : ""} block px-4 py-2 text-sm text-slate-700`}
                        >
                          Settings
                        </Link>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => signOut({ callbackUrl: "/login" })}
                          className={`${active ? "bg-slate-50" : ""} block w-full px-4 py-2 text-left text-sm text-slate-700`}
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
          <main className="flex-1 p-4 sm:p-6 bg-slate-50 min-h-screen">
            {/* OAuth Completion - handles post-OAuth registration completion */}
            <OAuthCompletion />
            
            {/* Survey Banner */}
            {surveyStatus.shouldShowBanner && !isSurveyLoading && (
              <SurveyBanner 
                onDismissPermanently={dismissSurveyPermanently}
                onDismissTemporarily={dismissSurveyTemporarily}
              />
            )}
            {children}
          </main>
          
          {/* Footer */}
          <FooterCopyright />
        </div>

        {/* Feedback Modal */}
        <FeedbackModal 
          isOpen={isFeedbackModalOpen} 
          onClose={() => setIsFeedbackModalOpen(false)} 
        />
      </div>
    </SuspensionCheck>
  );
} 