"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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

interface JobDetails {
  id: string;
  title: string;
  description: string;
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
  const [isApplying, setIsApplying] = useState(false);
  const [applicationSuccess, setApplicationSuccess] = useState(false);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");

  useEffect(() => {
    if (params.slug) {
      fetchJobDetails(params.slug as string);
    }
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch job details");
      setJob(null);
    } finally {
      setLoading(false);
    }
  };

  const handleBookmark = async () => {
    if (!job) return;

    try {
      const response = await fetch(`/api/jobs/${job.id}/bookmark`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to bookmark job');

      const { bookmarked } = await response.json();
      setJob({ ...job, isBookmarked: bookmarked });
    } catch (error) {
      console.error('Error bookmarking job:', error);
    }
  };

  const handleApply = async () => {
    if (!job) return;

    try {
      setIsApplying(true);
      const response = await fetch(`/api/jobs/${job.id}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coverLetter }),
      });

      if (!response.ok) throw new Error('Failed to apply for job');

      setApplicationSuccess(true);
      setShowApplicationModal(false);
      setCoverLetter("");
    } catch (error) {
      console.error('Error applying for job:', error);
    } finally {
      setIsApplying(false);
    }
  };

  const formatSalary = (salary: JobDetails["salary"]) => {
    if (!salary || !salary.min || !salary.max) return 'Salary not specified';
    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: salary.currency,
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
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
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
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-blue-600 hover:text-blue-500 mb-6"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Jobs
          </button>
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {error || "Job not found"}
            </h1>
            <p className="text-gray-600 mb-6">
              The job you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => router.push('/dashboard/jobs')}>
              Browse All Jobs
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Back Navigation */}
        <button
          onClick={() => router.back()}
          className="flex items-center text-blue-600 hover:text-blue-500 mb-6"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Jobs
        </button>

        {/* Success Message */}
        {applicationSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <CheckIcon className="h-5 w-5 text-green-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  Application submitted successfully!
                </p>
                <p className="text-sm text-green-700 mt-1">
                  The employer will review your application and get back to you soon.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Header */}
          <div className="px-8 py-6 border-b border-gray-200">
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

              <div className="flex items-center gap-3">
                <button
                  onClick={handleBookmark}
                  className={`p-2 rounded-full ${
                    job.isBookmarked 
                      ? 'text-blue-600 bg-blue-50' 
                      : 'text-gray-400 hover:text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {job.isBookmarked ? (
                    <BookmarkSolidIcon className="h-6 w-6" />
                  ) : (
                    <BookmarkIcon className="h-6 w-6" />
                  )}
                </button>
                <Button
                  onClick={() => setShowApplicationModal(true)}
                  size="lg"
                  className="px-8"
                >
                  Apply Now
                </Button>
              </div>
            </div>
          </div>

          {/* Job Details */}
          <div className="px-8 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-8">
                {/* Description */}
                <section>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Job Description</h2>
                  <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {job.description}
                  </div>
                </section>

                {/* Requirements */}
                <section>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Requirements</h2>
                  <ul className="space-y-2">
                    {job.requirements.map((requirement, index) => (
                      <li key={index} className="flex items-start">
                        <CheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{requirement}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Company Info */}
                <div className="bg-gray-50 rounded-lg p-6">
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
                <div className="bg-gray-50 rounded-lg p-6">
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

        {/* Application Modal */}
        <Dialog open={showApplicationModal} onOpenChange={setShowApplicationModal}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Apply for {job.title}</DialogTitle>
              <DialogDescription>
                Submit your application for this position. A cover letter is optional but recommended.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cover Letter (Optional)
              </label>
              <textarea
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                rows={6}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Tell the employer why you're interested in this position and what makes you a great fit..."
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowApplicationModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleApply}
                disabled={isApplying}
              >
                {isApplying ? "Submitting..." : "Submit Application"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
} 