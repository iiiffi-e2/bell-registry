"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { BuildingOfficeIcon, MapPinIcon, BriefcaseIcon, UserGroupIcon, ClockIcon } from "@heroicons/react/24/outline";
import { getTimeAgo } from "@/lib/utils";

interface JobDetails {
  id: string;
  title: string;
  professionalRole: string;
  description: string;
  location: string;
  requirements: string[];
  salary: {
    min: number;
    max: number;
    currency: string;
  };
  jobType: string;
  employmentType: string;
  featured: boolean;
  createdAt: string;
  expiresAt: string;
  employer: {
    employerProfile: {
      companyName: string;
      description: string;
      website: string;
      location: string;
    };
  };
  isBookmarked: boolean;
  hasApplied: boolean;
}

export default function PublicJobDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [job, setJob] = useState<JobDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const viewTrackedRef = useRef(false); // Track if we've already recorded a view for this page load

  useEffect(() => {
    if (params.slug) {
      fetchJobDetails(params.slug as string);
    }
  }, [params.slug]);

  useEffect(() => {
    // Reset view tracking when slug changes
    viewTrackedRef.current = false;
  }, [params.slug]);

  const fetchJobDetails = async (slug: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/jobs/details/${slug}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Job not found");
        }
        throw new Error("Failed to fetch job details");
      }

      const data = await response.json();
      setJob(data.job);
      setError(null);

      // Track job view after successfully fetching the job details
      // Only track once per page load
      if (data.job?.id && !viewTrackedRef.current) {
        viewTrackedRef.current = true; // Mark as tracked to prevent duplicates
        try {
          const viewResponse = await fetch(`/api/jobs/${slug}/view`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          if (viewResponse.ok) {
            const viewData = await viewResponse.json();
            console.log('View tracking result:', viewData); // Debug logging
          }
        } catch (viewError) {
          // Silently fail if view tracking doesn't work
          console.error("Failed to track job view:", viewError);
          viewTrackedRef.current = false; // Reset on error so we can try again
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch job details");
      setJob(null);
    } finally {
      setLoading(false);
    }
  };

  const formatSalary = (salary: JobDetails["salary"]) => {
    if (!salary || !salary.min || !salary.max) return 'Salary not specified';
    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: salary.currency || "USD",
      maximumFractionDigits: 0,
    });
    return `${formatter.format(salary.min)} - ${formatter.format(salary.max)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Job Not Found</h2>
        <p className="text-gray-600 mb-4">{error || "The job you're looking for doesn't exist or has been removed."}</p>
        <button
          onClick={() => router.push("/jobs")}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Browse Jobs
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{job.title}</h1>
                {job.featured && (
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-0.5 text-sm font-medium text-blue-800">
                    Featured
                  </span>
                )}
              </div>
              
              <div className="text-lg text-gray-600 mb-4">{job.professionalRole}</div>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                <div className="flex items-center">
                  <BuildingOfficeIcon className="h-4 w-4 text-gray-400 mr-1" />
                  {job.employer.employerProfile.companyName}
                </div>
                <div className="flex items-center">
                  <MapPinIcon className="h-4 w-4 text-gray-400 mr-1" />
                  {job.location}
                </div>
                <div className="flex items-center">
                  <BriefcaseIcon className="h-4 w-4 text-gray-400 mr-1" />
                  {job.jobType}
                </div>
                <div className="flex items-center">
                  <UserGroupIcon className="h-4 w-4 text-gray-400 mr-1" />
                  {job.employmentType}
                </div>
                <div className="flex items-center">
                  <ClockIcon className="h-4 w-4 text-gray-400 mr-1" />
                  Posted {getTimeAgo(job.createdAt)}
                </div>
              </div>

              <div className="text-lg font-semibold text-gray-900 mb-2">
                {formatSalary(job.salary)}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Job Description */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Description</h3>
              <div className="prose max-w-none">
                <p className="whitespace-pre-wrap">{job.description}</p>
              </div>
            </div>

            {/* Requirements */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Requirements</h3>
              <ul className="list-disc list-inside space-y-2">
                {job.requirements.map((requirement, index) => (
                  <li key={index} className="text-gray-700">{requirement}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="space-y-6">
            {/* Company Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">About the Company</h3>
              <div className="space-y-3">
                <div>
                  <p className="font-medium text-gray-900">
                    {job.employer.employerProfile.companyName}
                  </p>
                  {job.employer.employerProfile.location && (
                    <p className="text-sm text-gray-600">
                      {job.employer.employerProfile.location}
                    </p>
                  )}
                </div>
                {job.employer.employerProfile.description && (
                  <p className="text-sm text-gray-700">
                    {job.employer.employerProfile.description}
                  </p>
                )}
                {job.employer.employerProfile.website && (
                  <a
                    href={job.employer.employerProfile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-500"
                  >
                    Visit Company Website
                  </a>
                )}
              </div>
            </div>

            {/* Job Details */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Job Type:</span>
                  <span className="font-medium">{job.jobType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Work Type:</span>
                  <span className="font-medium">{job.employmentType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Posted:</span>
                  <span className="font-medium">{formatDate(job.createdAt)}</span>
                </div>
                {job.expiresAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Expires:</span>
                    <span className="font-medium">{formatDate(job.expiresAt)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 