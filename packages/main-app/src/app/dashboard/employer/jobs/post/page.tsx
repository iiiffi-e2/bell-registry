"use client";

import { useState, useEffect, useRef } from "react";
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
import { PROFESSIONAL_ROLES } from "@/lib/constants";
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
import { formatSubscriptionType } from "@/lib/subscription-utils";

const EMPLOYMENT_TYPES = [
  "Full-time",
  "Part-time",
  "Contract",
  "Temporary",
  "Seasonal",
  "Live-in",
  "Live-out"
] as const;

type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

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
  featured: z.boolean().optional().default(false),
  expiresAt: z.string().optional().default(""),
});

type JobFormValues = z.infer<typeof jobFormSchema>;

const defaultValues: Partial<JobFormValues> = {
  title: "",
  professionalRole: "",
  description: "",
  exceptionalOpportunity: "",
  location: "",
  requirements: [{ value: "" }],
  compensation: [{ value: "" }],
  salary: "",
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
  const { data: session, status } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [customTitle, setCustomTitle] = useState<string>("");
  const [showImprovedDescriptionModal, setShowImprovedDescriptionModal] = useState(false);
  const [improvedDescription, setImprovedDescription] = useState("");
  const [isImprovingDescription, setIsImprovingDescription] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const subscriptionCheckedRef = useRef(false);

  // Role-based access control
  useEffect(() => {
    if (status === "authenticated" && session?.user?.role) {
      // Redirect professionals away from employer screens
      if (session.user.role === "PROFESSIONAL") {
        router.push("/dashboard");
        return;
      }
      
      // Only allow employers and agencies
      if (session.user.role !== "EMPLOYER" && session.user.role !== "AGENCY") {
        router.push("/dashboard");
        return;
      }
    }
  }, [session, status, router]);

  // Add this alert to verify we're on the correct page
  useEffect(() => {
    // Remove this alert after testing
    // alert("Employer job posting page loaded - this is the correct page!");
  }, []);

  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues,
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
  }, [selectedRole, customTitle]);

  // Check subscription status on page load - only once
  // Using ref to prevent unnecessary API calls when switching tabs
  useEffect(() => {
    if (session?.user?.id && !subscriptionCheckedRef.current) {
      subscriptionCheckedRef.current = true;
      checkSubscriptionStatus();
    }
    
    // Cleanup function to reset ref when component unmounts
    return () => {
      subscriptionCheckedRef.current = false;
    };
  }, [session?.user?.id]);

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
      
      // Filter out empty requirements and compensation
      const requirements = data.requirements
        .filter(req => req.value.trim() !== "")
        .map(req => req.value);
        
      const compensation = data.compensation
        .filter(comp => comp.value.trim() !== "")
        .map(comp => comp.value);

      const jobData = {
        ...data,
        requirements,
        compensation,
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

  // Show loading state while checking authentication and role
  if (status === "loading" || !session?.user?.role) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirect unauthorized users
  if (session.user.role === "PROFESSIONAL") {
    router.push("/dashboard");
    return null;
  }

  if (session.user.role !== "EMPLOYER" && session.user.role !== "AGENCY") {
    router.push("/dashboard");
    return null;
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

  // If subscription is expired or can't post jobs, show only the warning message
  if (showSubscriptionWarning) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Post a New Job</h1>
          <p className="mt-2 text-gray-600">
            Fill in the details below to create a new job listing
          </p>
        </div>

        {/* Subscription Warning - Full Screen */}
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="max-w-md mx-auto">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-6">
              <AlertTriangle className="h-8 w-8 text-red-600" aria-hidden="true" />
            </div>
            <h3 className="text-xl font-semibold text-red-800 mb-3">
              Cannot Post Job
            </h3>
            <p className="text-gray-600 mb-6">
              {!subscriptionStatus?.hasActiveSubscription 
                ? "Your subscription has expired. Upgrade to continue posting jobs."
                : "You've reached your job posting limit for this subscription period."
              }
            </p>
            <Link
              href="/dashboard/subscription"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
              <CreditCard className="h-5 w-5 mr-2" />
              Upgrade Subscription
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Post a New Job</h1>
        <p className="mt-2 text-gray-600">
          Fill in the details below to create a new job listing
        </p>
      </div>

      {/* Subscription Status Info */}
      {subscriptionStatus?.subscription && subscriptionStatus.canPostJob && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <CreditCard className="h-5 w-5 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-blue-800">
                <span className="font-medium">Subscription:</span> {formatSubscriptionType(subscriptionStatus.subscription.subscriptionType)} | 
                <span className="font-medium"> Jobs Used:</span> {subscriptionStatus.subscription.jobsPostedCount} / {subscriptionStatus.subscription.jobPostLimit || '∞'}
              </p>
            </div>
          </div>
        </div>
      )}

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

            <FormField
              control={form.control}
              name="professionalRole"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Category <span className="text-red-500">*</span></FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="employmentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employment Type <span className="text-red-500">*</span></FormLabel>
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
                    <FormLabel>Ideal Hire Date (Optional)</FormLabel>
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
                {isSubmitting ? "Posting..." : "Post Job"}
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