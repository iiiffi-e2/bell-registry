"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { BookmarkIcon } from '@heroicons/react/24/outline'
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid'
import { SaveCandidateModal } from './SaveCandidateModal'

interface SaveCandidateButtonProps {
  candidateId: string
  candidateName?: string
  className?: string
}

export function SaveCandidateButton({ candidateId, candidateName = "this candidate", className = "" }: SaveCandidateButtonProps) {
  const { data: session } = useSession()
  const [isSaved, setIsSaved] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Check if current user is an employer/agency
  const canSaveCandidate = session?.user?.role === 'EMPLOYER' || session?.user?.role === 'AGENCY'

  // Fetch save status when component mounts
  useEffect(() => {
    if (canSaveCandidate) {
      fetchSaveStatus()
    }
  }, [canSaveCandidate, candidateId])

  const fetchSaveStatus = async () => {
    try {
      const response = await fetch(`/api/candidates/${candidateId}/bookmark`)
      if (response.ok) {
        const { saved } = await response.json()
        setIsSaved(saved)
      }
    } catch (error) {
      console.error('Error fetching save status:', error)
    }
  }

  const handleButtonClick = () => {
    setIsModalOpen(true)
  }

  const handleModalSave = (saved: boolean) => {
    setIsSaved(saved)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
  }

  // Don't render if user can't save candidates
  if (!canSaveCandidate) {
    return null
  }

  return (
    <>
      <button
        onClick={handleButtonClick}
        disabled={isLoading}
        className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium transition-colors ${
          isSaved 
            ? 'text-blue-700 bg-blue-50 border-blue-300 hover:bg-blue-100' 
            : 'text-gray-700 bg-white hover:bg-gray-50'
        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
        title={isSaved ? 'Update saved candidate' : 'Save candidate'}
      >
        {isSaved ? (
          <BookmarkSolidIcon className="h-5 w-5 mr-2" />
        ) : (
          <BookmarkIcon className="h-5 w-5 mr-2" />
        )}
        {isSaved ? 'Saved' : 'Save Candidate'}
      </button>

      <SaveCandidateModal
        candidateId={candidateId}
        candidateName={candidateName}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={handleModalSave}
        initialSaved={isSaved}
      />
    </>
  )
} 