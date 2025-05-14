import { UserRole } from '@prisma/client'

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

export interface CandidateFilters {
  location?: string
  roleType?: UserRole
  searchQuery?: string
}

export interface CandidateSearchParams extends CandidateFilters {
  page?: number
  limit?: number
} 