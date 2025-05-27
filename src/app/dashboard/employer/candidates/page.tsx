"use client";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Candidates | Bell Registry",
  description: "Manage your candidate interactions",
};

export default function CandidatesPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Candidates</h1>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">
          Select an option from the sidebar menu to browse all candidates or view your saved candidates.
        </p>
      </div>
    </div>
  );
} 