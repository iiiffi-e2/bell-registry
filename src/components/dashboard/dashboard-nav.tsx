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
  ChevronDown,
  CreditCard,
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
    href: "/dashboard/jobs",
    color: "text-violet-500",
  },
  {
    label: "Candidates",
    icon: Users,
    href: "#",
    color: "text-blue-500",
    submenu: [
      {
        label: "Browse All",
        href: "/browse-professionals",
      },
      {
        label: "View Saved",
        href: "/dashboard/employer/saved-candidates",
      },
    ],
  },
  {
    label: "Applications",
    icon: FileText,
    href: "/dashboard/employer/applications",
    color: "text-green-500",
  },
  {
    label: "Subscription",
    icon: CreditCard,
    href: "/dashboard/subscription",
    color: "text-purple-500",
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
    label: "Subscription",
    icon: CreditCard,
    href: "/dashboard/subscription",
    color: "text-purple-500",
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
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

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

    let roleRoutes;
    if (session.user.role === ROLES.EMPLOYER) {
      roleRoutes = employerRoutes;
    } else if (session.user.role === ROLES.AGENCY) {
      roleRoutes = agencyRoutes;
    } else if (session.user.role === ROLES.ADMIN) {
      roleRoutes = adminRoutes;
    } else {
      roleRoutes = professionalRoutes;
    }

    return roleRoutes;
  })();

  // Set initial submenu state based on current path
  useEffect(() => {
    const currentRoute = routes.find(route => 
      route.submenu?.some(subItem => pathname === subItem.href)
    );
    if (currentRoute) {
      setOpenSubmenu(currentRoute.href);
    }
  }, [pathname, routes]);

  const toggleSubmenu = (href: string) => {
    setOpenSubmenu(openSubmenu === href ? null : href);
  };

  return (
    <div className="flex h-full w-64 flex-col border-r bg-white">
      <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4">
          <Link href="/" className="text-xl font-bold text-blue-600">
                          The Bell Registry
          </Link>
        </div>
        <nav className="mt-5 flex-1 px-2 space-y-1">
          {routes.map((route) => (
            <div key={route.href} className="relative">
              {route.submenu ? (
                <div>
                  <button
                    type="button"
                    onClick={() => toggleSubmenu(route.href)}
                    className="w-full flex items-center justify-between px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  >
                    <div className="flex items-center">
                      <route.icon
                        className={cn("mr-3 h-6 w-6", route.color)}
                        aria-hidden="true"
                      />
                      <span>{route.label}</span>
                    </div>
                    <ChevronDown
                      className={cn(
                        "h-5 w-5 transition-transform duration-200",
                        openSubmenu === route.href ? "rotate-180" : ""
                      )}
                    />
                  </button>
                  {openSubmenu === route.href && (
                    <div className="mt-1 ml-8 space-y-1">
                      {route.submenu.map((subItem) => (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          className={cn(
                            "block px-2 py-2 text-sm font-medium rounded-md",
                            pathname === subItem.href
                              ? "bg-gray-100 text-gray-900"
                              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                          )}
                        >
                          {subItem.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href={route.href}
                  className={cn(
                    "flex items-center px-2 py-2 text-sm font-medium rounded-md",
                    pathname === route.href
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <route.icon
                    className={cn("mr-3 h-6 w-6", route.color)}
                    aria-hidden="true"
                  />
                  {route.label}
                </Link>
              )}
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
} 