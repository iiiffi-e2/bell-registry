import { UserRole } from '@bell-registry/shared'

export interface CandidateProfile {
  id: string
  userId: string
  name: string
  location: string
  roleType: string
  skills: string[]
  experience: number
  bio: string
  isComplete: boolean
  createdAt: Date
  updatedAt: Date
}

export type SortOption = 'recent' | 'experience' | 'certifications' | 'views' | 'relevance'

export interface CandidateFilters {
  location?: string
  roleType?: UserRole
  searchQuery?: string
  sortBy?: SortOption
  openToWork?: boolean
}

export interface CandidateSearchParams extends CandidateFilters {
  page?: number
  limit?: number
} 