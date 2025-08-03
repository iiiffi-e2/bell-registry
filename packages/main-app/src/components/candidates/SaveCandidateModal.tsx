"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BookmarkIcon } from '@heroicons/react/24/outline'
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid'

interface Job {
  id: string
  title: string
  location: string
  status: string
}

interface SaveCandidateModalProps {
  candidateId: string
  candidateName: string
  isOpen: boolean
  onClose: () => void
  onSave: (saved: boolean) => void
  initialSaved?: boolean
}

export function SaveCandidateModal({ 
  candidateId, 
  candidateName, 
  isOpen, 
  onClose, 
  onSave,
  initialSaved = false 
}: SaveCandidateModalProps) {
  const { data: session } = useSession()
  const [note, setNote] = useState('')
  const [selectedJobId, setSelectedJobId] = useState<string>('none')
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingJobs, setIsLoadingJobs] = useState(false)

  // Check if current user is an employer/agency
  const canSaveCandidate = session?.user?.role === 'EMPLOYER' || session?.user?.role === 'AGENCY'

  // Fetch active jobs when modal opens
  useEffect(() => {
    if (isOpen && canSaveCandidate) {
      fetchActiveJobs()
      if (initialSaved) {
        fetchExistingSaveData()
      }
    }
  }, [isOpen, canSaveCandidate, initialSaved])

  const fetchActiveJobs = async () => {
    setIsLoadingJobs(true)
    try {
      const response = await fetch('/api/dashboard/employer/jobs')
      if (response.ok) {
        const data = await response.json()
        // Filter to only active jobs
        const activeJobs = (data.jobs || []).filter((job: Job) => 
          job.status === 'ACTIVE' || job.status === 'INTERVIEWING'
        )
        setJobs(activeJobs)
      }
    } catch (error) {
      console.error('Error fetching jobs:', error)
    } finally {
      setIsLoadingJobs(false)
    }
  }

  const fetchExistingSaveData = async () => {
    try {
      const response = await fetch(`/api/dashboard/professionals/bookmark/${candidateId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.savedProfessional) {
          setNote(data.savedProfessional.note || '')
          setSelectedJobId(data.savedProfessional.jobId || 'none')
        }
      }
    } catch (error) {
      console.error('Error fetching existing save data:', error)
    }
  }

  const handleSave = async () => {
    if (isLoading) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/dashboard/professionals/bookmark/${candidateId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          note: note.trim() || null,
          jobId: selectedJobId === 'none' ? null : selectedJobId,
        }),
      })

      if (response.ok) {
        const { saved } = await response.json()
        onSave(saved)
        onClose()
        // Reset form
        setNote('')
        setSelectedJobId('none')
      } else {
        console.error('Failed to save professional')
      }
    } catch (error) {
      console.error('Error saving professional:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemove = async () => {
    if (isLoading) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/dashboard/professionals/bookmark/${candidateId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        onSave(false)
        onClose()
        // Reset form
        setNote('')
        setSelectedJobId('none')
      } else {
        console.error('Failed to remove saved professional')
      }
    } catch (error) {
      console.error('Error removing saved professional:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!canSaveCandidate) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookmarkIcon className="h-5 w-5" />
            {initialSaved ? 'Update Saved Professional' : 'Save Professional'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-4">
              {initialSaved ? 'Update details for' : 'Save'} <span className="font-medium">{candidateName}</span> to your saved professionals list.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="job-select">Attach to Job (Optional)</Label>
            <Select value={selectedJobId} onValueChange={setSelectedJobId} disabled={isLoadingJobs}>
              <SelectTrigger>
                <SelectValue placeholder={isLoadingJobs ? "Loading jobs..." : "Select a job (optional)"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No job selected</SelectItem>
                {jobs.map((job) => (
                  <SelectItem key={job.id} value={job.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{job.title}</span>
                      <span className="text-xs text-gray-500">{job.location}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Notes (Optional)</Label>
            <Textarea
              id="note"
              placeholder="Add any notes about this candidate..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-gray-500">{note.length}/500 characters</p>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          {initialSaved && (
            <Button variant="destructive" onClick={handleRemove} disabled={isLoading}>
              {isLoading ? 'Removing...' : 'Remove'}
            </Button>
          )}
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Saving...' : initialSaved ? 'Update' : 'Save Candidate'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 