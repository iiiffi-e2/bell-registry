import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ProfilePictureUpload } from "./profile-picture-upload";
import { useState, useEffect, useRef } from "react";
import { CurrencyDollarIcon, SparklesIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { MediaUpload } from "./media-upload";
import { useSession } from "next-auth/react";
import ImprovedBioModal from "@/components/ui/improved-bio-modal";
import { Combobox } from "@headlessui/react";
import { LocationAutocomplete } from "@/components/ui/location-autocomplete";
import { GoogleMapsLoader } from "@/components/ui/google-maps-loader";
import { MultiLocationAutocomplete } from '../ui/multi-location-autocomplete';
import { FormField, FormItem, FormLabel, FormControl, FormDescription } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Form } from "@/components/ui/form";
import { SkillsCombobox } from "@/components/ui/skills-combobox";
import { validateNameNotInText } from "@/lib/utils";
import { PROFESSIONAL_ROLES } from "@/lib/constants";

const EMPLOYMENT_TYPES = [
  "Full-time",
  "Part-time", 
  "Event",
  "Contract",
  "Seasonal"
] as const;

const profileSchema = z.object({
  // Basic Info
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  photoUrl: z.string().optional(),
  preferredRole: z.string().min(2, "Professional title is required"),
  location: z.string().min(2, "Current location is required"),
  workLocations: z.array(z.string()).optional().default([]),
  openToRelocation: z.boolean().default(false),
  openToWork: z.boolean().default(false),
  isAnonymous: z.boolean().default(false),
  customInitials: z.string().regex(/^[A-Za-z]{2,3}$/, "Must be 2-3 letters only").optional().or(z.literal("")),
  dontContactMe: z.boolean().default(false),
  yearsOfExperience: z.string().optional(),
  availability: z.string().optional(),
  employmentType: z.string().optional(),
  
  // Professional Bio
  bio: z.string().min(50, "Bio must be at least 50 characters"),
  
  // About Me Sections
  whatImSeeking: z.string().optional(),
  whyIEnjoyThisWork: z.string().optional(),
  whatSetsApartMe: z.string().optional(),
  idealEnvironment: z.string().optional(),
  
  // Professional Details
  seekingOpportunities: z.array(z.string()).default([]),
  skills: z.array(z.string()).default([]).refine((skills) => skills.length <= 10, {
    message: "You can select a maximum of 10 skills"
  }),
  payRangeMin: z.string().optional(),
  payRangeMax: z.string().optional(),
  payType: z.string().default("Salary"),
  
  // Media - managed separately via state
  // additionalPhotos: z.array(z.string()).optional(),
  // mediaUrls: z.array(z.string()).optional(),
  
  // Existing fields
  certifications: z.string().optional(),
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
  const inputRef = useRef<HTMLInputElement>(null);

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
              inputRef.current?.focus();
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
              ref={inputRef}
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
    // @ts-ignore - Complex Zod schema type inference issue
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      photoUrl: "",
      preferredRole: "",
      location: "",
      workLocations: [],
      openToRelocation: false,
      openToWork: false,
      isAnonymous: false,
      customInitials: "",
      dontContactMe: false,
      yearsOfExperience: "",
      availability: "",
      employmentType: "",
      bio: "",
      whatImSeeking: "",
      whyIEnjoyThisWork: "",
      whatSetsApartMe: "",
      idealEnvironment: "",
      seekingOpportunities: [],
      skills: [],
      payRangeMin: "",
      payRangeMax: "",
      payType: "Salary",
      // additionalPhotos: [],
      // mediaUrls: [],
      certifications: "",
      experience: [],
      phoneNumber: "",
    },
  });

  const currentBio = form.watch("bio");

  // Custom validation function for name checking
  const validateNameFields = (data: ProfileFormData) => {
    const errors: Record<string, { message: string }> = {};

    // Validate bio
    if (data.bio) {
      const bioValidation = validateNameNotInText(data.bio, data.firstName, data.lastName);
      if (!bioValidation.isValid) {
        errors.bio = { message: bioValidation.errorMessage || "Invalid bio content" };
      }
    }

    // Validate whatImSeeking
    if (data.whatImSeeking) {
      const seekingValidation = validateNameNotInText(data.whatImSeeking, data.firstName, data.lastName);
      if (!seekingValidation.isValid) {
        errors.whatImSeeking = { message: seekingValidation.errorMessage || "Invalid content" };
      }
    }

    // Validate whyIEnjoyThisWork
    if (data.whyIEnjoyThisWork) {
      const enjoyValidation = validateNameNotInText(data.whyIEnjoyThisWork, data.firstName, data.lastName);
      if (!enjoyValidation.isValid) {
        errors.whyIEnjoyThisWork = { message: enjoyValidation.errorMessage || "Invalid content" };
      }
    }

    // Validate whatSetsApartMe
    if (data.whatSetsApartMe) {
      const setsApartValidation = validateNameNotInText(data.whatSetsApartMe, data.firstName, data.lastName);
      if (!setsApartValidation.isValid) {
        errors.whatSetsApartMe = { message: setsApartValidation.errorMessage || "Invalid content" };
      }
    }

    // Validate idealEnvironment
    if (data.idealEnvironment) {
      const environmentValidation = validateNameNotInText(data.idealEnvironment, data.firstName, data.lastName);
      if (!environmentValidation.isValid) {
        errors.idealEnvironment = { message: environmentValidation.errorMessage || "Invalid content" };
      }
    }

    return errors;
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

  // Track if profile has been loaded to prevent re-loading when user has made changes
  const [profileLoaded, setProfileLoaded] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await fetch("/api/profile");
        const data = await response.json();
        
        
        if (data) {
          // Set the form values
          const formValues = {
            firstName: data.user?.firstName || "",
            lastName: data.user?.lastName || "",
            photoUrl: data.photoUrl || "",
            preferredRole: data.preferredRole || "",
            location: data.location || "",
            workLocations: data.workLocations || [],
            openToRelocation: data.openToRelocation || false,
            isAnonymous: Boolean(data.user?.isAnonymous), // Ensure boolean value
            customInitials: data.user?.customInitials || "",
            dontContactMe: Boolean(data.user?.dontContactMe), // Ensure boolean value
            yearsOfExperience: data.yearsOfExperience?.toString() || "",
            availability: data.availability ? data.availability.split('T')[0] : "",
            employmentType: data.employmentType || "",
            bio: data.bio || "",
            whatImSeeking: data.whatImSeeking || "",
            whyIEnjoyThisWork: data.whyIEnjoyThisWork || "",
            whatSetsApartMe: data.whatSetsApartMe || "",
            idealEnvironment: data.idealEnvironment || "",
            seekingOpportunities: data.seekingOpportunities || [],
            skills: Array.isArray(data.skills) ? data.skills : (data.skills ? data.skills.split(", ").filter(Boolean) : []),
            payRangeMin: data.payRangeMin?.toString() || "",
            payRangeMax: data.payRangeMax?.toString() || "",
            payType: data.payType || "Salary",
            // additionalPhotos: data.additionalPhotos || [],
            // mediaUrls: data.mediaUrls || [],
            certifications: Array.isArray(data.certifications) ? data.certifications.join(", ") : data.certifications || "",
            experience: data.experience || [],
            phoneNumber: data.phoneNumber || "",
          };

          form.reset(formValues);
          setUploadedPhotos(data.additionalPhotos || []);
          setUploadedMedia(data.mediaUrls || []);
          setProfileLoaded(true);
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      }
    };

    // Only load profile if session exists and profile hasn't been loaded yet
    if (session?.user && !profileLoaded) {
      loadProfile();
    }
  }, [session?.user?.id, profileLoaded]);

  const handleSubmit = async (data: ProfileFormData) => {
    setIsLoading(true);
    try {
      // Run custom validation
      const nameErrors = validateNameFields(data);
      
      if (Object.keys(nameErrors).length > 0) {
        // Set the errors on the form
        Object.entries(nameErrors).forEach(([field, error]) => {
          form.setError(field as keyof ProfileFormData, error);
        });
        setIsLoading(false);
        return;
      }


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
    <Form {...form}>
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

                  {/* Custom Initials */}
                  <FormField
                    control={form.control}
                    name="customInitials"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Custom Initials (Optional)</FormLabel>
                        <FormControl>
                          <input
                            type="text"
                            {...field}
                            placeholder="e.g., JD or JDS"
                            maxLength={3}
                            className="w-20 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 uppercase"
                            style={{ textTransform: 'uppercase' }}
                            onChange={(e) => {
                              const value = e.target.value.replace(/[^A-Za-z]/g, '').toUpperCase();
                              field.onChange(value);
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          Customize the initials shown when your profile is anonymous. Leave blank to use your name initials automatically. Must be 2-3 letters only.
                        </FormDescription>
                      </FormItem>
                    )}
                  />

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

                  {/* Years of Experience and Availability */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                    <div>
                      <label htmlFor="availability" className="block text-sm font-medium text-gray-700">
                        When are you available to start?
                      </label>
                      <div className="mt-1">
                        <input
                          type="date"
                          {...form.register("availability")}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          placeholder="Optional"
                        />
                      </div>
                      {form.formState.errors.availability && (
                        <p className="mt-1 text-sm text-red-600">{form.formState.errors.availability.message}</p>
                      )}
                    </div>
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
                        placeholder="Select roles you&apos;re interested in..."
                      />
                    </div>
                    {form.formState.errors.seekingOpportunities && (
                      <p className="mt-1 text-sm text-red-600">{form.formState.errors.seekingOpportunities.message}</p>
                    )}
                  </div>

                  {/* Skills */}
                  <div>
                    <label htmlFor="skills" className="block text-sm font-medium text-gray-700">
                      Skills & Tags <span className="text-gray-500 text-xs">(Max 10)</span>
                    </label>
                    <div className="mt-1">
                      <SkillsCombobox
                        value={form.watch("skills") || []}
                        onChange={(newValue) => form.setValue("skills", newValue)}
                        placeholder="Search and select up to 10 skills..."
                        maxSelections={10}
                      />
                    </div>
                    {form.formState.errors.skills && (
                      <p className="mt-1 text-sm text-red-600">{form.formState.errors.skills.message}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      Choose from our curated list of skills organized by category. This helps employers find the right professionals with specific expertise.
                    </p>
                  </div>

                  {/* Employment Type */}
                  <div>
                    <label htmlFor="employmentType" className="block text-sm font-medium text-gray-700">
                      Employment Type Preference (Optional)
                    </label>
                    <div className="mt-1">
                      <select
                        {...form.register("employmentType")}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      >
                        <option value="">Select employment type...</option>
                        {EMPLOYMENT_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>
                    {form.formState.errors.employmentType && (
                      <p className="mt-1 text-sm text-red-600">{form.formState.errors.employmentType.message}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      Specify your preferred employment arrangement to help employers find the right match.
                    </p>
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
                        <label htmlFor="payType" className="sr-only">
                          Pay Type
                        </label>
                        <select
                          {...form.register("payType")}
                          className="block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        >
                          <option value="Salary">Salary</option>
                          <option value="Hourly">Hourly</option>
                          <option value="Contract">Contract</option>
                          <option value="Commission">Commission</option>
                          <option value="Other">Other</option>
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
                      What I&apos;m Seeking
                    </label>
                    <div className="mt-1">
                      <textarea
                        {...form.register("whatImSeeking")}
                        rows={4}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder="Describe your ideal work environment and culture... (Optional)"
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
                                                  placeholder="Share what motivates you and why you&apos;re passionate about this field... (Optional)"
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

        {/* Profile Settings Section */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Profile Settings</h3>
            <div className="mt-6 space-y-6">
              <FormField
                control={form.control}
                name="openToWork"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-green-200 bg-green-50 p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-green-800 font-semibold">Open to Opportunities</FormLabel>
                      <FormDescription className="text-green-700">
                        Let employers know you&apos;re actively seeking new opportunities. This will display a prominent &quot;Open to Opportunities&quot; badge on your profile.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="isAnonymous"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-gray-200 bg-gray-50 p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Anonymous Profile</FormLabel>
                      <FormDescription>
                        When enabled, your profile will display only your initials and hide your headshot and email address from public view.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />


              <FormField
                control={form.control}
                name="dontContactMe"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-red-200 bg-red-50 p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                                              <FormLabel className="text-red-800 font-semibold">Don&apos;t Contact Me</FormLabel>
                      <FormDescription className="text-red-700">
                        When enabled, employers will not be able to message you directly through your profile. You can still apply to jobs and respond to existing conversations.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
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
    </Form>
  );
} 