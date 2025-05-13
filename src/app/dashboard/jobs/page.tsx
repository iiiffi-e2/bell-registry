"use client";

import { useState } from "react";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  BuildingOfficeIcon,
} from "@heroicons/react/24/outline";
import { BookmarkIcon } from "@heroicons/react/24/solid";

const jobs = [
  {
    id: 1,
    title: "Estate Manager",
    company: "Luxury Estate Services",
    location: "Beverly Hills, CA",
    type: "Full-time",
    salary: "$120,000 - $180,000",
    description:
      "Seeking an experienced Estate Manager to oversee daily operations of a luxury property...",
    requirements: [
      "10+ years of estate management experience",
      "Strong organizational and leadership skills",
      "Experience with staff management",
      "Valid driver's license",
    ],
    posted: "2 days ago",
    isSaved: false,
  },
  {
    id: 2,
    title: "Private Chef",
    company: "Elite Household Staff",
    location: "New York, NY",
    type: "Full-time",
    salary: "$90,000 - $130,000",
    description:
      "Looking for a skilled Private Chef to prepare gourmet meals for a high-profile family...",
    requirements: [
      "Culinary degree required",
      "5+ years experience in fine dining",
      "Knowledge of dietary restrictions and allergies",
      "Flexible schedule",
    ],
    posted: "1 week ago",
    isSaved: true,
  },
  // Add more job listings as needed
];

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
    location: [],
    jobType: [],
    salaryRange: [],
  });

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
        <div className="mt-6">
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
          <div className="mt-4 flex flex-wrap gap-2">
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
        <div className="mt-8 flow-root">
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
                                  {job.company}
                                </p>
                                <MapPinIcon className="ml-4 h-4 w-4 text-gray-400" />
                                <p className="ml-1 text-sm text-gray-500">
                                  {job.location}
                                </p>
                                <CurrencyDollarIcon className="ml-4 h-4 w-4 text-gray-400" />
                                <p className="ml-1 text-sm text-gray-500">
                                  {job.salary}
                                </p>
                              </div>
                            </div>
                            <div className="ml-4 flex flex-shrink-0">
                              <button
                                type="button"
                                className={`rounded-full p-1 ${
                                  job.isSaved
                                    ? "text-blue-600 hover:text-blue-700"
                                    : "text-gray-400 hover:text-gray-500"
                                }`}
                              >
                                <BookmarkIcon className="h-6 w-6" />
                              </button>
                            </div>
                          </div>
                          <div className="mt-2">
                            <p className="text-sm text-gray-500">
                              {job.description}
                            </p>
                            <div className="mt-4">
                              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                                {job.type}
                              </span>
                              <span className="ml-2 text-xs text-gray-500">
                                Posted {job.posted}
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
        </div>
      </div>
    </div>
  );
} 