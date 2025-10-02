/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

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
  searchQuery?: string
  openToWork?: boolean
  roles?: string[]
  location?: string
  radius?: number // in miles
}

export interface CandidateSearchParams extends CandidateFilters {
  page?: number
  limit?: number
} 