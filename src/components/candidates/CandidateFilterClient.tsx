"use client"

import { useRouter, useSearchParams } from 'next/navigation'
import { CandidateFilters } from '@/types/candidate'
import { CandidateFilters as CandidateFiltersComponent } from './CandidateFilters'
import { useCallback } from 'react'

interface CandidateFilterClientProps {
  locations: string[]
  roleTypes: string[]
}

export function CandidateFilterClient({
  locations,
  roleTypes,
}: CandidateFilterClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentFilters: CandidateFilters = {
    location: searchParams.get('location') || undefined,
    roleType: searchParams.get('roleType') || undefined,
    searchQuery: searchParams.get('search') || undefined,
  }

  const handleFiltersChange = useCallback(
    (newFilters: CandidateFilters) => {
      const params = new URLSearchParams()
      if (newFilters.location) params.set('location', newFilters.location)
      if (newFilters.roleType) params.set('roleType', newFilters.roleType)
      if (newFilters.searchQuery) params.set('search', newFilters.searchQuery)
      router.push(`/browse-professionals?${params.toString()}`)
    },
    [router]
  )

  return (
    <CandidateFiltersComponent
      filters={currentFilters}
      onFiltersChange={handleFiltersChange}
      locations={locations}
      roleTypes={roleTypes}
    />
  )
} 