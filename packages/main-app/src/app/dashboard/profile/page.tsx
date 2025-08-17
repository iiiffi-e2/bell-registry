"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  UserCircleIcon,
  PencilSquareIcon,
  MapPinIcon,


  BriefcaseIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  LinkIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import { generateProfileUrl } from "@/lib/utils";
import Link from "next/link";
import { PhotoGallery } from "@/components/profile/photo-gallery";
import { MediaViewer } from "@/components/profile/media-viewer";
import { OpenToWorkBadge, ProfilePictureWithBadge } from "@/components/profile/open-to-work-badge";
import { FormattedText } from "@/components/ui/formatted-text";

interface CandidateProfile {
  id: string;
  userId: string;
  bio: string | null;
  title: string | null;
  skills: string[];
  experience: any[];
  certifications: string[];
  availability: string | null;
  resumeUrl: string | null;
  location: string | null;
  createdAt: Date;
  updatedAt: Date;
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
    firstName: string | null;
    lastName: string | null;
    email: string;
    phoneNumber: string | null;
    image: string | null;
    profileSlug: string | null;
    id: string;
    isAnonymous: boolean;
    customInitials?: string | null;
  };
  preferredRole: string | null;
}

// Helper function to get display name based on anonymous setting
function getDisplayName(profile: CandidateProfile) {
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
    const firstInitial = profile.user.firstName?.[0] || '';
    const lastInitial = profile.user.lastName?.[0] || '';
    return `${firstInitial}. ${lastInitial}.`;
  }
  return `${profile.user.firstName || ''} ${profile.user.lastName || ''}`.trim();
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch("/api/profile");
        if (response.ok) {
          const data = await response.json();
          setProfile(data);
          if (!data || !data.bio) {
            // If profile doesn't exist or is empty, redirect to edit
            router.push("/dashboard/profile/edit");
          }
        } else {
          // If profile doesn't exist, redirect to edit
          router.push("/dashboard/profile/edit");
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user) {
      fetchProfile();
    }
  }, [session, router]);

  if (loading) {
    return (
      <div className="min-h-screen py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-32 bg-gray-200 rounded-lg mb-6"></div>
            <div className="h-20 bg-gray-200 rounded-lg mb-4"></div>
            <div className="h-40 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen py-8">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-slate-900 sm:text-3xl sm:truncate">
              My Profile
            </h2>
            {profile?.user.profileSlug && (
              <Link
                href={generateProfileUrl(profile.user.profileSlug)}
                className="mt-2 inline-flex items-center text-sm text-blue-600 hover:text-blue-500"
              >
                View public profile
                <svg className="ml-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.22 14.78a.75.75 0 001.06 0l7.22-7.22v5.69a.75.75 0 001.5 0v-7.5a.75.75 0 00-.75-.75h-7.5a.75.75 0 000 1.5h5.69l-7.22 7.22a.75.75 0 000 1.06z" clipRule="evenodd" />
                </svg>
              </Link>
            )}
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <button
              onClick={() => router.push("/dashboard/profile/edit")}
              className="inline-flex items-center px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PencilSquareIcon className="h-5 w-5 mr-2 text-slate-500" />
              Edit Profile
            </button>
          </div>
        </div>

        {/* Anonymous Mode Banner */}
        {profile.user.isAnonymous && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  This profile is currently in anonymous mode. Your public profile will display only your initials and hide your headshot and email address.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Profile Content */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content Column */}
              <div className="lg:col-span-2">
                {/* Profile Header */}
                <div className="flex items-center mb-6">
                  <div className="flex-shrink-0">
                                       <ProfilePictureWithBadge
                     imageUrl={profile.user.image}
                     displayName={`${profile.user.firstName || ''} ${profile.user.lastName || ''}`.trim()}
                     isOpenToWork={false}
                     isAnonymous={false}
                     size="lg"
                   />
                  </div>
                  <div className="ml-6">
                    <div className="flex items-center gap-3">
                      <h3 className="text-2xl font-bold text-gray-900">
                        {`${profile.user.firstName || ''} ${profile.user.lastName || ''}`.trim()}
                      </h3>
                      {profile.openToWork && (
                        <OpenToWorkBadge variant="inline" size="sm" />
                      )}
                    </div>
                    <p className="mt-1 text-lg text-gray-600">{profile.preferredRole || 'Professional'}</p>

                    
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

                {/* Experience */}
                {profile.experience?.length > 0 && (
                  <div className="mt-8">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Experience</h4>
                    <div className="space-y-4">
                      {profile.experience.map((exp: any, index: number) => (
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
                        const [year, month, day] = (profile.availability as string).split('T')[0].split('-');
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

                {/* Resume */}
                {profile.resumeUrl && (
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