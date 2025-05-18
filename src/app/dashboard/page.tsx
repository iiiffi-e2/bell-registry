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
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useProfile } from "@/providers/profile-provider";

const ROLES = {
  PROFESSIONAL: "PROFESSIONAL",
  EMPLOYER: "EMPLOYER",
  AGENCY: "AGENCY",
  ADMIN: "ADMIN",
} as const;

const stats = [
  {
    name: "Profile Views",
    stat: "245",
    icon: EyeIcon,
    change: "+4.75%",
    changeType: "positive",
  },
  {
    name: "Applications",
    stat: "12",
    icon: DocumentCheckIcon,
    change: "+54.02%",
    changeType: "positive",
  },
  {
    name: "Saved Jobs",
    stat: "23",
    icon: BriefcaseIcon,
    change: "+12.05%",
    changeType: "positive",
  },
  {
    name: "Interview Invites",
    stat: "3",
    icon: ChartBarIcon,
    change: "+54.02%",
    changeType: "positive",
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

const recommendedJobs = [
  {
    id: 1,
    title: "Executive Housekeeper",
    company: "Luxury Estates International",
    location: "Los Angeles, CA",
    salary: "$80,000 - $120,000",
    type: "Full-time",
    posted: "2 days ago",
  },
  {
    id: 2,
    title: "Personal Chef",
    company: "Private Staff Group",
    location: "San Francisco, CA",
    salary: "$100,000 - $150,000",
    type: "Full-time",
    posted: "3 days ago",
  },
  {
    id: 3,
    title: "Estate Manager",
    company: "Elite Domestic Agency",
    location: "Greenwich, CT",
    salary: "$150,000 - $200,000",
    type: "Full-time",
    posted: "1 week ago",
  },
];

export default function DashboardPage() {
  const { data: session } = useSession();
  const { profile } = useProfile();
  
  const isProfessional = session?.user?.role === ROLES.PROFESSIONAL;
  const isProfileIncomplete = isProfessional && !profile?.bio;

  if (!isProfessional) {
    return <EmployerDashboard />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {session?.user?.name?.split(' ')[0] || 'Professional'}
          </h1>
          <p className="mt-2 text-gray-600">
            Here's what's happening with your job search
          </p>
        </div>

        {/* Profile Completion Alert */}
        {isProfileIncomplete && (
          <div className="mb-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
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
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
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
                            : "text-red-600"
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
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Applications */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
              <div className="border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Recent Applications</h2>
                  <Link
                    href="/dashboard/applications"
                    className="text-sm font-medium text-blue-600 hover:text-blue-500"
                  >
                    View all
                  </Link>
                </div>
              </div>
              <div className="divide-y divide-gray-100">
                {recentApplications.map((application) => (
                  <div key={application.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {application.position}
                        </h3>
                        <div className="mt-1 flex items-center text-sm text-gray-500">
                          <BuildingOfficeIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                          {application.company}
                        </div>
                        <div className="mt-1 flex items-center text-sm text-gray-500">
                          <MapPinIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                          {application.location}
                        </div>
                        <div className="mt-1 flex items-center text-sm text-gray-500">
                          <CalendarIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                          Applied on {new Date(application.date).toLocaleDateString()}
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${application.statusColor}`}
                      >
                        {application.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recommended Jobs */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
              <div className="border-b border-gray-200 px-6 py-4">
                <h2 className="text-lg font-semibold text-gray-900">Recommended Jobs</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {recommendedJobs.map((job) => (
                  <div key={job.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <h3 className="text-base font-medium text-gray-900">
                      {job.title}
                    </h3>
                    <div className="mt-1 flex items-center text-sm text-gray-500">
                      <BuildingOfficeIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                      {job.company}
                    </div>
                    <div className="mt-1 flex items-center text-sm text-gray-500">
                      <MapPinIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                      {job.location}
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {job.type}
                      </span>
                      <span className="text-sm text-gray-500">{job.posted}</span>
                    </div>
                  </div>
                ))}
                <div className="p-6">
                  <Link
                    href="/dashboard/jobs"
                    className="block w-full text-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    View More Jobs
                  </Link>
                </div>
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