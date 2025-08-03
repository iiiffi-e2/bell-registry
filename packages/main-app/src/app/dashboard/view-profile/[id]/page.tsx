"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  UserCircleIcon,
  MapPinIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  CalendarIcon,
  EyeIcon,
  ClockIcon,
  CheckCircleIcon,
  LinkIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import { PhotoGallery } from "@/components/profile/photo-gallery";
import { MediaViewer } from "@/components/profile/media-viewer";
import { SaveCandidateButton } from "@/components/candidates/SaveCandidateButton";
import { MessageProfessionalButton } from "@/components/professionals/MessageProfessionalButton";
import { OpenToWorkBadge, ProfilePictureWithBadge } from "@/components/profile/open-to-work-badge";
import { FormattedText } from "@/components/ui/formatted-text";

interface Experience {
  title: string;
  employer: string;
  startDate: string;
  endDate?: string;
  description: string;
}

interface ProfessionalProfile {
  id: string;
  bio: string | null;
  title: string | null;
  skills: string[];
  experience: Experience[];
  certifications: string[];
  location: string | null;
  availability: string | null;
  resumeUrl: string | null;
  profileViews: number;
  workLocations: string[];
  openToRelocation: boolean;
  yearsOfExperience: number | null;
  whatImSeeking: string | null;
  whyIEnjoyThisWork: string | null;
  whatSetsApartMe: string | null;
  idealEnvironment: string | null;
  seekingOpportunities: string[];
  payRangeMin: number | null;
  payRangeMax: number | null;
  payType: string;
  additionalPhotos: string[];
  mediaUrls: string[];
  openToWork: boolean;
  employmentType: string | null;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    image: string | null;
    role: string;
    createdAt: string;
    email: string;
    phoneNumber: string | null;
    isAnonymous: boolean;
    customInitials?: string | null;
    dontContactMe?: boolean;
  };
  preferredRole: string | null;
}

function getDisplayName(profile: ProfessionalProfile) {
  const firstName = profile.user.firstName || '';
  const lastName = profile.user.lastName || '';
  
  if (profile.user.isAnonymous) {
    // Use custom initials if provided, otherwise use name initials
    if (profile.user.customInitials && profile.user.customInitials.length >= 2) {
      const initials = profile.user.customInitials.toUpperCase();
      if (initials.length === 2) {
        return `${initials[0]}. ${initials[1]}.`;
      } else if (initials.length === 3) {
        return `${initials[0]}. ${initials[1]}. ${initials[2]}.`;
      }
    }
    
    // Fallback to name initials
    const firstInitial = firstName[0] || '';
    const lastInitial = lastName[0] || '';
    return `${firstInitial}. ${lastInitial}.`;
  }
  
  return `${firstName} ${lastName}`.trim();
}

export default function ProfessionalProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfessionalProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState<number | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/dashboard/view-profile/${params.id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Professional not found');
        } else {
          setError('Failed to load professional profile');
        }
        return;
      }
      
      const data = await response.json();
      setProfile(data);
    } catch (err) {
      console.error('Error fetching professional profile:', err);
      setError('Failed to load professional profile');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    
    fetchProfile();
  }, [status, router, fetchProfile]);

  const handleBack = () => {
    router.back();
  };

  const handleMediaClick = (index: number) => {
    setSelectedMediaIndex(index);
  };

  const handleCloseMedia = () => {
    setSelectedMediaIndex(null);
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading professional profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg font-medium mb-2">Error</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleBack}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 text-lg font-medium mb-2">Professional not found</div>
          <button
            onClick={handleBack}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const displayName = getDisplayName(profile);
  const allMedia = [
    ...(profile.additionalPhotos || []),
    ...(profile.mediaUrls || [])
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={handleBack}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back
          </button>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <ProfilePictureWithBadge
                  profile={profile}
                  size="lg"
                  className="h-20 w-20"
                />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{displayName}</h1>
                  {profile.title && (
                    <p className="text-lg text-gray-600 mt-1">{profile.title}</p>
                  )}
                  {profile.location && (
                    <div className="flex items-center text-gray-500 mt-2">
                      <MapPinIcon className="h-4 w-4 mr-1" />
                      {profile.location}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <SaveCandidateButton
                  candidateId={profile.user.id}
                  candidateName={displayName}
                  onSaveStatusChange={() => {}}
                />
                <MessageProfessionalButton
                  professionalId={profile.user.id}
                  professionalName={displayName}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Bio */}
            {profile.bio && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">About</h2>
                <FormattedText text={profile.bio} />
              </div>
            )}

            {/* Experience */}
            {profile.experience && profile.experience.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Experience</h2>
                <div className="space-y-4">
                  {profile.experience.map((exp, index) => (
                    <div key={index} className="border-l-4 border-blue-500 pl-4">
                      <h3 className="font-medium text-gray-900">{exp.title}</h3>
                      <p className="text-gray-600">{exp.employer}</p>
                      <p className="text-sm text-gray-500">
                        {exp.startDate} - {exp.endDate || 'Present'}
                      </p>
                      {exp.description && (
                        <p className="text-gray-700 mt-2">{exp.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skills */}
            {profile.skills && profile.skills.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Media Gallery */}
            {allMedia.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Portfolio</h2>
                <PhotoGallery
                  photos={allMedia}
                  onPhotoClick={handleMediaClick}
                />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Stats */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Profile Views</span>
                  <span className="font-medium">{profile.profileViews}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Member Since</span>
                  <span className="font-medium">
                    {new Date(profile.user.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {profile.yearsOfExperience && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Experience</span>
                    <span className="font-medium">{profile.yearsOfExperience} years</span>
                  </div>
                )}
              </div>
            </div>

            {/* Additional Info */}
            {profile.whatImSeeking && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">What I&apos;m Seeking</h3>
                <FormattedText text={profile.whatImSeeking} />
              </div>
            )}

            {profile.whyIEnjoyThisWork && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Why I Enjoy This Work</h3>
                <FormattedText text={profile.whyIEnjoyThisWork} />
              </div>
            )}

            {profile.whatSetsApartMe && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">What Sets Me Apart</h3>
                <FormattedText text={profile.whatSetsApartMe} />
              </div>
            )}

            {profile.idealEnvironment && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Ideal Environment</h3>
                <FormattedText text={profile.idealEnvironment} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Media Viewer Modal */}
      {selectedMediaIndex !== null && (
        <MediaViewer
          media={allMedia}
          initialIndex={selectedMediaIndex}
          onClose={handleCloseMedia}
        />
      )}
    </div>
  );
} 