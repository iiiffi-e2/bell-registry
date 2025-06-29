import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';
import { JobStatus } from '@bell-registry/shared';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 25000, // Increased slightly for GPT-4
  maxRetries: 2,
});

// Role hierarchy validation service
class RoleHierarchyValidator {
  private roleHierarchies = {
    'estate_management': {
      senior: ['estate manager', 'house manager', 'property manager', 'estate director'],
      mid: ['assistant estate manager', 'assistant house manager', 'estate coordinator'],
      junior: ['estate assistant', 'house assistant']
    },
    'housekeeping': {
      senior: ['head housekeeper', 'housekeeping manager', 'housekeeping supervisor'],
      mid: ['housekeeper', 'housekeeping coordinator'],
      junior: ['housekeeping assistant', 'cleaner', 'maid']
    },
    'culinary': {
      senior: ['executive chef', 'head chef', 'private chef'],
      mid: ['sous chef', 'cook'],
      junior: ['kitchen assistant', 'prep cook']
    },
    'childcare': {
      senior: ['nanny manager', 'head nanny', 'governess'],
      mid: ['nanny', 'babysitter'],
      junior: ['nanny assistant', 'mother\'s helper']
    },
    'security': {
      senior: ['security manager', 'head of security', 'security director'],
      mid: ['security officer', 'bodyguard'],
      junior: ['security assistant', 'gate attendant']
    },
    'grounds': {
      senior: ['grounds manager', 'head groundskeeper', 'landscape manager'],
      mid: ['groundskeeper', 'gardener'],
      junior: ['grounds assistant', 'landscaping helper']
    },
    'administrative': {
      senior: ['personal assistant', 'executive assistant', 'chief of staff'],
      mid: ['assistant', 'coordinator'],
      junior: ['administrative assistant', 'receptionist']
    }
  };

  getRoleCategory(title: string): { category: string; level: string } | null {
    const normalizedTitle = title.toLowerCase();
    
    for (const [category, levels] of Object.entries(this.roleHierarchies)) {
      for (const [level, roles] of Object.entries(levels)) {
        if (roles.some(role => normalizedTitle.includes(role))) {
          return { category, level };
        }
      }
    }
    return null;
  }

  isAppropriateMatch(candidateRole: string, jobRole: string): boolean {
    const candidateInfo = this.getRoleCategory(candidateRole);
    const jobInfo = this.getRoleCategory(jobRole);
    
    if (!candidateInfo || !jobInfo) {
      return true; // Allow if we can't categorize - be permissive
    }

    // Block only obvious inappropriate downgrades
    // Estate/House Managers should not be matched with operational staff roles
    if (candidateInfo.category === 'estate_management' && candidateInfo.level === 'senior') {
      if (jobInfo.category === 'housekeeping' || 
          (jobInfo.category === 'grounds' && jobInfo.level === 'junior') ||
          (jobInfo.category === 'culinary' && jobInfo.level === 'junior')) {
        return false; // Block clear downgrades
      }
    }

    // Otherwise be permissive - let AI do the detailed scoring
    return true;
  }
}

const roleValidator = new RoleHierarchyValidator();

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

    // Get active jobs with pre-filtering for relevance
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
      take: 15, // Increased to find more potential matches
      orderBy: { createdAt: 'desc' }
    });

    if (jobs.length === 0) {
      return [];
    }

    // Pre-filter jobs based on role appropriateness (now more lenient)
    const appropriateJobs = jobs.filter(job => {
      if (!profile.preferredRole) return true;
      const isAppropriate = roleValidator.isAppropriateMatch(profile.preferredRole, job.title);
      if (!isAppropriate) {
        console.log(`Filtered inappropriate match: ${profile.preferredRole} -> ${job.title}`);
      }
      return isAppropriate;
    });

    console.log(`Jobs found: ${jobs.length}, After filtering: ${appropriateJobs.length}`);

    if (appropriateJobs.length === 0) {
      console.log('No appropriate jobs found after role hierarchy filtering');
      console.log('Available job titles:', jobs.map(j => j.title));
      return [];
    }

    // Use AI to analyze and score matches
    const matches = await this.analyzeJobMatches(profile, appropriateJobs);
    
    // Return top 5 matches
    return matches
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }

  private async analyzeJobMatches(
    profile: ProfileData, 
    jobs: JobData[]
  ): Promise<JobMatchResult[]> {
    // Optimize for speed while maintaining context
    const truncatedBio = profile.bio ? profile.bio.substring(0, 120) : 'Not provided';
    const topSkills = profile.skills.slice(0, 5).join(', ') || 'Not specified';
    const topOpportunities = profile.seekingOpportunities.slice(0, 2).join(', ') || 'Not specified';
    
    // Enhanced prompt for better reasoning while maintaining speed
    const prompt = `Expert career matcher: Analyze each job thoroughly for the candidate. Provide detailed reasoning for compatibility.

CANDIDATE PROFILE:
Role: ${profile.preferredRole || 'Any role'} | Experience: ${profile.yearsOfExperience || 0} years | Location: ${profile.location || 'Any location'}
Skills: ${topSkills} | Seeking: ${topOpportunities} 
Salary Range: ${profile.payRangeMin && profile.payRangeMax ? `$${Math.round(profile.payRangeMin/1000)}k-${Math.round(profile.payRangeMax/1000)}k` : 'Flexible'}
${truncatedBio ? `Bio: ${truncatedBio}` : ''}

JOBS TO ANALYZE:
${jobs.map((job, i) => {
  const salary = job.salary?.min && job.salary?.max ? 
    `$${Math.round(job.salary.min/1000)}k-${Math.round(job.salary.max/1000)}k` : 'Not specified';
  return `${i + 1}. ID: ${job.id}
   Title: ${job.title}
   Location: ${job.location}
   Salary: ${salary}
   Description: ${job.description.substring(0, 100)}
   Requirements: ${job.requirements.slice(0, 3).join(', ')}`;
}).join('\n\n')}

For each job, provide detailed reasoning explaining:
- Role compatibility and career progression fit
- Location match and relocation considerations  
- Skills alignment with requirements
- Experience level appropriateness
- Salary range compatibility
- Overall fit with candidate's stated preferences

Score each factor (0-100): roleMatch, locationMatch, skillsMatch, experienceMatch, salaryMatch, preferenceMatch

JSON format:
[{"jobId":"id","score":75,"reasoning":"Detailed explanation of why this is a good match, covering role fit, location advantages, skills alignment, experience match, salary compatibility, and how it meets the candidate's seeking opportunities. Be specific about strengths and any potential concerns.","matchFactors":{"roleMatch":80,"locationMatch":70,"skillsMatch":75,"experienceMatch":80,"salaryMatch":65,"preferenceMatch":85}}]`;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an expert career matching specialist. Provide thoughtful, detailed reasoning for each job match while maintaining accurate scoring. Always return valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 2000, // Increased for detailed reasoning
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      // Parse the JSON response
      const matches = JSON.parse(response) as JobMatchResult[];
      
      // Basic validation (role hierarchy already handled by pre-filtering)
      const validatedMatches = matches.filter(match => {
        return match.jobId && 
               typeof match.score === 'number' && 
               match.score >= 0 && 
               match.score <= 100 &&
               match.reasoning &&
               match.matchFactors;
      });
      
      return validatedMatches;

    } catch (error) {
      console.error('Error in AI job matching:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          throw new Error('AI request timed out. Please try again with fewer jobs or check your connection.');
        }
        if (error.message.includes('rate limit')) {
          throw new Error('Too many requests. Please wait a moment and try again.');
        }
        if (error.message.includes('tokens')) {
          throw new Error('Request too large. This will be optimized in the next update.');
        }
      }
      
      throw new Error('AI analysis failed. Please try again later.');
    }
  }

  async saveJobMatches(userId: string, matches: JobMatchResult[]): Promise<void> {
    try {
      // Delete existing matches for this user (to refresh)
      await prisma.$executeRaw`DELETE FROM "JobMatch" WHERE "userId" = ${userId}`;

      // Save new matches
      if (matches.length > 0) {
        // Use individual insert statements to ensure proper type handling
        for (const match of matches) {
          const id = `jm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          await prisma.$executeRaw`
            INSERT INTO "JobMatch" ("id", "userId", "jobId", "score", "reasoning", "matchFactors", "createdAt", "updatedAt")
            VALUES (${id}, ${userId}, ${match.jobId}, ${match.score}::double precision, ${match.reasoning}, ${JSON.stringify(match.matchFactors)}::jsonb, NOW(), NOW())
          `;
        }
      }
    } catch (error) {
      console.error('Error saving job matches:', error);
      throw new Error('Failed to save job matches');
    }
  }
}

export const aiJobMatchingService = new AIJobMatchingService(); 