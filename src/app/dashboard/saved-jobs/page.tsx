"use client";

import { useState, useEffect } from "react";
import {
  MapPinIcon,
  CurrencyDollarIcon,
  BuildingOfficeIcon,
  BookmarkIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";

interface Job {
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
  featured: boolean;
  createdAt: string;
  employer: {
    firstName: string;
    lastName: string;
    employerProfile: {
      companyName: string;
    };
  };
  urlSlug: string;
}

export default function SavedJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchSavedJobs();
  }, []);

  const fetchSavedJobs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/jobs/saved');
      if (!response.ok) throw new Error('Failed to fetch saved jobs');
      
      const data = await response.json();
      setJobs(data.jobs);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch saved jobs');
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUnsave = async (jobId: string) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}/bookmark`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to unsave job');
      
      // Remove the job from the list
      setJobs(jobs.filter(job => job.id !== jobId));
    } catch (error) {
      console.error('Error unsaving job:', error);
    }
  };

  const formatSalary = (salary: Job["salary"]) => {
    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: salary.currency || "USD",
      maximumFractionDigits: 0,
    });
    return `${formatter.format(salary.min)} - ${formatter.format(salary.max)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  return (
    <div className="py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:tracking-tight">
              Saved Jobs
            </h2>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading saved jobs...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500">{error}</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-12">
            <BookmarkIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No saved jobs</h3>
            <p className="mt-1 text-sm text-gray-500">
              Start saving jobs you're interested in by clicking the bookmark icon.
            </p>
            <div className="mt-6">
              <button
                type="button"
                onClick={() => router.push('/dashboard/jobs')}
                className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                Browse Jobs
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow duration-200"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{job.title}</h3>
                      <div className="mt-1 flex items-center text-sm text-gray-500">
                        <BuildingOfficeIcon className="h-4 w-4 text-gray-400" />
                        <span className="ml-1">{job.employer.employerProfile.companyName}</span>
                      </div>
                      <div className="mt-1 flex items-center text-sm text-gray-500">
                        <MapPinIcon className="h-4 w-4 text-gray-400" />
                        <span className="ml-1">{job.location}</span>
                      </div>
                      <div className="mt-1 flex items-center text-sm text-gray-500">
                        <CurrencyDollarIcon className="h-4 w-4 text-gray-400" />
                        <span className="ml-1">{formatSalary(job.salary)}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleUnsave(job.id)}
                      className="rounded-full p-1 text-blue-600 hover:text-blue-500"
                    >
                      <BookmarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                  <p className="mt-4 text-sm text-gray-500 line-clamp-3">{job.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {job.requirements.map((req, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800"
                      >
                        {req}
                      </span>
                    ))}
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    Posted {formatDate(job.createdAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 