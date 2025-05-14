"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import * as z from "zod";
import { ProfilePictureUpload } from "@/components/profile/profile-picture-upload";
import { SparklesIcon } from "@heroicons/react/24/outline";
import ImprovedBioModal from "@/components/ui/improved-bio-modal";

const profileSchema = z.object({
  bio: z.string().min(50, "Bio must be at least 50 characters"),
  title: z.string().min(2, "Professional title is required"),
  location: z.string().min(1, "Location is required"),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 characters"),
  skills: z.string().transform((str) => str.split(",").map((s) => s.trim())),
  certifications: z.string().transform((str) => str.split(",").map((s) => s.trim())),
  availability: z.string().optional(),
  experience: z.array(z.object({
    title: z.string(),
    employer: z.string(),
    startDate: z.string(),
    endDate: z.string().optional(),
    description: z.string(),
  })).optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function EditProfilePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [experiences, setExperiences] = useState([{ 
    title: "", 
    employer: "", 
    startDate: "", 
    endDate: "", 
    description: "" 
  }]);
  const [showImprovedBioModal, setShowImprovedBioModal] = useState(false);
  const [improvedBio, setImprovedBio] = useState("");
  const [isImprovingBio, setIsImprovingBio] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    watch,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  const currentBio = watch("bio");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch("/api/profile");
        if (response.ok) {
          const data = await response.json();
          // Pre-fill form with existing data
          setValue("bio", data.bio || "");
          setValue("title", data.title || "");
          setValue("location", data.location || "");
          setValue("phoneNumber", data.user.phoneNumber || "");
          setValue("skills", data.skills?.join(", ") || "");
          setValue("certifications", data.certifications?.join(", ") || "");
          setValue("availability", data.availability ? new Date(data.availability).toISOString().split("T")[0] : "");
          if (data.experience?.length > 0) {
            setExperiences(data.experience);
          }
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };

    if (session?.user) {
      fetchProfile();
    }
  }, [session, setValue]);

  const onSubmit = async (data: ProfileFormData) => {
    try {
      setIsLoading(true);
      data.experience = experiences.filter(exp => exp.title && exp.employer);

      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      router.push("/dashboard/profile");
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const addExperience = () => {
    setExperiences([
      ...experiences,
      { title: "", employer: "", startDate: "", endDate: "", description: "" },
    ]);
  };

  const removeExperience = (index: number) => {
    setExperiences(experiences.filter((_, i) => i !== index));
  };

  const updateExperience = (index: number, field: string, value: string) => {
    const updatedExperiences = [...experiences];
    updatedExperiences[index] = {
      ...updatedExperiences[index],
      [field]: value,
    };
    setExperiences(updatedExperiences);
  };

  const handleImproveWithAI = async () => {
    try {
      setIsImprovingBio(true);
      setShowImprovedBioModal(true);
      
      const response = await fetch("/api/ai/improve-bio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ currentBio }),
      });

      if (!response.ok) {
        throw new Error("Failed to improve bio");
      }

      const data = await response.json();
      setImprovedBio(data.improvedBio);
    } catch (error) {
      console.error("Error improving bio:", error);
      // You might want to show an error toast here
      setShowImprovedBioModal(false);
    } finally {
      setIsImprovingBio(false);
    }
  };

  const handleAcceptImprovedBio = (bio: string) => {
    setValue("bio", bio);
    setShowImprovedBioModal(false);
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Edit Profile
            </h2>
          </div>
        </div>

        {/* Profile Picture Upload */}
        <div className="bg-white shadow sm:rounded-lg mb-8">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
              Profile Picture
            </h3>
            <ProfilePictureUpload />
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="grid grid-cols-1 gap-6">
                {/* Title */}
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    Professional Title
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="title"
                      {...register("title")}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="e.g. Private Chef, Estate Manager, Personal Assistant"
                    />
                  </div>
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                  )}
                </div>

                {/* Bio */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                      Professional Bio
                    </label>
                    <button
                      type="button"
                      onClick={handleImproveWithAI}
                      disabled={!currentBio || isLoading}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <SparklesIcon className="h-4 w-4 mr-1" />
                      Improve with AI
                    </button>
                  </div>
                  <div className="mt-1">
                    <textarea
                      {...register("bio")}
                      rows={4}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="Tell us about your professional background and expertise..."
                    />
                  </div>
                  {errors.bio && (
                    <p className="mt-1 text-sm text-red-600">{errors.bio.message}</p>
                  )}
                </div>

                {/* Location */}
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                    Location
                  </label>
                  <input
                    {...register("location")}
                    type="text"
                    className="mt-1 block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md"
                    placeholder="City, State"
                  />
                  {errors.location && (
                    <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
                  )}
                </div>

                {/* Phone Number */}
                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <input
                    {...register("phoneNumber")}
                    type="tel"
                    className="mt-1 block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md"
                    placeholder="(123) 456-7890"
                  />
                  {errors.phoneNumber && (
                    <p className="mt-1 text-sm text-red-600">{errors.phoneNumber.message}</p>
                  )}
                </div>

                {/* Skills */}
                <div>
                  <label htmlFor="skills" className="block text-sm font-medium text-gray-700">
                    Skills
                  </label>
                  <input
                    {...register("skills")}
                    type="text"
                    className="mt-1 block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md"
                    placeholder="Enter skills separated by commas"
                  />
                  {errors.skills && (
                    <p className="mt-1 text-sm text-red-600">{errors.skills.message}</p>
                  )}
                </div>

                {/* Certifications */}
                <div>
                  <label htmlFor="certifications" className="block text-sm font-medium text-gray-700">
                    Certifications
                  </label>
                  <input
                    {...register("certifications")}
                    type="text"
                    className="mt-1 block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md"
                    placeholder="Enter certifications separated by commas"
                  />
                  {errors.certifications && (
                    <p className="mt-1 text-sm text-red-600">{errors.certifications.message}</p>
                  )}
                </div>

                {/* Availability */}
                <div>
                  <label htmlFor="availability" className="block text-sm font-medium text-gray-700">
                    Available From
                  </label>
                  <input
                    {...register("availability")}
                    type="date"
                    className="mt-1 block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md"
                  />
                </div>

                {/* Experience */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Work Experience
                    </label>
                    <button
                      type="button"
                      onClick={addExperience}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Add Experience
                    </button>
                  </div>
                  <div className="space-y-4">
                    {experiences.map((exp, index) => (
                      <div key={index} className="border rounded-md p-4">
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Job Title
                            </label>
                            <input
                              type="text"
                              value={exp.title}
                              onChange={(e) => updateExperience(index, "title", e.target.value)}
                              className="mt-1 block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Employer
                            </label>
                            <input
                              type="text"
                              value={exp.employer}
                              onChange={(e) => updateExperience(index, "employer", e.target.value)}
                              className="mt-1 block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Start Date
                              </label>
                              <input
                                type="date"
                                value={exp.startDate}
                                onChange={(e) => updateExperience(index, "startDate", e.target.value)}
                                className="mt-1 block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                End Date
                              </label>
                              <input
                                type="date"
                                value={exp.endDate}
                                onChange={(e) => updateExperience(index, "endDate", e.target.value)}
                                className="mt-1 block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Description
                            </label>
                            <textarea
                              value={exp.description}
                              onChange={(e) => updateExperience(index, "description", e.target.value)}
                              rows={3}
                              className="mt-1 block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 rounded-md"
                            />
                          </div>
                          {experiences.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeExperience(index)}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.push("/dashboard/profile")}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>

        {/* Improved Bio Modal */}
        <ImprovedBioModal
          isOpen={showImprovedBioModal}
          onClose={() => setShowImprovedBioModal(false)}
          originalBio={currentBio || ""}
          improvedBio={improvedBio}
          onAccept={handleAcceptImprovedBio}
          isLoading={isImprovingBio}
        />
      </div>
    </div>
  );
} 