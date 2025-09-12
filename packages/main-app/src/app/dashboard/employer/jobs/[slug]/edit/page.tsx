"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { WysiwygEditor } from "@/components/ui/wysiwyg-editor";
import { GoogleMapsLoader } from "@/components/ui/google-maps-loader";
import { LocationAutocomplete } from "@/components/ui/location-autocomplete";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PROFESSIONAL_ROLES } from "@/lib/constants";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import { SparklesIcon } from "@heroicons/react/24/outline";
import ImprovedJobDescriptionModal from "@/components/ui/improved-job-description-modal";

const EMPLOYMENT_TYPES = [
  "Full-time",
  "Part-time",
  "Contract",
  "Temporary",
  "Seasonal",
  "Live-in",
  "Live-out"
] as const;

const JOB_STATUSES = [
  "ACTIVE",
  "INTERVIEWING", 
  "FILLED",
  "CLOSED"
] as const;

type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];
type JobStatus = (typeof JOB_STATUSES)[number];

const jobFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  professionalRole: z.string().min(1, "Professional role is required"),
  description: z.string().min(1, "Description is required"),
  exceptionalOpportunity: z.string().optional().default(""),
  location: z.string().min(1, "Location is required"),
  requirements: z.array(z.object({
    value: z.string()
  })).optional().default([]),
  compensation: z.array(z.object({
    value: z.string()
  })).optional().default([]),
  salary: z.string().min(1, "Salary is required"),
  employmentType: z.enum(EMPLOYMENT_TYPES, {
    required_error: "Employment type is required",
  }).optional().default("Full-time" as EmploymentType),
  status: z.enum(JOB_STATUSES, {
    required_error: "Job status is required",
  }).optional().default("ACTIVE" as JobStatus),
  featured: z.boolean().optional().default(false),
  expiresAt: z.string().optional().default(""),
  customApplicationUrl: z.string().optional().default(""),
});

type JobFormValues = z.infer<typeof jobFormSchema>;

export default function EditJobPage() {
  const params = useParams();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showImprovedDescriptionModal, setShowImprovedDescriptionModal] = useState(false);
  const [improvedDescription, setImprovedDescription] = useState("");
  const [isImprovingDescription, setIsImprovingDescription] = useState(false);

  const form = useForm<JobFormValues>({
    // resolver: zodResolver(jobFormSchema), // Temporarily disabled due to TypeScript strict mode conflicts
    defaultValues: {
      title: "",
      professionalRole: "",
      description: "",
      exceptionalOpportunity: "",
      location: "",
      requirements: [{ value: "" }],
      compensation: [{ value: "" }],
      salary: "",
      employmentType: "Full-time",
      status: "ACTIVE",
      featured: false,
      expiresAt: "",
      customApplicationUrl: "",
    }
  });

  const { fields: requirementFields, append: appendRequirement, remove: removeRequirement } = useFieldArray({
    name: "requirements",
    control: form.control,
  });

  const { fields: compensationFields, append: appendCompensation, remove: removeCompensation } = useFieldArray({
    name: "compensation",
    control: form.control,
  });

  const currentDescription = form.watch("description");
  const currentTitle = form.watch("title");
  const currentProfessionalRole = form.watch("professionalRole");

  useEffect(() => {
    async function fetchJobDetails() {
      if (!params?.slug) {
        console.error("No slug parameter found");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/jobs/details/${params.slug}`);
        if (!response.ok) {
          throw new Error("Failed to fetch job details");
        }

        const data = await response.json();
        const job = data.job;

        // Format the date to YYYY-MM-DD for the input
        const expiryDate = job.expiresAt 
          ? new Date(job.expiresAt).toISOString().split('T')[0]
          : "";

        const formData = {
          title: job.title,
          professionalRole: job.professionalRole,
          description: job.description,
          exceptionalOpportunity: job.exceptionalOpportunity || "",
          location: job.location,
          requirements: (job.requirements || []).length > 0 
            ? (job.requirements || []).map((req: string) => ({ value: req }))
            : [{ value: "" }],
          compensation: (job.compensation || []).length > 0 
            ? (job.compensation || []).map((comp: string) => ({ value: comp }))
            : [{ value: "" }],
          salary: job.salary || "",
          employmentType: job.employmentType as EmploymentType,
          status: job.status as JobStatus,
          featured: job.featured,
          expiresAt: expiryDate,
        };

        form.reset(formData);
      } catch (error) {
        console.error("Error fetching job details:", error);
        toast.error("Failed to load job details");
      } finally {
        setIsLoading(false);
      }
    }

    fetchJobDetails();
  }, [params?.slug]);

  async function onSubmit(data: JobFormValues) {
    if (!params?.slug) {
      toast.error("Missing job identifier");
      return;
    }

    // Manual validation for required fields
    if (!data.salary || data.salary.trim() === "") {
      toast.error("Salary is required");
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Filter out empty requirements and compensation
      const requirements = (data.requirements || [])
        .filter(req => req.value.trim() !== "")
        .map(req => req.value);
        
      const compensation = (data.compensation || [])
        .filter(comp => comp.value.trim() !== "")
        .map(comp => comp.value);

      const jobData = {
        ...data,
        requirements,
        compensation,
      };

      const response = await fetch(`/api/jobs/${params.slug}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(jobData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || "Failed to update job");
      }

      toast.success("Job updated successfully!");
      router.push("/dashboard");
    } catch (error) {
      toast.error("Failed to update job. Please try again.");
      console.error("Error updating job:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleImproveWithAI = async () => {
    try {
      setIsImprovingDescription(true);
      setShowImprovedDescriptionModal(true);
      
      const response = await fetch("/api/ai/improve-job-description", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          currentDescription,
          jobTitle: currentTitle,
          professionalRole: currentProfessionalRole
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || "Failed to improve job description");
      }

      setImprovedDescription(data.improvedDescription);
    } catch (error: any) {
      console.error("Error improving job description:", error);
      // Show error in modal instead of closing it
      setImprovedDescription(`Error: ${error.message || "Failed to improve job description. Please try again later."}`);
    } finally {
      setIsImprovingDescription(false);
    }
  };

  const handleAcceptImprovedDescription = (description: string) => {
    form.setValue("description", description);
    setShowImprovedDescriptionModal(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Job Posting</h1>
        <p className="mt-2 text-gray-600">
          Update the details of your job listing
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Title <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. Experienced Estate Manager for Luxury Manhattan Property" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Enter a descriptive title for the position
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="professionalRole"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Category <span className="text-red-500">*</span></FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a job category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PROFESSIONAL_ROLES.map((role) => (
                          <SelectItem key={role} value={role}>
                            {role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choose the primary category for this position
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select job status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {JOB_STATUSES.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Set the current status of this job posting
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <div className="flex justify-between items-center mb-1">
                    <FormLabel>Job Description <span className="text-red-500">*</span></FormLabel>
                    <button
                      type="button"
                      onClick={handleImproveWithAI}
                      disabled={!currentDescription || isSubmitting}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <SparklesIcon className="h-4 w-4 mr-1" />
                      Improve with AI
                    </button>
                  </div>
                                        <FormControl>
                        <WysiwygEditor
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Describe the role and responsibilities..."
                          minHeight="200px"
                        />
                      </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="exceptionalOpportunity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What makes this an exceptional opportunity?</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Highlight what makes this position special - unique benefits, growth opportunities, company culture, etc."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    This will appear as a highlight above the full job description to attract top candidates
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="employmentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employment Type <span className="text-red-500">*</span></FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select employment type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {EMPLOYMENT_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="salary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Salary <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g. $50,000 - $70,000 per year, $25/hour, Competitive salary" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Enter the salary range or compensation details
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <FormLabel>Requirements (Optional)</FormLabel>
                  <FormDescription className="text-sm text-gray-500">
                    Add any specific requirements for this position
                  </FormDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendRequirement({ value: "" })}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Requirement
                </Button>
              </div>
              
              <div className="space-y-3">
                {requirementFields.map((field, index) => (
                  <div key={field.id} className="flex gap-2">
                    <FormField
                      control={form.control}
                      name={`requirements.${index}.value`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input
                              placeholder="Enter a job requirement"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {index > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeRequirement(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <FormLabel>Additional Benefits (Optional)</FormLabel>
                  <FormDescription className="text-sm text-gray-500">
                    Add additional benefits, perks, and compensation details
                  </FormDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendCompensation({ value: "" })}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Benefit
                </Button>
              </div>
              
              <div className="space-y-3">
                {compensationFields.map((field, index) => (
                  <div key={field.id} className="flex gap-2">
                    <FormField
                      control={form.control}
                      name={`compensation.${index}.value`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input
                              placeholder="e.g. Health insurance, 401k matching, Paid time off, Professional development"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {index > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeCompensation(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <GoogleMapsLoader>
                      <LocationAutocomplete
                        value={field.value || ""}
                        onChange={field.onChange}
                        placeholder="Search for a city..."
                        allowCustomInput={false}
                      />
                    </GoogleMapsLoader>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="expiresAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ideal Hire Date (Optional)</FormLabel>
                  <FormControl>
                    <Input type="date" min={new Date().toISOString().split('T')[0]} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Featured Job section hidden - future enhancement
            <FormField
              control={form.control}
              name="featured"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Featured Job</FormLabel>
                    <div className="text-sm text-gray-500">
                      Featured jobs appear at the top of search results
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            */}

            <FormField
              control={form.control}
              name="customApplicationUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Custom Application URL (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://example.com/apply" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    If provided, the apply button will redirect to this URL instead of using the Bell Registry application system
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </div>

      {/* Improved Job Description Modal */}
      <ImprovedJobDescriptionModal
        isOpen={showImprovedDescriptionModal}
        onClose={() => setShowImprovedDescriptionModal(false)}
        originalDescription={currentDescription || ""}
        improvedDescription={improvedDescription}
        onAccept={handleAcceptImprovedDescription}
        isLoading={isImprovingDescription}
      />
    </div>
  );
} 