"use client";

import { Metadata } from "next";
import { EmployerProfileForm } from "@/components/profile/employer-profile-form";
import { toast } from "sonner";

export default function EmployerProfilePage() {
  const handleSubmit = async (data: any) => {
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Employer Profile</h1>
        <EmployerProfileForm onSubmit={handleSubmit} />
      </div>
    </div>
  );
} 