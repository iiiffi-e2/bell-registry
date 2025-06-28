"use client";

console.log('🚀 Dashboard Layout loaded!');

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
import { SubscriptionAlert } from "@/components/subscription/SubscriptionAlert";
import { FeedbackModal } from "@/components/modals/feedback-modal";
import { SurveyBanner } from "@/components/survey/survey-banner";
import { useSurvey } from "@/hooks/use-survey";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import SuspensionCheck from "@/components/auth/suspension-check";

// Temporary test component
function TestSuspensionWrapper({ children }: { children: React.ReactNode }) {
  console.log('🧪 TestSuspensionWrapper rendered');
  return <>{children}</>;
}

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
  { name: "Professionals", href: "/browse-professionals", icon: UserCircleIcon },
  { name: "Job Listings", href: "/dashboard/jobs", icon: BriefcaseIcon },
  { name: "Job Alerts", href: "/dashboard/job-alerts", icon: BellIcon },
  { name: "Saved Jobs", href: "/dashboard/saved-jobs", icon: BookmarkIcon },
  { name: "Messages", href: "/dashboard/messages", icon: ChatBubbleLeftRightIcon },
  { name: "Profile", href: "/dashboard/profile", icon: UserCircleIcon },
];

const employerNavigation: NavigationItem[] = [
  { name: "Dashboard", href: "/dashboard/employer", icon: HomeIcon },
  { name: "Job Listings", href: "/dashboard/jobs", icon: BriefcaseIcon },
  { 
    name: "Candidates", 
    href: "#", 
    icon: UsersIcon,
    submenu: [
      { name: "Browse All", href: "/browse-professionals" },
      { name: "View Saved", href: "/dashboard/employer/saved-candidates" }
    ]
  },
  { name: "Applications", href: "/dashboard/employer/applications", icon: DocumentTextIcon },
  { name: "Messages", href: "/dashboard/messages", icon: ChatBubbleLeftRightIcon },
  { name: "Subscription", href: "/dashboard/subscription", icon: CreditCardIcon },
  { name: "Billing", href: "/dashboard/billing", icon: ReceiptPercentIcon },
  { name: "Company Profile", href: "/dashboard/employer/profile", icon: BuildingOfficeIcon },
];

const agencyNavigation: NavigationItem[] = [
  { name: "Dashboard", href: "/dashboard/agency", icon: HomeIcon },
  { name: "Job Listings", href: "/dashboard/agency/jobs", icon: BriefcaseIcon },
  { name: "Candidates", href: "/dashboard/agency/candidates", icon: UsersIcon },
  { name: "Applications", href: "/dashboard/agency/applications", icon: DocumentTextIcon },
  { name: "Messages", href: "/dashboard/messages", icon: ChatBubbleLeftRightIcon },
  { name: "Subscription", href: "/dashboard/subscription", icon: CreditCardIcon },
  { name: "Billing", href: "/dashboard/billing", icon: ReceiptPercentIcon },
  { name: "Agency Profile", href: "/dashboard/agency/profile", icon: BuildingOfficeIcon },
];

const adminNavigation: NavigationItem[] = [
  { name: "Dashboard", href: "/dashboard/admin", icon: HomeIcon },
  { name: "Users", href: "/dashboard/admin/users", icon: UsersIcon },
  { name: "Jobs", href: "/dashboard/admin/jobs", icon: BriefcaseIcon },
  { name: "Messages", href: "/dashboard/messages", icon: ChatBubbleLeftRightIcon },
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
    <TestSuspensionWrapper>
      <div className="min-h-screen bg-gray-50">
        <DashboardNav />
        <main className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </TestSuspensionWrapper>
  );
} 