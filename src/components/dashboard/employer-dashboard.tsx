"use client";

import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, Users, Bookmark, Briefcase, Plus, ArrowRight, Pencil } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { truncateWords } from "@/lib/utils";
import { SubscriptionAlert } from "@/components/subscription/SubscriptionAlert";

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
  description: string;
}

interface Stats {
  activeJobs: number;
  totalApplications: number;
  newApplications: number;
  savedCandidates: number;
  totalViews: number;
}

export function EmployerDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<Stats>({
    activeJobs: 0,
    totalApplications: 0,
    newApplications: 0,
    savedCandidates: 0,
    totalViews: 0,
  });
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [canPostJob, setCanPostJob] = useState<boolean>(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        // Fetch stats
        const statsRes = await fetch("/api/dashboard/employer/stats");
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }

        // Fetch active jobs
        const jobsRes = await fetch("/api/dashboard/employer/jobs");
        if (jobsRes.ok) {
          const jobsData = await jobsRes.json();
          // Filter to only show active listings (ACTIVE and INTERVIEWING)
          const activeJobs = (jobsData.jobs || []).filter((job: Job) => 
            job.status === "ACTIVE" || job.status === "INTERVIEWING"
          );
          setJobs(activeJobs);
        }

        // Check if user can post jobs
        const canPostRes = await fetch("/api/subscription/can-post-job");
        if (canPostRes.ok) {
          const canPostData = await canPostRes.json();
          setCanPostJob(canPostData.canPostJob);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {session?.user?.name?.split(' ')[0] || 'Employer'}
        </h1>
        <p className="mt-2 text-gray-600">
          Manage your job listings and view candidate applications
        </p>
      </div>

      {/* Subscription Alert */}
      <SubscriptionAlert />

      {/* Stats Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Briefcase className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Active Listings</p>
              <p className="text-2xl font-bold">{stats.activeJobs}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <Link href="/dashboard/employer/applications" className="block">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 rounded-full relative">
                <Users className="h-6 w-6 text-green-600" />
                {stats.newApplications > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center h-5 w-5 rounded-full bg-red-500 text-white text-xs font-medium">
                    {stats.newApplications > 9 ? '9+' : stats.newApplications}
                  </span>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Applications</p>
                <p className="text-2xl font-bold">{stats.totalApplications}</p>
                {stats.newApplications > 0 && (
                  <p className="text-xs text-green-600 font-medium mt-1">
                    {stats.newApplications} new
                  </p>
                )}
              </div>
            </div>
          </Link>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-purple-100 rounded-full">
              <Bookmark className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Saved Candidates</p>
              <p className="text-2xl font-bold">{stats.savedCandidates}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-orange-100 rounded-full">
              <Eye className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Views</p>
              <p className="text-2xl font-bold">{stats.totalViews}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Job Listings Table */}
      <Card className="overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Active Job Listings</h2>
            <div className="flex gap-3">
              <Button variant="outline" asChild>
                <Link href="/dashboard/employer/jobs" className="flex items-center">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  View All Jobs
                </Link>
              </Button>
              <Button asChild={canPostJob} variant={canPostJob ? "default" : "outline"}>
                {canPostJob ? (
                  <Link href="/dashboard/employer/jobs/post" className="flex items-center">
                    <Plus className="h-4 w-4 mr-2" />
                    Post New Job
                  </Link>
                ) : (
                  <Link href="/dashboard/subscription" className="flex items-center">
                    <Plus className="h-4 w-4 mr-2" />
                    Upgrade to Post Jobs
                  </Link>
                )}
              </Button>
            </div>
          </div>

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
                          <div className="text-sm text-gray-600 mt-1">
                            {truncateWords(job.description, 60)}
                          </div>
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
              <h3 className="mt-2 text-sm font-medium text-gray-900">No active job listings</h3>
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
      </Card>
    </div>
  );
} 