"use client"

import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { type CandidateFilters } from '@/types/candidate'
import { UserRole } from '@prisma/client'
import { Search } from 'lucide-react'

interface CandidateFiltersProps {
  filters: CandidateFilters
  onFiltersChange: (filters: CandidateFilters) => void
  locations: string[]
  roleTypes: UserRole[]
}

export function CandidateFilters({
  filters,
  onFiltersChange,
  locations,
  roleTypes,
}: CandidateFiltersProps) {
  const handleLocationChange = (value: string) => {
    onFiltersChange({ ...filters, location: value === 'all' ? undefined : value })
  }

  const handleRoleTypeChange = (value: string) => {
    onFiltersChange({ ...filters, roleType: value === 'all' ? undefined : value as UserRole })
  }

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6 p-4 bg-card rounded-lg">
      <div className="flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search professionals..."
            value={filters.searchQuery || ''}
            onChange={(e) =>
              onFiltersChange({ ...filters, searchQuery: e.target.value })
            }
            className="pl-10"
          />
        </div>
      </div>
      <div className="flex flex-col gap-4 md:flex-row md:gap-6">
        <Select
          value={filters.location || 'all'}
          onValueChange={handleLocationChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select location" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All locations</SelectItem>
            {locations.map((location) => (
              <SelectItem key={location} value={location}>
                {location}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.roleType || 'all'}
          onValueChange={handleRoleTypeChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select role type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            {roleTypes.map((role) => (
              <SelectItem key={role} value={role}>
                {role.replace(/_/g, ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
} 