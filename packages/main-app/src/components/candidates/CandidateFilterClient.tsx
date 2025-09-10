"use client"

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState, useEffect } from 'react'
import { type CandidateFilters } from '../../types/candidate'
import { ProfessionalsFilterModal } from '../ProfessionalsFilterModal'
import { PROFESSIONAL_ROLES } from '@/lib/constants'

interface CandidateFilterClientProps {
  onFiltersChange: (filters: CandidateFilters) => void
}

export function CandidateFilterClient({
  onFiltersChange,
}: CandidateFilterClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Use local state for search query to make it more responsive
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  
  // Parse selected roles from URL params and maintain local state
  const [selectedRoles, setSelectedRoles] = useState<string[]>(
    searchParams.get('roles') ? searchParams.get('roles')!.split(',') : []
  )
  
  // Location and radius state
  const [location, setLocation] = useState(searchParams.get('location') || '')
  const [radius, setRadius] = useState(parseInt(searchParams.get('radius') || '50'))
  const [openToWork, setOpenToWork] = useState(searchParams.get('openToWork') === 'true')
  
  // State for filter modal
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)

  // Count active filters for badge
  const getActiveFiltersCount = () => {
    let count = 0;
    if (selectedRoles.length > 0) count += selectedRoles.length;
    if (location) count += 1;
    if (radius !== 50) count += 1;
    if (openToWork) count += 1;
    return count;
  };

   // Function to update URL without triggering search
   const updateURL = useCallback(
     (filters: CandidateFilters) => {
       const params = new URLSearchParams(searchParams)
       if (filters.searchQuery) {
         params.set('search', filters.searchQuery)
       } else {
         params.delete('search')
       }
       if (filters.roles && filters.roles.length > 0) {
         params.set('roles', filters.roles.join(','))
       } else {
         params.delete('roles')
       }
       if (filters.openToWork) {
         params.set('openToWork', 'true')
       } else {
         params.delete('openToWork')
       }
       if (filters.location) {
         params.set('location', filters.location)
       } else {
         params.delete('location')
       }
       if (filters.radius && filters.radius !== 50) {
         params.set('radius', filters.radius.toString())
       } else {
         params.delete('radius')
       }
       
       router.replace(`?${params.toString()}`, { scroll: false })
     },
     [router, searchParams]
   )

   // Function to trigger actual search
   const triggerSearch = useCallback(
     (filters: CandidateFilters) => {
       updateURL(filters)
       onFiltersChange(filters)
     },
     [onFiltersChange, updateURL]
   )

   // Sync state with URL params when they change (only on mount or external URL changes)
   useEffect(() => {
     const urlRoles = searchParams.get('roles') ? searchParams.get('roles')!.split(',') : []
     const urlLocation = searchParams.get('location') || ''
     const urlRadius = parseInt(searchParams.get('radius') || '50')
     const urlOpenToWork = searchParams.get('openToWork') === 'true'
     
     setSelectedRoles(urlRoles)
     setLocation(urlLocation)
     setRadius(urlRadius)
     setOpenToWork(urlOpenToWork)
   }, [searchParams])

   // Debounced search effect - for search query and location changes
   useEffect(() => {
     const timer = setTimeout(() => {
       triggerSearch({
         searchQuery: searchQuery || undefined,
         openToWork: openToWork || undefined,
         roles: selectedRoles,
         location: location || undefined,
         radius: radius !== 50 ? radius : undefined,
       })
     }, 300) // 300ms delay

     return () => clearTimeout(timer)
   }, [searchQuery, location, radius, selectedRoles, openToWork]) // Removed triggerSearch and searchParams to prevent infinite loop
  

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
  }

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setLocation(value)
  }

  const handleRadiusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value)
    setRadius(value)
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      {/* Search Bar and Filters Button */}
      <div className="flex gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Try: 'private chef Austin' or 'personal chef in Austin' for smart search..."
            className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors"
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
        
        <button
          type="button"
          onClick={() => setIsFilterModalOpen(true)}
          className="inline-flex items-center rounded-md bg-white px-4 py-3 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors"
        >
          <svg 
            className="h-5 w-5 text-gray-400 mr-2" 
            fill="none" 
            viewBox="0 0 24 24" 
            strokeWidth={1.5} 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
          </svg>
          Filters
          {getActiveFiltersCount() > 0 && (
            <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
              {getActiveFiltersCount()}
            </span>
          )}
        </button>
      </div>

      {/* Active Filter Tags */}
      {getActiveFiltersCount() > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-gray-600">Active filters:</span>
          
          {/* Role Tags */}
          {selectedRoles.map((role) => (
            <span
              key={role}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-100 text-blue-800 rounded-full font-medium"
            >
              {role}
              <button
                onClick={() => {
                  const newRoles = selectedRoles.filter(r => r !== role)
                  setSelectedRoles(newRoles)
                  updateURL({
                    searchQuery: searchQuery || undefined,
                    openToWork: openToWork || undefined,
                    roles: newRoles.length > 0 ? newRoles : undefined,
                    location: location || undefined,
                    radius: radius !== 50 ? radius : undefined,
                  })
                }}
                className="ml-1 text-blue-600 hover:text-blue-800 hover:bg-blue-200 rounded-full w-4 h-4 flex items-center justify-center transition-colors"
                title="Remove role"
              >
                ×
              </button>
            </span>
          ))}
          
          {/* Location Tag */}
          {location && (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 text-xs bg-green-100 text-green-800 rounded-full font-medium">
              📍 {location}
              <button
                onClick={() => {
                  setLocation('')
                  updateURL({
                    searchQuery: searchQuery || undefined,
                    openToWork: openToWork || undefined,
                    roles: selectedRoles,
                    location: undefined,
                    radius: radius !== 50 ? radius : undefined,
                  })
                }}
                className="ml-1 text-green-600 hover:text-green-800 hover:bg-green-200 rounded-full w-4 h-4 flex items-center justify-center transition-colors"
                title="Remove location"
              >
                ×
              </button>
            </span>
          )}
          
          {/* Radius Tag */}
          {radius !== 50 && (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 text-xs bg-purple-100 text-purple-800 rounded-full font-medium">
              📏 {radius} miles
              <button
                onClick={() => {
                  setRadius(50)
                  updateURL({
                    searchQuery: searchQuery || undefined,
                    openToWork: openToWork || undefined,
                    roles: selectedRoles,
                    location: location || undefined,
                    radius: undefined,
                  })
                }}
                className="ml-1 text-purple-600 hover:text-purple-800 hover:bg-purple-200 rounded-full w-4 h-4 flex items-center justify-center transition-colors"
                title="Reset radius"
              >
                ×
              </button>
            </span>
          )}
          
          {/* Open to Work Tag */}
          {openToWork && (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 text-xs bg-orange-100 text-orange-800 rounded-full font-medium">
              🟢 Open to Work
              <button
                onClick={() => {
                  triggerSearch({
                    searchQuery: searchQuery || undefined,
                    openToWork: undefined,
                    roles: selectedRoles,
                    location: location || undefined,
                    radius: radius !== 50 ? radius : undefined,
                  })
                }}
                className="ml-1 text-orange-600 hover:text-orange-800 hover:bg-orange-200 rounded-full w-4 h-4 flex items-center justify-center transition-colors"
                title="Remove filter"
              >
                ×
              </button>
            </span>
          )}
          
          {/* Clear All Button */}
          <button
            onClick={() => {
              setSelectedRoles([])
              setLocation('')
              setRadius(50)
              updateURL({
                searchQuery: searchQuery || undefined,
                openToWork: undefined,
                roles: undefined,
                location: undefined,
                radius: undefined,
              })
            }}
            className="text-xs text-red-600 hover:text-red-800 font-medium underline"
          >
            Clear all filters
          </button>
        </div>
      )}
      
      {/* Filters Modal */}
      <ProfessionalsFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        filters={{
          searchQuery: searchQuery || undefined,
          roles: selectedRoles,
          location: location || undefined,
          radius: radius,
          openToWork: openToWork || undefined,
        }}
        onFiltersChange={(newFilters) => {
          // Update local state
          setSelectedRoles(newFilters.roles || []);
          setLocation(newFilters.location || '');
          setRadius(newFilters.radius || 50);
          setOpenToWork(newFilters.openToWork || false);
          
          // Trigger search with new filters
          triggerSearch(newFilters);
        }}
      />
    </div>
  )
} 