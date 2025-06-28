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
});

type EmployerProfileFormData = z.infer<typeof employerProfileSchema>;

interface EmployerProfileFormProps {
  onSubmit: (data: EmployerProfileFormData) => Promise<void>;
}

export function EmployerProfileForm({ onSubmit }: EmployerProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { data: session } = useSession();

  const form = useForm<EmployerProfileFormData>({
    resolver: zodResolver(employerProfileSchema),
    defaultValues: {
      companyName: "",
      description: "",
      website: "",
      logoUrl: "",
      location: "",
    },
  });

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
    try {
      await onSubmit(data);
      toast.success("Profile updated successfully");
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
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Company Profile</h3>
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
                            value={field.value}
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