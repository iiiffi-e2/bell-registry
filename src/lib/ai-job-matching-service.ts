import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';
import { JobStatus } from '@prisma/client';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30000,
  maxRetries: 3,
});

interface JobMatchResult {
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
}

interface ProfileData {
  bio?: string | null;
  skills: string[];
  preferredRole?: string | null;
  location?: string | null;
  workLocations: string[];
  yearsOfExperience?: number | null;
  payRangeMin?: number | null;
  payRangeMax?: number | null;
  payType?: string | null;
  seekingOpportunities: string[];
  openToRelocation: boolean;
}

interface JobData {
  id: string;
  title: string;
  description: string;
  location: string;
  salary: any;
  requirements: string[];
  employmentType?: string | null;
  jobType?: string | null;
  professionalRole: string;
  employer: {
    employerProfile?: {
      companyName: string;
    } | null;
  };
}

export class AIJobMatchingService {
  async findMatchingJobs(userId: string): Promise<JobMatchResult[]> {
    // Get user profile
    const profile = await prisma.candidateProfile.findUnique({
      where: { userId },
      select: {
        bio: true,
        skills: true,
        preferredRole: true,
        location: true,
        workLocations: true,
        yearsOfExperience: true,
        payRangeMin: true,
        payRangeMax: true,
        payType: true,
        seekingOpportunities: true,
        openToRelocation: true,
      }
    });

    if (!profile) {
      throw new Error('Profile not found');
    }

    // Get active jobs (broader search)
    const jobs = await prisma.job.findMany({
      where: {
        status: JobStatus.ACTIVE,
        OR: [
          { expiresAt: { gte: new Date() } },
          { expiresAt: null }
        ]
      },
      include: {
        employer: {
          select: {
            employerProfile: {
              select: {
                companyName: true,
              }
            }
          }
        }
      },
      take: 20, // Reduced for token limit optimization
      orderBy: { createdAt: 'desc' }
    });

    if (jobs.length === 0) {
      return [];
    }

    // Use AI to analyze and score matches
    const matches = await this.analyzeJobMatches(profile, jobs);
    
    // Return top 5 matches
    return matches
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }

  private async analyzeJobMatches(
    profile: ProfileData, 
    jobs: JobData[]
  ): Promise<JobMatchResult[]> {
    // Optimize profile data for token usage
    const truncatedBio = profile.bio ? profile.bio.substring(0, 200) : 'Not provided';
    const topSkills = profile.skills.slice(0, 8).join(', ') || 'Not specified';
    const topOpportunities = profile.seekingOpportunities.slice(0, 3).join(', ') || 'Not specified';
    
    const prompt = `Analyze job-candidate fit. Return JSON only.

CANDIDATE:
Bio: ${truncatedBio}
Skills: ${topSkills}
Role: ${profile.preferredRole || 'Any'}
Location: ${profile.location || 'Any'}
Experience: ${profile.yearsOfExperience || 'Any'} years
Salary: ${profile.payRangeMin && profile.payRangeMax 
      ? `$${profile.payRangeMin}k-$${profile.payRangeMax}k` 
      : 'Flexible'}
Seeking: ${topOpportunities}
Relocate: ${profile.openToRelocation ? 'Yes' : 'No'}

JOBS:
${jobs.map((job, i) => `${i + 1}. ID:${job.id} | ${job.title} | ${job.employer.employerProfile?.companyName || 'Company'} | ${job.location} | ${job.description.substring(0, 150)} | Req: ${job.requirements.slice(0, 3).join(', ')}`).join('\n')}

Return JSON array:
[{"jobId":"id","score":0-100,"reasoning":"brief explanation","matchFactors":{"roleMatch":0-100,"locationMatch":0-100,"skillsMatch":0-100,"experienceMatch":0-100,"salaryMatch":0-100,"preferenceMatch":0-100}}]`;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert career matching AI that provides accurate, honest assessments of job-candidate fit. Always return valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 3000,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      // Parse the JSON response
      const matches = JSON.parse(response) as JobMatchResult[];
      
      // Validate and sanitize the response
      return matches.filter(match => 
        match.jobId && 
        typeof match.score === 'number' && 
        match.score >= 0 && 
        match.score <= 100 &&
        match.reasoning &&
        match.matchFactors
      );

    } catch (error) {
      console.error('Error in AI job matching:', error);
      throw new Error('Failed to analyze job matches');
    }
  }

  async saveJobMatches(userId: string, matches: JobMatchResult[]): Promise<void> {
    // Delete existing matches for this user (to refresh)
    await prisma.jobMatch.deleteMany({
      where: { userId }
    });

    // Save new matches
    const data = matches.map(match => ({
      userId,
      jobId: match.jobId,
      score: match.score,
      reasoning: match.reasoning,
      matchFactors: match.matchFactors,
    }));

    if (data.length > 0) {
      await prisma.jobMatch.createMany({
        data,
        skipDuplicates: true,
      });
    }
  }
}

export const aiJobMatchingService = new AIJobMatchingService(); 