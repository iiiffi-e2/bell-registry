import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ProfilePictureUpload } from "./profile-picture-upload";
import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { Form } from "@/components/ui/form";
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { GoogleMapsLoader } from "@/components/ui/google-maps-loader";
import { LocationAutocomplete } from "@/components/ui/location-autocomplete";
import { toast } from "sonner";
import { UserRole } from "@/types";

// Create different schemas for agencies and employers
const agencyProfileSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  description: z.string().optional(),
  website: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  logoUrl: z.string().optional(),
  location: z.string().optional(),
  publicSlug: z.string()
    .optional()
    .refine((val) => !val || /^[a-zA-Z0-9-]*$/.test(val), {
      message: "Only letters, numbers, and dashes are allowed",
    })
    .refine((val) => !val || (val.length >= 3 && val.length <= 50), {
      message: "Must be between 3 and 50 characters",
    }),
});

const employerProfileSchema = z.object({
  companyName: z.string().optional(), // Optional for employers
  description: z.string().optional(),
  website: z.string().optional(), // Optional for employers
  logoUrl: z.string().optional(),
  location: z.string().optional(),
  publicSlug: z.string()
    .optional()
    .refine((val) => !val || /^[a-zA-Z0-9-]*$/.test(val), {
      message: "Only letters, numbers, and dashes are allowed",
    })
    .refine((val) => !val || (val.length >= 3 && val.length <= 50), {
      message: "Must be between 3 and 50 characters",
    }),
});

type AgencyProfileFormData = z.infer<typeof agencyProfileSchema>;
type EmployerProfileFormData = z.infer<typeof employerProfileSchema>;
type ProfileFormData = AgencyProfileFormData | EmployerProfileFormData;

interface EmployerProfileFormProps {
  onSubmit: (data: ProfileFormData) => Promise<void>;
}

export function EmployerProfileForm({ onSubmit }: EmployerProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [baseUrl, setBaseUrl] = useState("");
  const [slugAvailability, setSlugAvailability] = useState<{
    checking: boolean;
    available: boolean | null;
    suggestions: string[];
  }>({ checking: false, available: null, suggestions: [] });
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
  const { data: session } = useSession();
  const formInitializedRef = useRef(false);

  // Determine if user is an agency or employer
  const isAgency = session?.user?.role === UserRole.AGENCY;
  const isEmployer = session?.user?.role === UserRole.EMPLOYER;

  // Use appropriate schema based on user role
  const schema = isAgency ? agencyProfileSchema : employerProfileSchema;

  // Check if profile is filled out
  const isProfileFilledOut = () => {
    const values = form.getValues();
    if (isAgency) {
      return !!(values.companyName && (values.description || values.website || values.location || values.publicSlug));
    } else {
      return !!(values.description || values.location || values.publicSlug);
    }
  };

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      companyName: "",
      description: "",
      website: "",
      logoUrl: "",
      location: "",
      publicSlug: "",
    },
    mode: "onChange", // Enable real-time validation
  });

  useEffect(() => {
    // Set base URL on client side only
    if (typeof window !== "undefined") {
      setBaseUrl(window.location.origin);
    }
  }, []);



  useEffect(() => {
    const loadProfile = async () => {
      if (formInitializedRef.current) return; // Prevent reloading if already initialized
      
      try {
        const response = await fetch("/api/profile");
        if (!response.ok) {
          throw new Error("Failed to load profile");
        }
        const data = await response.json();
        
        if (data?.employerProfile) {
          form.reset({
            companyName: data.employerProfile.companyName || "",
            description: data.employerProfile.description || "",
            website: data.employerProfile.website || "",
            logoUrl: data.employerProfile.logoUrl || "",
            location: data.employerProfile.location || "",
            publicSlug: data.employerProfile.publicSlug || "",
          });
          formInitializedRef.current = true;
          
          // Set edit mode based on whether profile is filled out
          const hasData = isAgency 
            ? !!(data.employerProfile.companyName && (data.employerProfile.description || data.employerProfile.website || data.employerProfile.location || data.employerProfile.publicSlug))
            : !!(data.employerProfile.description || data.employerProfile.location || data.employerProfile.publicSlug);
          
          setIsEditMode(!hasData); // Start in edit mode if profile is empty
        }
      } catch (error) {
        console.error("Error loading profile:", error);
        toast.error("Failed to load profile");
      }
    };

    if (session?.user && !formInitializedRef.current) {
      loadProfile();
    }
  }, [session, isAgency]); // Added isAgency to dependencies

  // Debounced slug availability check
  const checkSlugAvailability = useCallback(
    async (slug: string) => {
      if (!slug || slug.length < 3) {
        setSlugAvailability({ checking: false, available: null, suggestions: [] });
        return;
      }

      setSlugAvailability(prev => ({ ...prev, checking: true }));

      try {
        const response = await fetch(`/api/employers/check-slug?slug=${encodeURIComponent(slug)}`);
        if (response.ok) {
          const data = await response.json();
          setSlugAvailability({
            checking: false,
            available: data.available,
            suggestions: data.suggestions || []
          });
        }
      } catch (error) {
        console.error("Error checking slug availability:", error);
        setSlugAvailability({ checking: false, available: null, suggestions: [] });
      }
    },
    []
  );

  // Debounce the slug checking
  useEffect(() => {
    const currentSlug = form.watch("publicSlug");
    if (!currentSlug) {
      setSlugAvailability({ checking: false, available: null, suggestions: [] });
      return;
    }

    const timeoutId = setTimeout(() => {
      checkSlugAvailability(currentSlug);
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [form.watch("publicSlug"), checkSlugAvailability]);

  const handleSubmit = async (data: ProfileFormData) => {
    // Check if slug is available before submitting
    if (data.publicSlug && slugAvailability.available === false) {
      toast.error("Please choose an available URL before saving");
      return;
    }

    // Prepare data for submission
    const submitData = { ...data };
    
    // For employers, handle companyName properly
    if (isEmployer) {
      if (!submitData.companyName || submitData.companyName.trim() === "") {
        delete submitData.companyName;
      } else {
        submitData.companyName = submitData.companyName.trim();
      }
    }

    setIsLoading(true);
    setShowSuccessMessage(false);
    try {
      await onSubmit(submitData);
      toast.success("Profile updated successfully");
      setShowSuccessMessage(true);
      setIsEditMode(false); // Exit edit mode after successful save
      formInitializedRef.current = false; // Reset to allow reloading latest data
      // Hide success message after 20 seconds
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 20000);
    } catch (error: any) {
      console.error("Error updating profile:", error);
      
      // Handle specific database constraint errors
      if (error?.message?.includes('publicSlug') || error?.message?.includes('unique')) {
        toast.error("This URL is already taken. Please choose a different one.");
        // Re-check availability after error
        if (data.publicSlug) {
          checkSlugAvailability(data.publicSlug);
        }
      } else {
        toast.error("Failed to update profile");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Render read-only view
  const renderReadOnlyView = () => {
    const values = form.getValues();
    
    return (
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              {isAgency ? "Agency Profile" : "Employer Profile"}
            </h3>
            <Button
              onClick={() => setIsEditMode(true)}
              variant="outline"
              size="sm"
            >
              Edit Profile
            </Button>
          </div>
          
          <div className="space-y-6">
            {/* Company Logo - Only for Agencies */}
            {isAgency && values.logoUrl && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Company Logo</h4>
                <img 
                  src={values.logoUrl} 
                  alt="Company logo" 
                  className="h-20 w-20 rounded-lg object-cover"
                />
              </div>
            )}

            {/* Company Name - Only for Agencies */}
            {isAgency && values.companyName && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Company Name</h4>
                <p className="text-base text-gray-900">{values.companyName}</p>
              </div>
            )}

            {/* Description / About Us */}
            {values.description && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">
                  {isAgency ? "Company Description" : "About Us"}
                </h4>
                <p className="text-base text-gray-900 whitespace-pre-wrap">{values.description}</p>
              </div>
            )}

            {/* Website - Only for Agencies */}
            {isAgency && values.website && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Company Website</h4>
                <a 
                  href={values.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  {values.website}
                </a>
              </div>
            )}

            {/* Location */}
            {values.location && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">
                  {isAgency ? "Company Location" : "Location"}
                </h4>
                <p className="text-base text-gray-900">{values.location}</p>
              </div>
            )}

            {/* Custom Job Page URL */}
            {values.publicSlug && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Custom Job Page URL</h4>
                <div className="flex items-center gap-2">
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-gray-800">
                    {baseUrl ? `${baseUrl}/employers/${values.publicSlug}/jobs` : "Loading..."}
                  </code>
                  <button
                    type="button"
                    onClick={() => {
                      if (baseUrl) {
                        navigator.clipboard.writeText(`${baseUrl}/employers/${values.publicSlug}/jobs`);
                        toast.success("Link copied to clipboard!");
                      }
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}

            {/* Empty state */}
            {!values.description && !values.location && !values.publicSlug && 
             (!isAgency || (!values.companyName && !values.website)) && (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No profile information has been added yet.</p>
                <Button onClick={() => setIsEditMode(true)}>
                  Add Profile Information
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Success Message */}
      {showSuccessMessage && (
        <div className="rounded-md bg-green-50 p-4 border border-green-200">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                Your {isAgency ? "agency" : "employer"} profile has been successfully updated!
              </p>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  type="button"
                  onClick={() => setShowSuccessMessage(false)}
                  className="inline-flex rounded-md bg-green-50 p-1.5 text-green-500 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 focus:ring-offset-green-50"
                >
                  <span className="sr-only">Dismiss</span>
                  <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Render read-only view or edit form */}
      {!isEditMode ? (
        renderReadOnlyView()
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    {isAgency ? "Agency Profile" : "Employer Profile"}
                  </h3>
                  <Button
                    onClick={() => setIsEditMode(false)}
                    variant="outline"
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
                <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4">
              {/* Company Logo Upload - Only for Agencies */}
              {isAgency && (
                <div>
                  <ProfilePictureUpload
                    currentImage={form.watch("logoUrl") as string}
                    onUpload={(url) => form.setValue("logoUrl", url)}
                  />
                </div>
              )}

              {/* Company Name - Only for Agencies */}
              {isAgency && (
                <div>
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter company name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Company Description / About Us */}
              <div>
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isAgency ? "Company Description" : "About Us"}</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          rows={4}
                          placeholder={isAgency ? "Tell us about your company..." : "Tell us about yourself..."}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Website - Only for Agencies */}
              {isAgency && (
                <div>
                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Website</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://www.example.com" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Location */}
              <div>
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isAgency ? "Company Location" : "Location"}</FormLabel>
                      <FormControl>
                        <GoogleMapsLoader>
                          <LocationAutocomplete
                            value={field.value || ""}
                            onChange={field.onChange}
                            placeholder={isAgency ? "Search for a city..." : "Search for a city..."}
                            allowCustomInput={false}
                          />
                        </GoogleMapsLoader>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Public Slug */}
              <div>
                <FormField
                  control={form.control}
                  name="publicSlug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custom Job Page URL</FormLabel>
                      <FormControl>
                        <Input 
                          {...field}
                          placeholder={isAgency ? "your-company-name" : "your-name"} 
                          onChange={(e) => {
                            // Filter out invalid characters and convert to lowercase
                            const filteredValue = e.target.value
                              .toLowerCase()
                              .replace(/[^a-z0-9-]/g, '')
                              .replace(/^-+|-+$/g, '') // Remove leading/trailing dashes
                              .replace(/-{2,}/g, '-'); // Replace multiple dashes with single dash
                            field.onChange(filteredValue);
                          }}
                          maxLength={50}
                        />
                      </FormControl>
                      <FormDescription>
                        Only letters, numbers, and dashes allowed (3-50 characters). This creates: /employers/[your-slug]/jobs
                      </FormDescription>
                      
                      {/* Slug Availability Status */}
                      {field.value && field.value.length >= 3 && (
                        <div className="mt-2">
                          {slugAvailability.checking && (
                            <p className="text-sm text-gray-500 flex items-center gap-2">
                              <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600"></span>
                              Checking availability...
                            </p>
                          )}
                          
                          {!slugAvailability.checking && slugAvailability.available === true && (
                            <p className="text-sm text-green-600 flex items-center gap-2">
                              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Available! This URL is ready to use.
                            </p>
                          )}
                          
                          {!slugAvailability.checking && slugAvailability.available === false && (
                            <div className="space-y-2">
                              <p className="text-sm text-red-600 flex items-center gap-2">
                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                This URL is already taken
                              </p>
                              
                              {slugAvailability.suggestions.length > 0 && (
                                <div className="bg-gray-50 rounded-md p-3">
                                  <p className="text-sm font-medium text-gray-700 mb-2">Try these alternatives:</p>
                                  <div className="flex flex-wrap gap-2">
                                    {slugAvailability.suggestions.map((suggestion) => (
                                      <button
                                        key={suggestion}
                                        type="button"
                                        onClick={() => field.onChange(suggestion)}
                                        className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                                      >
                                        {suggestion}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Custom Link Display */}
              {form.watch("publicSlug") && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Your Custom Job Page</h4>
                  <p className="text-sm text-blue-700 mb-2">
                    Share this link to show all your job openings:
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="bg-white px-2 py-1 rounded text-sm font-mono text-blue-800 border">
                      {baseUrl ? `${baseUrl}/employers/${form.watch("publicSlug")}/jobs` : "Loading..."}
                    </code>
                    <button
                      type="button"
                      onClick={() => {
                        if (baseUrl) {
                          navigator.clipboard.writeText(`${baseUrl}/employers/${form.watch("publicSlug")}/jobs`);
                          toast.success("Link copied to clipboard!");
                          setCopyStatus('copied');
                          // Reset copy status after 2 seconds
                          setTimeout(() => {
                            setCopyStatus('idle');
                          }, 2000);
                        }
                      }}
                      className={`text-sm font-medium transition-colors duration-200 flex items-center gap-1 ${
                        copyStatus === 'copied' 
                          ? 'text-green-600 hover:text-green-700' 
                          : 'text-blue-600 hover:text-blue-700'
                      }`}
                      disabled={!baseUrl}
                    >
                      {copyStatus === 'copied' ? (
                        <>
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Copied!
                        </>
                      ) : (
                        <>
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={
              isLoading || 
              (form.watch("publicSlug") && slugAvailability.available === false) ||
              slugAvailability.checking
            }
            className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isLoading ? "Saving..." : 
             slugAvailability.checking ? "Checking..." :
             (form.watch("publicSlug") && slugAvailability.available === false) ? "URL Unavailable" :
             "Save Changes"}
          </Button>
        </div>
      </form>
    </Form>
      )}
    </div>
  );
} 