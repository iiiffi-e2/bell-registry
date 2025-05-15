import Image from "next/image";
import { headers } from "next/headers";
import {
  UserCircleIcon,
  MapPinIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  CalendarIcon,
  EyeIcon,
  ClockIcon,
  EnvelopeIcon,
  PhoneIcon,
  CheckCircleIcon,
  LinkIcon,
} from "@heroicons/react/24/outline";

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
  payCurrency: string;
  additionalPhotos: string[];
  mediaUrls: string[];
  user: {
    firstName: string | null;
    lastName: string | null;
    image: string | null;
    role: string;
    createdAt: string;
    email: string;
    phoneNumber: string | null;
  };
}

async function getProfile(slug: string): Promise<PublicProfile> {
  const headersList = headers();
  const host = headersList.get("host");
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  const url = `${protocol}://${host}/api/professionals/${slug}`;
  
  console.log("[PROFILE_PAGE] Fetching profile from:", url);
  
  const response = await fetch(url, {
    next: { revalidate: 60 }, // Revalidate every minute
  });

  console.log("[PROFILE_PAGE] Response status:", response.status);

  if (!response.ok) {
    const text = await response.text();
    console.error("[PROFILE_PAGE] Error response:", text);
    throw new Error('Profile not found');
  }

  const data = await response.json();
  console.log("[PROFILE_PAGE] Received profile data:", data);
  return data;
}

export default async function PublicProfilePage({
  params,
}: {
  params: { slug: string };
}) {
  console.log("[PROFILE_PAGE] Rendering page for slug:", params.slug);
  
  const profile = await getProfile(params.slug);
  
  console.log("[PROFILE_PAGE] Profile loaded:", {
    hasProfile: !!profile,
    hasBio: !!profile?.bio,
    hasSkills: profile?.skills?.length > 0,
    hasExperience: profile?.experience?.length > 0,
  });

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
                  {profile.user.image ? (
                    <div className="h-24 w-24 rounded-full overflow-hidden bg-gray-100">
                      <Image
                        src={profile.user.image}
                        alt={`${profile.user.firstName} ${profile.user.lastName}`}
                        width={96}
                        height={96}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-24 w-24 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                      <UserCircleIcon className="h-24 w-24 text-gray-300" />
                    </div>
                  )}
                </div>
                <div className="ml-6">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {profile.user.firstName} {profile.user.lastName}
                  </h1>
                  <p className="mt-1 text-lg text-gray-600">{profile.title || 'Professional'}</p>
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <EnvelopeIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                    {profile.user.email}
                  </div>
                  {profile.user.phoneNumber && (
                    <div className="mt-1 flex items-center text-sm text-gray-500">
                      <PhoneIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                      {profile.user.phoneNumber}
                    </div>
                  )}
                </div>
              </div>

              {/* Bio */}
              {profile.bio && (
                <div className="mb-8">
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Professional Bio</h4>
                  <p className="text-gray-700 whitespace-pre-wrap">{profile.bio}</p>
                </div>
              )}

              {/* About Me Sections */}
              {(profile.whatImSeeking || profile.whyIEnjoyThisWork || profile.whatSetsApartMe || profile.idealEnvironment) && (
                <div className="space-y-8">
                  {profile.whatImSeeking && (
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-2">What I'm Seeking</h4>
                      <p className="text-gray-700 whitespace-pre-wrap">{profile.whatImSeeking}</p>
                    </div>
                  )}

                  {profile.whyIEnjoyThisWork && (
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-2">Why I Enjoy This Work</h4>
                      <p className="text-gray-700 whitespace-pre-wrap">{profile.whyIEnjoyThisWork}</p>
                    </div>
                  )}

                  {profile.whatSetsApartMe && (
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-2">What Sets Me Apart</h4>
                      <p className="text-gray-700 whitespace-pre-wrap">{profile.whatSetsApartMe}</p>
                    </div>
                  )}

                  {profile.idealEnvironment && (
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-2">Ideal Environment</h4>
                      <p className="text-gray-700 whitespace-pre-wrap">{profile.idealEnvironment}</p>
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
                          <BriefcaseIcon className="h-4 w-4 inline mr-1" />
                          {exp.title} at {exp.employer}
                        </p>
                        <p className="text-sm text-gray-500">
                          {exp.startDate} - {exp.endDate || "Present"}
                        </p>
                        <p className="mt-1 text-sm text-gray-500 whitespace-pre-wrap">
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
                        {profile.payCurrency} {profile.payRangeMin.toLocaleString()} - {profile.payRangeMax.toLocaleString()}
                      </>
                    ) : profile.payRangeMin ? (
                      <>
                        From {profile.payCurrency} {profile.payRangeMin.toLocaleString()}
                      </>
                    ) : (
                      <>
                        Up to {profile.payCurrency} {profile.payRangeMax.toLocaleString()}
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 