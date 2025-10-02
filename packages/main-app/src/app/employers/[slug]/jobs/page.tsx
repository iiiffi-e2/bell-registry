/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  MapPinIcon,
  CurrencyDollarIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
  UserGroupIcon,
  ClockIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { PublicNavigation } from "@/components/PublicNavigation";
import { stripHtmlAndTruncate } from "@/lib/utils";

interface Job {
  id: string;
  title: string;
  description: string;
  location: string;
  requirements: string[];
  salary?: string;
  compensation: string[];
  status: string;
  featured: boolean;
  createdAt: string;
  urlSlug: string;
  jobType: string;
  employmentType: string;
  professionalRole: string;
  employer: {
    firstName: string;
    lastName: string;
    employerProfile: {
      companyName: string;
      logoUrl: string;
      location: string;
    };
  };
}

interface Employer {
  companyName: string;
  description: string;
  website: string;
  logoUrl: string;
  location: string;
  publicSlug: string;
}

interface PaginationData {
  total: number;
  pages: number;
  page: number;
  limit: number;
}

// formatSalary function removed - salary no longer displayed

function getTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return date.toLocaleDateString();
}

export default function EmployerJobsPage() {
  const params = useParams();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [employer, setEmployer] = useState<Employer | null>(null);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/employers/${params.slug}/jobs?page=${currentPage}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError("Employer not found");
          } else {
            setError("Failed to load jobs");
          }
          return;
        }

        const data = await response.json();
        setJobs(data.jobs);
        setEmployer(data.employer);
        setPagination(data.pagination);
      } catch (error) {
        console.error("Error fetching jobs:", error);
        setError("Failed to load jobs");
      } finally {
        setLoading(false);
      }
    };

    if (params.slug) {
      fetchJobs();
    }
  }, [params.slug, currentPage]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PublicNavigation />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow p-6">
                    <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PublicNavigation />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <Link
              href="/jobs"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Browse All Jobs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!employer) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PublicNavigation />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Employer Not Found</h1>
            <p className="text-gray-600 mb-4">The employer you&apos;re looking for doesn&apos;t exist.</p>
            <Link
              href="/jobs"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Browse All Jobs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicNavigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center gap-4 mb-4">
              {employer.logoUrl && (
                <img
                  src={employer.logoUrl}
                  alt={`${employer.companyName} logo`}
                  className="w-16 h-16 rounded-lg object-cover"
                />
              )}
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{employer.companyName}</h1>
                {employer.location && (
                  <p className="text-gray-600 flex items-center gap-1">
                    <MapPinIcon className="h-4 w-4" />
                    {employer.location}
                  </p>
                )}
              </div>
            </div>
            
            {employer.description && (
              <p className="text-gray-700 mb-4">{employer.description}</p>
            )}
            
            {employer.website && (
              <a
                href={employer.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Visit Website
              </a>
            )}
          </div>

          {/* Jobs List */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">
                Open Positions ({pagination?.total || 0})
              </h2>
            </div>

            {jobs.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-600">No open positions at the moment.</p>
                <p className="text-gray-500 text-sm mt-2">Check back later for new opportunities.</p>
              </div>
            ) : (
              <>
                {jobs.map((job) => (
                  <div key={job.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            <Link
                              href={`/jobs/${job.urlSlug}`}
                              className="hover:text-blue-600 transition-colors"
                            >
                              {job.title}
                            </Link>
                          </h3>
                          
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
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

                          {/* Salary display removed */}

                          <p className="text-gray-700 text-sm leading-relaxed">
                            {stripHtmlAndTruncate(job.description, 30)}
                          </p>
                        </div>
                        
                        {job.featured && (
                          <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-0.5 text-sm font-medium text-blue-800">
                            Featured
                          </span>
                        )}
                      </div>

                      <div className="flex justify-between items-center">
                        <Link
                          href={`/jobs/${job.urlSlug}`}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                        >
                          View Job
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Pagination */}
                {pagination && pagination.pages > 1 && (
                  <div className="flex justify-center items-center space-x-2 mt-8">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeftIcon className="h-4 w-4" />
                    </button>
                    
                    <span className="text-sm text-gray-700">
                      Page {currentPage} of {pagination.pages}
                    </span>
                    
                    <button
                      onClick={() => setCurrentPage(Math.min(pagination.pages, currentPage + 1))}
                      disabled={currentPage === pagination.pages}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRightIcon className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 