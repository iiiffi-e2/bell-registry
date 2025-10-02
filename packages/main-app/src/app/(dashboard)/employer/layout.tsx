/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

import { DashboardNav } from "@/components/dashboard/dashboard-nav";

export default function EmployerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav />
      <main className="ml-64 min-h-screen bg-gray-50 p-6">
        {children}
      </main>
    </div>
  );
} 