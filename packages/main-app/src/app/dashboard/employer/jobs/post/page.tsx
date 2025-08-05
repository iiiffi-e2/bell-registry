"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, X } from "lucide-react";
import { SparklesIcon } from "@heroicons/react/24/outline";
import ImprovedJobDescriptionModal from "@/components/ui/improved-job-description-modal";
import { useSession } from "next-auth/react";
import { AlertTriangle, CreditCard, Loader2 } from "lucide-react";
import Link from "next/link";

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

type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];
type JobType = (typeof JOB_TYPES)[number];

const jobFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  professionalRole: z.string().min(1, "Professional role is required"),
  description: z.string().min(1, "Description is required"),
  exceptionalOpportunity: z.string().optional().default(""),
  location: z.string().min(1, "Location is required"),
  requirements: z.array(z.object({
    value: z.string()
  })).optional().default([]),
  salaryMin: z.string().optional().default(""),
  salaryMax: z.string().optional().default(""),
  jobType: z.enum(JOB_TYPES, {
    required_error: "Job type is required",
  }).optional().default("Permanent" as JobType),
  employmentType: z.enum(EMPLOYMENT_TYPES, {
    required_error: "Employment type is required",
  }).optional().default("Full-time" as EmploymentType),
  featured: z.boolean().optional().default(false),
  expiresAt: z.string().optional().default(""),
});

type JobFormValues = z.infer<typeof jobFormSchema>;

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

const defaultValues: Partial<JobFormValues> = {
  title: "",
  professionalRole: "",
  description: "",
  exceptionalOpportunity: "",
  location: "",
  requirements: [{ value: "" }],
  salaryMin: "",
  salaryMax: "",
  jobType: "Permanent" as JobType,
  employmentType: "Full-time" as EmploymentType,
  featured: false,
  expiresAt: "",
};

interface SubscriptionStatus {
  canPostJob: boolean;
  hasActiveSubscription: boolean;
  subscription?: {
    subscriptionType: string;
    jobPostLimit: number | null;
    jobsPostedCount: number;
    subscriptionEndDate: string | null;
  };
}

export default function PostJobPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [customTitle, setCustomTitle] = useState<string>("");
  const [showImprovedDescriptionModal, setShowImprovedDescriptionModal] = useState(false);
  const [improvedDescription, setImprovedDescription] = useState("");
  const [isImprovingDescription, setIsImprovingDescription] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);

  // Add this alert to verify we're on the correct page
  useEffect(() => {
    // Remove this alert after testing
    // alert("Employer job posting page loaded - this is the correct page!");
  }, []);

  const form = useForm<JobFormValues>({
    // resolver: zodResolver(jobFormSchema), // Temporarily disabled due to TypeScript strict mode conflicts
    defaultValues,
  });

  const { fields: requirementFields, append: appendRequirement, remove: removeRequirement } = useFieldArray({
    name: "requirements",
    control: form.control,
  });

  const currentDescription = form.watch("description");
  const currentTitle = form.watch("title");
  const currentProfessionalRole = form.watch("professionalRole");

  // Update form title when role is selected
  useEffect(() => {
    if (selectedRole) {
      if (selectedRole === "Other") {
        form.setValue("title", customTitle);
      } else {
        form.setValue("title", selectedRole);
        setCustomTitle("");
      }
    }
  }, [selectedRole, customTitle, form]);

  // Check subscription status on page load
  useEffect(() => {
    if (session?.user?.id) {
      checkSubscriptionStatus();
    }
  }, [session]);

  const checkSubscriptionStatus = async () => {
    try {
      setLoadingSubscription(true);
      const [canPostResponse, subscriptionResponse] = await Promise.all([
        fetch('/api/subscription/can-post-job'),
        fetch('/api/subscription')
      ]);

      if (canPostResponse.ok && subscriptionResponse.ok) {
        const canPostData = await canPostResponse.json();
        const subscriptionData = await subscriptionResponse.json();
        
        setSubscriptionStatus({
          canPostJob: canPostData.canPostJob,
          hasActiveSubscription: canPostData.hasActiveSubscription,
          subscription: subscriptionData.subscription
        });
      }
    } catch (error) {
      console.error('Error checking subscription status:', error);
    } finally {
      setLoadingSubscription(false);
    }
  };

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
      setImprovedDescription(`Error: ${error.message || "Failed to improve job description. Please try again later."}`);
    } finally {
      setIsImprovingDescription(false);
    }
  };

  const handleAcceptImprovedDescription = (description: string) => {
    form.setValue("description", description);
    setShowImprovedDescriptionModal(false);
  };

  async function onSubmit(data: JobFormValues) {
    // Pre-flight check before submission
    if (!subscriptionStatus?.canPostJob) {
      toast.error("Cannot post job. Please check your subscription status.");
      return;
    }

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

      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(jobData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.code === "SUBSCRIPTION_LIMIT_REACHED") {
          toast.error("Job posting limit reached. Please upgrade your subscription.");
          return;
        }
        throw new Error("Failed to create job");
      }

      const result = await response.json();
      const jobSlug = result.job?.urlSlug;

      if (!jobSlug) {
        throw new Error("Job created but no slug returned");
      }

      const redirectUrl = `/dashboard/employer/jobs/${jobSlug}`;

      toast.success("Job posted successfully!");
      router.push(redirectUrl);
      
    } catch (error) {
      toast.error("Failed to post job. Please try again.");
      console.error("Error posting job:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Show loading state while checking subscription
  if (loadingSubscription) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-sm rounded-lg p-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500 mr-3" />
            <span>Checking subscription status...</span>
          </div>
        </div>
      </div>
    );
  }

  // Show subscription warning if can't post jobs
  const showSubscriptionWarning = subscriptionStatus && !subscriptionStatus.canPostJob;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Post a New Job</h1>
        <p className="mt-2 text-gray-600">
          Fill in the details below to create a new job listing
        </p>
      </div>

      {/* Subscription Warning */}
      {showSubscriptionWarning && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800 mb-1">
                Cannot Post Job
              </h3>
              <p className="text-sm text-red-700 mb-3">
                {!subscriptionStatus?.hasActiveSubscription 
                  ? "Your subscription has expired. Upgrade to continue posting jobs."
                  : "You've reached your job posting limit for this subscription period."
                }
              </p>
              <Link
                href="/dashboard/subscription"
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Upgrade Subscription
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Status Info */}
      {subscriptionStatus?.subscription && subscriptionStatus.canPostJob && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <CreditCard className="h-5 w-5 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-blue-800">
                <span className="font-medium">Subscription:</span> {subscriptionStatus.subscription.subscriptionType} | 
                <span className="font-medium"> Jobs Used:</span> {subscriptionStatus.subscription.jobsPostedCount} / {subscriptionStatus.subscription.jobPostLimit || '∞'}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Disable all form fields if can't post jobs */}
            <fieldset disabled={!!showSubscriptionWarning} className={showSubscriptionWarning ? "opacity-50" : ""}>
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
                        disabled={!currentDescription || isSubmitting || !!showSubscriptionWarning}
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
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
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
                  name="jobType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Type (Optional)</FormLabel>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="employmentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employment Type (Optional)</FormLabel>
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
                  name="expiresAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expiry Date (Optional)</FormLabel>
                      <FormControl>
                        <Input type="date" min={new Date().toISOString().split('T')[0]} {...field} />
                      </FormControl>
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
                    disabled={!!showSubscriptionWarning}
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
                          disabled={!!showSubscriptionWarning}
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
                      <FormLabel>Minimum Salary (USD) (Optional)</FormLabel>
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
                      <FormLabel>Maximum Salary (USD) (Optional)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g. 100000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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
                        disabled={!!showSubscriptionWarning}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              */}
            </fieldset>

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
                disabled={isSubmitting || !!showSubscriptionWarning}
              >
                {isSubmitting ? "Posting..." : showSubscriptionWarning ? "Upgrade Required" : "Post Job"}
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