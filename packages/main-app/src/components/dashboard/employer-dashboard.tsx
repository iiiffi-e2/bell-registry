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
import { Eye, Users, Bookmark, Briefcase, Plus, ArrowRight, Pencil, MapPin } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { stripHtmlAndTruncate } from "@/lib/utils";
import { SubscriptionAlert } from "@/components/subscription/SubscriptionAlert";
import { EmployerOnly } from "@/components/auth/role-guard";

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
    <EmployerOnly>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, Employer
          </h1>
          <p className="mt-2 text-gray-600">
            Manage your job listings and view candidate applications
          </p>
        </div>

      {/* Subscription Alert */}
      <SubscriptionAlert />

      {/* Stats Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 sm:p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="p-2 sm:p-3 bg-blue-100 rounded-full flex-shrink-0">
              <Briefcase className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-600">Active Listings</p>
              <p className="text-xl sm:text-2xl font-bold">{stats.activeJobs}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6 hover:shadow-lg transition-shadow">
          <Link href="/dashboard/employer/applications" className="block">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="p-2 sm:p-3 bg-green-100 rounded-full relative flex-shrink-0">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                {stats.newApplications > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-red-500 text-white text-xs font-medium">
                    {stats.newApplications > 9 ? '9+' : stats.newApplications}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-600">Total Applications</p>
                <p className="text-xl sm:text-2xl font-bold">{stats.totalApplications}</p>
                {stats.newApplications > 0 && (
                  <p className="text-xs text-green-600 font-medium mt-1">
                    {stats.newApplications} new
                  </p>
                )}
              </div>
            </div>
          </Link>
        </Card>

        <Card className="p-4 sm:p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="p-2 sm:p-3 bg-purple-100 rounded-full flex-shrink-0">
              <Bookmark className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-600">Saved Candidates</p>
              <p className="text-xl sm:text-2xl font-bold">{stats.savedCandidates}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="p-2 sm:p-3 bg-orange-100 rounded-full flex-shrink-0">
              <Eye className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-600">Total Views</p>
              <p className="text-xl sm:text-2xl font-bold">{stats.totalViews}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Job Listings Table */}
      <Card className="overflow-hidden">
        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <h2 className="text-xl font-semibold">Active Job Listings</h2>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Button variant="outline" asChild className="w-full sm:w-auto">
                <Link href="/dashboard/employer/jobs" className="flex items-center justify-center">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  View All Jobs
                </Link>
              </Button>
              <Button asChild={canPostJob} variant={canPostJob ? "default" : "outline"} className="w-full sm:w-auto">
                {canPostJob ? (
                  <Link href="/dashboard/employer/jobs/post" className="flex items-center justify-center">
                    <Plus className="h-4 w-4 mr-2" />
                    Post New Job
                  </Link>
                ) : (
                  <Link href="/dashboard/subscription" className="flex items-center justify-center">
                    <Plus className="h-4 w-4 mr-2" />
                    Upgrade to Post Jobs
                  </Link>
                )}
              </Button>
            </div>
          </div>

          {jobs.length > 0 ? (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block rounded-md border table-container">
                <Table className="mobile-table">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px]">Job Title</TableHead>
                      <TableHead className="min-w-[120px]">Location</TableHead>
                      <TableHead className="min-w-[80px] text-center">Views</TableHead>
                      <TableHead className="min-w-[100px] text-center">Applicants</TableHead>
                      <TableHead className="min-w-[100px]">Status</TableHead>
                      <TableHead className="min-w-[120px] text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell className="max-w-[200px]">
                          <div className="space-y-1">
                            <div className="font-medium truncate">{job.title}</div>
                            <div className="text-sm text-gray-500 truncate">{job.professionalRole}</div>
                            <div className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {stripHtmlAndTruncate(job.description, 60)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[120px]">
                          <span className="truncate block">{job.location}</span>
                        </TableCell>
                        <TableCell className="text-center">{job.views}</TableCell>
                        <TableCell className="text-center">{job.applicants}</TableCell>
                        <TableCell className="max-w-[100px]">
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
                          <div className="flex items-center justify-center gap-2">
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

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {jobs.map((job) => (
                  <Card key={job.id} className="p-4">
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-medium text-gray-900 truncate">{job.title}</h3>
                        <p className="text-sm text-gray-500 truncate">{job.professionalRole}</p>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {stripHtmlAndTruncate(job.description, 60)}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-4">
                                                     <span className="text-gray-600">
                             <MapPin className="h-4 w-4 inline mr-1" />
                             {job.location}
                           </span>
                          <span className="text-gray-600">
                            <Eye className="h-4 w-4 inline mr-1" />
                            {job.views} views
                          </span>
                          <span className="text-gray-600">
                            <Users className="h-4 w-4 inline mr-1" />
                            {job.applicants} applicants
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
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
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No active job listings</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by posting your first job listing.
              </p>
              <div className="mt-6">
                <Button asChild className="w-full sm:w-auto">
                  <Link href="/dashboard/employer/jobs/post" className="flex items-center justify-center">
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
    </EmployerOnly>
  );
} 