"use client";

import { useState, useEffect } from "react";
import { Suspense } from "react";
import { useSession } from "next-auth/react";
import { CandidateCard } from "@/components/candidates/CandidateCard";
import { CandidateFilterClient } from "@/components/candidates/CandidateFilterClient";
import { type CandidateFilters } from "@/types/candidate";
import { UserRole } from "@prisma/client";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

interface PaginationData {
  total: number;
  pages: number;
  page: number;
  limit: number;
}

function LoadingGrid() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="bg-gray-200 h-64 rounded-lg"></div>
        </div>
      ))}
    </div>
  );
}

export default function BrowseProfessionalsPage() {
  const { data: session } = useSession();
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<CandidateFilters>({});
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    pages: 1,
    page: 1,
    limit: 9
  });
  const [locations, setLocations] = useState<string[]>([]);
  const [roleTypes, setRoleTypes] = useState<UserRole[]>([]);

  // Determine if we should use dashboard routes
  const shouldUseDashboardRoutes = session?.user?.role === 'EMPLOYER' || session?.user?.role === 'AGENCY';

  useEffect(() => {
    Promise.all([
      fetch("/api/locations").then(res => res.json()),
      fetch("/api/role-types").then(res => res.json())
    ]).then(([locationsData, roleTypesData]) => {
      setLocations(locationsData);
      setRoleTypes(roleTypesData.filter((role: string) => role !== "ADMIN"));
    });
  }, []);

  useEffect(() => {
    fetchProfessionals(1);
  }, [filters]);

  const fetchProfessionals = async (page: number) => {
    try {
      setLoading(true);
      const searchParams = new URLSearchParams();
      if (filters.location) searchParams.append("location", filters.location);
      if (filters.roleType) searchParams.append("roleType", filters.roleType);
      if (filters.searchQuery) searchParams.append("search", filters.searchQuery);
      if (filters.openToWork) searchParams.append("openToWork", "true");
      searchParams.append("page", page.toString());
      searchParams.append("limit", "9");

      const response = await fetch(`/api/professionals?${searchParams.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch professionals");
      
      const data = await response.json();
      setProfessionals(data.professionals);
      setPagination(data.pagination);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch professionals");
      setProfessionals([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        <div className="lg:flex lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
              Browse Professionals
            </h2>
          </div>
        </div>

        <div className="mt-8">
          <Suspense fallback={<div className="animate-pulse h-12 bg-gray-200 rounded w-full mb-8"></div>}>
            <CandidateFilterClient
              locations={locations}
              roleTypes={roleTypes}
              onFiltersChange={setFilters}
            />
          </Suspense>

          <Suspense fallback={<LoadingGrid />}>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-500">Loading professionals...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-500">{error}</p>
              </div>
            ) : (
              <>
                <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {professionals.map((professional) => (
                    <CandidateCard 
                      key={professional.id} 
                      candidate={professional} 
                      useDashboardRoutes={shouldUseDashboardRoutes}
                    />
                  ))}
                  {professionals.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-500">
                      No professionals found matching your criteria
                    </div>
                  )}
                </div>

                {/* Pagination Controls */}
                <div className="mt-8 flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
                  <div className="flex flex-1 justify-between sm:hidden">
                    <button
                      onClick={() => fetchProfessionals(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => fetchProfessionals(pagination.page + 1)}
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
                          onClick={() => fetchProfessionals(pagination.page - 1)}
                          disabled={pagination.page === 1}
                          className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="sr-only">Previous</span>
                          <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                        </button>
                        <button
                          onClick={() => fetchProfessionals(pagination.page + 1)}
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
          </Suspense>
        </div>
      </div>
    </div>
  );
} 