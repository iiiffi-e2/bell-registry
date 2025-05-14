"use client"

import { useRouter, useSearchParams } from 'next/navigation'
import { CandidateFilters, SortOption } from '@/types/candidate'
import { UserRole } from '@prisma/client'
import { useCallback } from 'react'

interface CandidateFilterClientProps {
  locations: string[]
  roleTypes: UserRole[]
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'recent', label: 'Most Recent' },
  { value: 'experience', label: 'Most Experienced' },
  { value: 'certifications', label: 'Most Certified' },
  { value: 'views', label: 'Most Viewed' },
  { value: 'relevance', label: 'Most Relevant' },
]

export function CandidateFilterClient({
  locations,
  roleTypes,
}: CandidateFilterClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentFilters: CandidateFilters = {
    location: searchParams.get('location') || undefined,
    roleType: searchParams.get('roleType') as UserRole | undefined,
    searchQuery: searchParams.get('search') || undefined,
    sortBy: (searchParams.get('sort') as SortOption) || 'recent',
  }

  const handleFiltersChange = useCallback(
    (newFilters: CandidateFilters) => {
      const params = new URLSearchParams()
      if (newFilters.location) params.set('location', newFilters.location)
      if (newFilters.roleType) params.set('roleType', newFilters.roleType)
      if (newFilters.searchQuery) params.set('search', newFilters.searchQuery)
      if (newFilters.sortBy) params.set('sort', newFilters.sortBy)
      router.push(`/browse-professionals?${params.toString()}`)
    },
    [router]
  )

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Search */}
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700">
            Search
          </label>
          <input
            type="text"
            id="search"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="Search professionals..."
            value={currentFilters.searchQuery || ''}
            onChange={(e) =>
              handleFiltersChange({ ...currentFilters, searchQuery: e.target.value || undefined })
            }
          />
        </div>

        {/* Location */}
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700">
            Location
          </label>
          <select
            id="location"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            value={currentFilters.location || ''}
            onChange={(e) =>
              handleFiltersChange({ ...currentFilters, location: e.target.value || undefined })
            }
          >
            <option value="">All Locations</option>
            {locations.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>
        </div>

        {/* Role Type */}
        <div>
          <label htmlFor="roleType" className="block text-sm font-medium text-gray-700">
            Role Type
          </label>
          <select
            id="roleType"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            value={currentFilters.roleType || ''}
            onChange={(e) =>
              handleFiltersChange({
                ...currentFilters,
                roleType: (e.target.value as UserRole) || undefined,
              })
            }
          >
            <option value="">All Roles</option>
            {roleTypes.map((role) => (
              <option key={role} value={role}>
                {role.charAt(0) + role.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </div>

        {/* Sort By */}
        <div>
          <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700">
            Sort By
          </label>
          <select
            id="sortBy"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            value={currentFilters.sortBy || 'recent'}
            onChange={(e) =>
              handleFiltersChange({
                ...currentFilters,
                sortBy: (e.target.value as SortOption) || undefined,
              })
            }
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
} 