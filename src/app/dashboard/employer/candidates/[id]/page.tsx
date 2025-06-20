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

interface CandidateProfile {
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

function getDisplayName(profile: CandidateProfile) {
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

export default function CandidateProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/dashboard/candidates/${params.id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError("Profile not found");
        } else {
          setError("Failed to load profile");
        }
        return;
      }

      const data = await response.json();
      setProfile(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    // Wait for session to load, don't redirect during loading state
    if (status === "loading") {
      return;
    }

    if (status === "unauthenticated" || !session?.user) {
      router.push("/login");
      return;
    }

    if (session.user.role !== "EMPLOYER" && session.user.role !== "AGENCY") {
      router.push("/dashboard");
      return;
    }

    fetchProfile();
  }, [session, status, params.id, router, fetchProfile]);

  // Show loading state while session is loading or while fetching profile
  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-6">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <button
              onClick={() => router.back()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="py-6">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeftIcon className="mr-1 h-4 w-4" />
            Back
          </button>
        </div>

        {/* Profile Content */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content Column */}
              <div className="lg:col-span-2">
                {/* Profile Header */}
                <div className="flex items-center mb-6">
                  <div className="flex-shrink-0">
                    <ProfilePictureWithBadge
                      imageUrl={profile.user.image}
                      displayName={getDisplayName(profile)}
                      isOpenToWork={profile.openToWork}
                      isAnonymous={profile.user.isAnonymous}
                      size="lg"
                    />
                  </div>
                  <div className="ml-6">
                    <div className="flex items-center gap-3">
                      <h1 className="text-2xl font-bold text-gray-900">
                        {getDisplayName(profile)}
                      </h1>
                      {profile.openToWork && (
                        <OpenToWorkBadge variant="inline" size="sm" />
                      )}
                    </div>
                    <p className="mt-1 text-lg text-gray-600">{profile.title || profile.preferredRole || 'Professional'}</p>

                  </div>
                </div>

                {/* Bio */}
                {profile.bio && (
                  <div className="mb-8 bg-gray-50 rounded-lg p-6 border-l-4 border-blue-200">
                    <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                      <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-1 rounded-full mr-3">Bio</span>
                      Professional Bio
                    </h4>
                    <FormattedText text={profile.bio} />
                  </div>
                )}

                {/* About Me Sections */}
                {(profile.whatImSeeking || profile.whyIEnjoyThisWork || profile.whatSetsApartMe || profile.idealEnvironment) && (
                  <div className="space-y-6">
                    {profile.whatImSeeking && (
                      <div className="bg-gray-50 rounded-lg p-6 border-l-4 border-purple-200">
                        <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                          <span className="bg-purple-100 text-purple-800 text-sm font-medium px-2.5 py-1 rounded-full mr-3">Goals</span>
                          What I&apos;m Seeking
                        </h4>
                        <FormattedText text={profile.whatImSeeking} />
                      </div>
                    )}

                    {profile.whyIEnjoyThisWork && (
                      <div className="bg-gray-50 rounded-lg p-6 border-l-4 border-green-200">
                        <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                          <span className="bg-green-100 text-green-800 text-sm font-medium px-2.5 py-1 rounded-full mr-3">Passion</span>
                          Why I Enjoy This Work
                        </h4>
                        <FormattedText text={profile.whyIEnjoyThisWork} />
                      </div>
                    )}

                    {profile.whatSetsApartMe && (
                      <div className="bg-gray-50 rounded-lg p-6 border-l-4 border-amber-200">
                        <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                          <span className="bg-amber-100 text-amber-800 text-sm font-medium px-2.5 py-1 rounded-full mr-3">Strengths</span>
                          What Sets Me Apart
                        </h4>
                        <FormattedText text={profile.whatSetsApartMe} />
                      </div>
                    )}

                    {profile.idealEnvironment && (
                      <div className="bg-gray-50 rounded-lg p-6 border-l-4 border-indigo-200">
                        <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                          <span className="bg-indigo-100 text-indigo-800 text-sm font-medium px-2.5 py-1 rounded-full mr-3">Culture</span>
                          Ideal Environment
                        </h4>
                        <FormattedText text={profile.idealEnvironment} />
                      </div>
                    )}
                  </div>
                )}

                {/* Skills */}
                {profile.skills.length > 0 && (
                  <div className="mt-8">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Skills</h4>
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

                {/* Experience */}
                {profile.experience.length > 0 && (
                  <div className="mt-8">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Experience</h4>
                    <div className="space-y-4">
                      {profile.experience.map((exp, index) => (
                        <div key={index} className="border-l-4 border-gray-200 pl-4">
                          <p className="text-sm font-medium text-gray-900">
                            <BriefcaseIcon className="h-4 w-4 inline mr-1" />
                            {exp.title} at {exp.employer}
                          </p>
                          <p className="text-sm text-gray-500">
                            {exp.startDate} - {exp.endDate || "Present"}
                          </p>
                          <div className="mt-1">
                            <FormattedText text={exp.description} className="text-sm text-gray-500" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Certifications */}
                {profile.certifications.length > 0 && (
                  <div className="mt-8">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Certifications</h4>
                    <div className="space-y-2">
                      {profile.certifications.map((cert, index) => (
                        <div key={index} className="flex items-center text-sm text-gray-700">
                          <AcademicCapIcon className="h-5 w-5 mr-2 text-gray-400" />
                          {cert}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar Column */}
              <div className="lg:col-span-1 space-y-6">
                <div className="text-right text-sm text-gray-500 mb-4">
                  <div className="flex items-center justify-end mb-1">
                    <EyeIcon className="h-4 w-4 mr-1" />
                    {profile.profileViews} profile views
                  </div>
                  <div className="flex items-center justify-end">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    Member since {new Date(profile.user.createdAt).toLocaleDateString()}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <SaveCandidateButton 
                    candidateId={profile.user.id} 
                    candidateName={getDisplayName(profile)}
                    className="w-full"
                  />
                  <MessageProfessionalButton 
                    professionalId={profile.user.id}
                    className="w-full"
                    dontContactMe={profile.user.dontContactMe}
                  />
                </div>

                {/* Location */}
                {profile.location && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Current Location</h4>
                    <p className="text-gray-900 flex items-center">
                      <MapPinIcon className="h-5 w-5 mr-2 text-gray-400" />
                      {profile.location}
                    </p>
                  </div>
                )}

                {/* Work Preferences */}
                {(profile.workLocations?.length > 0 || profile.openToRelocation) && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Work Preferences</h4>
                    {profile.workLocations?.length > 0 && (
                      <div className="mb-2">
                        <p className="text-sm font-medium text-gray-700">Available to work in:</p>
                        <p className="text-sm text-gray-900">{profile.workLocations.join(", ")}</p>
                      </div>
                    )}
                    {profile.openToRelocation && (
                      <div className="text-sm text-blue-600 flex items-center">
                        <CheckCircleIcon className="h-5 w-5 mr-1" />
                        Open to relocation
                      </div>
                    )}
                  </div>
                )}

                {/* Years of Experience */}
                {profile.yearsOfExperience !== null && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Years of Experience</h4>
                    <p className="text-gray-900">{profile.yearsOfExperience} years</p>
                  </div>
                )}

                {/* Employment Type */}
                {profile.employmentType && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Employment Type Preference</h4>
                    <p className="text-gray-900 flex items-center">
                      <BriefcaseIcon className="h-5 w-5 mr-2 text-gray-400" />
                      {profile.employmentType}
                    </p>
                  </div>
                )}

                {/* Availability */}
                {profile.availability && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Available From</h4>
                    <p className="text-gray-900">
                      <CalendarIcon className="h-5 w-5 mr-2 text-gray-400 inline" />
                      {new Date(profile.availability).toLocaleDateString()}
                    </p>
                  </div>
                )}

                {/* Salary Range */}
                {(profile.payRangeMin || profile.payRangeMax) && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Salary Expectations</h4>
                    <p className="text-gray-900">
                      {profile.payRangeMin && profile.payRangeMax
                        ? `$${profile.payRangeMin.toLocaleString()} - $${profile.payRangeMax.toLocaleString()}${profile.payType === 'Hourly' ? '/hr' : ''}`
                        : profile.payRangeMin
                        ? `$${profile.payRangeMin.toLocaleString()}+${profile.payType === 'Hourly' ? '/hr' : ''}`
                        : `Up to $${profile.payRangeMax!.toLocaleString()}${profile.payType === 'Hourly' ? '/hr' : ''}`}
                    </p>
                  </div>
                )}

                {/* Seeking Opportunities */}
                {profile.seekingOpportunities.length > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Seeking</h4>
                    <div className="space-y-1">
                      {profile.seekingOpportunities.map((opportunity, index) => (
                        <div key={index} className="text-sm text-gray-900 flex items-center">
                          <CheckCircleIcon className="h-4 w-4 mr-2 text-green-500" />
                          {opportunity}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Photo Gallery */}
                {profile.additionalPhotos.length > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <PhotoGallery photos={profile.additionalPhotos} />
                  </div>
                )}

                {/* Media Files */}
                {profile.mediaUrls.length > 0 && (
                  <MediaViewer mediaUrls={profile.mediaUrls} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 