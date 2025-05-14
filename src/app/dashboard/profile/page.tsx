"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  UserCircleIcon,
  PencilSquareIcon,
  MapPinIcon,
  EnvelopeIcon,
  PhoneIcon,
  BriefcaseIcon,
  AcademicCapIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import { generateProfileUrl } from "@/lib/utils";
import Link from "next/link";

interface CandidateProfile {
  id: string;
  userId: string;
  bio: string | null;
  title: string | null;
  skills: string[];
  experience: any[];
  certifications: string[];
  availability: Date | null;
  resumeUrl: string | null;
  location: string | null;
  createdAt: Date;
  updatedAt: Date;
  user: {
    firstName: string | null;
    lastName: string | null;
    email: string;
    phoneNumber: string | null;
    image: string | null;
    profileSlug: string | null;
  };
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
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
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
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PencilSquareIcon className="h-5 w-5 mr-2 text-gray-500" />
              Edit Profile
            </button>
          </div>
        </div>

        {/* Profile Content */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          {/* Basic Info */}
          <div className="px-4 py-5 sm:px-6 flex items-center">
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
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    aria-hidden="true"
                    className="h-24 w-24 text-gray-300"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                    />
                  </svg>
                </div>
              )}
            </div>
            <div className="ml-6">
              <h3 className="text-2xl font-bold text-gray-900">
                {profile.user.firstName} {profile.user.lastName}
              </h3>
              <p className="mt-1 text-lg text-gray-600">{profile.title || 'Professional'}</p>
              <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
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
          </div>

          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
              {/* Bio */}
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Bio</dt>
                <dd className="mt-1 text-sm text-gray-900">{profile.bio}</dd>
              </div>

              {/* Skills */}
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

              {/* Experience */}
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Experience</dt>
                <dd className="mt-1 space-y-4">
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
                </dd>
              </div>

              {/* Certifications */}
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

              {/* Availability */}
              {profile.availability && (
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">
                    Available From
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
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
    </div>
  );
} 