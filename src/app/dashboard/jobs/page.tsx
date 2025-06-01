"use client";

import { useState, useEffect, useCallback } from "react";
import * as React from "react";
import { useRouter } from "next/navigation";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  BuildingOfficeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ListBulletIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";
import { BookmarkIcon } from "@heroicons/react/24/solid";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Label,
} from "@/components/ui/label";
import {
  Button,
} from "@/components/ui/button";
import { FilterProvider, useFilters } from "@/contexts/FilterContext";
import { FilterModal } from "@/components/FilterModal";
import { truncateWords } from "@/lib/utils";

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
  urlSlug: string;
  employer: {
    firstName: string;
    lastName: string;
    employerProfile: {
      companyName: string;
    };
  };
  isBookmarked?: boolean;
}

interface PaginationData {
  total: number;
  pages: number;
  page: number;
  limit: number;
}

const filters = {
  locations: [
    "New York, NY",
    "Los Angeles, CA",
    "Miami, FL",
    "San Francisco, CA",
    "Chicago, IL",
  ],
  jobTypes: ["Full-time", "Part-time", "Contract", "Temporary"],
  employmentTypes: ["On-site", "Remote", "Hybrid"],
  salaryRanges: [
    { label: "Under $50,000", min: 0, max: 50000 },
    { label: "$50,000 - $100,000", min: 50000, max: 100000 },
    { label: "$100,000 - $150,000", min: 100000, max: 150000 },
    { label: "$150,000 - $200,000", min: 150000, max: 200000 },
    { label: "$200,000+", min: 200000, max: null },
  ],
  statuses: ["ACTIVE", "FILLED", "EXPIRED"],
  sortOptions: [
    { value: "recent", label: "Most Recent" },
    { value: "salary-high", label: "Highest Salary" },
    { value: "salary-low", label: "Lowest Salary" },
    { value: "oldest", label: "Oldest" },
  ],
};

type ViewMode = "list" | "grid";

const FilterButton = React.memo(({ 
  children, 
  isSelected, 
  onClick 
}: { 
  children: React.ReactNode;
  isSelected: boolean; 
  onClick: (e: React.MouseEvent) => void;
}) => (
  <button
    type="button"
    onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      onClick(e);
    }}
    className={`px-3 py-1 rounded-full text-sm transition-colors ${
      isSelected
        ? "bg-blue-100 text-blue-800"
        : "bg-gray-100 text-gray-800"
    }`}
  >
    {children}
  </button>
));

FilterButton.displayName = 'FilterButton';

function JobSearchPageContent() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [searchTerm, setSearchTerm] = useState("");
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    pages: 1,
    page: 1,
    limit: 10,
  });

  const { filters: selectedFilters, toggleFilter } = useFilters();

  // Set default view mode based on screen size
  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 640px)');
    setViewMode(mediaQuery.matches ? 'grid' : 'list');

    const handleResize = (e: MediaQueryListEvent) => {
      setViewMode(e.matches ? 'grid' : 'list');
    };

    mediaQuery.addEventListener('change', handleResize);
    return () => mediaQuery.removeEventListener('change', handleResize);
  }, []);

  useEffect(() => {
    fetchJobs(1);
  }, [searchTerm, selectedFilters]);

  const fetchJobs = async (page: number) => {
    try {
      setLoading(true);
      const searchParams = new URLSearchParams();
      
      console.log('Current filters:', selectedFilters);
      
      if (searchTerm) searchParams.append("search", searchTerm);
      
      // Handle location filters
      if (selectedFilters.location.length > 0) {
        const locationParam = selectedFilters.location.join(',');
        console.log('Sending locations:', locationParam);
        searchParams.append("location", locationParam);
      }
      
      // Handle other filters
      if (selectedFilters.jobType.length > 0) {
        searchParams.append("jobType", selectedFilters.jobType.join(','));
      }
      if (selectedFilters.employmentType.length > 0) {
        searchParams.append("employmentType", selectedFilters.employmentType.join(','));
      }
      if (selectedFilters.status.length > 0) {
        searchParams.append("status", selectedFilters.status.join(','));
      }
      if (selectedFilters.salaryRange.length > 0) {
        const [min, max] = selectedFilters.salaryRange[0].split("-").map(Number);
        if (min) searchParams.append("salaryMin", min.toString());
        if (max) searchParams.append("salaryMax", max.toString());
      }
      searchParams.append("sortBy", selectedFilters.sortBy);
      searchParams.append("page", page.toString());

      const queryString = searchParams.toString();
      console.log('Fetching jobs with params:', queryString);

      const response = await fetch(`/api/jobs?${queryString}`);
      if (!response.ok) throw new Error("Failed to fetch jobs");
      
      const data = await response.json();
      console.log('Jobs response:', data);
      
      const jobsWithBookmarks = await Promise.all(
        data.jobs.map(async (job: Job) => {
          const bookmarkResponse = await fetch(`/api/jobs/${job.urlSlug}/bookmark`);
          if (bookmarkResponse.ok) {
            const { bookmarked } = await bookmarkResponse.json();
            return { ...job, isBookmarked: bookmarked };
          }
          return { ...job, isBookmarked: false };
        })
      );

      setJobs(jobsWithBookmarks);
      setPagination(data.pagination);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch jobs");
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBookmark = async (jobSlug: string) => {
    try {
      const response = await fetch(`/api/jobs/${jobSlug}/bookmark`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to bookmark job');

      const { bookmarked } = await response.json();
      
      // Update the jobs state to reflect the new bookmark status
      setJobs(jobs.map(job => 
        job.urlSlug === jobSlug ? { ...job, isBookmarked: bookmarked } : job
      ));
    } catch (error) {
      console.error('Error bookmarking job:', error);
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

  const handleJobClick = (job: Job) => {
    router.push(`/dashboard/jobs/${job.urlSlug}`);
  };

  const JobCard = ({ job, isLoading }: { job: Job; isLoading?: boolean }) => (
    <div 
      className={`bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow duration-200 cursor-pointer ${
        job.featured ? 'border-2 border-blue-500 relative' : ''
      } ${isLoading ? 'opacity-50' : ''}`}
      onClick={() => handleJobClick(job)}
    >
      {job.featured && (
        <div className="absolute -top-3 left-4">
          <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-0.5 text-sm font-medium text-blue-800">
            Featured
          </span>
        </div>
      )}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-medium text-gray-900 hover:text-blue-600 transition-colors">{job.title}</h3>
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
          onClick={(e) => {
            e.stopPropagation();
            handleBookmark(job.urlSlug);
          }}
          className={`rounded-full p-1 ${
            job.isBookmarked ? 'text-blue-600' : 'text-gray-400 hover:text-gray-500'
          }`}
        >
          <BookmarkIcon className="h-6 w-6" />
        </button>
      </div>
      <p className="mt-4 text-sm text-gray-500 line-clamp-3">{truncateWords(job.description, 60)}</p>
      
      <div className="flex flex-wrap gap-2">
        {job.requirements.slice(0, 3).map((req, index) => (
          <span
            key={index}
            className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800"
          >
            {req}
          </span>
        ))}
        {job.requirements.length > 3 && (
          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
            +{job.requirements.length - 3} more
          </span>
        )}
      </div>
      <div className="mt-2 text-xs text-gray-500">
        Posted {formatDate(job.createdAt)}
      </div>
    </div>
  );

  const JobListItem = ({ job, isLoading }: { job: Job; isLoading?: boolean }) => (
    <div
      className={`p-4 sm:px-6 hover:bg-gray-50 transition duration-150 ease-in-out cursor-pointer ${
        job.featured ? 'bg-blue-50 relative pt-8' : ''
      } ${isLoading ? 'opacity-50' : ''}`}
      onClick={() => handleJobClick(job)}
    >
      {job.featured && (
        <div className="absolute top-2 left-4">
          <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-0.5 text-sm font-medium text-blue-800">
            Featured
          </span>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium leading-6 text-gray-900 hover:text-blue-600 transition-colors">
                {job.title}
              </h3>
              <div className="mt-1 flex items-center">
                <BuildingOfficeIcon className="h-4 w-4 text-gray-400" />
                <p className="ml-1 text-sm text-gray-500">
                  {job.employer.employerProfile.companyName}
                </p>
                <MapPinIcon className="ml-4 h-4 w-4 text-gray-400" />
                <p className="ml-1 text-sm text-gray-500">
                  {job.location}
                </p>
                <CurrencyDollarIcon className="ml-4 h-4 w-4 text-gray-400" />
                <p className="ml-1 text-sm text-gray-500">
                  {formatSalary(job.salary)}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleBookmark(job.urlSlug);
              }}
              className={`rounded-full p-1 ${
                job.isBookmarked ? 'text-blue-600' : 'text-gray-400 hover:text-gray-500'
              }`}
            >
              <BookmarkIcon className="h-6 w-6" />
            </button>
          </div>
          
          <p className="text-sm text-gray-500">
            {truncateWords(job.description, 60)}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {job.requirements.map((req, index) => (
              <span
                key={index}
                className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800"
              >
                {req}
              </span>
            ))}
            <span className="ml-2 text-xs text-gray-500">
              Posted {formatDate(job.createdAt)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="lg:flex lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
              Job Search
            </h2>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mt-4">
          <div className="flex space-x-4">
            <div className="flex-1">
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <MagnifyingGlassIcon
                    className="h-5 w-5 text-gray-400"
                    aria-hidden="true"
                  />
                </div>
                <input
                  type="text"
                  className="block w-full rounded-md border-0 py-3 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                  placeholder="Search jobs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center rounded-lg border border-gray-200 p-1">
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded ${
                    viewMode === "list"
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  <ListBulletIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded ${
                    viewMode === "grid"
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  <Squares2X2Icon className="h-5 w-5" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => setIsFilterModalOpen(true)}
                className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                <FunnelIcon
                  className="h-5 w-5 text-gray-400 mr-2"
                  aria-hidden="true"
                />
                Filters
                {Object.values(selectedFilters).flat().length > 1 && (
                  <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                    {Object.values(selectedFilters).flat().length - 1}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Filter Tags */}
          <div className="mt-4 flex flex-wrap gap-2">
            {Object.entries(selectedFilters).map(([category, values]) =>
              Array.isArray(values) && values.length > 0 ? values.map((value) => (
                <span
                  key={`${category}-${value}`}
                  className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700"
                >
                  {value}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const filterCategory = category as keyof typeof selectedFilters;
                      toggleFilter(filterCategory, value);
                    }}
                    className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full text-blue-700 hover:bg-blue-200 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <span className="sr-only">Remove filter for {value}</span>
                    <span className="leading-none relative -top-[1px]">×</span>
                  </button>
                </span>
              )) : null
            )}
          </div>
        </div>

        {/* Job Listings */}
        <div className="mt-8">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-500">Loading jobs...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500">{error}</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No jobs found matching your criteria.</p>
            </div>
          ) : (
            <>
              {viewMode === "list" ? (
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                  <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                    <div className="space-y-4">
                      {jobs.map((job) => (
                        <div 
                          key={job.id} 
                          className={`overflow-hidden shadow sm:rounded-lg ${
                            job.featured ? 'ring-2 ring-blue-500' : 'ring-1 ring-black ring-opacity-5'
                          }`}
                        >
                          <JobListItem job={job} isLoading={loading} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {jobs.map((job) => (
                    <JobCard key={job.id} job={job} isLoading={loading} />
                  ))}
                </div>
              )}

              {/* Pagination Controls */}
              <div className="mt-4 flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
                <div className="flex flex-1 justify-between sm:hidden">
                  <button
                    onClick={() => fetchJobs(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => fetchJobs(pagination.page + 1)}
                    disabled={pagination.page >= pagination.pages}
                    className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
                      <span className="font-medium">
                        {Math.min(pagination.page * pagination.limit, pagination.total)}
                      </span>{' '}
                      of <span className="font-medium">{pagination.total}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                      <button
                        onClick={() => fetchJobs(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Previous</span>
                        <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                      </button>
                      <button
                        onClick={() => fetchJobs(pagination.page + 1)}
                        disabled={pagination.page >= pagination.pages}
                        className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Next</span>
                        <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <FilterModal
          isOpen={isFilterModalOpen}
          onClose={() => setIsFilterModalOpen(false)}
          filters={filters}
        />
      </div>
    </div>
  );
}

export default function JobSearchPage() {
  return (
    <FilterProvider>
      <JobSearchPageContent />
    </FilterProvider>
  );
} 