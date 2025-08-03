import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ProfilePictureUpload } from "./profile-picture-upload";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Form } from "@/components/ui/form";
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { GoogleMapsLoader } from "@/components/ui/google-maps-loader";
import { LocationAutocomplete } from "@/components/ui/location-autocomplete";
import { toast } from "sonner";

const employerProfileSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  description: z.string().optional(),
  website: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  logoUrl: z.string().optional(),
  location: z.string().optional(),
  publicSlug: z.string().optional(),
});

type EmployerProfileFormData = z.infer<typeof employerProfileSchema>;

interface EmployerProfileFormProps {
  onSubmit: (data: EmployerProfileFormData) => Promise<void>;
}

export function EmployerProfileForm({ onSubmit }: EmployerProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [baseUrl, setBaseUrl] = useState("");
  const { data: session } = useSession();

  const form = useForm<EmployerProfileFormData>({
    resolver: zodResolver(employerProfileSchema),
    defaultValues: {
      companyName: "",
      description: "",
      website: "",
      logoUrl: "",
      location: "",
      publicSlug: "",
    },
  });

  useEffect(() => {
    // Set base URL on client side only
    if (typeof window !== "undefined") {
      setBaseUrl(window.location.origin);
    }
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
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
        }
      } catch (error) {
        console.error("Error loading profile:", error);
        toast.error("Failed to load profile");
      }
    };

    if (session?.user) {
      loadProfile();
    }
  }, [session, form]);

  const handleSubmit = async (data: EmployerProfileFormData) => {
    setIsLoading(true);
    setShowSuccessMessage(false);
    try {
      await onSubmit(data);
      toast.success("Profile updated successfully");
      setShowSuccessMessage(true);
      // Hide success message after 20 seconds
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 20000);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
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
                  Your employer profile has been successfully updated!
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

        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Employer Profile</h3>
            <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4">
              {/* Company Logo Upload */}
              <div>
                <ProfilePictureUpload
                  currentImage={form.watch("logoUrl") as string}
                  onUpload={(url) => form.setValue("logoUrl", url)}
                />
              </div>

              {/* Employer Name */}
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

              {/* Company Description */}
              <div>
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Description</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          rows={4}
                          placeholder="Tell us about your company..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Website */}
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

              {/* Location */}
              <div>
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Location</FormLabel>
                      <FormControl>
                        <GoogleMapsLoader>
                          <LocationAutocomplete
                            value={field.value || ""}
                            onChange={field.onChange}
                            placeholder="Enter company location..."
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
                          placeholder="your-company-name" 
                        />
                      </FormControl>
                      <FormDescription>
                        This will create a custom URL for your job listings: /employers/[your-slug]/jobs
                      </FormDescription>
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
                        }
                      }}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      disabled={!baseUrl}
                    >
                      Copy
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
            disabled={isLoading}
            className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
} 