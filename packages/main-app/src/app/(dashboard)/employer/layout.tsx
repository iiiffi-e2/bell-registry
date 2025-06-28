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