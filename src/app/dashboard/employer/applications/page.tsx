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

  useEffect(() => {
    if (session?.user?.role !== "EMPLOYER") {
      router.push("/dashboard");
      return;
    }
    fetchApplications();
    fetchJobs();
  }, [session, router]);

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
      }
    } catch (error) {
      console.error("Error updating application status:", error);
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
                            href={`/jobs/${application.job.urlSlug}`}
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
                          href={`/api/files/applications/${application.resumeUrl.split('/').pop()}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500"
                        >
                          <DocumentArrowDownIcon className="mr-1 h-4 w-4" />
                          Download Resume
                        </a>
                        {application.coverLetterUrl && (
                          <a
                            href={`/api/files/applications/${application.coverLetterUrl.split('/').pop()}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500"
                          >
                            <DocumentArrowDownIcon className="mr-1 h-4 w-4" />
                            Download Cover Letter
                          </a>
                        )}
                        <Link
                          href={`/dashboard/employer/candidates/${application.candidate.id}`}
                          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500"
                        >
                          <UserCircleIcon className="mr-1 h-4 w-4" />
                          View Profile
                        </Link>
                      </div>
                    </div>

                    <div className="ml-4 flex flex-col items-end gap-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          application.status
                        )}`}
                      >
                        {getStatusLabel(application.status)}
                      </span>

                      {application.status === "PENDING" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateApplicationStatus(application.id, "REVIEWED")}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                          >
                            Mark as Reviewed
                          </button>
                        </div>
                      )}

                      {application.status === "REVIEWED" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateApplicationStatus(application.id, "INTERVIEW")}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircleIcon className="mr-1 h-3 w-3" />
                            Interview
                          </button>
                          <button
                            onClick={() => updateApplicationStatus(application.id, "REJECTED")}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                          >
                            <XCircleIcon className="mr-1 h-3 w-3" />
                            Reject
                          </button>
                        </div>
                      )}

                      {application.status === "INTERVIEW" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateApplicationStatus(application.id, "OFFER")}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                          >
                            Make Offer
                          </button>
                          <button
                            onClick={() => updateApplicationStatus(application.id, "REJECTED")}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                          >
                            Reject
                          </button>
                        </div>
                      )}
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