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
        {/* Basic Info */}
        <div className="px-4 py-5 sm:px-6 flex items-center border-b border-gray-200">
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
          <div className="ml-6 flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {profile.user.firstName} {profile.user.lastName}
                </h1>
                <p className="mt-1 text-lg text-gray-600">{profile.title || 'Professional'}</p>
                <div className="mt-2 flex flex-col sm:flex-row sm:flex-wrap sm:space-x-6">
                  {profile.location && (
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <MapPinIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                      {profile.location}
                    </div>
                  )}
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <EnvelopeIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                    {profile.user.email}
                  </div>
                  {profile.user.phoneNumber && (
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <PhoneIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                      {profile.user.phoneNumber}
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right text-sm text-gray-500">
                <div className="flex items-center justify-end mb-1">
                  <EyeIcon className="h-4 w-4 mr-1" />
                  {profile.profileViews} profile views
                </div>
                <div className="flex items-center justify-end">
                  <ClockIcon className="h-4 w-4 mr-1" />
                  Member since {new Date(profile.user.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 py-5 sm:px-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
            {/* Bio */}
            {profile.bio && (
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Bio</dt>
                <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{profile.bio}</dd>
              </div>
            )}

            {/* Skills */}
            {profile.skills.length > 0 && (
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Skills</dt>
                <dd className="mt-1">
                  <ul className="flex flex-wrap gap-2">
                    {profile.skills.map((skill, index) => (
                      <li
                        key={index}
                        className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                      >
                        {skill}
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            )}

            {/* Experience */}
            {profile.experience.length > 0 && (
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Experience</dt>
                <dd className="mt-1 space-y-4">
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
                </dd>
              </div>
            )}

            {/* Certifications */}
            {profile.certifications.length > 0 && (
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">
                  Certifications
                </dt>
                <dd className="mt-1">
                  <ul className="flex flex-wrap gap-2">
                    {profile.certifications.map((cert, index) => (
                      <li
                        key={index}
                        className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800"
                      >
                        <AcademicCapIcon className="h-4 w-4 mr-1" />
                        {cert}
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            )}

            {/* Availability */}
            {profile.availability && (
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">
                  Available From
                </dt>
                <dd className="mt-1 text-sm text-gray-900 flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-1 text-gray-400" />
                  {new Date(profile.availability).toLocaleDateString()}
                </dd>
              </div>
            )}

            {/* Resume */}
            {profile.resumeUrl && (
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Resume</dt>
                <dd className="mt-1">
                  <a
                    href={profile.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <BriefcaseIcon className="h-5 w-5 mr-2 text-gray-500" />
                    View Resume
                  </a>
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    </div>
  );
} 