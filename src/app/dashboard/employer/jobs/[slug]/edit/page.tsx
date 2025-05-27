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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
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

const JOB_TYPES = [
  "Permanent",
  "Fixed-term",
  "Temporary",
  "Freelance",
  "Per Diem"
] as const;

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

type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];
type JobType = (typeof JOB_TYPES)[number];

const jobFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  professionalRole: z.string().min(1, "Professional role is required"),
  description: z.string().min(1, "Description is required"),
  location: z.string().min(1, "Location is required"),
  requirements: z.array(z.object({
    value: z.string()
  })).min(1, "At least one requirement is required"),
  salaryMin: z.string().min(1, "Minimum salary is required"),
  salaryMax: z.string().min(1, "Maximum salary is required"),
  jobType: z.enum(JOB_TYPES, {
    required_error: "Job type is required",
  }),
  employmentType: z.enum(EMPLOYMENT_TYPES, {
    required_error: "Employment type is required",
  }),
  featured: z.boolean().default(false),
  expiresAt: z.string().min(1, "Expiry date is required"),
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
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      title: "",
      professionalRole: "",
      description: "",
      location: "",
      requirements: [{ value: "" }],
      salaryMin: "",
      salaryMax: "",
      jobType: "Permanent",
      employmentType: "Full-time",
      featured: false,
      expiresAt: "",
    }
  });

  const { fields: requirementFields, append: appendRequirement, remove: removeRequirement } = useFieldArray({
    name: "requirements",
    control: form.control,
  });

  const currentDescription = form.watch("description");
  const currentTitle = form.watch("title");
  const currentProfessionalRole = form.watch("professionalRole");

  useEffect(() => {
    async function fetchJobDetails() {
      try {
        const response = await fetch(`/api/jobs/details/${params.slug}`);
        if (!response.ok) {
          throw new Error("Failed to fetch job details");
        }

        const data = await response.json();
        const job = data.job;

        // Format the date to YYYY-MM-DD for the input
        const expiryDate = new Date(job.expiresAt).toISOString().split('T')[0];

        form.reset({
          title: job.title,
          professionalRole: job.professionalRole,
          description: job.description,
          location: job.location,
          requirements: job.requirements.map((req: string) => ({ value: req })),
          salaryMin: job.salary.min.toString(),
          salaryMax: job.salary.max.toString(),
          jobType: job.jobType as JobType,
          employmentType: job.employmentType as EmploymentType,
          featured: job.featured,
          expiresAt: expiryDate,
        });
      } catch (error) {
        console.error("Error fetching job details:", error);
        toast.error("Failed to load job details");
      } finally {
        setIsLoading(false);
      }
    }

    fetchJobDetails();
  }, [params.slug, form]);

  async function onSubmit(data: JobFormValues) {
    try {
      setIsSubmitting(true);
      
      // Filter out empty requirements
      const requirements = data.requirements
        .filter(req => req.value.trim() !== "")
        .map(req => req.value);

      const jobData = {
        ...data,
        requirements,
        salary: {
          min: parseInt(data.salaryMin),
          max: parseInt(data.salaryMax),
          currency: "USD"
        },
      };

      const response = await fetch(`/api/jobs/${params.slug}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(jobData),
      });

      if (!response.ok) {
        throw new Error("Failed to update job");
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
                  <FormLabel>Job Title</FormLabel>
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

            <FormField
              control={form.control}
              name="professionalRole"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Professional Role</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a professional role" />
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
                    Choose the primary role category for this position
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <div className="flex justify-between items-center mb-1">
                    <FormLabel>Job Description</FormLabel>
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
                    <Textarea
                      placeholder="Describe the role and responsibilities..."
                      className="min-h-[200px] resize-y"
                      {...field}
                    />
                  </FormControl>
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
                    <FormLabel>Employment Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                name="jobType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select job type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {JOB_TYPES.map((type) => (
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
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <FormLabel>Requirements</FormLabel>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="salaryMin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Salary (USD)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g. 50000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="salaryMax"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Salary (USD)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g. 100000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. New York, NY" {...field} />
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
                  <FormLabel>Expiry Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
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