/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

import { Metadata } from "next";
import { EmployerDashboard } from "@/components/dashboard/employer-dashboard";

export const metadata: Metadata = {
  title: "Employer Dashboard - The Bell Registry",
  description: "Manage your job listings and view candidate applications",
};

export default function EmployerDashboardPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <EmployerDashboard />
    </div>
  );
} 