"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  DocumentArrowDownIcon,
  EnvelopeIcon,
  CalendarIcon,
  UserCircleIcon,
  BriefcaseIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

interface Application {
  id: string;
  createdAt: string;
  status: string;
  resumeUrl: string;
  coverLetterUrl: string | null;
  message: string | null;
  job: {
    id: string;
    title: string;
    professionalRole: string;
    location: string;
    urlSlug: string;
  };
  candidate: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    candidateProfile?: {
      title: string | null;
      location: string | null;
      yearsOfExperience: number | null;
    } | null;
    profileSlug: string;
  };
}

export default function EmployerApplicationsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedJob, setSelectedJob] = useState<string>("all");
  const [jobs, setJobs] = useState<any[]>([]);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.role) {
      // Redirect professionals away from employer screens
      if (session.user.role === "PROFESSIONAL") {
        router.push("/dashboard");
        return;
      }
      
      // Only allow employers and agencies
      if (session.user.role !== "EMPLOYER" && session.user.role !== "AGENCY") {
        router.push("/dashboard");
        return;
      }
    }
    
    if (session) {
      fetchApplications();
      fetchJobs();
    }
  }, [session, router]);

  // Show loading state while checking authentication and role
  if (!session?.user?.role) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirect unauthorized users
  if (session.user.role === "PROFESSIONAL") {
    router.push("/dashboard");
    return null;
  }

  if (session.user.role !== "EMPLOYER" && session.user.role !== "AGENCY") {
    router.push("/dashboard");
    return null;
  }

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/dashboard/employer/applications");
      if (response.ok) {
        const data = await response.json();
        setApplications(data.applications || []);
      }
    } catch (error) {
      console.error("Error fetching applications:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchJobs = async () => {
    try {
      const response = await fetch("/api/jobs/my-jobs");
      if (response.ok) {
        const data = await response.json();
        setJobs(data.jobs || []);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
    }
  };

  const updateApplicationStatus = async (applicationId: string, newStatus: string) => {
    try {
      setUpdatingStatus(applicationId);
      const response = await fetch(`/api/dashboard/employer/applications/${applicationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        // Update local state
        setApplications(prev =>
          prev.map(app =>
            app.id === applicationId ? { ...app, status: newStatus } : app
          )
        );
      } else {
        // Revert the change if the update failed
        alert('Failed to update application status. Please try again.');
      }
    } catch (error) {
      console.error("Error updating application status:", error);
      alert('Failed to update application status. Please try again.');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const filteredApplications = applications.filter(app => {
    if (selectedStatus !== "all" && app.status !== selectedStatus) return false;
    if (selectedJob !== "all" && app.job.id !== selectedJob) return false;
    return true;
  });

  const statusCounts = {
    all: applications.length,
    PENDING: applications.filter(app => app.status === "PENDING").length,
    REVIEWED: applications.filter(app => app.status === "REVIEWED").length,
    INTERVIEW: applications.filter(app => app.status === "INTERVIEW").length,
    OFFER: applications.filter(app => app.status === "OFFER").length,
    REJECTED: applications.filter(app => app.status === "REJECTED").length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-gray-100 text-gray-800";
      case "REVIEWED":
        return "bg-yellow-100 text-yellow-800";
      case "INTERVIEW":
        return "bg-blue-100 text-blue-800";
      case "OFFER":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      case "ACCEPTED":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "PENDING":
        return "New";
      case "REVIEWED":
        return "Reviewed";
      case "INTERVIEW":
        return "Interview";
      case "OFFER":
        return "Offer Extended";
      case "REJECTED":
        return "Not Selected";
      case "ACCEPTED":
        return "Accepted";
      default:
        return status;
    }
  };

  const getStatusDescription = (status: string) => {
    switch (status) {
      case "PENDING":
        return "New application awaiting review";
      case "REVIEWED":
        return "Application has been reviewed";
      case "INTERVIEW":
        return "Candidate invited for interview";
      case "OFFER":
        return "Job offer has been extended";
      case "REJECTED":
        return "Application not selected to proceed";
      case "ACCEPTED":
        return "Candidate has accepted the offer";
      default:
        return "";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900">Applications</h1>
            <p className="mt-2 text-sm text-gray-700">
              Review and manage applications from candidates
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-6 flex flex-col sm:flex-row gap-4">
          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700">
              Filter by Status
            </label>
            <select
              id="status-filter"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
            >
              <option value="all">All ({statusCounts.all})</option>
              <option value="PENDING">New ({statusCounts.PENDING})</option>
              <option value="REVIEWED">Reviewed ({statusCounts.REVIEWED})</option>
              <option value="INTERVIEW">Interview ({statusCounts.INTERVIEW})</option>
              <option value="OFFER">Offer Extended ({statusCounts.OFFER})</option>
              <option value="REJECTED">Not Selected ({statusCounts.REJECTED})</option>
            </select>
          </div>

          <div>
            <label htmlFor="job-filter" className="block text-sm font-medium text-gray-700">
              Filter by Job
            </label>
            <select
              id="job-filter"
              value={selectedJob}
              onChange={(e) => setSelectedJob(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
            >
              <option value="all">All Jobs</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title} - {job.location}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Applications List */}
        <div className="mt-8">
          {filteredApplications.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <BriefcaseIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No applications found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {selectedStatus !== "all" || selectedJob !== "all"
                  ? "Try adjusting your filters"
                  : "Applications will appear here when candidates apply to your jobs"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredApplications.map((application) => (
                <div
                  key={application.id}
                  className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        <UserCircleIcon className="h-12 w-12 text-gray-400" />
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            {application.candidate.firstName || application.candidate.lastName
                              ? `${application.candidate.firstName || ""} ${
                                  application.candidate.lastName || ""
                                }`.trim()
                              : application.candidate.email}
                          </h3>
                          {application.candidate.candidateProfile?.title && (
                            <p className="text-sm text-gray-500">
                              {application.candidate.candidateProfile.title}
                            </p>
                          )}
                          <p className="text-sm text-gray-500">{application.candidate.email}</p>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="text-sm">
                          <span className="font-medium text-gray-900">Job:</span>{" "}
                          <Link
                            href={`/dashboard/employer/jobs/${application.job.urlSlug}`}
                            className="text-blue-600 hover:text-blue-500"
                          >
                            {application.job.title}
                          </Link>
                        </div>
                        <div className="text-sm">
                          <span className="font-medium text-gray-900">Location:</span>{" "}
                          {application.job.location}
                        </div>
                        <div className="text-sm">
                          <span className="font-medium text-gray-900">Applied:</span>{" "}
                          {new Date(application.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-sm">
                          <span className="font-medium text-gray-900">Experience:</span>{" "}
                          {application.candidate.candidateProfile?.yearsOfExperience
                            ? `${application.candidate.candidateProfile.yearsOfExperience} years`
                            : "Not specified"}
                        </div>
                      </div>

                      {application.message && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium text-gray-900">Message from Candidate:</h4>
                          <p className="mt-1 text-sm text-gray-600">{application.message}</p>
                        </div>
                      )}

                      <div className="mt-4 flex items-center gap-4">
                        <a
                          href={application.resumeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500"
                        >
                          <DocumentArrowDownIcon className="mr-1 h-4 w-4" />
                          Download Resume
                        </a>
                        {application.coverLetterUrl && (
                          <a
                            href={application.coverLetterUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500"
                          >
                            <DocumentArrowDownIcon className="mr-1 h-4 w-4" />
                            Download Cover Letter
                          </a>
                        )}
                        <Link
                          href={`/dashboard/view-profile/${application.candidate.id}`}
                          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500"
                        >
                          <UserCircleIcon className="mr-1 h-4 w-4" />
                          View Profile
                        </Link>
                      </div>
                    </div>

                    <div className="ml-4 flex flex-col items-end gap-2 min-w-[200px]">
                      <div className="w-full">
                        <label htmlFor={`status-${application.id}`} className="block text-xs font-medium text-gray-700 mb-1">
                          Application Status
                        </label>
                        <div className="relative">
                          <select
                            id={`status-${application.id}`}
                            value={application.status}
                            onChange={(e) => updateApplicationStatus(application.id, e.target.value)}
                            disabled={updatingStatus === application.id}
                            className={`block w-full rounded-md border-gray-300 py-1.5 pl-3 pr-8 text-sm font-medium shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                              application.status === 'PENDING' ? 'bg-gray-50 text-gray-700 border-gray-300' :
                              application.status === 'REVIEWED' ? 'bg-yellow-50 text-yellow-700 border-yellow-300' :
                              application.status === 'INTERVIEW' ? 'bg-blue-50 text-blue-700 border-blue-300' :
                              application.status === 'OFFER' ? 'bg-green-50 text-green-700 border-green-300' :
                              application.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-300' :
                              application.status === 'ACCEPTED' ? 'bg-green-50 text-green-700 border-green-300' :
                              'bg-gray-50 text-gray-700 border-gray-300'
                            }`}
                          >
                            <option value="PENDING">New Application</option>
                            <option value="REVIEWED">Under Review</option>
                            <option value="INTERVIEW">Interview Stage</option>
                            <option value="OFFER">Offer Extended</option>
                            <option value="REJECTED">Not Selected</option>
                            <option value="ACCEPTED">Offer Accepted</option>
                          </select>
                          {updatingStatus === application.id && (
                            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                              <div className="animate-spin h-4 w-4 border-2 border-gray-500 border-t-transparent rounded-full"></div>
                            </div>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          {getStatusDescription(application.status)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 