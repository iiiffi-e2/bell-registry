import { DashboardNav } from "@/components/dashboard/dashboard-nav";

export default function EmployerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <DashboardNav />
      <main className="flex-1 bg-gray-50">
        {children}
      </main>
    </div>
  );
} 