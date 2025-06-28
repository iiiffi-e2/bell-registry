"use client"

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { UserRole } from '@prisma/client'
import { type CandidateFilters } from '@/types/candidate'
import { type SortOption } from '@/types/sort'

interface CandidateFilterClientProps {
  locations: string[]
  roleTypes: UserRole[]
  onFiltersChange: (filters: CandidateFilters) => void
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
  onFiltersChange,
}: CandidateFilterClientProps) {
  const searchParams = useSearchParams()

  const currentFilters: CandidateFilters = {
    location: searchParams.get('location') || undefined,
    roleType: searchParams.get('roleType') as UserRole | undefined,
    searchQuery: searchParams.get('search') || undefined,
    sortBy: (searchParams.get('sort') as SortOption) || 'recent',
    openToWork: searchParams.get('openToWork') === 'true' || undefined,
  }

  const handleFiltersChange = useCallback(
    (newFilters: CandidateFilters) => {
      onFiltersChange(newFilters)
    },
    [onFiltersChange]
  )

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex-1">
        <input
          type="text"
          placeholder="Search professionals..."
          className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
          value={currentFilters.searchQuery || ''}
          onChange={(e) =>
            handleFiltersChange({
              ...currentFilters,
              searchQuery: e.target.value || undefined,
            })
          }
        />
      </div>
      <div className="flex gap-4">
        <select
          value={currentFilters.location || ''}
          onChange={(e) =>
            handleFiltersChange({
              ...currentFilters,
              location: e.target.value || undefined,
            })
          }
          className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-blue-600 sm:text-sm sm:leading-6"
        >
          <option value="">All Locations</option>
          {locations.map((location) => (
            <option key={location} value={location}>
              {location}
            </option>
          ))}
        </select>
        <select
          value={currentFilters.roleType || ''}
          onChange={(e) =>
            handleFiltersChange({
              ...currentFilters,
              roleType: (e.target.value as UserRole) || undefined,
            })
          }
          className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-blue-600 sm:text-sm sm:leading-6"
        >
          <option value="">All Roles</option>
          {roleTypes.map((role) => (
            <option key={role} value={role}>
              {role.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
        <select
          value={currentFilters.openToWork ? 'true' : ''}
          onChange={(e) =>
            handleFiltersChange({
              ...currentFilters,
              openToWork: e.target.value === 'true' ? true : undefined,
            })
          }
          className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-blue-600 sm:text-sm sm:leading-6"
        >
          <option value="">All Professionals</option>
          <option value="true">Open to Work</option>
        </select>
        
        <select
          value={currentFilters.sortBy || 'recent'}
          onChange={(e) =>
            handleFiltersChange({
              ...currentFilters,
              sortBy: e.target.value as SortOption,
            })
          }
          className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-blue-600 sm:text-sm sm:leading-6"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
} 