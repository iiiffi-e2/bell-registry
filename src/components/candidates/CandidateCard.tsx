"use client"

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { UserCircleIcon, MapPinIcon, BookmarkIcon } from '@heroicons/react/24/outline'
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid'
import { generateProfileUrl } from '@/lib/utils'

interface CandidateCardProps {
  candidate: {
    id: string
    bio: string | null
    title: string | null
    preferredRole: string | null
    location: string | null
    skills: string[]
    user: {
      id: string
      firstName: string | null
      lastName: string | null
      image: string | null
      role: string
      profileSlug: string | null
    }
  }
}

export function CandidateCard({ candidate }: CandidateCardProps) {
  const { data: session } = useSession()
  const [isSaved, setIsSaved] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Check if current user is an employer/agency
  const canSaveCandidate = session?.user?.role === 'EMPLOYER' || session?.user?.role === 'AGENCY'

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

  const handleSaveToggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (isLoading) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/candidates/${candidate.user.id}/bookmark`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const { saved } = await response.json()
        setIsSaved(saved)
      } else {
        console.error('Failed to toggle save status')
      }
    } catch (error) {
      console.error('Error toggling save status:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative block bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200">
      {/* Bookmark button for employers */}
      {canSaveCandidate && (
        <button
          onClick={handleSaveToggle}
          disabled={isLoading}
          className={`absolute top-4 right-4 z-10 p-2 rounded-full transition-colors ${
            isSaved 
              ? 'text-blue-600 hover:text-blue-700' 
              : 'text-gray-400 hover:text-gray-600'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={isSaved ? 'Remove from saved candidates' : 'Save candidate'}
        >
          {isSaved ? (
            <BookmarkSolidIcon className="h-5 w-5" />
          ) : (
            <BookmarkIcon className="h-5 w-5" />
          )}
        </button>
      )}

      <Link
        href={generateProfileUrl(candidate.user.profileSlug)}
        className="block p-6"
      >
        <div className="flex items-center space-x-4">
          {candidate.user.image ? (
            <div className="h-12 w-12 rounded-full overflow-hidden bg-gray-100">
              <Image
                src={candidate.user.image}
                alt={displayName}
                width={48}
                height={48}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <UserCircleIcon className="h-12 w-12 text-gray-400" />
          )}
          <div>
            <h3 className="text-lg font-medium text-gray-900">{displayName}</h3>
            <p className="text-sm text-gray-500">{candidate.title || candidate.preferredRole || 'Professional'}</p>
          </div>
        </div>

        {candidate.location && (
          <div className="mt-2 flex items-center text-sm text-gray-500">
            <MapPinIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
            {candidate.location}
          </div>
        )}

        {candidate.bio && (
          <p className="mt-4 text-sm text-gray-600 line-clamp-3">{candidate.bio}</p>
        )}

        {candidate.skills.length > 0 && (
          <div className="mt-4">
            <div className="flex flex-wrap gap-2">
              {candidate.skills.slice(0, 3).map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {skill}
                </span>
              ))}
              {candidate.skills.length > 3 && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  +{candidate.skills.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}
      </Link>
    </div>
  )
} 