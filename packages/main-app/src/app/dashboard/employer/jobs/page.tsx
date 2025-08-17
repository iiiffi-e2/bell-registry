"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, Users, Bookmark, Briefcase, Plus, ArrowRight, Pencil } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";

interface Job {
  id: number;
  title: string;
  professionalRole: string;
  location: string;
  views: number;
  applicants: number;
  status: string;
  createdAt: string;
  urlSlug: string;
}

export default function EmployerJobsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    async function fetchJobs() {
      try {
        const response = await fetch("/api/dashboard/employer/jobs");
        if (response.ok) {
          const data = await response.json();
          setJobs(data.jobs || []);
        }
      } catch (error) {
        console.error("Error fetching jobs:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchJobs();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Job Listings</h1>
            <p className="mt-2 text-gray-600">
              Manage your job postings and view applications
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard/employer/jobs/post" className="flex items-center">
              <Plus className="h-4 w-4 mr-2" />
              Post New Job
            </Link>
          </Button>
        </div>

        {/* Jobs Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            {jobs.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job Title</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Views</TableHead>
                      <TableHead>Applicants</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{job.title}</div>
                            <div className="text-sm text-gray-500">{job.professionalRole}</div>
                          </div>
                        </TableCell>
                        <TableCell>{job.location}</TableCell>
                        <TableCell>{job.views}</TableCell>
                        <TableCell>{job.applicants}</TableCell>
                        <TableCell>
                          <span
                            className={
                              job.status === "EXPIRED" || job.status === "CLOSED"
                                ? "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-700"
                                : job.status === "ACTIVE"
                                ? "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                                : job.status === "INTERVIEWING"
                                ? "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                : job.status === "FILLED"
                                ? "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                                : "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                            }
                          >
                            {job.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/dashboard/employer/jobs/${job.urlSlug}`} className="flex items-center gap-1">
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/dashboard/employer/jobs/${job.urlSlug}/edit`} className="flex items-center gap-1">
                                <Pencil className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No job listings</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by posting your first job listing.
                </p>
                <div className="mt-6">
                  <Button asChild>
                    <Link href="/dashboard/employer/jobs/post" className="flex items-center">
                      <Plus className="h-4 w-4 mr-2" />
                      Post New Job
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 