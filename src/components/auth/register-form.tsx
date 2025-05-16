"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import * as z from "zod";
import Link from "next/link";

const ROLES = ["PROFESSIONAL", "EMPLOYER", "AGENCY"] as const;
type Role = typeof ROLES[number];

// Step 1: Email and Terms
const stepOneSchema = z.object({
  email: z.string().email("Invalid email address"),
  terms: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and conditions",
  }),
  role: z.enum(ROLES),
});

// Step 2: Personal Details and Password
const stepTwoSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type StepOneData = z.infer<typeof stepOneSchema>;
type StepTwoData = z.infer<typeof stepTwoSchema>;

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [stepOneData, setStepOneData] = useState<StepOneData | null>(null);

  const stepOneForm = useForm<StepOneData>({
    resolver: zodResolver(stepOneSchema),
    defaultValues: {
      role: (searchParams.get("role")?.toUpperCase() || "PROFESSIONAL") as Role,
      terms: false,
    },
  });

  const stepTwoForm = useForm<StepTwoData>({
    resolver: zodResolver(stepTwoSchema),
  });

  const onStepOneSubmit = async (data: StepOneData) => {
    setStepOneData(data);
    setCurrentStep(2);
  };

  const onStepTwoSubmit = async (data: StepTwoData) => {
    if (!stepOneData) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: stepOneData.email,
          role: stepOneData.role,
          firstName: data.firstName,
          lastName: data.lastName,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Something went wrong");
      }

      router.push("/login?registered=true");
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred");
      if (error instanceof Error && error.message.includes("email already exists")) {
        setCurrentStep(1); // Go back to email step if email exists
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    setIsLoading(true);
    signIn("google", { 
      callbackUrl: "/dashboard",
      role: stepOneForm.watch("role")
    });
  };

  if (currentStep === 1) {
    return (
      <div className="space-y-6">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="terms"
            {...stepOneForm.register("terms")}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="terms" className="ml-2 block text-sm text-gray-600">
            By signing up, I agree to BellRegistry's{" "}
            <Link href="/terms" className="text-blue-600 hover:text-blue-500">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-blue-600 hover:text-blue-500">
              Privacy Policy
            </Link>
            .
          </label>
        </div>
        {stepOneForm.formState.errors.terms && (
          <p className="mt-1 text-sm text-red-600">
            {stepOneForm.formState.errors.terms.message}
          </p>
        )}

        <div>
          <div className="relative">
            <input
              {...stepOneForm.register("email")}
              type="email"
              className="block w-full rounded-md border-0 py-3 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm"
              placeholder="Enter email"
            />
            {stepOneForm.formState.errors.email && (
              <p className="mt-1 text-sm text-red-600">
                {stepOneForm.formState.errors.email.message}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={stepOneForm.handleSubmit(onStepOneSubmit)}
          disabled={isLoading}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
        >
          Continue
        </button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">or</span>
          </div>
        </div>

        <div>
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign up with Google
          </button>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Log in
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
            First Name
          </label>
          <input
            {...stepTwoForm.register("firstName")}
            type="text"
            className="mt-1 block w-full rounded-md border-0 py-3 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm"
            placeholder="Enter your first name"
          />
          {stepTwoForm.formState.errors.firstName && (
            <p className="mt-1 text-sm text-red-600">
              {stepTwoForm.formState.errors.firstName.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
            Last Name
          </label>
          <input
            {...stepTwoForm.register("lastName")}
            type="text"
            className="mt-1 block w-full rounded-md border-0 py-3 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm"
            placeholder="Enter your last name"
          />
          {stepTwoForm.formState.errors.lastName && (
            <p className="mt-1 text-sm text-red-600">
              {stepTwoForm.formState.errors.lastName.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            {...stepTwoForm.register("password")}
            type="password"
            className="mt-1 block w-full rounded-md border-0 py-3 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm"
            placeholder="Create a password"
          />
          {stepTwoForm.formState.errors.password && (
            <p className="mt-1 text-sm text-red-600">
              {stepTwoForm.formState.errors.password.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
            Confirm Password
          </label>
          <input
            {...stepTwoForm.register("confirmPassword")}
            type="password"
            className="mt-1 block w-full rounded-md border-0 py-3 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm"
            placeholder="Confirm your password"
          />
          {stepTwoForm.formState.errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600">
              {stepTwoForm.formState.errors.confirmPassword.message}
            </p>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}

      <div className="flex space-x-4">
        <button
          type="button"
          onClick={() => setCurrentStep(1)}
          className="flex-1 py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Back
        </button>
        <button
          onClick={stepTwoForm.handleSubmit(onStepTwoSubmit)}
          disabled={isLoading}
          className="flex-1 py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
        >
          {isLoading ? "Creating account..." : "Create account"}
        </button>
      </div>
    </div>
  );
} 