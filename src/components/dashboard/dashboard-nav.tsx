"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Briefcase,
  Bell,
  Bookmark,
  Settings,
  User,
  Users,
  FileText,
  Building,
} from "lucide-react";
import { useEffect, useState } from "react";

const ROLES = {
  PROFESSIONAL: "PROFESSIONAL",
  EMPLOYER: "EMPLOYER",
  AGENCY: "AGENCY",
  ADMIN: "ADMIN",
} as const;

const professionalRoutes = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
    color: "text-sky-500",
  },
  {
    label: "Job Alerts",
    icon: Bell,
    href: "/dashboard/job-alerts",
    color: "text-pink-700",
  },
  {
    label: "Saved Jobs",
    icon: Bookmark,
    href: "/dashboard/saved-jobs",
    color: "text-orange-700",
  },
  {
    label: "Profile",
    icon: User,
    href: "/dashboard/profile",
    color: "text-emerald-500",
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/dashboard/settings",
    color: "text-gray-500",
  },
];

const employerRoutes = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard/employer",
    color: "text-sky-500",
  },
  {
    label: "Job Listings",
    icon: Briefcase,
    href: "/dashboard/employer/jobs",
    color: "text-violet-500",
  },
  {
    label: "Candidates",
    icon: Users,
    href: "/dashboard/employer/candidates",
    color: "text-blue-500",
  },
  {
    label: "Applications",
    icon: FileText,
    href: "/dashboard/employer/applications",
    color: "text-green-500",
  },
  {
    label: "Company Profile",
    icon: Building,
    href: "/dashboard/employer/profile",
    color: "text-orange-500",
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/dashboard/employer/settings",
    color: "text-gray-500",
  },
];

const agencyRoutes = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard/agency",
    color: "text-sky-500",
  },
  {
    label: "Job Listings",
    icon: Briefcase,
    href: "/dashboard/agency/jobs",
    color: "text-violet-500",
  },
  {
    label: "Candidates",
    icon: Users,
    href: "/dashboard/agency/candidates",
    color: "text-blue-500",
  },
  {
    label: "Applications",
    icon: FileText,
    href: "/dashboard/agency/applications",
    color: "text-green-500",
  },
  {
    label: "Agency Profile",
    icon: Building,
    href: "/dashboard/agency/profile",
    color: "text-orange-500",
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/dashboard/agency/settings",
    color: "text-gray-500",
  },
];

const adminRoutes = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard/admin",
    color: "text-sky-500",
  },
  {
    label: "Users",
    icon: Users,
    href: "/dashboard/admin/users",
    color: "text-blue-500",
  },
  {
    label: "Jobs",
    icon: Briefcase,
    href: "/dashboard/admin/jobs",
    color: "text-violet-500",
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/dashboard/admin/settings",
    color: "text-gray-500",
  },
];

export function DashboardNav() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  // Determine which routes to show based on user role
  const routes = (() => {
    if (status === 'loading') {
      return [{
        label: "Loading...",
        icon: LayoutDashboard,
        href: "#",
        color: "text-gray-500",
      }];
    }

    if (!session?.user) {
      return [{
        label: "Not authenticated",
        icon: LayoutDashboard,
        href: "#",
        color: "text-red-500",
      }];
    }

    // Debug role information
    const userRole = session.user.role;
    
    // Add a debug route at the top
    const debugRoute = {
      label: `Debug - Current Role: ${userRole || 'none'}`,
      icon: LayoutDashboard,
      href: "#",
      color: "text-red-500",
    };

    let roleRoutes;
    if (userRole === ROLES.EMPLOYER) {
      roleRoutes = employerRoutes;
    } else if (userRole === ROLES.AGENCY) {
      roleRoutes = agencyRoutes;
    } else if (userRole === ROLES.ADMIN) {
      roleRoutes = adminRoutes;
    } else {
      roleRoutes = professionalRoutes;
    }

    return [debugRoute, ...roleRoutes];
  })();

  return (
    <div className="space-y-4 py-4 flex flex-col h-full bg-white text-black">
      <div className="px-3 py-2 flex-1">
        <div className="space-y-1">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-black hover:bg-white/10 rounded-lg transition",
                pathname === route.href
                  ? "text-black bg-white/10"
                  : "text-zinc-400"
              )}
            >
              <div className="flex items-center flex-1">
                <route.icon className={cn("h-5 w-5 mr-3", route.color)} />
                {route.label}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
} 