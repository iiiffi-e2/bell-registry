"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  MapPinIcon,
  CurrencyDollarIcon,
  UserCircleIcon,
  BookmarkIcon,
} from "@heroicons/react/24/outline";
import { BookmarkIcon as BookmarkSolidIcon } from "@heroicons/react/24/solid";
import Image from "next/image";
import Link from "next/link";
import { SaveCandidateButton } from "@/components/candidates/SaveCandidateButton";

interface SavedCandidate {
  id: string;
  bio: string | null;
  title: string | null;
  preferredRole: string | null;
  location: string | null;
  skills: string[];
  yearsOfExperience: number | null;
  payRangeMin: number | null;
  payRangeMax: number | null;
  payCurrency: string | null;
  savedAt: string;
  note: string | null;
  job: {
    id: string;
    title: string;
    location: string;
    status: string;
  } | null;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    image: string | null;
    role: string;
    profileSlug: string | null;
    email: string;
    phoneNumber: string | null;
    isAnonymous: boolean;
  };
}

export default function SavedCandidatesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [candidates, setCandidates] = useState<SavedCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is authorized
    if (session && session.user?.role !== 'EMPLOYER' && session.user?.role !== 'AGENCY') {
      router.push('/dashboard');
      return;
    }

    if (session) {
      fetchSavedCandidates();
    }
  }, [session, router]);

  const fetchSavedCandidates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/candidates/saved');
      if (!response.ok) throw new Error('Failed to fetch saved candidates');
      
      const data = await response.json();
      setCandidates(data.candidates);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch saved candidates');
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveStatusChange = (candidateId: string, saved: boolean) => {
    if (!saved) {
      // Remove the candidate from the list if unsaved
      setCandidates(candidates.filter(candidate => candidate.user.id !== candidateId));
    } else {
      // Refresh the list to get updated data
      fetchSavedCandidates();
    }
  };

  // Helper function to get display name based on anonymous setting
  const getDisplayName = (candidate: SavedCandidate) => {
    const firstName = candidate.user.firstName || '';
    const lastName = candidate.user.lastName || '';
    
    // Check if anonymized (either by isAnonymous flag or single character names indicating anonymization)
    if (candidate.user.isAnonymous || (firstName.length === 1 && lastName.length === 1)) {
      const firstInitial = firstName[0] || '';
      const lastInitial = lastName[0] || '';
      return `${firstInitial}. ${lastInitial}.`;
    }
    
    return `${firstName} ${lastName}`.trim();
  };

  const formatSalaryRange = (candidate: SavedCandidate) => {
    if (!candidate.payRangeMin && !candidate.payRangeMax) return null;
    
    const currency = candidate.payCurrency || 'USD';
    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    });

    if (candidate.payRangeMin && candidate.payRangeMax) {
      return `${formatter.format(candidate.payRangeMin)} - ${formatter.format(candidate.payRangeMax)}`;
    } else if (candidate.payRangeMin) {
      return `${formatter.format(candidate.payRangeMin)}+`;
    } else if (candidate.payRangeMax) {
      return `Up to ${formatter.format(candidate.payRangeMax)}`;
    }
    return null;
  };

  if (!session) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        <div className="lg:flex lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
              Saved Candidates
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Professionals you've bookmarked for future reference
            </p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading saved candidates...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500">{error}</p>
          </div>
        ) : candidates.length === 0 ? (
          <div className="text-center py-12">
            <BookmarkIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No saved candidates</h3>
            <p className="mt-1 text-sm text-gray-500">
              Start saving candidates you're interested in by clicking the bookmark icon on their profiles.
            </p>
            <div className="mt-6">
              <button
                type="button"
                onClick={() => router.push('/browse-professionals')}
                className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                Browse Professionals
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {candidates.map((candidate) => (
              <div
                key={candidate.id}
                className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow duration-200"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <Link
                      href={`/dashboard/employer/candidates/${candidate.user.id}`}
                      className="flex-1"
                    >
                      <div className="flex items-center space-x-4">
                        {candidate.user.image && !candidate.user.isAnonymous ? (
                          <div className="h-16 w-16 rounded-full overflow-hidden bg-gray-100">
                            <Image
                              src={candidate.user.image}
                              alt={getDisplayName(candidate)}
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
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-900 hover:text-blue-600 transition-colors">
                            {getDisplayName(candidate)}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {candidate.title || candidate.preferredRole || 'Professional'}
                          </p>
                          {candidate.location && (
                            <div className="mt-1 flex items-center text-sm text-gray-500">
                              <MapPinIcon className="h-4 w-4 text-gray-400" />
                              <span className="ml-1">{candidate.location}</span>
                            </div>
                          )}
                          {formatSalaryRange(candidate) && (
                            <div className="mt-1 flex items-center text-sm text-gray-500">
                              <CurrencyDollarIcon className="h-4 w-4 text-gray-400" />
                              <span className="ml-1">{formatSalaryRange(candidate)}</span>
                            </div>
                          )}
                          {candidate.yearsOfExperience && (
                            <p className="mt-1 text-sm text-gray-500">
                              {candidate.yearsOfExperience} years of experience
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                    <SaveCandidateButton
                      candidateId={candidate.user.id}
                      candidateName={getDisplayName(candidate)}
                      className="ml-4"
                      onSaveStatusChange={(saved) => handleSaveStatusChange(candidate.user.id, saved)}
                    />
                  </div>
                  
                  {candidate.bio && (
                    <p className="mt-4 text-sm text-gray-500 line-clamp-3">{candidate.bio}</p>
                  )}

                  {/* Note */}
                  {candidate.note && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <p className="text-sm text-yellow-800">
                        <span className="font-medium">Note:</span> {candidate.note}
                      </p>
                    </div>
                  )}

                  {/* Attached Job */}
                  {candidate.job && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-sm text-blue-800">
                        <span className="font-medium">Attached to job:</span> {candidate.job.title}
                        <span className="text-blue-600 ml-2">({candidate.job.location})</span>
                      </p>
                    </div>
                  )}

                  {candidate.skills.length > 0 && (
                    <div className="mt-4">
                      <div className="flex flex-wrap gap-2">
                        {candidate.skills.slice(0, 5).map((skill, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"
                          >
                            {skill}
                          </span>
                        ))}
                        {candidate.skills.length > 5 && (
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                            +{candidate.skills.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="mt-4 text-xs text-gray-400">
                    Saved on {new Date(candidate.savedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 