/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ExternalLink, RefreshCw, Sparkles, MapPin, Building, DollarSign } from 'lucide-react';
import { BookmarkIcon } from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';

interface JobMatch {
  jobId: string;
  score: number;
  reasoning: string;
  matchFactors: {
    roleMatch: number;
    locationMatch: number;
    skillsMatch: number;
    experienceMatch: number;
    salaryMatch: number;
    preferenceMatch: number;
  };
  job: {
    id: string;
    title: string;
    description: string;
    location: string;
    salary: any;
    urlSlug: string;
    employmentType?: string;
    jobType?: string;
    employer: {
      firstName?: string;
      lastName?: string;
      role?: string;
      employerProfile?: {
        companyName: string;
      };
    };
  };
  link: string;
}

interface AIJobMatchesResponse {
  matches: JobMatch[];
  totalMatches: number;
  cached?: boolean;
  hasCache?: boolean;
  isRecent?: boolean;
  lastUpdated?: string;
}

export default function AIJobMatches() {
  const [matches, setMatches] = useState<JobMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsGeneration, setNeedsGeneration] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | undefined>();
  const [savedJobs, setSavedJobs] = useState<{ [key: string]: boolean }>({});
  const [savingJobs, setSavingJobs] = useState<{ [key: string]: boolean }>({});

  const fetchSavedStatus = useCallback(async (jobs: JobMatch[]) => {
    try {
      const savedStatus: { [key: string]: boolean } = {};
      
      // Fetch saved status for all jobs
      await Promise.all(
        jobs.map(async (match) => {
          try {
            const response = await fetch(`/api/jobs/${match.job.urlSlug}/bookmark`);
            if (response.ok) {
              const { bookmarked } = await response.json();
              savedStatus[match.job.urlSlug] = bookmarked;
            } else {
              savedStatus[match.job.urlSlug] = false;
            }
          } catch (error) {
            console.error(`Error fetching save status for job ${match.job.urlSlug}:`, error);
            savedStatus[match.job.urlSlug] = false;
          }
        })
      );
      
      setSavedJobs(savedStatus);
    } catch (error) {
      console.error('Error fetching saved job statuses:', error);
    }
  }, []);

  const fetchMatches = useCallback(async (forceRefresh = false) => {
    try {
      setError(null);
      
      let url = '/api/ai/job-matches/cached';
      let data: AIJobMatchesResponse;
      
      if (forceRefresh) {
        // Generate new matches using AI
        const response = await fetch('/api/ai/job-matches', { method: 'POST' });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to refresh job matches');
        }
        // After refresh, fetch the cached results
        const cachedResponse = await fetch('/api/ai/job-matches/cached');
        data = await cachedResponse.json();
      } else {
        // Try to get cached matches first
        const response = await fetch(url);
        data = await response.json();
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch job matches');
        }
        
        // If no cache exists, show empty state with option to generate
        if (!data.hasCache) {
          setMatches([]);
          setNeedsGeneration(true);
          return;
        }
      }
      
      setMatches(data.matches);
      setNeedsGeneration(!data.isRecent);
      setLastUpdated(data.lastUpdated);
      
      // Fetch saved status for all matched jobs
      if (data.matches.length > 0) {
        fetchSavedStatus(data.matches);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [fetchSavedStatus]);

  const refreshMatches = async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      
      await fetchMatches(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsRefreshing(false);
    }
  };

  const generateMatches = async () => {
    setIsLoading(true);
    await fetchMatches(true);
  };

  useEffect(() => {
    fetchMatches(false);
  }, [fetchMatches]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 border-green-200';
    if (score >= 60) return 'bg-yellow-100 border-yellow-200';
    return 'bg-red-100 border-red-200';
  };

  const handleSaveJob = async (jobSlug: string) => {
    setSavingJobs(prev => ({ ...prev, [jobSlug]: true }));
    
    try {
      const response = await fetch(`/api/jobs/${jobSlug}/bookmark`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to save job');

      const { bookmarked } = await response.json();
      setSavedJobs(prev => ({ ...prev, [jobSlug]: bookmarked }));
    } catch (error) {
      console.error('Error saving job:', error);
    } finally {
      setSavingJobs(prev => ({ ...prev, [jobSlug]: false }));
    }
  };

  const formatFactorName = (factor: string) => {
    return factor.replace('Match', '').replace(/([A-Z])/g, ' $1').trim();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI Job Matches
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Finding your perfect job matches...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                AI-Powered Job Matches
              </CardTitle>
              <CardDescription>
                Jobs specifically selected for you based on your profile, skills, and preferences
                {lastUpdated && (
                  <span className="block text-xs text-gray-400 mt-1">
                    Last updated: {new Date(lastUpdated).toLocaleString()}
                  </span>
                )}
              </CardDescription>
            </div>
            <Button 
              onClick={refreshMatches} 
              disabled={isRefreshing}
              variant={needsGeneration ? "default" : "outline"}
              size="sm"
              className={needsGeneration ? "bg-blue-600 hover:bg-blue-700" : ""}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Generating...' : needsGeneration ? 'Generate Fresh Matches' : 'Refresh Matches'}
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <p className="text-red-600">{error}</p>
              <Button 
                onClick={() => fetchMatches(false)} 
                variant="outline" 
                size="sm" 
                className="mt-2"
              >
                Try Again
              </Button>
            </div>
          )}
          
          {matches.length === 0 && !error && (
            <div className="text-center py-8">
              <Sparkles className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              {needsGeneration ? (
                <div>
                  <p className="text-gray-500 mb-4">
                    Generate personalized job matches using AI
                  </p>
                  <Button 
                    onClick={generateMatches}
                    disabled={isLoading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    {isLoading ? 'Generating Matches...' : 'Generate AI Job Matches'}
                  </Button>
                </div>
              ) : (
                <p className="text-gray-500">
                  No job matches found. Complete your profile to get better matches!
                </p>
              )}
            </div>
          )}
          
          <div className="space-y-6">
            {matches.map((match) => (
              <div key={match.jobId} className="border rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{match.job.title}</h3>
                      <Badge 
                        className={`${getScoreBgColor(match.score)} ${getScoreColor(match.score)}`}
                      >
                        {match.score}% Match
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1">
                        <Building className="h-4 w-4" />
                        {match.job.employer.role === 'EMPLOYER' ? 'Individual Employer' :
                         match.job.employer.employerProfile?.companyName || 
                         `${match.job.employer.firstName} ${match.job.employer.lastName}`}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {match.job.location}
                      </div>
                      {/* Salary display removed - now using compensation field */}
                    </div>
                    
                    <p className="text-gray-700 mb-4">{match.reasoning}</p>
                    
                    {/* Match Factors */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                      {Object.entries(match.matchFactors).map(([factor, score]) => (
                        <div key={factor} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="capitalize">
                              {formatFactorName(factor)}
                            </span>
                            <span>{score}%</span>
                          </div>
                          <Progress value={score} className="h-2" />
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex gap-3">
                      <Button asChild>
                        <Link href={match.link}>
                          View Job Details
                          <ExternalLink className="h-4 w-4 ml-2" />
                        </Link>
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => handleSaveJob(match.job.urlSlug)}
                        disabled={savingJobs[match.job.urlSlug]}
                        className="flex items-center gap-2"
                      >
                        {savedJobs[match.job.urlSlug] ? (
                          <BookmarkSolidIcon className="h-4 w-4 text-blue-600" />
                        ) : (
                          <BookmarkIcon className="h-4 w-4" />
                        )}
                        {savingJobs[match.job.urlSlug] 
                          ? 'Saving...' 
                          : savedJobs[match.job.urlSlug] 
                          ? 'Saved' 
                          : 'Save Job'
                        }
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 