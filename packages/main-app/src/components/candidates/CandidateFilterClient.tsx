"use client"

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState, useEffect } from 'react'
import { type CandidateFilters } from '../../types/candidate'

// Professional roles constant
const PROFESSIONAL_ROLES = [
  "Head Gardener",
  "Executive Housekeeper",
  "Driver",
  "Executive Protection",
  "Butler",
  "Governess",
  "Private Teacher",
  "Nanny | Educator",
  "Nanny",
  "Family Assistant",
  "Personal Assistant",
  "Laundress",
  "Housekeeper",
  "Houseman",
  "Estate Couple",
  "Property Caretaker",
  "House Manager",
  "Estate Manager",
  "Personal Chef",
  "Private Chef",
  "Event Chef",
  "Drop-Off Chef",
  "Seasonal Chef",
  "Office Chef",
  "Yacht Chef",
  "Jet Chef",
  "Family Office CEO",
  "Family Office COO",
  "Executive Assistant",
  "Administrative Assistant",
  "Office Manager",
  "Human Resources Director",
  "Director of Residences",
  "Chief of Staff",
  "Estate Hospitality Manager",
  "Estate IT Director",
  "Estate Security Director",
  "Director of Operations",
  "Director of Real Estate and Construction",
  "Construction Manager",
  "Facilities Manager",
  "Property Manager",
  "Landscape Director",
  "Yacht Captain",
  "Yacht Steward | Stewardess",
  "Yacht Engineer",
  "Flight Attendant",
  "Other"
];

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
  
  // State for roles dropdown
  const [isRolesOpen, setIsRolesOpen] = useState(false)
  const [roleSearch, setRoleSearch] = useState('')

     // Filter roles based on search
   const filteredRoles = PROFESSIONAL_ROLES.filter(role =>
     role.toLowerCase().includes(roleSearch.toLowerCase())
   )

   const handleFiltersChange = useCallback(
     (newFilters: CandidateFilters) => {
       // Update local state for selected roles
       if (newFilters.roles !== undefined) {
         setSelectedRoles(newFilters.roles || [])
       }
       
       // Update URL parameters
       const params = new URLSearchParams(searchParams)
       if (newFilters.searchQuery) {
         params.set('search', newFilters.searchQuery)
       } else {
         params.delete('search')
       }
       if (newFilters.roles && newFilters.roles.length > 0) {
         params.set('roles', newFilters.roles.join(','))
       } else {
         params.delete('roles')
       }
       if (newFilters.openToWork) {
         params.set('openToWork', 'true')
       } else {
         params.delete('openToWork')
       }
       
       // Update the URL
       router.push(`?${params.toString()}`)
       
       onFiltersChange(newFilters)
     },
     [onFiltersChange, router, searchParams]
   )

   // Sync selectedRoles with URL params when they change
   useEffect(() => {
     const urlRoles = searchParams.get('roles') ? searchParams.get('roles')!.split(',') : []
     setSelectedRoles(urlRoles)
   }, [searchParams])

   // Debounced search effect
   useEffect(() => {
     const timer = setTimeout(() => {
       onFiltersChange({
         searchQuery: searchQuery || undefined,
         openToWork: searchParams.get('openToWork') === 'true' || undefined,
         roles: selectedRoles,
       })
     }, 300) // 300ms delay

     return () => clearTimeout(timer)
   }, [searchQuery, onFiltersChange, searchParams, selectedRoles])
  
  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isRolesOpen && !(event.target as Element).closest('.roles-dropdown')) {
        setIsRolesOpen(false)
        setRoleSearch('')
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isRolesOpen) {
        setIsRolesOpen(false)
        setRoleSearch('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isRolesOpen])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      {/* Search Bar */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search professionals by name, skills, location, or role..."
          className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors"
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Professional Roles Filter */}
        <div className="relative">
          <div className="relative roles-dropdown">
            <button
              type="button"
              onClick={() => setIsRolesOpen(!isRolesOpen)}
              className="inline-flex items-center justify-between w-56 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
                             <span className="truncate">
                 {selectedRoles && selectedRoles.length > 0
                   ? `${selectedRoles.length} role${selectedRoles.length === 1 ? '' : 's'} selected`
                   : 'Select professional roles'
                 }
               </span>
              <svg className="ml-2 h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            
            {/* Dropdown Menu */}
            {isRolesOpen && (
              <div className="absolute z-10 w-80 mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-60 overflow-auto">
                                 {/* Search Input with Clear All */}
                 <div className="p-3 border-b border-gray-200">
                   <div className="flex items-center gap-2">
                     <input
                       type="text"
                       placeholder="Search roles..."
                       value={roleSearch}
                       onChange={(e) => setRoleSearch(e.target.value)}
                       className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                     />
                                           <button
                        type="button"
                        onClick={() => {
                          handleFiltersChange({ 
                            searchQuery: searchQuery || undefined,
                            openToWork: searchParams.get('openToWork') === 'true' || undefined,
                            roles: undefined
                          })
                        }}
                        className="text-xs text-red-600 hover:text-red-800 font-medium px-3 py-1 hover:bg-red-50 rounded whitespace-nowrap"
                      >
                        Clear all
                      </button>
                   </div>
                 </div>
                
                {/* Role Options */}
                <div className="p-1">
                  {filteredRoles.length > 0 ? (
                    filteredRoles.map((role) => (
                      <label
                        key={role}
                        className="flex items-center px-3 py-2.5 text-sm hover:bg-gray-100 cursor-pointer rounded-md"
                      >
                                                 <input
                           type="checkbox"
                           checked={selectedRoles.includes(role)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              const newRoles = [...selectedRoles, role]
                              handleFiltersChange({ 
                                searchQuery: searchQuery || undefined,
                                openToWork: searchParams.get('openToWork') === 'true' || undefined,
                                roles: newRoles
                              })
                            } else {
                              const newRoles = selectedRoles.filter(r => r !== role)
                              handleFiltersChange({
                                searchQuery: searchQuery || undefined,
                                openToWork: searchParams.get('openToWork') === 'true' || undefined,
                                roles: newRoles.length > 0 ? newRoles : undefined,
                              })
                            }
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-3"
                        />
                        {role}
                      </label>
                    ))
                  ) : (
                                         <div className="px-3 py-2 text-sm text-gray-500">
                       No roles found matching &ldquo;{roleSearch}&rdquo;
                     </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

                 {/* Status Filter */}
         <div className="relative">
                    <select
           value={searchParams.get('openToWork') === 'true' ? 'true' : ''}
           onChange={(e) =>
             handleFiltersChange({
               searchQuery: searchQuery || undefined,
               openToWork: e.target.value === 'true' ? true : undefined,
               roles: selectedRoles,
             })
           }
             className="appearance-none inline-flex items-center justify-between rounded-lg border border-gray-300 bg-white px-4 py-2.5 pr-10 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
           >
             <option value="">All Professionals</option>
             <option value="true">Open to Work</option>
           </select>
           <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" viewBox="0 0 20 20" fill="currentColor">
             <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
           </svg>
         </div>
      </div>

             {/* Selected Roles Tags */}
       {selectedRoles && selectedRoles.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-gray-600">Selected roles:</span>
                         {selectedRoles.map((role) => (
              <span
                key={role}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-100 text-blue-800 rounded-full font-medium"
              >
                {role}
                <button
                  onClick={() => {
                    const newRoles = selectedRoles.filter(r => r !== role)
                    handleFiltersChange({
                      searchQuery: searchQuery || undefined,
                      openToWork: searchParams.get('openToWork') === 'true' || undefined,
                      roles: newRoles.length > 0 ? newRoles : undefined,
                    })
                  }}
                  className="ml-1 text-blue-600 hover:text-blue-800 hover:bg-blue-200 rounded-full w-4 h-4 flex items-center justify-center transition-colors"
                  title="Remove role"
                >
                  ×
                </button>
              </span>
            ))}
            <button
              onClick={() => handleFiltersChange({ 
                searchQuery: searchQuery || undefined,
                openToWork: searchParams.get('openToWork') === 'true' || undefined,
                roles: undefined
              })}
              className="text-xs text-red-600 hover:text-red-800 font-medium underline"
            >
              Clear all
            </button>
          </div>
        </div>
      )}
    </div>
  )
} 