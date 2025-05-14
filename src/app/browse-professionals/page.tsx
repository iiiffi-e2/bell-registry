import { Suspense } from 'react'
import { CandidateCard } from '@/components/candidates/CandidateCard'
import { CandidateFilterClient } from '@/components/candidates/CandidateFilterClient'
import { type CandidateFilters } from '@/types/candidate'
import { UserRole } from '@prisma/client'
import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getProfessionals(filters: CandidateFilters) {
  const headersList = headers()
  const host = headersList.get('host')
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https'

  const params = new URLSearchParams()
  if (filters.location) params.set('location', filters.location)
  if (filters.roleType) params.set('roleType', filters.roleType)
  if (filters.searchQuery) params.set('search', filters.searchQuery)

  const response = await fetch(`${protocol}://${host}/api/professionals?${params.toString()}`, {
    headers: {
      'Content-Type': 'application/json',
    },
  })
  
  if (!response.ok) throw new Error('Failed to fetch professionals')
  return response.json()
}

async function getLocations() {
  // In a real app, this would be fetched from the API
  return ['New York', 'London', 'Remote', 'San Francisco', 'Berlin']
}

function getRoleTypes() {
  return Object.values(UserRole).filter(role => role !== UserRole.ADMIN)
}

function LoadingCard() {
  return (
    <div className="animate-pulse bg-white rounded-lg shadow p-6">
      <div className="flex items-center space-x-4">
        <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="mt-2 h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-3 bg-gray-200 rounded"></div>
        <div className="h-3 bg-gray-200 rounded w-5/6"></div>
      </div>
    </div>
  )
}

function LoadingGrid() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <LoadingCard key={i} />
      ))}
    </div>
  )
}

export default async function BrowseProfessionalsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined }
}) {
  const filters: CandidateFilters = {
    location: searchParams.location,
    roleType: searchParams.roleType as UserRole | undefined,
    searchQuery: searchParams.search,
  }

  const [professionals, locations, roleTypes] = await Promise.all([
    getProfessionals(filters),
    getLocations(),
    getRoleTypes(),
  ])

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
            />
          </Suspense>

          <Suspense fallback={<LoadingGrid />}>
            <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {professionals.professionals.map((professional) => (
                <CandidateCard key={professional.id} candidate={professional} />
              ))}
              {professionals.professionals.length === 0 && (
                <div className="col-span-full text-center py-12 text-gray-500">
                  No professionals found matching your criteria
                </div>
              )}
            </div>
          </Suspense>
        </div>
      </div>
    </div>
  )
} 