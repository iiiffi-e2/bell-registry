"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
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
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { PhotoGallery } from "@/components/profile/photo-gallery";
import { MediaViewer } from "@/components/profile/media-viewer";
import { SaveCandidateButton } from "@/components/candidates/SaveCandidateButton";
import { MessageProfessionalButton } from "@/components/professionals/MessageProfessionalButton";
import { ReportProfileModal } from "@/components/profile/ReportProfileModal";
import { OpenToWorkBadge, ProfilePictureWithBadge } from "@/components/profile/open-to-work-badge";
import { FormattedText } from "@/components/ui/formatted-text";
import { notFound } from "next/navigation";

interface Experience {
  title: string;
  employer: string;
  startDate: string;
  endDate?: string;
  description: string;
}

interface PublicProfile {
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

// Helper function to get display name based on anonymous setting
function getDisplayName(profile: PublicProfile) {
  const firstName = profile.user.firstName || '';
  const lastName = profile.user.lastName || '';
  
  // Check if anonymized (either by isAnonymous flag or single character names)
  if (profile.user.isAnonymous || (firstName.length === 1 && lastName.length === 1)) {
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

export default function PublicProfilePage({
  params,
}: {
  params: { slug: string };
}) {
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await fetch(`/api/professionals/${params.slug}`);
        if (!response.ok) {
          throw new Error('Profile not found');
        }
        const data = await response.json();
        setProfile(data);
        setProfileLoaded(true);
      } catch (error) {
        console.error('Error fetching profile:', error);
        notFound();
      } finally {
        setLoading(false);
      }
    }

    // Only fetch profile if it hasn't been loaded yet
    if (!profileLoaded) {
      fetchProfile();
    }
  }, [params.slug, profileLoaded]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-white shadow rounded-lg animate-pulse">
          <div className="px-4 py-5 sm:p-6">
            <div className="h-32 bg-gray-200 rounded mb-4"></div>
            <div className="h-6 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded mb-4"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="space-y-4">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
              <div className="lg:col-span-1">
                <div className="space-y-4">
                  <div className="h-20 bg-gray-200 rounded"></div>
                  <div className="h-20 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    notFound();
  }

  return (
    <div className="max-w-5xl mx-auto">
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
                     isOpenToWork={false}
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

               {/* Anonymous Profile Notice - Only for employers/agencies with network access */}
               {profile.user.isAnonymous && (session?.user?.role === 'EMPLOYER' || session?.user?.role === 'AGENCY') && (
                 <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                   <div className="flex items-start">
                     <div className="flex-shrink-0">
                       <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                         <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                       </svg>
                     </div>
                     <div className="ml-3">
                       <p className="text-sm text-blue-800">
                         <span className="font-medium">Profile Anonymity Notice:</span> This professional has chosen to keep their profile anonymous. While you have network access, some information remains hidden for privacy reasons.
                       </p>
                     </div>
                   </div>
                 </div>
               )}

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

              {/* Experience */}
              {profile.experience.length > 0 && (
                <div className="mt-8">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Experience</h4>
                  <div className="space-y-4">
                    {profile.experience.map((exp, index) => (
                      <div key={index} className="border-l-4 border-gray-200 pl-4">
                        <p className="text-sm font-medium text-gray-900">
                          {exp.title} at {exp.employer}
                        </p>
                        <p className="text-sm text-gray-500">
                          {exp.startDate} - {exp.endDate || "Present"}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          {exp.description}
                        </p>
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

              {/* Action Buttons - Only for Employers/Agencies */}
              {(session?.user?.role === 'EMPLOYER' || session?.user?.role === 'AGENCY') && (
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
              )}

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
                  <h4 className="text-sm font-medium text-gray-500 mb-2">When are you available to start?</h4>
                  <p className="text-gray-900">
                    {(() => {
                      const [year, month, day] = profile.availability.split('T')[0].split('-');
                      return `${month}/${day}/${year.slice(2)}`;
                    })()}
                  </p>
                </div>
              )}

              {/* Seeking Opportunities */}
              {profile.seekingOpportunities?.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Seeking Opportunities</h4>
                  <div className="flex flex-wrap gap-2">
                    {profile.seekingOpportunities.map((opportunity, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                      >
                        {opportunity}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Skills */}
              {profile.skills.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Skills & Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Pay Range */}
              {(profile.payRangeMin || profile.payRangeMax) && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Pay Range</h4>
                  <p className="text-gray-900">
                    {profile.payRangeMin && profile.payRangeMax ? (
                      <>
                        ${profile.payRangeMin.toLocaleString()} - ${profile.payRangeMax.toLocaleString()}
                        {profile.payType === 'Hourly' && '/hr'}
                      </>
                    ) : profile.payRangeMin ? (
                      <>
                        From ${profile.payRangeMin.toLocaleString()}
                        {profile.payType === 'Hourly' && '/hr'}
                      </>
                    ) : (
                      <>
                        Up to ${profile.payRangeMax?.toLocaleString()}
                        {profile.payType === 'Hourly' && '/hr'}
                      </>
                    )}
                  </p>
                </div>
              )}

              {/* Resume - Hidden for anonymous profiles */}
              {!profile.user.isAnonymous && profile.resumeUrl && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Resume</h4>
                  <a
                    href={profile.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <BriefcaseIcon className="h-5 w-5 mr-2 text-gray-500" />
                    View Resume
                  </a>
                </div>
              )}

              {/* Photo Gallery - Hidden for anonymous profiles */}
              {!profile.user.isAnonymous && profile.additionalPhotos && profile.additionalPhotos.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <PhotoGallery photos={profile.additionalPhotos} />
                </div>
              )}

              {/* Media Files - Hidden for anonymous profiles */}
              {!profile.user.isAnonymous && profile.mediaUrls && profile.mediaUrls.length > 0 && (
                <MediaViewer mediaUrls={profile.mediaUrls} />
              )}
            </div>
          </div>

          {/* Report Profile Link - Subtle placement at the bottom */}
          {session && session.user.id !== profile.user.id && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="text-center">
                <button
                  onClick={() => setIsReportModalOpen(true)}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors inline-flex items-center"
                >
                  <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                  Report this profile
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Report Profile Modal */}
      <ReportProfileModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        profileId={profile.user.id}
        profileName={getDisplayName(profile)}
      />
    </div>
  );
} 