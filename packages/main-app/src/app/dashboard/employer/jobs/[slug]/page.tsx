"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  MapPinIcon,
  CurrencyDollarIcon,
  BuildingOfficeIcon,
  ClockIcon,
  CalendarIcon,
  CheckIcon,
  BookmarkIcon,
  ArrowLeftIcon,
  UserGroupIcon,
  BriefcaseIcon,
} from "@heroicons/react/24/outline";
import { BookmarkIcon as BookmarkSolidIcon } from "@heroicons/react/24/solid";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormattedJobDescription } from "@/components/ui/rich-text-editor";

interface JobDetails {
  id: string;
  title: string;
  professionalRole: string;
  description: string;
  exceptionalOpportunity?: string;
  location: string;
  requirements: string[];
  salary: {
    min: number;
    max: number;
    currency: string;
  };
  status: string;
  jobType: string;
  employmentType: string;
  featured: boolean;
  createdAt: string;
  expiresAt: string;
  urlSlug: string;
  employer: {
    firstName: string;
    lastName: string;
    employerProfile: {
      companyName: string;
      description?: string;
      website?: string;
      logoUrl?: string;
      location?: string;
      publicSlug?: string;
    };
  };
  applications?: any[];
  isBookmarked?: boolean;
}

export default function JobDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [job, setJob] = useState<JobDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params?.slug) {
      fetchJobDetails(params.slug as string);
    }
  }, [params?.slug]);

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

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="bg-white rounded-lg shadow p-8">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {error || "Job not found"}
        </h1>
        <p className="text-gray-600 mb-6">
                        The job you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        <Button onClick={() => router.push('/dashboard/employer/jobs')}>
          View All Jobs
        </Button>
      </div>
    );
  }

  return (
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

            <div className="flex items-center gap-2">
              <CurrencyDollarIcon className="h-5 w-5 text-green-600" />
              <span className="text-xl font-semibold text-green-600">
                {formatSalary(job.salary)}
              </span>
              <span className="text-sm text-gray-500">per year</span>
            </div>
          </div>
        </div>
      </div>

      {/* Job Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Exceptional Opportunity */}
          {job.exceptionalOpportunity && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-blue-900 mb-3 flex items-center">
                <span className="mr-2">✨</span>
                What makes this an exceptional opportunity
              </h2>
              <p className="text-blue-800 leading-relaxed">
                {job.exceptionalOpportunity}
              </p>
            </div>
          )}

          {/* Description */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Job Description</h2>
            <FormattedJobDescription text={job.description} />
          </div>

          {/* Requirements */}
          {job.requirements && job.requirements.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Requirements</h2>
              <ul className="space-y-2">
                {job.requirements.map((requirement, index) => (
                  <li key={index} className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{requirement}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Employer Info */}
          {(job.employer.employerProfile.description || job.employer.employerProfile.website || job.employer.employerProfile.publicSlug) && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">About the Employer</h3>
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
                {job.employer.employerProfile.publicSlug && (
                  <Link
                    href={`/employers/${job.employer.employerProfile.publicSlug}/jobs`}
                    className="text-sm text-blue-600 hover:text-blue-500"
                  >
                    View All Jobs
                  </Link>
                )}
              </div>
            </div>
          )}

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
  );
} 