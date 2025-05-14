"use client";

import { useState, useEffect } from "react";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  BuildingOfficeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { BookmarkIcon } from "@heroicons/react/24/solid";

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
  createdAt: string;
  employer: {
    firstName: string;
    lastName: string;
    employerProfile: {
      companyName: string;
    };
  };
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
  salaryRanges: [
    "Under $50,000",
    "$50,000 - $100,000",
    "$100,000 - $150,000",
    "$150,000+",
  ],
};

export default function JobSearchPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilters, setSelectedFilters] = useState({
    location: [] as string[],
    jobType: [] as string[],
    salaryRange: [] as string[],
  });
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    pages: 1,
    page: 1,
    limit: 10,
  });

  useEffect(() => {
    fetchJobs(1);
  }, [searchTerm, selectedFilters]);

  const fetchJobs = async (page: number) => {
    try {
      setLoading(true);
      const searchParams = new URLSearchParams();
      if (searchTerm) searchParams.append("search", searchTerm);
      if (selectedFilters.location.length > 0) {
        searchParams.append("location", selectedFilters.location[0]);
      }
      searchParams.append("page", page.toString());

      const response = await fetch(`/api/jobs?${searchParams.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch jobs");
      
      const data = await response.json();
      setJobs(data.jobs);
      setPagination(data.pagination);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch jobs");
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleFilter = (category: keyof typeof selectedFilters, value: string) => {
    setSelectedFilters((prev) => {
      const current = prev[category];
      return {
        ...prev,
        [category]: current.includes(value)
          ? current.filter((item) => item !== value)
          : [...current, value],
      };
    });
  };

  const formatSalary = (salary: Job["salary"]) => {
    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: salary.currency,
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
            <button
              type="button"
              className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              <FunnelIcon
                className="h-5 w-5 text-gray-400 mr-2"
                aria-hidden="true"
              />
              Filters
            </button>
          </div>

          {/* Filter Tags */}
          <div className="mt-2 flex flex-wrap gap-2">
            {Object.entries(selectedFilters).map(([category, values]) =>
              values.map((value) => (
                <span
                  key={`${category}-${value}`}
                  className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700"
                >
                  {value}
                  <button
                    type="button"
                    onClick={() =>
                      toggleFilter(
                        category as keyof typeof selectedFilters,
                        value
                      )
                    }
                    className="ml-1 inline-flex h-4 w-4 flex-shrink-0 rounded-full p-1 text-blue-700 hover:bg-blue-200 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <span className="sr-only">Remove filter for {value}</span>×
                  </button>
                </span>
              ))
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
              <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                    <div className="divide-y divide-gray-200 bg-white">
                      {jobs.map((job) => (
                        <div
                          key={job.id}
                          className="p-4 sm:px-6 hover:bg-gray-50 transition duration-150 ease-in-out"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h3 className="text-lg font-medium leading-6 text-gray-900">
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
                                  className="rounded-full p-1 text-gray-400 hover:text-gray-500"
                                >
                                  <BookmarkIcon className="h-6 w-6" />
                                </button>
                              </div>
                              <div className="mt-2">
                                <p className="text-sm text-gray-500">
                                  {job.description}
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
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

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
      </div>
    </div>
  );
} 