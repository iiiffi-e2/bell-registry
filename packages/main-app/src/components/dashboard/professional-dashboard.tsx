"use client";

import { useSession } from "next-auth/react";
import { useProfile } from "@/providers/profile-provider";
import { useEffect, useState } from "react";
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
  BellIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import AIJobMatches from "@/components/ai-job-matches";
import { useWelcomeMessage } from "@/hooks/useWelcomeMessage";

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
];



const quickActions = [
  { name: "Job Alerts", icon: BellIcon },
  { name: "Update Profile", icon: UserCircleIcon },
  { name: "Resume", icon: DocumentTextIcon },
  { name: "Saved Jobs", icon: BookmarkIcon },
];

export function ProfessionalDashboard() {
  const { data: session } = useSession();
  const { profile, loading: profileLoading } = useProfile();
  const { welcomeMessage, loading: welcomeLoading } = useWelcomeMessage();
  const [profileViews, setProfileViews] = useState<number | null>(null);
  const [percentChange, setPercentChange] = useState<number | null>(null);
  const [loadingProfileViews, setLoadingProfileViews] = useState(true);
  const [savedJobsCount, setSavedJobsCount] = useState<number | null>(null);
  const [loadingSavedJobs, setLoadingSavedJobs] = useState(true);
  const [recommendedJobs, setRecommendedJobs] = useState<any[]>([]);
  const [loadingRecommendedJobs, setLoadingRecommendedJobs] = useState(true);
  const [applications, setApplications] = useState<any[]>([]);
  const [loadingApplications, setLoadingApplications] = useState(true);
  const [openToWork, setOpenToWork] = useState<boolean>(false);

  useEffect(() => {
    async function fetchRecommendedJobs() {
      setLoadingRecommendedJobs(true);
      try {
        const res = await fetch("/api/jobs/recommended");
        if (res.ok) {
          const data = await res.json();
          setRecommendedJobs(data.jobs || []);
        }
      } catch (e) {
        console.error('Error fetching recommended jobs:', e);
      } finally {
        setLoadingRecommendedJobs(false);
      }
    }
    fetchRecommendedJobs();
  }, []);

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

  useEffect(() => {
    async function fetchSavedJobsCount() {
      setLoadingSavedJobs(true);
      try {
        const res = await fetch("/api/jobs/saved");
        if (res.ok) {
          const data = await res.json();
          setSavedJobsCount(Array.isArray(data.jobs) ? data.jobs.length : 0);
        }
      } catch (e) {
        // handle error
      } finally {
        setLoadingSavedJobs(false);
      }
    }
    fetchSavedJobsCount();
  }, []);

  useEffect(() => {
    async function fetchApplications() {
      setLoadingApplications(true);
      try {
        const res = await fetch("/api/jobs/apply");
        if (res.ok) {
          const data = await res.json();
          setApplications(data.applications || []);
        }
      } catch (e) {
        console.error('Error fetching applications:', e);
      } finally {
        setLoadingApplications(false);
      }
    }
    fetchApplications();
  }, []);

  const isProfileIncomplete = !profileLoading && !profile?.bio;

  // Set openToWork from profile when available
  useEffect(() => {
    if (profile?.openToWork !== undefined) {
      setOpenToWork(profile.openToWork);
    }
  }, [profile]);

  const applicationStats = {
    total: applications.length,
    pending: applications.filter(app => app.status === 'PENDING').length,
    interview: applications.filter(app => app.status === 'INTERVIEW').length,
    reviewed: applications.filter(app => app.status === 'REVIEWED').length,
  };

  const stats = [
    {
      name: "Active Applications",
      stat: applicationStats.total.toString(),
      icon: DocumentCheckIcon,
      change: `${applicationStats.pending} pending`,
      changeType: "positive",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-slate-100 text-slate-800';
      case 'REVIEWED':
        return 'bg-yellow-100 text-yellow-800';
      case 'INTERVIEW':
        return 'bg-blue-100 text-blue-800';
      case 'OFFER':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'ACCEPTED':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Applied';
      case 'REVIEWED':
        return 'Under Review';
      case 'INTERVIEW':
        return 'Interview';
      case 'OFFER':
        return 'Offer Received';
      case 'REJECTED':
        return 'Not Selected';
      case 'ACCEPTED':
        return 'Accepted';
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 overflow-x-hidden">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col gap-8 w-full">
          {/* Welcome Section */}
          <div>
            {welcomeLoading ? (
              <>
                <h1 className="text-3xl font-bold text-slate-900">
                  Welcome, {session?.user?.name?.split(' ')[0] || 'Professional'}
                </h1>
                <p className="mt-2 text-slate-600">
                  Loading...
                </p>
              </>
            ) : (
              <>
                <h1 className="text-3xl font-bold text-slate-900">
                  {welcomeMessage?.title || `Welcome, ${session?.user?.name?.split(' ')[0] || 'Professional'}`}
                </h1>
                <p className="mt-2 text-slate-600">
                  {welcomeMessage?.subtitle || "Here's what's happening with your job search"}
                </p>
              </>
            )}
          </div>

          {/* Profile Completion Alert */}
          {isProfileIncomplete && (
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white shadow-lg">
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
                    className="mt-4 inline-flex items-center px-4 py-2 bg-white text-blue-700 rounded-lg font-medium text-sm hover:bg-blue-50 transition-colors"
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
                className="bg-white overflow-hidden rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <item.icon
                        className="h-6 w-6 text-slate-500"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-slate-600 truncate">
                        {item.name}
                      </p>
                      <div className="flex items-baseline">
                        <p className="text-2xl font-semibold text-slate-900">
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

            {/* Saved Jobs Stat Card */}
            <div className="bg-white overflow-hidden rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <BookmarkIcon className="h-6 w-6 text-slate-500" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-slate-600 truncate">Saved Jobs</p>
                    <div className="flex items-baseline">
                      <p className="text-2xl font-semibold text-slate-900">
                        {loadingSavedJobs ? "--" : savedJobsCount}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Views Stat Card */}
            <div className="bg-white overflow-hidden rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <EyeIcon className="h-6 w-6 text-slate-500" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-slate-600 truncate">Profile Views</p>
                    <div className="flex items-baseline">
                      <p className="text-2xl font-semibold text-slate-900">
                        {loadingProfileViews ? "--" : profileViews}
                      </p>
                      {!loadingProfileViews && percentChange !== null && (
                        <p
                          className={`ml-2 flex items-baseline text-sm font-semibold ${
                            percentChange > 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {percentChange > 0 ? "+" : ""}{percentChange}%
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Applications */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Recent Applications</h2>
              <Link
                href="/dashboard/applications"
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                View all
              </Link>
            </div>
            
            {loadingApplications ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : applications.length === 0 ? (
              <div className="text-center py-12">
                <DocumentCheckIcon className="mx-auto h-12 w-12 text-slate-400" />
                <h3 className="mt-2 text-sm font-medium text-slate-900">No applications yet</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Start applying to jobs to see them here.
                </p>
                <div className="mt-6">
                  <Link
                    href="/dashboard/jobs"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Browse Jobs
                    <ArrowRightIcon className="ml-2 h-4 w-4" />
                  </Link>
                </div>
              </div>
            ) : (
              <table className="w-full min-w-[700px] divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Position</th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Employer</th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Location</th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Applied Date</th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-3 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {applications.slice(0, 5).map((application) => (
                    <tr key={application.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-3 py-4 whitespace-nowrap">
                        <div className="font-medium text-slate-900">{application.job.title}</div>
                        <div className="text-sm text-slate-500">{application.job.jobType}</div>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap">{application.job.employer.employerProfile?.companyName || 'N/A'}</td>
                      <td className="px-3 py-4 whitespace-nowrap">{application.job.location}</td>
                      <td className="px-3 py-4">{new Date(application.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                          {getStatusLabel(application.status)}
                        </span>
                      </td>
                      <td className="px-3 py-4 text-center space-x-2">
                        <Link href={`/dashboard/jobs/${application.job.urlSlug}`} className="inline-flex items-center p-2 text-slate-400 hover:text-blue-600" title="View Job Listing">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12C2.25 12 5.25 5.25 12 5.25s9.75 6.75 9.75 6.75-3 6.75-9.75 6.75S2.25 12 2.25 12z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </Link>
                        {application.resumeUrl && (
                          <a href={application.resumeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center p-2 text-slate-400 hover:text-green-600" title="Download Resume">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5A3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.25a2.25 2.25 0 00-2.25 2.25v10.5a2.25 2.25 0 002.25 2.25h13.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H10.5z" />
                            </svg>
                          </a>
                        )}
                        {application.coverLetterUrl && (
                          <a href={application.coverLetterUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center p-2 text-slate-400 hover:text-purple-600" title="Download Cover Letter">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5A3.375 3.375 0 00-3.375-3.375H8.25M8.25 18.75l3.75-3.75 3.75 3.75m-7.5 0h7.5" />
                            </svg>
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* AI Job Matches */}
          <AIJobMatches />

          {/* Widgets Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recommended Jobs */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-slate-900">Recommended Jobs</h2>
                  <Link
                    href="/dashboard/jobs"
                    className="text-sm font-medium text-blue-600 hover:text-blue-500"
                  >
                    View all
                    <ArrowRightIcon className="ml-1 h-4 w-4 inline" />
                  </Link>
                </div>
                
                {loadingRecommendedJobs ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : recommendedJobs.length > 0 ? (
                  <div className="space-y-4">
                    {recommendedJobs.map((job) => (
                      <Link
                        key={job.id}
                        href={`/dashboard/jobs/${job.urlSlug}`}
                        className="block p-4 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-slate-900">{job.title}</h3>
                            <p className="text-sm text-slate-600">
                              {job.employer.employerProfile?.companyName || `${job.employer.firstName} ${job.employer.lastName}`}
                            </p>
                            <div className="mt-1 flex items-center text-sm text-slate-500">
                              <MapPinIcon className="h-4 w-4 mr-1" />
                              {job.location}
                            </div>
                          </div>
                          <BriefcaseIcon className="h-5 w-5 text-slate-400" />
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BriefcaseIcon className="mx-auto h-12 w-12 text-slate-400" />
                    <h3 className="mt-2 text-sm font-medium text-slate-900">No recommended jobs found</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      We couldn&apos;t find any jobs matching your profile. Try browsing all jobs.
                    </p>
                    <div className="mt-6">
                      <Link
                        href="/dashboard/jobs"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Browse Jobs
                        <ArrowRightIcon className="ml-2 h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
              
              {/* Open to Work Toggle Section */}
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-green-800">Open to Work</h4>
                      {openToWork && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-green-700">
                      {openToWork ? 'Visible to employers' : 'Not actively seeking'}
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/profile/open-to-work', {
                          method: 'PATCH',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({ openToWork: !openToWork }),
                        });

                        if (response.ok) {
                          setOpenToWork(!openToWork);
                        }
                      } catch (error) {
                        console.error('Error updating open to work status:', error);
                      }
                    }}
                    disabled={profileLoading}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 ${
                      openToWork ? 'bg-green-600' : 'bg-slate-300'
                    }`}
                  >
                    <span className="sr-only">Toggle open to work status</span>
                    <span
                      className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${
                        openToWork ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 flex-1 justify-center">
                {quickActions.map((action) => {
                  if (action.name === "Update Profile") {
                    return (
                      <Link
                        key={action.name}
                        href="/dashboard/profile/edit"
                        className="w-full flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-6 text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      >
                        <action.icon className="h-6 w-6 mb-2 text-blue-500" />
                        <span className="font-medium text-center w-full">{action.name}</span>
                      </Link>
                    );
                  }
                  if (action.name === "Job Alerts") {
                    return (
                      <Link
                        key={action.name}
                        href="/dashboard/job-alerts"
                        className="w-full flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-6 text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      >
                        <action.icon className="h-6 w-6 mb-2 text-blue-500" />
                        <span className="font-medium text-center w-full">{action.name}</span>
                      </Link>
                    );
                  }
                  if (action.name === "Saved Jobs") {
                    return (
                      <Link
                        key={action.name}
                        href="/dashboard/saved-jobs"
                        className="w-full flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-6 text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      >
                        <action.icon className="h-6 w-6 mb-2 text-blue-500" />
                        <span className="font-medium text-center w-full">{action.name}</span>
                      </Link>
                    );
                  }
                  return (
                    <button
                      key={action.name}
                      className="w-full flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-6 text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    >
                      <action.icon className="h-6 w-6 mb-2 text-blue-500" />
                      <span className="font-medium text-center w-full">{action.name}</span>
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