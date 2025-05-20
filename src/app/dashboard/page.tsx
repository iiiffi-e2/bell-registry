"use client";

import { useSession } from "next-auth/react";
import {
  ChartBarIcon,
  BriefcaseIcon,
  EyeIcon,
  DocumentCheckIcon,
  UserCircleIcon,
  ArrowRightIcon,
  MapPinIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  BookmarkIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useProfile } from "@/providers/profile-provider";
import { useEffect, useState } from "react";

const ROLES = {
  PROFESSIONAL: "PROFESSIONAL",
  EMPLOYER: "EMPLOYER",
  AGENCY: "AGENCY",
  ADMIN: "ADMIN",
} as const;

const stats = [
  {
    name: "Active Applications",
    stat: "12",
    icon: DocumentCheckIcon,
    change: "2 new this week",
    changeType: "positive",
  },
  {
    name: "Interviews Scheduled",
    stat: "3",
    icon: CalendarIcon,
    change: "1 new this week",
    changeType: "positive",
  },
  {
    name: "Saved Jobs",
    stat: "8",
    icon: BookmarkIcon,
    change: "No change",
    changeType: "neutral",
  },
];

const recentApplications = [
  {
    id: 1,
    position: "Estate Manager",
    company: "Luxury Estate Services",
    location: "Beverly Hills, CA",
    status: "Under Review",
    statusColor: "bg-yellow-100 text-yellow-800",
    date: "2024-03-10",
    salary: "$120,000 - $180,000",
  },
  {
    id: 2,
    position: "Private Chef",
    company: "Elite Household Staff",
    location: "New York, NY",
    status: "Interview",
    statusColor: "bg-blue-100 text-blue-800",
    date: "2024-03-08",
    salary: "$90,000 - $140,000",
  },
  {
    id: 3,
    position: "House Manager",
    company: "Premium Staffing Solutions",
    location: "Miami, FL",
    status: "Applied",
    statusColor: "bg-gray-100 text-gray-800",
    date: "2024-03-05",
    salary: "$85,000 - $130,000",
  },
];

const upcomingInterviews = [
  {
    id: 1,
    employer: "Rothschild Estate",
    date: "May 20, 2023",
    time: "10:00 AM",
  },
  {
    id: 2,
    employer: "Wellington Family",
    date: "May 25, 2023",
    time: "2:30 PM",
  },
];

const recommendedJobs = [
  {
    id: 1,
    title: "Executive Chef",
    company: "Morgan Estate",
    location: "Aspen, CO",
  },
  {
    id: 2,
    title: "Private Chef",
    company: "Johnson Family",
    location: "Malibu, CA",
  },
];

const quickActions = [
  { name: "New Application", icon: DocumentCheckIcon },
  { name: "Update Profile", icon: UserCircleIcon },
  { name: "Resume", icon: DocumentTextIcon },
  { name: "Saved Jobs", icon: BookmarkIcon },
];

export default function DashboardPage() {
  const { data: session } = useSession();
  const { profile } = useProfile();
  const [profileViews, setProfileViews] = useState<number | null>(null);
  const [percentChange, setPercentChange] = useState<number | null>(null);
  const [loadingProfileViews, setLoadingProfileViews] = useState(true);

  useEffect(() => {
    async function fetchProfileViews() {
      setLoadingProfileViews(true);
      try {
        const res = await fetch("/api/dashboard/profile-views");
        if (res.ok) {
          const data = await res.json();
          setProfileViews(data.totalViews);
          setPercentChange(data.percentChange);
        }
      } catch (e) {
        // handle error
      } finally {
        setLoadingProfileViews(false);
      }
    }
    fetchProfileViews();
  }, []);

  const isProfessional = session?.user?.role === ROLES.PROFESSIONAL;
  const isProfileIncomplete = isProfessional && !profile?.bio;

  if (!isProfessional) {
    return <EmployerDashboard />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col gap-8">
          {/* Welcome Section */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {session?.user?.name?.split(' ')[0] || 'Professional'}
            </h1>
            <p className="mt-2 text-gray-600">
              Here's what's happening with your job search
            </p>
          </div>

          {/* Profile Completion Alert */}
          {isProfileIncomplete && (
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <UserCircleIcon className="h-6 w-6" />
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-lg font-semibold">Complete Your Profile</h3>
                  <p className="mt-1">
                    A complete profile helps employers find you and increases your chances of finding the perfect job.
                  </p>
                  <Link
                    href="/dashboard/profile/edit"
                    className="mt-4 inline-flex items-center px-4 py-2 bg-white text-blue-600 rounded-lg font-medium text-sm hover:bg-blue-50 transition-colors"
                  >
                    Complete Profile
                    <ArrowRightIcon className="ml-2 h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((item) => (
              <div
                key={item.name}
                className="bg-white overflow-hidden rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <item.icon
                        className="h-6 w-6 text-gray-400"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500 truncate">
                        {item.name}
                      </p>
                      <div className="flex items-baseline">
                        <p className="text-2xl font-semibold text-gray-900">
                          {item.stat}
                        </p>
                        <p
                          className={`ml-2 flex items-baseline text-sm font-semibold ${
                            item.changeType === "positive"
                              ? "text-green-600"
                              : item.changeType === "negative"
                              ? "text-red-600"
                              : "text-gray-400"
                          }`}
                        >
                          {item.change}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {/* Profile Views Stat Card (live data) */}
            <div className="bg-white overflow-hidden rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <EyeIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500 truncate">Profile Views</p>
                    <div className="flex items-baseline">
                      <p className="text-2xl font-semibold text-gray-900">
                        {loadingProfileViews
                          ? "--"
                          : profileViews !== null
                          ? profileViews
                          : "--"}
                      </p>
                      <p
                        className={`ml-2 flex items-baseline text-sm font-semibold ${
                          percentChange === null || loadingProfileViews
                            ? "text-gray-400"
                            : percentChange > 0
                            ? "text-green-600"
                            : percentChange < 0
                            ? "text-red-600"
                            : "text-gray-400"
                        }`}
                      >
                        {loadingProfileViews || percentChange === null
                          ? ""
                          : percentChange > 0
                          ? `+${percentChange.toFixed(0)}%`
                          : percentChange < 0
                          ? `${percentChange.toFixed(0)}%`
                          : "0%"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Applications */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recent Applications</h2>
              <Link
                href="/dashboard/applications"
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                View all
              </Link>
            </div>
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Position</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Employer</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Applied Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {recentApplications.map((application) => (
                  <tr key={application.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{application.position}</div>
                      <div className="text-sm text-gray-500">Full-time</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{application.company}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{application.location}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{new Date(application.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${application.statusColor}`}>
                        {application.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <Link href="#" className="inline-flex items-center p-2 text-gray-400 hover:text-blue-600" title="View Listing">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12C2.25 12 5.25 5.25 12 5.25s9.75 6.75 9.75 6.75-3 6.75-9.75 6.75S2.25 12 2.25 12z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Widgets Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Upcoming Interviews */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Upcoming Interviews</h3>
                <Link href="#" className="text-sm font-medium text-blue-600 hover:text-blue-500">View all</Link>
              </div>
              <div className="space-y-4">
                {upcomingInterviews.map((interview) => (
                  <div key={interview.id} className="flex items-center">
                    <CalendarIcon className="h-6 w-6 text-blue-400 mr-3" />
                    <div>
                      <div className="font-medium text-gray-900">{interview.employer}</div>
                      <div className="text-sm text-gray-500">{interview.date} • {interview.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Recommended Jobs */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recommended Jobs</h3>
                <Link href="#" className="text-sm font-medium text-blue-600 hover:text-blue-500">View all</Link>
              </div>
              <div className="space-y-4">
                {recommendedJobs.map((job) => (
                  <div key={job.id} className="flex items-center">
                    <BriefcaseIcon className="h-6 w-6 text-blue-400 mr-3" />
                    <div>
                      <div className="font-medium text-gray-900">{job.title}</div>
                      <div className="text-sm text-gray-500">{job.company} • {job.location}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex flex-col">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-4 flex-1">
                {quickActions.map((action) => {
                  if (action.name === "Update Profile") {
                    return (
                      <Link
                        key={action.name}
                        href="/dashboard/profile/edit"
                        className="flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-6 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      >
                        <action.icon className="h-6 w-6 mb-2 text-blue-400" />
                        <span className="font-medium">{action.name}</span>
                      </Link>
                    );
                  }
                  if (action.name === "Saved Jobs") {
                    return (
                      <Link
                        key={action.name}
                        href="/dashboard/saved-jobs"
                        className="flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-6 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      >
                        <action.icon className="h-6 w-6 mb-2 text-blue-400" />
                        <span className="font-medium">{action.name}</span>
                      </Link>
                    );
                  }
                  return (
                    <button
                      key={action.name}
                      className="flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-6 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    >
                      <action.icon className="h-6 w-6 mb-2 text-blue-400" />
                      <span className="font-medium">{action.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmployerDashboard() {
  return (
    <div className="py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">
          Employer Dashboard
        </h1>
      </div>
    </div>
  );
}