/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';
import { JobStatus, Prisma } from '@bell-registry/shared';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30000,
  maxRetries: 2,
});

export interface ParsedJobSearch {
  // Core Requirements
  role: {
    primary: string;
    alternatives: string[];
    confidence: number;
  };
  
  // Location & Travel
  location: {
    primary: string[];
    flexibility: "none" | "regional" | "national" | "international";
    travelRequirements: string[];
  };
  
  // Work Arrangements
  workStyle: {
    living: "live-in" | "live-out" | "flexible";
    schedule: string[];
    overtime: "none" | "occasional" | "regular";
  };
  
  // Family/Client Preferences
  clientProfile: {
    familySize: string;
    children: "none" | "young" | "teenagers" | "mixed";
    lifestyle: string[];
    specialNeeds: string[];
  };
  
  // Skills & Experience
  qualifications: {
    experience: number;
    specialties: string[];
    languages: string[];
    certifications: string[];
  };
  
  // Compensation Expectations
  compensation: {
    range?: [number, number];
    benefits: string[];
    flexibility: boolean;
  };
  
  // Soft Requirements
  preferences: {
    privacy: "standard" | "high" | "celebrity-level";
    growth: string[];
    culture: string[];
  };
  
  // Parsed Intent Confidence
  confidence: number;
  ambiguities: string[];
}

export interface AISearchSummary {
  searchIntent: string;
  requirements: {
    mustHave: string[];
    preferred: string[];
    dealBreakers: string[];
  };
  clarificationQuestions: string[];
  suggestedRefinements: string[];
}

export interface JobMatchScore {
  overallScore: number;
  breakdown: {
    roleMatch: number;
    locationMatch: number;
    requirementsMatch: number;
    preferencesMatch: number;
    compensationMatch: number;
    cultureMatch: number;
  };
  matchHighlights: string[];
  potentialConcerns: string[];
  missingInfo: string[];
}

export interface AIJobMatch {
  jobId: string;
  job: any;
  score: JobMatchScore;
  reasoning: string;
  link: string;
}

export interface ConversationRefinement {
  userFeedback: string;
  aiResponse: string;
  updatedSearch: ParsedJobSearch;
  newResults: AIJobMatch[];
}

export class AISearchService {
  
  /**
   * Transcribe audio to text using OpenAI Whisper
   */
  async transcribeAudio(audioFile: File): Promise<string> {
    try {
      const transcription = await openai.audio.transcriptions.create({
        file: audioFile,
        model: "whisper-1",
        language: "en",
      });
      
      return transcription.text;
    } catch (error) {
      console.error('Error transcribing audio:', error);
      throw new Error('Failed to transcribe audio. Please try typing your search instead.');
    }
  }

  /**
   * Simple fallback search parsing when AI is not available
   */
  private createFallbackParsedSearch(query: string): { parsedSearch: ParsedJobSearch; summary: AISearchSummary } {
    const lowerQuery = query.toLowerCase();
    
    // Simple keyword extraction with exact phrase priority
    let primaryRole = "General Position";
    let alternatives: string[] = [];
    
    if (lowerQuery.includes("estate manager") || lowerQuery.includes("estate management")) {
      primaryRole = "Estate Manager";
      alternatives = ["Property Manager", "Estate Management"];
    } else if (lowerQuery.includes("house manager") || lowerQuery.includes("house management")) {
      primaryRole = "House Manager";
      alternatives = ["Estate Manager", "Household Manager"];
    } else if (lowerQuery.includes("private chef") || lowerQuery.includes("executive chef")) {
      primaryRole = "Private Chef";
      alternatives = ["Executive Chef", "Personal Chef"];
    } else if (lowerQuery.includes("chef")) {
      primaryRole = "Chef";
      alternatives = ["Private Chef", "Executive Chef"];
    } else if (lowerQuery.includes("executive housekeeper")) {
      primaryRole = "Executive Housekeeper";
      alternatives = ["Housekeeper", "Housekeeping Manager"];
    } else if (lowerQuery.includes("housekeeper") || lowerQuery.includes("housekeeping")) {
      primaryRole = "Housekeeper";
      alternatives = ["Executive Housekeeper"];
    } else if (lowerQuery.includes("nanny") || lowerQuery.includes("childcare")) {
      primaryRole = "Nanny";
      alternatives = ["Governess", "Family Assistant"];
    } else if (lowerQuery.includes("personal assistant") || lowerQuery.includes("executive assistant")) {
      primaryRole = "Personal Assistant";
      alternatives = ["Executive Assistant", "Family Assistant"];
    } else if (lowerQuery.includes("butler")) {
      primaryRole = "Butler";
      alternatives = ["House Manager"];
    }

    // Location extraction
    const locations = [];
    if (lowerQuery.includes("united states") || lowerQuery.includes("usa") || lowerQuery.includes("anywhere")) {
      locations.push("United States");
    } else if (lowerQuery.includes("new york") || lowerQuery.includes("manhattan")) {
      locations.push("New York");
    } else if (lowerQuery.includes("california") || lowerQuery.includes("los angeles")) {
      locations.push("California");
    }

    const parsedSearch: ParsedJobSearch = {
      role: {
        primary: primaryRole,
        alternatives: alternatives,
        confidence: 70
      },
      location: {
        primary: locations,
        flexibility: locations.includes("United States") ? "national" : "none",
        travelRequirements: []
      },
      workStyle: {
        living: "flexible",
        schedule: [],
        overtime: "none"
      },
      clientProfile: {
        familySize: "",
        children: "none",
        lifestyle: [],
        specialNeeds: []
      },
      qualifications: {
        experience: 0,
        specialties: [],
        languages: ["English"],
        certifications: []
      },
      compensation: {
        benefits: [],
        flexibility: true
      },
      preferences: {
        privacy: "standard",
        growth: [],
        culture: []
      },
      confidence: 70,
      ambiguities: ["Using fallback parsing - AI parsing not available"]
    };

    const summary: AISearchSummary = {
      searchIntent: `Looking for ${primaryRole} position`,
      requirements: {
        mustHave: [primaryRole],
        preferred: [],
        dealBreakers: []
      },
      clarificationQuestions: [],
      suggestedRefinements: []
    };

    return { parsedSearch, summary };
  }

  /**
   * Parse natural language job search query
   */
  async parseJobSearchQuery(query: string): Promise<{ parsedSearch: ParsedJobSearch; summary: AISearchSummary }> {
    const prompt = `You are an expert job search assistant for the luxury private service industry. Parse this natural language job search query into structured requirements.

LUXURY SERVICE ROLES CONTEXT:
- Estate Management: Estate Manager, House Manager, Property Manager
- Culinary: Private Chef, Executive Chef, Personal Chef, Cook  
- Housekeeping: Executive Housekeeper, Housekeeper, Houseman
- Childcare: Nanny, Governess, Family Assistant
- Personal Care: Personal Assistant, Executive Assistant, Butler
- Security: Executive Protection, Security Manager
- Grounds: Head Gardener, Groundskeeper, Landscape Manager

USER QUERY: "${query}"

Extract and structure all mentioned requirements, preferences, and constraints. Be intelligent about industry terminology.

For compensation, convert mentions like "good salary", "competitive pay" to appropriate ranges:
- Entry level: $40k-60k
- Mid level: $60k-100k  
- Senior level: $100k-150k+

Return JSON in this exact format:
{
  "parsedSearch": {
    "role": {
      "primary": "Executive Housekeeper",
      "alternatives": ["House Manager"],
      "confidence": 95
    },
    "location": {
      "primary": ["Manhattan"],
      "flexibility": "none",
      "travelRequirements": []
    },
    "workStyle": {
      "living": "live-out",
      "schedule": ["5-day week"],
      "overtime": "occasional"
    },
    "clientProfile": {
      "familySize": "couple",
      "children": "none",
      "lifestyle": ["professionals"],
      "specialNeeds": []
    },
    "qualifications": {
      "experience": 5,
      "specialties": ["luxury linens"],
      "languages": ["English"],
      "certifications": []
    },
    "compensation": {
      "range": [80000, 120000],
      "benefits": ["health insurance"],
      "flexibility": true
    },
    "preferences": {
      "privacy": "high",
      "growth": [],
      "culture": ["professional"]
    },
    "confidence": 85,
    "ambiguities": ["Salary expectations unclear"]
  },
  "summary": {
    "searchIntent": "Executive housekeeper position in Manhattan",
    "requirements": {
      "mustHave": ["Executive housekeeper role", "Manhattan location"],
      "preferred": ["5-day schedule", "Luxury experience"],
      "dealBreakers": ["Live-in requirement"]
    },
    "clarificationQuestions": [
      "What's your preferred salary range?",
      "Are you open to occasional travel?"
    ],
    "suggestedRefinements": [
      "luxury housekeeping Manhattan",
      "executive housekeeper Upper East Side"
    ]
  }
}`;

    try {
      console.log('🔑 Checking OpenAI API key...', process.env.OPENAI_API_KEY ? 'Present' : 'Missing');
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert job search assistant. Always return valid JSON exactly as specified."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 1500,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) throw new Error('No response from AI');

      const cleanedResponse = response.replace(/```json\n?|\n?```/g, '').trim();
      const result = JSON.parse(cleanedResponse);
      console.log('🧠 AI Parsed Result:', JSON.stringify(result, null, 2));
      return result;
    } catch (error: any) {
      console.error('Error parsing search with AI, falling back to simple parsing:', error);
      console.log('🔄 Using fallback search parsing...');
      
      // Use fallback parsing instead of failing completely
      return this.createFallbackParsedSearch(query);
    }
  }

  /**
   * Find jobs matching the parsed search criteria
   */
  async findMatchingJobs(parsedSearch: ParsedJobSearch): Promise<AIJobMatch[]> {
    try {
      console.log('🔍 AI Search - Parsed Search:', JSON.stringify(parsedSearch, null, 2));

      // Start with basic active job filter
      let whereConditions: Prisma.JobWhereInput = {
        status: JobStatus.ACTIVE,
        OR: [
          { expiresAt: { gte: new Date() } },
          { expiresAt: null }
        ]
      };

      // Build flexible search conditions
      const searchConditions: Prisma.JobWhereInput[] = [];

      // Role matching - be more flexible
      if (parsedSearch.role.primary) {
        const roleTerms = [parsedSearch.role.primary, ...parsedSearch.role.alternatives];
        console.log('🎯 Searching for role terms:', roleTerms);
        
        const roleConditions: Prisma.JobWhereInput[] = [];
        
                         roleTerms.forEach(term => {
          const termLower = term.toLowerCase();
          
          // Prioritize exact phrase matching - this should be the primary filter
          roleConditions.push(
            { title: { contains: term, mode: Prisma.QueryMode.insensitive } },
            { professionalRole: { contains: term, mode: Prisma.QueryMode.insensitive } }
          );
          
          // For compound terms, be VERY selective about individual word matching
          if (termLower.includes(' ')) {
            const words = termLower.split(' ');
            words.forEach(word => {
              // Only use highly specific, unique words that clearly identify the role
              if (['estate', 'butler', 'sommelier', 'chef', 'governess', 'nanny'].includes(word)) {
                roleConditions.push(
                  { title: { contains: word, mode: Prisma.QueryMode.insensitive } },
                  { professionalRole: { contains: word, mode: Prisma.QueryMode.insensitive } }
                );
              }
            });
          }
        });

        if (roleConditions.length > 0) {
          searchConditions.push({ OR: roleConditions });
        }
      }

      // Location matching - be flexible with "United States" etc.
      if (parsedSearch.location.primary.length > 0 && parsedSearch.location.flexibility !== "national") {
        const locationConditions: Prisma.JobWhereInput[] = [];
        
        parsedSearch.location.primary.forEach(loc => {
          // Handle broad location terms
          if (loc.toLowerCase().includes('united states') || loc.toLowerCase().includes('usa')) {
            // Don't add location filter for US-wide searches
            return;
          }
          
          const locationWords = loc.toLowerCase().split(' ');
          locationWords.forEach(word => {
            if (word.length > 2) {
              locationConditions.push({
                location: { contains: word, mode: Prisma.QueryMode.insensitive }
              });
            }
          });
        });

        if (locationConditions.length > 0) {
          searchConditions.push({ OR: locationConditions });
        }
      }

      // Apply search conditions if we have any, otherwise get all jobs for AI filtering
      if (searchConditions.length > 0) {
        whereConditions = {
          ...whereConditions,
          AND: [
            {
              OR: searchConditions.flat()
            }
          ]
        };
        console.log('🎯 Using targeted database search with conditions');
      } else {
        console.log('🔧 No specific search conditions, getting all active jobs for AI filtering');
      }

      console.log('📊 Database Query:', JSON.stringify(whereConditions, null, 2));

      // Get matching jobs
      const jobs = await prisma.job.findMany({
        where: whereConditions,
        include: {
          employer: {
            select: {
              firstName: true,
              lastName: true,
              employerProfile: {
                select: {
                  companyName: true,
                }
              }
            }
          }
        },
        take: 50, // Increased to get more potential matches
        orderBy: { createdAt: 'desc' }
      });

      console.log(`🎯 Found ${jobs.length} jobs from database`);
      
      if (jobs.length === 0) {
        console.log('❌ No jobs found in database - this suggests a database issue');
        return [];
      }

      // Score matches with AI
      console.log('🤖 Scoring job matches with AI...');
      const scoredMatches = await this.scoreJobMatches(parsedSearch, jobs);
      
      // Apply additional filtering for role relevance
      const filteredMatches = scoredMatches.filter(match => {
        // For specific role searches, be very strict
        if (parsedSearch.role.primary !== "General Position") {
          const roleTerms = [parsedSearch.role.primary, ...parsedSearch.role.alternatives];
          const jobTitle = match.job.title.toLowerCase();
          const jobRole = (match.job.professionalRole || '').toLowerCase();
          
          // Check if the job actually relates to the searched role
          const hasRoleRelevance = roleTerms.some(term => {
            const termLower = term.toLowerCase();
            
            // Exact matches are always good
            if (jobTitle.includes(termLower) || jobRole.includes(termLower)) {
              return true;
            }
            
            // For estate manager, only allow estate/property/house management roles
            if (termLower.includes('estate manager')) {
              return (jobTitle.includes('estate') || jobRole.includes('estate') ||
                      jobTitle.includes('property') || jobRole.includes('property') ||
                      (jobTitle.includes('house') && (jobTitle.includes('manager') || jobRole.includes('manager'))));
            }
            
            // For other roles, check for specific keywords
            if (termLower.includes('chef')) {
              return jobTitle.includes('chef') || jobRole.includes('chef');
            }
            if (termLower.includes('housekeeper')) {
              return jobTitle.includes('housekeeper') || jobRole.includes('housekeeper') || 
                     jobTitle.includes('housekeeping') || jobRole.includes('housekeeping');
            }
            
            return false;
          });
          
          return hasRoleRelevance && match.score.overallScore >= 60;
        }
        
        return match.score.overallScore >= 60;
      });
      
      console.log(`🎯 Filtered from ${scoredMatches.length} to ${filteredMatches.length} relevant matches`);
      
      return filteredMatches
        .sort((a, b) => b.score.overallScore - a.score.overallScore)
        .slice(0, 10);

    } catch (error) {
      console.error('Error finding matching jobs:', error);
      throw new Error('Failed to find matching jobs');
    }
  }

  /**
   * Score job matches against parsed search criteria
   */
  private async scoreJobMatches(parsedSearch: ParsedJobSearch, jobs: any[]): Promise<AIJobMatch[]> {
    const prompt = `You are a strict job matching specialist. Score these jobs against the search criteria with HIGH PRECISION. Only jobs that closely match the requested role should receive high scores.

IMPORTANT: Be very strict about role matching. If someone searches for "Estate Manager", do not give high scores to Butler, Security Director, or other unrelated roles, even if they contain the word "manager".

SEARCH CRITERIA:
${JSON.stringify(parsedSearch, null, 2)}

JOBS:
${jobs.map((job, i) => `
${i + 1}. ID: ${job.id}
   Title: ${job.title}
   Professional Role: ${job.professionalRole || 'Not specified'}
   Location: ${job.location}
   Salary: ${job.salary ? `$${job.salary.min || 0}-${job.salary.max || 0}` : 'Not specified'}
   Description: ${job.description.substring(0, 200)}...
`).join('\n')}

SCORING GUIDELINES:
- roleMatch: 90-100 for exact role matches, 70-89 for closely related roles, 50-69 for somewhat related, 0-49 for unrelated roles
- Only give high overall scores (80+) to jobs that are genuinely relevant to the search
- Be strict: Butler ≠ Estate Manager, Security Director ≠ Estate Manager, etc.

Return JSON array with scores:
[{
  "jobId": "job-id",
  "score": {
    "overallScore": 85,
    "breakdown": {
      "roleMatch": 90,
      "locationMatch": 80,
      "requirementsMatch": 85,
      "preferencesMatch": 80,
      "compensationMatch": 90,
      "cultureMatch": 85
    },
    "matchHighlights": ["Perfect role match"],
    "potentialConcerns": ["Salary slightly below range"],
    "missingInfo": ["Work schedule not specified"]
  },
  "reasoning": "Detailed explanation of match quality"
}]`;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert job matching specialist. Always return valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 2500,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) throw new Error('No scoring response from AI');

      const cleanedResponse = response.replace(/```json\n?|\n?```/g, '').trim();
      const scores = JSON.parse(cleanedResponse);

      // Combine scores with job data
      const matches: AIJobMatch[] = scores.map((score: any) => {
        const job = jobs.find((j: any) => j.id === score.jobId);
        if (!job) return null;

        return {
          jobId: score.jobId,
          job,
          score: score.score,
          reasoning: score.reasoning,
          link: `/dashboard/jobs/${job.urlSlug}`
        };
      }).filter(Boolean);

      return matches;

    } catch (error) {
      console.error('Error scoring job matches with AI, using simple scoring:', error);
      
      // Fallback to improved scoring based on precise keyword matching
      const matches: AIJobMatch[] = jobs.map(job => {
        let roleMatch = 0;
        let locationMatch = 50; // Default location score
        
        const jobTitle = job.title.toLowerCase();
        const jobRole = (job.professionalRole || '').toLowerCase();
        const jobLocation = job.location.toLowerCase();
        
        // Role matching with exact phrase priority
        const roleTerms = [parsedSearch.role.primary, ...parsedSearch.role.alternatives];
        let hasExactRoleMatch = false;
        let bestMatchTerm = '';
        
        roleTerms.forEach(term => {
          if (!term) return;
          
          const termLower = term.toLowerCase();
          
          // Exact phrase match gets highest score
          if (jobTitle.includes(termLower) || jobRole.includes(termLower)) {
            roleMatch = 95;
            hasExactRoleMatch = true;
            bestMatchTerm = term;
          }
          // For compound terms like "estate manager", check for specific role alignment
          else if (!hasExactRoleMatch && termLower.includes(' ')) {
            const words = termLower.split(' ');
            
            // Define role-specific matching rules
            if (termLower.includes('estate manager')) {
              // Estate Manager should only match with estate, property, or house management roles
              if (jobTitle.includes('estate') || jobRole.includes('estate') ||
                  jobTitle.includes('property') || jobRole.includes('property') ||
                  (jobTitle.includes('house') && jobTitle.includes('manager')) ||
                  (jobRole.includes('house') && jobRole.includes('manager'))) {
                roleMatch = Math.max(roleMatch, 80);
                bestMatchTerm = term;
              }
            } else if (termLower.includes('house manager')) {
              // House Manager should match with house, estate, or household management
              if (jobTitle.includes('house') || jobRole.includes('house') ||
                  jobTitle.includes('estate') || jobRole.includes('estate') ||
                  jobTitle.includes('household') || jobRole.includes('household')) {
                roleMatch = Math.max(roleMatch, 80);
                bestMatchTerm = term;
              }
            } else {
              // For other compound terms, use the original logic but be more restrictive
              let wordMatches = 0;
              let hasSpecificTerm = false;
              
              words.forEach(word => {
                if (['estate', 'butler', 'sommelier', 'chef', 'governess', 'nanny'].includes(word) && 
                    (jobTitle.includes(word) || jobRole.includes(word))) {
                  wordMatches++;
                  hasSpecificTerm = true;
                }
              });
              
              // Only match if we have specific role-defining terms
              if (hasSpecificTerm && wordMatches >= 1) {
                roleMatch = Math.max(roleMatch, 70);
                bestMatchTerm = term;
              }
            }
          }
        });
        
        // Location matching
        if (parsedSearch.location.primary.length > 0) {
          const hasLocationMatch = parsedSearch.location.primary.some(loc => {
            if (loc.toLowerCase() === 'united states') return true; // National search
            return jobLocation.includes(loc.toLowerCase());
          });
          locationMatch = hasLocationMatch ? 90 : 30;
        }
        
        // Calculate overall score
        const overallScore = Math.round((roleMatch * 0.8) + (locationMatch * 0.2));
        
        const matchHighlights = [];
        const concerns = [];
        
        if (hasExactRoleMatch) {
          matchHighlights.push(`Exact match for "${bestMatchTerm}"`);
        } else if (roleMatch >= 70) {
          matchHighlights.push(`Partial match for "${bestMatchTerm}"`);
        } else if (roleMatch > 0) {
          concerns.push("Limited role relevance");
        } else {
          concerns.push("No clear role match found");
        }
        
        if (locationMatch >= 90) {
          matchHighlights.push("Good location match");
        } else if (locationMatch < 50) {
          concerns.push("Location may not match preferences");
        }
        
        return {
          jobId: job.id,
          job,
          score: {
            overallScore,
            breakdown: {
              roleMatch,
              locationMatch,
              requirementsMatch: 50,
              preferencesMatch: 50,
              compensationMatch: 50,
              cultureMatch: 50
            },
            matchHighlights,
            potentialConcerns: concerns,
            missingInfo: ["AI analysis not available - using keyword matching"]
          },
          reasoning: hasExactRoleMatch 
            ? `Strong match: "${job.title}" closely matches your search for "${parsedSearch.role.primary}"`
            : roleMatch >= 70
            ? `Partial match: "${job.title}" has some relevance to "${parsedSearch.role.primary}"`
            : `Limited match: "${job.title}" may not be what you're looking for`,
          link: `/dashboard/jobs/${job.urlSlug}`
        };
      })
      .filter(match => match.score.overallScore >= 60) // Filter out poor matches - only show good matches
      .sort((a, b) => b.score.overallScore - a.score.overallScore);

      return matches;
    }
  }

  /**
   * Handle conversational refinement
   */
  async refineSearch(
    originalSearch: ParsedJobSearch,
    userFeedback: string,
    previousResults: AIJobMatch[]
  ): Promise<ConversationRefinement> {
    const prompt = `The user provided feedback to refine their job search. Update the search criteria and provide a conversational response.

ORIGINAL SEARCH:
${JSON.stringify(originalSearch, null, 2)}

USER FEEDBACK: "${userFeedback}"

PREVIOUS RESULTS COUNT: ${previousResults.length}

Based on the feedback:
1. Update the search criteria appropriately
2. Provide a natural, conversational AI response
3. Explain what changes were made

Return JSON:
{
  "updatedSearch": { /* updated ParsedJobSearch object */ },
  "aiResponse": "I understand you'd prefer... I've updated your search to focus on... Here are the new results:",
  "searchChanges": ["Removed travel requirements", "Increased salary minimum to $100k"]
}`;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a helpful job search assistant. Update search criteria based on user feedback and provide natural responses."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No refinement response from AI');
      }

      const cleanedResponse = response.replace(/```json\n?|\n?```/g, '').trim();
      const result = JSON.parse(cleanedResponse);

      // Find new results with updated criteria
      const newResults = await this.findMatchingJobs(result.updatedSearch);

      return {
        userFeedback,
        aiResponse: result.aiResponse,
        updatedSearch: result.updatedSearch,
        newResults
      };

    } catch (error) {
      console.error('Error refining search:', error);
      throw new Error('Failed to refine search. Please try again.');
    }
  }
}

export const aiSearchService = new AISearchService(); 