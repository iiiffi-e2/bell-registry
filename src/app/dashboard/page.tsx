"use client";

import { useSession } from "next-auth/react";
import {
  ChartBarIcon,
  BriefcaseIcon,
  EyeIcon,
  DocumentCheckIcon,
  UserCircleIcon,
  ArrowRightIcon,
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
  },
  {
    id: 2,
    position: "Private Chef",
    company: "Elite Household Staff",
    location: "New York, NY",
    status: "Interview",
    statusColor: "bg-blue-100 text-blue-800",
    date: "2024-03-08",
  },
  {
    id: 3,
    position: "House Manager",
    company: "Premium Staffing Solutions",
    location: "Miami, FL",
    status: "Applied",
    statusColor: "bg-gray-100 text-gray-800",
    date: "2024-03-05",
  },
];

export default function DashboardPage() {
  const { data: session } = useSession();
  const { profile } = useProfile();
  
  const isProfessional = session?.user?.role === ROLES.PROFESSIONAL;
  const isProfileIncomplete = isProfessional && !profile?.bio;

  if (!isProfessional) {
    console.log("User is not a professional, showing employer dashboard");
    return <EmployerDashboard />;
  }

  return (
    <div className="py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        {isProfileIncomplete && (
          <div className="rounded-md bg-blue-50 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <UserCircleIcon className="h-5 w-5 text-blue-400" aria-hidden="true" />
              </div>
              <div className="ml-3 flex-1 md:flex md:justify-between">
                <p className="text-sm text-blue-700">
                  Complete your profile to help employers find you and increase your chances of finding the perfect job.
                </p>
                <p className="mt-3 text-sm md:mt-0 md:ml-6">
                  <Link
                    href="/dashboard/profile/edit"
                    className="whitespace-nowrap font-medium text-blue-700 hover:text-blue-600 inline-flex items-center"
                  >
                    Complete Profile
                    <ArrowRightIcon className="ml-1 h-4 w-4" />
                  </Link>
                </p>
              </div>
            </div>
          </div>
        )}
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
      </div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        {/* Stats */}
        <div className="mt-8">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((item) => (
              <div
                key={item.name}
                className="relative overflow-hidden rounded-lg bg-white px-4 pt-5 pb-12 shadow sm:px-6 sm:pt-6"
              >
                <dt>
                  <div className="absolute rounded-md bg-blue-500 p-3">
                    <item.icon
                      className="h-6 w-6 text-white"
                      aria-hidden="true"
                    />
                  </div>
                  <p className="ml-16 truncate text-sm font-medium text-gray-500">
                    {item.name}
                  </p>
                </dt>
                <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
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
                </dd>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Applications */}
        <div className="mt-8">
          <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
              <h2 className="text-xl font-semibold text-gray-900">
                Recent Applications
              </h2>
              <p className="mt-2 text-sm text-gray-700">
                A list of your most recent job applications and their current
                status.
              </p>
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
              <Link
                href="/dashboard/jobs"
                className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
              >
                Browse Jobs
              </Link>
            </div>
          </div>
          <div className="mt-8 flex flex-col">
            <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                        >
                          Position
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                        >
                          Company
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                        >
                          Location
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                        >
                          Status
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                        >
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {recentApplications.map((application) => (
                        <tr key={application.id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                            {application.position}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {application.company}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {application.location}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                            <span
                              className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${application.statusColor}`}
                            >
                              {application.status}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {application.date}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
        {/* Add employer-specific dashboard content here */}
      </div>
    </div>
  );
} 