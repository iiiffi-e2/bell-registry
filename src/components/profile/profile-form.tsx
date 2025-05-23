import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ProfilePictureUpload } from "./profile-picture-upload";
import { useState, useEffect } from "react";
import { CurrencyDollarIcon, SparklesIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { MediaUpload } from "./media-upload";
import { useSession } from "next-auth/react";
import ImprovedBioModal from "@/components/ui/improved-bio-modal";
import { Combobox } from "@headlessui/react";
import { LocationAutocomplete } from "@/components/ui/location-autocomplete";
import { GoogleMapsLoader } from "@/components/ui/google-maps-loader";
import { MultiLocationAutocomplete } from '../ui/multi-location-autocomplete';

const PROFESSIONAL_ROLES = [
  "Head Gardener",
  "Executive Housekeeper",
  "Driver",
  "Executive Protection",
  "Butler",
  "Governess",
  "Private Teacher",
  "Nanny | Educator",
  "Nanny",
  "Family Assistant",
  "Personal Assistant",
  "Laundress",
  "Housekeeper",
  "Houseman",
  "Estate Couple",
  "Property Caretaker",
  "House Manager",
  "Estate Manager",
  "Personal Chef",
  "Private Chef",
  "Event Chef",
  "Drop-Off Chef",
  "Seasonal Chef",
  "Office Chef",
  "Yacht Chef",
  "Jet Chef",
  "Family Office CEO",
  "Family Office COO",
  "Executive Assistant",
  "Administrative Assistant",
  "Office Manager",
  "Human Resources Director",
  "Director of Residences",
  "Chief of Staff",
  "Estate Hospitality Manager",
  "Estate IT Director",
  "Estate Security Director",
  "Director of Operations",
  "Director of Real Estate and Construction",
  "Construction Manager",
  "Facilities Manager",
  "Property Manager",
  "Landscape Director",
  "Yacht Captain",
  "Yacht Steward | Stewardess",
  "Yacht Engineer",
  "Flight Attendant",
  "Other"
];

const profileSchema = z.object({
  // Basic Info
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  photoUrl: z.string().optional(),
  preferredRole: z.string().min(2, "Professional title is required"),
  location: z.string().min(2, "Current location is required"),
  workLocations: z.array(z.string()).optional().default([]),
  openToRelocation: z.boolean().default(false),
  yearsOfExperience: z.string()
    .optional()
    .transform((val) => {
      if (!val || val === "") return null;
      const num = parseInt(val);
      return isNaN(num) ? null : num;
    }),
  
  // Professional Bio
  bio: z.string().min(50, "Bio must be at least 50 characters"),
  
  // About Me Sections
  whatImSeeking: z.string().optional(),
  whyIEnjoyThisWork: z.string().optional(),
  whatSetsApartMe: z.string().optional(),
  idealEnvironment: z.string().optional(),
  
  // Professional Details
  seekingOpportunities: z.array(z.string()).default([]),
  skills: z.string()
    .optional()
    .transform((str) => (!str ? [] : str.split(",").map((s) => s.trim()))),
  payRangeMin: z.string()
    .optional()
    .transform((val) => (val === "" ? undefined : Number(val))),
  payRangeMax: z.string()
    .optional()
    .transform((val) => (val === "" ? undefined : Number(val))),
  payCurrency: z.string().default("USD"),
  
  // Media
  additionalPhotos: z.array(z.string()).optional(),
  mediaUrls: z.array(z.string()).optional(),
  
  // Existing fields
  certifications: z.string()
    .optional()
    .transform((str) => (!str ? [] : str.split(",").map((s) => s.trim()))),
  availability: z.string().optional(),
  experience: z.array(z.any()).optional(),
  phoneNumber: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  onSubmit: (data: ProfileFormData) => Promise<void>;
}

function MultiSelect({ options, value, onChange, placeholder }: { 
  options: string[], 
  value: string[], 
  onChange: (value: string[]) => void,
  placeholder: string 
}) {
  const [query, setQuery] = useState("");

  const filteredOptions = query === ""
    ? options
    : options.filter((option) =>
        option.toLowerCase().includes(query.toLowerCase())
      );

  const handleSelect = (selectedOption: string) => {
    if (!value.includes(selectedOption)) {
      onChange([...value, selectedOption]);
    }
    setQuery("");
  };

  const handleRemove = (optionToRemove: string) => {
    onChange(value.filter(v => v !== optionToRemove));
  };

  return (
    <div className="relative">
      <Combobox as="div" value={query} onChange={handleSelect}>
        <div className="relative">
          <div 
            className="flex flex-wrap gap-2 p-1 border rounded-md border-gray-300 bg-white min-h-[38px]"
            onClick={() => {
              const input = document.querySelector('[role="combobox"]') as HTMLElement;
              input?.focus();
            }}
          >
            {value.map((item) => (
              <span
                key={item}
                className="inline-flex items-center px-2 py-1 rounded-md text-sm bg-blue-100 text-blue-800"
              >
                {item}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(item);
                  }}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </span>
            ))}
            <Combobox.Input
              className="border-0 p-1 text-sm focus:ring-0 flex-1 min-w-[100px]"
              placeholder={value.length === 0 ? placeholder : "Add more..."}
              onChange={(event) => setQuery(event.target.value)}
              displayValue={(val: string) => val}
            />
            <Combobox.Button className="hidden">
              <span>Toggle</span>
            </Combobox.Button>
          </div>
          <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
            {filteredOptions.length === 0 && query !== "" ? (
              <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                Nothing found.
              </div>
            ) : (
              filteredOptions
                .filter(option => !value.includes(option))
                .map((option) => (
                  <Combobox.Option
                    key={option}
                    value={option}
                    className={({ active }) =>
                      `relative cursor-default select-none py-2 pl-4 pr-4 ${
                        active ? 'bg-blue-600 text-white' : 'text-gray-900'
                      }`
                    }
                  >
                    {option}
                  </Combobox.Option>
                ))
            )}
          </Combobox.Options>
        </div>
      </Combobox>
    </div>
  );
}

export function ProfileForm({ onSubmit }: ProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [uploadedMedia, setUploadedMedia] = useState<string[]>([]);
  const { data: session } = useSession();
  const [showImprovedBioModal, setShowImprovedBioModal] = useState(false);
  const [improvedBio, setImprovedBio] = useState("");
  const [isImprovingBio, setIsImprovingBio] = useState(false);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      openToRelocation: false,
      payCurrency: "USD",
    },
  });

  const currentBio = form.watch("bio");

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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || "Failed to improve bio");
      }

      setImprovedBio(data.improvedBio);
    } catch (error: any) {
      console.error("Error improving bio:", error);
      // Show error in modal instead of closing it
      setImprovedBio(`Error: ${error.message || "Failed to improve bio. Please try again later."}`);
    } finally {
      setIsImprovingBio(false);
    }
  };

  const handleAcceptImprovedBio = (bio: string) => {
    form.setValue("bio", bio);
    setShowImprovedBioModal(false);
  };

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await fetch("/api/profile");
        const data = await response.json();
        
        if (data) {
          form.reset({
            firstName: data.user?.firstName || "",
            lastName: data.user?.lastName || "",
            photoUrl: data.photoUrl || "",
            preferredRole: data.preferredRole || "",
            location: data.location || "",
            workLocations: data.workLocations || [],
            openToRelocation: data.openToRelocation || false,
            yearsOfExperience: data.yearsOfExperience?.toString() || "",
            bio: data.bio || "",
            whatImSeeking: data.whatImSeeking || "",
            whyIEnjoyThisWork: data.whyIEnjoyThisWork || "",
            whatSetsApartMe: data.whatSetsApartMe || "",
            idealEnvironment: data.idealEnvironment || "",
            seekingOpportunities: data.seekingOpportunities || [],
            skills: data.skills?.join(", ") || "",
            payRangeMin: data.payRangeMin?.toString() || "",
            payRangeMax: data.payRangeMax?.toString() || "",
            payCurrency: data.payCurrency || "USD",
            additionalPhotos: data.additionalPhotos || [],
            mediaUrls: data.mediaUrls || [],
            certifications: data.certifications?.join(", ") || "",
            availability: data.availability || "",
            experience: data.experience || [],
            phoneNumber: data.phoneNumber || "",
          });
          setUploadedPhotos(data.additionalPhotos || []);
          setUploadedMedia(data.mediaUrls || []);
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      }
    };

    if (session?.user) {
      loadProfile();
    }
  }, [session, form]);

  const handleSubmit = async (data: ProfileFormData) => {
    setIsLoading(true);
    try {
      await onSubmit({
        ...data,
        additionalPhotos: uploadedPhotos,
        mediaUrls: uploadedMedia,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-8">
          {/* Basic Info Section */}
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Basic Information</h3>
              <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4">
                {/* Profile Picture Upload */}
                <div>
                  <ProfilePictureUpload
                    currentImage={form.watch("photoUrl") as string}
                    onUpload={(url) => form.setValue("photoUrl", url)}
                  />
                </div>

                {/* First Name and Last Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        {...form.register("firstName")}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder="Enter your first name"
                      />
                    </div>
                    {form.formState.errors.firstName && (
                      <p className="mt-1 text-sm text-red-600">{form.formState.errors.firstName.message}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        {...form.register("lastName")}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder="Enter your last name"
                      />
                    </div>
                    {form.formState.errors.lastName && (
                      <p className="mt-1 text-sm text-red-600">{form.formState.errors.lastName.message}</p>
                    )}
                  </div>
                </div>

                {/* Professional Bio */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                      Professional Bio <span className="text-red-500">*</span>
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
                      {...form.register("bio")}
                      rows={4}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="Tell us about your professional background and expertise... (Required, minimum 50 characters)"
                    />
                  </div>
                  {form.formState.errors.bio && (
                    <p className="mt-1 text-sm text-red-600">{form.formState.errors.bio.message}</p>
                  )}
                </div>

                {/* Preferred Role */}
                <div>
                  <label htmlFor="preferredRole" className="block text-sm font-medium text-gray-700">
                    Professional Title <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1">
                    <select
                      {...form.register("preferredRole")}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                      <option value="">Select a Professional Title</option>
                      {PROFESSIONAL_ROLES.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </div>
                  {form.formState.errors.preferredRole && (
                    <p className="mt-1 text-sm text-red-600">{form.formState.errors.preferredRole.message}</p>
                  )}
                </div>

                {/* Years of Experience */}
                <div>
                  <label htmlFor="yearsOfExperience" className="block text-sm font-medium text-gray-700">
                    Years of Experience
                  </label>
                  <div className="mt-1">
                    <input
                      type="number"
                      {...form.register("yearsOfExperience")}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      min="0"
                      placeholder="Optional"
                    />
                  </div>
                  {form.formState.errors.yearsOfExperience && (
                    <p className="mt-1 text-sm text-red-600">{form.formState.errors.yearsOfExperience.message}</p>
                  )}
                </div>

                {/* Location Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                  <div className="flex flex-col">
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                      Current Location <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1">
                      <GoogleMapsLoader>
                        <LocationAutocomplete
                          value={form.watch("location")}
                          onChange={(value) => form.setValue("location", value)}
                          error={form.formState.errors.location?.message}
                          placeholder="Enter city and state..."
                        />
                      </GoogleMapsLoader>
                    </div>
                  </div>
                  <div className="flex items-center h-full pt-6 sm:pt-0">
                    <input
                      type="checkbox"
                      {...form.register("openToRelocation")}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      id="openToRelocation"
                    />
                    <label htmlFor="openToRelocation" className="ml-2 block text-sm text-gray-700">
                      Open to Relocation
                    </label>
                  </div>
                </div>

                {/* Available to Work In - its own row */}
                <div className="mt-4">
                  <label htmlFor="workLocations" className="block text-sm font-medium text-gray-700">
                    Available to Work In
                  </label>
                  <div className="mt-1">
                    <GoogleMapsLoader>
                      <MultiLocationAutocomplete
                        value={form.watch("workLocations") || []}
                        onChange={(value) => form.setValue("workLocations", value)}
                        error={form.formState.errors.workLocations?.message}
                        placeholder="Enter city and state..."
                      />
                    </GoogleMapsLoader>
                  </div>
                  {form.formState.errors.workLocations && (
                    <p className="mt-1 text-sm text-red-600">{form.formState.errors.workLocations.message}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Professional Details Section */}
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Professional Details</h3>
              <div className="mt-6 space-y-6">
                {/* Seeking Opportunities */}
                <div>
                  <label htmlFor="seekingOpportunities" className="block text-sm font-medium text-gray-700">
                    Seeking Opportunities (Roles)
                  </label>
                  <div className="mt-1">
                    <MultiSelect
                      options={PROFESSIONAL_ROLES}
                      value={form.watch("seekingOpportunities") || []}
                      onChange={(newValue) => form.setValue("seekingOpportunities", newValue)}
                      placeholder="Select roles you're interested in..."
                    />
                  </div>
                  {form.formState.errors.seekingOpportunities && (
                    <p className="mt-1 text-sm text-red-600">{form.formState.errors.seekingOpportunities.message}</p>
                  )}
                </div>

                {/* Skills */}
                <div>
                  <label htmlFor="skills" className="block text-sm font-medium text-gray-700">
                    Skills & Tags
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      {...form.register("skills")}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="Enter skills separated by commas (Optional)"
                    />
                  </div>
                  {form.formState.errors.skills && (
                    <p className="mt-1 text-sm text-red-600">{form.formState.errors.skills.message}</p>
                  )}
                </div>

                {/* Pay Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Pay Range (Optional)
                  </label>
                  <div className="mt-1 grid grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="payRangeMin" className="sr-only">
                        Minimum
                      </label>
                      <div className="relative rounded-md shadow-sm">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <CurrencyDollarIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </div>
                        <input
                          type="number"
                          {...form.register("payRangeMin")}
                          className="block w-full rounded-md border-gray-300 pl-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          placeholder="Min"
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="payRangeMax" className="sr-only">
                        Maximum
                      </label>
                      <div className="relative rounded-md shadow-sm">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <CurrencyDollarIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </div>
                        <input
                          type="number"
                          {...form.register("payRangeMax")}
                          className="block w-full rounded-md border-gray-300 pl-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          placeholder="Max"
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="payCurrency" className="sr-only">
                        Currency
                      </label>
                      <select
                        {...form.register("payCurrency")}
                        className="block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      >
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                        <option value="CAD">CAD</option>
                        <option value="AUD">AUD</option>
                      </select>
                    </div>
                  </div>
                  {(form.formState.errors.payRangeMin || form.formState.errors.payRangeMax) && (
                    <p className="mt-1 text-sm text-red-600">
                      {form.formState.errors.payRangeMin?.message || form.formState.errors.payRangeMax?.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* About Me Sections */}
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900">About Me</h3>
              <div className="mt-6 space-y-6">
                {/* What I'm Seeking */}
                <div>
                  <label htmlFor="whatImSeeking" className="block text-sm font-medium text-gray-700">
                    What I'm Seeking
                  </label>
                  <div className="mt-1">
                    <textarea
                      {...form.register("whatImSeeking")}
                      rows={4}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="Describe the type of position and environment you're looking for... (Optional)"
                    />
                  </div>
                  {form.formState.errors.whatImSeeking && (
                    <p className="mt-1 text-sm text-red-600">{form.formState.errors.whatImSeeking.message}</p>
                  )}
                </div>

                {/* Why I Enjoy This Work */}
                <div>
                  <label htmlFor="whyIEnjoyThisWork" className="block text-sm font-medium text-gray-700">
                    Why I Enjoy This Work
                  </label>
                  <div className="mt-1">
                    <textarea
                      {...form.register("whyIEnjoyThisWork")}
                      rows={4}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="Share what motivates you and why you're passionate about this field... (Optional)"
                    />
                  </div>
                  {form.formState.errors.whyIEnjoyThisWork && (
                    <p className="mt-1 text-sm text-red-600">{form.formState.errors.whyIEnjoyThisWork.message}</p>
                  )}
                </div>

                {/* What Sets Me Apart */}
                <div>
                  <label htmlFor="whatSetsApartMe" className="block text-sm font-medium text-gray-700">
                    What Sets Me Apart
                  </label>
                  <div className="mt-1">
                    <textarea
                      {...form.register("whatSetsApartMe")}
                      rows={4}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="Highlight your unique qualities and experiences... (Optional)"
                    />
                  </div>
                  {form.formState.errors.whatSetsApartMe && (
                    <p className="mt-1 text-sm text-red-600">{form.formState.errors.whatSetsApartMe.message}</p>
                  )}
                </div>

                {/* Ideal Environment */}
                <div>
                  <label htmlFor="idealEnvironment" className="block text-sm font-medium text-gray-700">
                    Ideal Environment
                  </label>
                  <div className="mt-1">
                    <textarea
                      {...form.register("idealEnvironment")}
                      rows={4}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="Describe your ideal work environment and culture... (Optional)"
                    />
                  </div>
                  {form.formState.errors.idealEnvironment && (
                    <p className="mt-1 text-sm text-red-600">{form.formState.errors.idealEnvironment.message}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Media Uploads */}
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Portfolio & Media</h3>
              <div className="mt-6 space-y-6">
                <p className="text-sm text-gray-500 italic">
                  By uploading photos and media, you confirm that you have the necessary rights, licenses, and permissions to use and share this content. You must own the content or have explicit permission to use it professionally.
                </p>
                {/* Additional Photos */}
                <MediaUpload
                  type="photo"
                  currentFiles={uploadedPhotos}
                  onUpload={(urls) => setUploadedPhotos([...uploadedPhotos, ...urls])}
                  onRemove={(url) => setUploadedPhotos(uploadedPhotos.filter((p) => p !== url))}
                  maxFiles={5}
                />

                {/* Additional Media */}
                <MediaUpload
                  type="media"
                  currentFiles={uploadedMedia}
                  onUpload={(urls) => setUploadedMedia([...uploadedMedia, ...urls])}
                  onRemove={(url) => setUploadedMedia(uploadedMedia.filter((m) => m !== url))}
                  maxFiles={3}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isLoading ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* Improved Bio Modal */}
      <ImprovedBioModal
        isOpen={showImprovedBioModal}
        onClose={() => setShowImprovedBioModal(false)}
        originalBio={currentBio || ""}
        improvedBio={improvedBio}
        onAccept={handleAcceptImprovedBio}
        isLoading={isImprovingBio}
      />
    </form>
  );
} 