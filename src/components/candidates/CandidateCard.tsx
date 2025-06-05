"use client"

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { UserCircleIcon, MapPinIcon, CurrencyDollarIcon, BookmarkIcon } from '@heroicons/react/24/outline'
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid'
import { generateProfileUrl } from '@/lib/utils'
import { SaveCandidateModal } from './SaveCandidateModal'

interface CandidateCardProps {
  candidate: {
    id: string
    bio: string | null
    title: string | null
    preferredRole: string | null
    location: string | null
    skills: string[]
    yearsOfExperience: number | null
    payRangeMin: number | null
    payRangeMax: number | null
    payType: string | null
    user: {
      id: string
      firstName: string | null
      lastName: string | null
      image: string | null
      profileSlug: string | null
    }
  }
  useDashboardRoutes?: boolean // New prop to determine routing context
}

export function CandidateCard({ candidate, useDashboardRoutes = false }: CandidateCardProps) {
  const { data: session } = useSession()
  const [isSaved, setIsSaved] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Check if current user is an employer/agency
  const canSaveCandidate = session?.user?.role === 'EMPLOYER' || session?.user?.role === 'AGENCY'

  // Determine the appropriate profile URL based on context
  const getProfileUrl = () => {
    if (useDashboardRoutes && canSaveCandidate) {
      return `/dashboard/employer/candidates/${candidate.user.id}`
    }
    return generateProfileUrl(candidate.user.profileSlug)
  }

  // Handle anonymized names (single characters) vs full names
  const getDisplayName = () => {
    const firstName = candidate.user.firstName || '';
    const lastName = candidate.user.lastName || '';
    
    // If names are single characters (anonymized), show as initials
    if (firstName.length === 1 && lastName.length === 1) {
      return `${firstName}. ${lastName}.`;
    }
    
    // Otherwise show full name
    return `${firstName} ${lastName}`.trim();
  };

  const displayName = getDisplayName();

  // Fetch save status when component mounts
  useEffect(() => {
    if (canSaveCandidate) {
      fetchSaveStatus()
    }
  }, [canSaveCandidate, candidate.user.id])

  const fetchSaveStatus = async () => {
    try {
      const response = await fetch(`/api/candidates/${candidate.user.id}/bookmark`)
      if (response.ok) {
        const { saved } = await response.json()
        setIsSaved(saved)
      }
    } catch (error) {
      console.error('Error fetching save status:', error)
    }
  }

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsModalOpen(true)
  }

  const handleModalSave = (saved: boolean) => {
    setIsSaved(saved)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
  }

  const formatSalaryRange = () => {
    if (!candidate.payRangeMin && !candidate.payRangeMax) return null;
    
    const payType = candidate.payType || 'Salary';
    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });

    const formatNumber = (num: number) => {
      if (payType === 'Hourly') {
        return `${formatter.format(num)}/hr`;
      }
      return formatter.format(num);
    };

    if (candidate.payRangeMin && candidate.payRangeMax) {
      return `${formatNumber(candidate.payRangeMin)} - ${formatNumber(candidate.payRangeMax)}`;
    } else if (candidate.payRangeMin) {
      return `${formatNumber(candidate.payRangeMin)}+`;
    } else if (candidate.payRangeMax) {
      return `Up to ${formatNumber(candidate.payRangeMax)}`;
    }
    return null;
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 relative">
        {/* Bookmark button - positioned absolutely in top right */}
        {canSaveCandidate && (
          <button
            onClick={handleBookmarkClick}
            className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-100 transition-colors z-10"
            title={isSaved ? 'Update saved candidate' : 'Save candidate'}
          >
            {isSaved ? (
              <BookmarkSolidIcon className="h-5 w-5 text-blue-600" />
            ) : (
              <BookmarkIcon className="h-5 w-5 text-gray-400 hover:text-blue-600" />
            )}
          </button>
        )}

        <Link href={getProfileUrl()} className="block p-6">
          <div className="flex items-start space-x-4">
            {/* Profile Image */}
            <div className="flex-shrink-0">
              {candidate.user.image ? (
                <div className="h-16 w-16 rounded-full overflow-hidden bg-gray-100">
                  <Image
                    src={candidate.user.image}
                    alt={displayName}
                    width={64}
                    height={64}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="h-16 w-16 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                  <UserCircleIcon className="h-16 w-16 text-gray-300" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 hover:text-blue-600 transition-colors">
                    {displayName}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {candidate.title || candidate.preferredRole || 'Professional'}
                  </p>
                </div>
              </div>

              {/* Location and Experience */}
              <div className="mt-2 flex items-center text-sm text-gray-500 space-x-4">
                {candidate.location && (
                  <div className="flex items-center">
                    <MapPinIcon className="h-4 w-4 text-gray-400 mr-1" />
                    <span>{candidate.location}</span>
                  </div>
                )}
                {candidate.yearsOfExperience && (
                  <span>{candidate.yearsOfExperience} years experience</span>
                )}
              </div>

              {/* Salary Range */}
              {formatSalaryRange() && (
                <div className="mt-2 flex items-center text-sm text-gray-500">
                  <CurrencyDollarIcon className="h-4 w-4 text-gray-400 mr-1" />
                  <span>{formatSalaryRange()}</span>
                </div>
              )}

              {/* Bio */}
              {candidate.bio && (
                <p className="mt-3 text-sm text-gray-600 line-clamp-2">
                  {candidate.bio}
                </p>
              )}

              {/* Skills */}
              {candidate.skills.length > 0 && (
                <div className="mt-3">
                  <div className="flex flex-wrap gap-1">
                    {candidate.skills.slice(0, 3).map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {skill}
                      </span>
                    ))}
                    {candidate.skills.length > 3 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        +{candidate.skills.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Link>
      </div>

      {/* Save Candidate Modal */}
      <SaveCandidateModal
        candidateId={candidate.user.id}
        candidateName={displayName}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={handleModalSave}
        initialSaved={isSaved}
      />
    </>
  )
} 