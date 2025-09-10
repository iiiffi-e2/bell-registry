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
import { ProfilePictureWithBadge, OpenToWorkBadge } from "@/components/profile/open-to-work-badge";

interface SavedProfessional {
  id: string;
  bio: string | null;
  title: string | null;
  preferredRole: string | null;
  location: string | null;
  skills: string[];
  yearsOfExperience: number | null;
  payRangeMin: number | null;
  payRangeMax: number | null;
  payType: string | null;
  openToWork: boolean;
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

export default function SavedProfessionalsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [professionals, setProfessionals] = useState<SavedProfessional[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is authorized
    if (session && session.user?.role) {
      // Redirect professionals away from employer screens
      if (session.user.role === 'PROFESSIONAL') {
        router.push('/dashboard');
        return;
      }
      
      // Only allow employers and agencies
      if (session.user.role !== 'EMPLOYER' && session.user.role !== 'AGENCY') {
        router.push('/dashboard');
        return;
      }
    }

    if (session) {
      fetchSavedProfessionals();
    }
  }, [session, router]);

  const fetchSavedProfessionals = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard/professionals/saved');
      if (!response.ok) throw new Error('Failed to fetch saved professionals');
      
      const data = await response.json();
      setProfessionals(data.professionals);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch saved professionals');
      setProfessionals([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveStatusChange = (professionalId: string, saved: boolean) => {
    if (!saved) {
      // Remove the professional from the list if unsaved
      setProfessionals(professionals.filter(professional => professional.user.id !== professionalId));
    } else {
      // Refresh the list to get updated data
      fetchSavedProfessionals();
    }
  };

  // Helper function to get display name based on anonymous setting
  const getDisplayName = (professional: SavedProfessional) => {
    const firstName = professional.user.firstName || '';
    const lastName = professional.user.lastName || '';
    
    if (professional.user.isAnonymous) {
      const firstInitial = firstName[0] || '';
      const lastInitial = lastName[0] || '';
      return `${firstInitial}. ${lastInitial}.`;
    }
    
    return `${firstName} ${lastName}`.trim();
  };

  const formatSalaryRange = (professional: SavedProfessional) => {
    if (!professional.payRangeMin && !professional.payRangeMax) {
      return 'Not specified';
    }

    const formatNumber = (num: number) => {
      if (num >= 1000000) {
        return `$${(num / 1000000).toFixed(1)}M`;
      } else if (num >= 1000) {
        return `$${(num / 1000).toFixed(0)}K`;
      }
      return `$${num.toLocaleString()}`;
    };

    if (professional.payRangeMin && professional.payRangeMax) {
      return `${formatNumber(professional.payRangeMin)} - ${formatNumber(professional.payRangeMax)}`;
    } else if (professional.payRangeMin) {
      return `${formatNumber(professional.payRangeMin)}+`;
    } else if (professional.payRangeMax) {
      return `Up to ${formatNumber(professional.payRangeMax)}`;
    }

    return 'Not specified';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading saved professionals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Saved Professionals
          </h1>
          <p className="mt-2 text-gray-600">
            Your saved professional profiles and notes
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {loading ? (
          <p className="mt-4 text-gray-500">Loading saved professionals...</p>
        ) : professionals.length === 0 ? (
          <div className="text-center py-12">
            <BookmarkIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No saved professionals</h3>
            <p className="mt-1 text-sm text-gray-500">
              Start saving professionals you&apos;re interested in by clicking the bookmark icon on their profiles.
            </p>
            <div className="mt-6">
              <Link
                href="/dashboard/browse-professionals"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Browse Professionals
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {professionals.map((professional) => (
              <div
                key={professional.id}
                className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow duration-200"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start gap-4">
                    <Link
                      href={`/dashboard/view-profile/${professional.user.id}`}
                      className="flex-1 min-w-0"
                    >
                      <div className="flex items-start space-x-4">
                        <ProfilePictureWithBadge
                          profile={professional}
                          size="md"
                          hideBadge={true}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                              {getDisplayName(professional)}
                            </h3>
                            {professional.openToWork && (
                              <OpenToWorkBadge variant="inline" size="sm" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {professional.title || professional.preferredRole || 'Professional'}
                          </p>
                          {professional.location && (
                            <div className="flex items-center text-sm text-gray-500">
                              <MapPinIcon className="h-4 w-4 mr-1.5 text-gray-400" />
                              {professional.location}
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                    
                    <SaveCandidateButton
                      candidateId={professional.user.id}
                      candidateName={getDisplayName(professional)}
                      onSaveStatusChange={(saved) => handleSaveStatusChange(professional.user.id, saved)}
                      className="flex-shrink-0"
                    />
                  </div>

                  {professional.skills && professional.skills.length > 0 && (
                    <div className="mt-5">
                      <div className="flex flex-wrap gap-2">
                        {professional.skills.slice(0, 5).map((skill, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {skill}
                          </span>
                        ))}
                        {professional.skills.length > 5 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            +{professional.skills.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="mt-5 flex items-center justify-between text-sm">
                    <div className="flex items-center text-gray-500">
                      <CurrencyDollarIcon className="h-4 w-4 mr-1.5 text-gray-400" />
                      {formatSalaryRange(professional)}
                    </div>
                    <div className="text-xs text-gray-500">
                      Saved on {new Date(professional.savedAt).toLocaleDateString()}
                    </div>
                  </div>

                  {professional.note && (
                    <div className="mt-5 p-3 bg-yellow-50 rounded-md border-l-4 border-yellow-200">
                      <div className="flex">
                        <div className="ml-1">
                          <p className="text-sm text-yellow-800">
                            <strong>Note:</strong> {professional.note}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {professional.job && (
                    <div className="mt-5 p-3 bg-blue-50 rounded-md border-l-4 border-blue-200">
                      <div className="flex">
                        <div className="ml-1">
                          <p className="text-xs text-blue-600 font-medium">Saved for job:</p>
                          <p className="text-sm text-blue-800 font-medium">{professional.job.title}</p>
                          <p className="text-xs text-blue-600">{professional.job.location}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 