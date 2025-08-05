"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { BuildingOfficeIcon, MapPinIcon, BriefcaseIcon, UserGroupIcon, ClockIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import { BookmarkIcon as BookmarkSolidIcon } from "@heroicons/react/24/solid";
import { BookmarkIcon } from "@heroicons/react/24/outline";
import { getTimeAgo } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { ApplyJobModal } from "@/components/modals/apply-job-modal";
import { Button } from "@/components/ui/button";
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
  jobType: string;
  employmentType: string;
  featured: boolean;
  createdAt: string;
  expiresAt: string;
  employer: {
    firstName?: string;
    lastName?: string;
    employerProfile: {
      companyName: string;
      description: string;
      website: string;
      location: string;
      publicSlug: string;
    };
  };
  isBookmarked: boolean;
  hasApplied: boolean;
}

export default function DashboardJobDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [job, setJob] = useState<JobDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);
  const viewTrackedRef = useRef(false);

  useEffect(() => {
    if (params?.slug) {
      fetchJobDetails(params.slug as string);
    }
  }, [params?.slug]);

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
      if (data.job?.id && !viewTrackedRef.current) {
        viewTrackedRef.current = true;
        try {
          const viewResponse = await fetch(`/api/jobs/${slug}/view`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          if (viewResponse.ok) {
            const viewData = await viewResponse.json();
            console.log('View tracking result:', viewData);
          }
        } catch (viewError) {
          console.error("Failed to track job view:", viewError);
          viewTrackedRef.current = false;
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch job details");
      setJob(null);
    } finally {
      setLoading(false);
    }
  };

  const handleBookmark = async () => {
    if (!job || isBookmarking) return;

    setIsBookmarking(true);
    try {
      const response = await fetch(`/api/jobs/${job.id}/bookmark`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setJob({
          ...job,
          isBookmarked: !job.isBookmarked
        });
      }
    } catch (error) {
      console.error('Failed to bookmark job:', error);
    } finally {
      setIsBookmarking(false);
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

  const handleApplicationSuccess = () => {
    if (job) {
      setJob({
        ...job,
        hasApplied: true
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
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
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="space-y-6">
        <Button
          variant="outline"
          onClick={() => router.push('/dashboard/jobs')}
          className="flex items-center gap-2"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Jobs
        </Button>
        
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Job Not Found</h2>
                      <p className="text-gray-600 mb-4">{error || "The job you&apos;re looking for doesn&apos;t exist or has been removed."}</p>
          <Button onClick={() => router.push("/dashboard/jobs")}>
            Browse Jobs
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button
        variant="outline"
        onClick={() => router.push('/dashboard/jobs')}
        className="flex items-center gap-2"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back to Jobs
      </Button>

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

            {/* Salary */}
            <div className="flex items-center text-xl font-semibold text-green-600 mb-6">
              <span>{formatSalary(job.salary)}</span>
              <span className="text-sm text-gray-500 ml-2">per year</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 ml-6">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBookmark}
              disabled={isBookmarking}
              className="flex items-center gap-2"
            >
              {job.isBookmarked ? (
                <BookmarkSolidIcon className="h-4 w-4 text-blue-600" />
              ) : (
                <BookmarkIcon className="h-4 w-4" />
              )}
              {job.isBookmarked ? 'Saved' : 'Save'}
            </Button>

            {session?.user?.role === 'PROFESSIONAL' && (
              <Button
                onClick={() => setIsApplyModalOpen(true)}
                disabled={job.hasApplied}
                className={job.hasApplied ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                {job.hasApplied ? 'Applied' : 'Apply Now'}
              </Button>
            )}
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
              <h2 className="text-xl font-bold text-blue-900 mb-3 flex items-center">
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
            <h2 className="text-xl font-bold text-gray-900 mb-4">Job Description</h2>
            <FormattedJobDescription text={job.description} />
          </div>

          {/* Requirements */}
          {job.requirements && job.requirements.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Requirements</h2>
              <ul className="space-y-2">
                {job.requirements.map((requirement, index) => (
                  <li key={index} className="flex items-start">
                    <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3"></div>
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
              <h3 className="text-lg font-bold text-gray-900 mb-4">About the Employer</h3>
              <div className="space-y-3">
                <div>
                  <div className="text-sm font-medium text-gray-500">Company</div>
                  <div className="text-gray-900">{job.employer.employerProfile.companyName}</div>
                </div>
                
                {job.employer.employerProfile.location && (
                  <div>
                    <div className="text-sm font-medium text-gray-500">Location</div>
                    <div className="text-gray-900">{job.employer.employerProfile.location}</div>
                  </div>
                )}

                {job.employer.employerProfile.website && (
                  <div>
                    <div className="text-sm font-medium text-gray-500">Website</div>
                    <a
                      href={job.employer.employerProfile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700"
                    >
                      {job.employer.employerProfile.website}
                    </a>
                  </div>
                )}

                {job.employer.employerProfile.description && (
                  <div>
                    <div className="text-sm font-medium text-gray-500 mb-2">Description</div>
                    <div className="text-gray-700 text-sm">{job.employer.employerProfile.description}</div>
                  </div>
                )}
                
                {job.employer.employerProfile.publicSlug && (
                  <div>
                    <div className="text-sm font-medium text-gray-500">All Jobs</div>
                    <Link
                      href={`/employers/${job.employer.employerProfile.publicSlug}/jobs`}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      View All Jobs
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Job Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Job Details</h3>
            <div className="space-y-3">
              <div>
                <div className="text-sm font-medium text-gray-500">Employment Type</div>
                <div className="text-gray-900">{job.employmentType}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">Job Type</div>
                <div className="text-gray-900">{job.jobType}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">Posted</div>
                <div className="text-gray-900">{formatDate(job.createdAt)}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">Expires</div>
                <div className="text-gray-900">{formatDate(job.expiresAt)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Apply Job Modal */}
      {session?.user?.role === 'PROFESSIONAL' && (
        <ApplyJobModal
          isOpen={isApplyModalOpen}
          onClose={() => setIsApplyModalOpen(false)}
          jobId={job.id}
          jobTitle={job.title}
          onSuccess={handleApplicationSuccess}
        />
      )}
    </div>
  );
} 