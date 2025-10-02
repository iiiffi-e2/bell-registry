/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

import { prisma } from "@/lib/prisma";
import { Resend } from 'resend';
import { JobStatus } from '@bell-registry/shared';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
// Allow build to pass without API key (needed for static generation)
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

const isDevelopment = process.env.NODE_ENV === 'development';
const FROM_EMAIL = isDevelopment 
  ? 'onboarding@resend.dev'
  : `Bell Registry <${process.env.ALERTS_EMAIL || 'alerts@bellregistry.com'}>`;

interface JobWithoutApplications {
  id: string;
  title: string;
  description: string;
  location: string;
  salary: any;
  requirements: string[];
  createdAt: Date;
  urlSlug: string;
  jobType: string | null;
  employmentType: string | null;
  expiresAt: Date | null;
  featured: boolean;
  employer: {
    firstName: string | null;
    lastName: string | null;
    email: string;
    employerProfile: {
      companyName: string;
    } | null;
  };
}

// Generate improvement suggestions based on job data
function generateJobImprovementSuggestions(job: JobWithoutApplications): string[] {
  const suggestions: string[] = [];
  
  // Check salary information
  if (!job.salary || !job.salary.min || !job.salary.max) {
    suggestions.push("Consider adding a competitive salary range to attract more candidates");
  } else if (job.salary.max - job.salary.min > job.salary.min * 0.5) {
    suggestions.push("Consider narrowing your salary range for more targeted applications");
  }
  
  // Check description length
  if (job.description.length < 200) {
    suggestions.push("Expand your job description with more details about responsibilities and company culture");
  } else if (job.description.length > 1000) {
    suggestions.push("Consider shortening your job description to highlight the most important points");
  }
  
  // Check requirements
  if (job.requirements.length > 8) {
    suggestions.push("Consider reducing the number of requirements to avoid deterring qualified candidates");
  } else if (job.requirements.length < 3) {
    suggestions.push("Add more specific requirements to help candidates understand what you're looking for");
  }
  
  // Check if job is featured
  if (!job.featured) {
    suggestions.push("Consider featuring your job posting to increase visibility");
  }
  
  // Check location specificity
  if (job.location.split(',').length < 2) {
    suggestions.push("Consider adding more specific location details (city, state) to attract local candidates");
  }
  
  // Check job type and employment type
  if (!job.jobType || !job.employmentType) {
    suggestions.push("Specify the job type and employment arrangement (full-time, remote, etc.) for clarity");
  }
  
  // Check expiry date
  if (job.expiresAt) {
    const daysUntilExpiry = Math.ceil((job.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysUntilExpiry < 7) {
      suggestions.push("Consider extending your job posting ideal hire date to give more time for applications");
    }
  }
  
  // Generic suggestions if no specific issues found
  if (suggestions.length === 0) {
    suggestions.push(
      "Consider updating your job title to include more specific keywords",
      "Add information about company benefits and perks",
      "Include details about career growth opportunities",
      "Consider posting on additional job boards or social media"
    );
  }
  
  return suggestions.slice(0, 5); // Limit to 5 suggestions
}

export async function findJobsWithoutApplications(): Promise<JobWithoutApplications[]> {
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  
  // Find active jobs posted more than 3 days ago with no applications
  const jobs = await prisma.job.findMany({
    where: {
      status: JobStatus.ACTIVE,
      createdAt: {
        lte: threeDaysAgo,
      },
      applications: {
        none: {},
      },
    },
    include: {
      employer: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          employerProfile: {
            select: {
              companyName: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return jobs;
}

export async function sendNoApplicationsNotificationEmail(
  employerEmail: string,
  employerName: string,
  jobs: JobWithoutApplications[]
) {
  // Use app URL for dashboard links
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
  
  const formatSalary = (salary: any) => {
    if (!salary || !salary.min || !salary.max) return 'Salary not specified';
    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: salary.currency || 'USD',
      maximumFractionDigits: 0,
    });
    return `${formatter.format(salary.min)} - ${formatter.format(salary.max)}`;
  };

  const jobsHtml = jobs.map(job => {
    const suggestions = generateJobImprovementSuggestions(job);
    const suggestionsHtml = suggestions.map(suggestion => 
      `<li style="margin-bottom: 4px; color: #374151;">${suggestion}</li>`
    ).join('');

    return `
      <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 20px; background-color: #ffffff;">
        <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 18px; font-weight: 600;">
          <a href="${appUrl}/dashboard/employer/jobs/${job.urlSlug}" style="color: #121155; text-decoration: none;">${job.title}</a>
        </h3>
        <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">
          Posted ${Math.ceil((Date.now() - job.createdAt.getTime()) / (1000 * 60 * 60 * 24))} days ago • ${job.location}
        </p>
        <p style="margin: 0 0 12px 0; color: #374151; font-size: 14px;">
          ${formatSalary(job.salary)} • ${job.jobType || 'Job type not specified'} • ${job.employmentType || 'Employment type not specified'}
        </p>
        
        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 12px 0;">
          <h4 style="margin: 0 0 8px 0; color: #92400e; font-size: 14px; font-weight: 600;">💡 Suggestions to improve your listing:</h4>
          <ul style="margin: 0; padding-left: 16px; color: #374151; font-size: 13px;">
            ${suggestionsHtml}
          </ul>
        </div>
        
        <div style="margin-top: 16px;">
          <a href="${appUrl}/dashboard/employer/jobs/${job.urlSlug}/edit" style="background-color: #121155; color: white; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 500; margin-right: 8px;">
            Edit Job
          </a>
          <a href="${appUrl}/dashboard/employer/jobs/${job.urlSlug}" style="background-color: #6b7280; color: white; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 500;">
            View Details
          </a>
        </div>
      </div>
    `;
  }).join('');

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px;">
      <div style="background-color: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #1f2937; font-size: 24px; font-weight: 700; margin: 0;">
            📋 Your Job Posting${jobs.length > 1 ? 's' : ''} Need${jobs.length === 1 ? 's' : ''} Attention
          </h1>
          <p style="color: #6b7280; font-size: 16px; margin: 8px 0 0 0;">
            Hi ${employerName}, ${jobs.length === 1 ? 'one of your job postings hasn\'t' : `${jobs.length} of your job postings haven't`} received any applications in the last 3 days.
          </p>
        </div>

        <div style="background-color: #eff6ff; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
          <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.5;">
            <strong>Don't worry!</strong> This is common and there are several ways to improve your job listing's visibility and appeal to candidates.
          </p>
        </div>

        ${jobsHtml}

        <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin-top: 24px;">
          <h3 style="margin: 0 0 12px 0; color: #1f2937; font-size: 16px; font-weight: 600;">💼 General Tips for Better Job Postings:</h3>
          <ul style="margin: 0; padding-left: 16px; color: #374151; font-size: 14px; line-height: 1.6;">
            <li>Use clear, specific job titles that candidates search for</li>
            <li>Include competitive compensation and benefits information</li>
            <li>Write engaging descriptions that highlight company culture</li>
            <li>Keep requirements realistic and focused on must-haves</li>
            <li>Consider featuring your posts for increased visibility</li>
          </ul>
        </div>

        <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
          <a href="${appUrl}/dashboard/employer/jobs" style="background-color: #121155; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; display: inline-block; margin-right: 12px;">
            Manage All Jobs
          </a>
          <a href="${appUrl}/dashboard/employer/jobs/post" style="background-color: #059669; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; display: inline-block;">
            Post New Job
          </a>
        </div>
        
        <div style="text-align: center; margin-top: 16px;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            You're receiving this because you have active job postings. 
            <a href="${appUrl}/dashboard/settings" style="color: #6b7280;">Manage notification preferences</a>
          </p>
        </div>
      </div>
    </div>
  `;

  const toEmail = isDevelopment ? 'delivered@resend.dev' : employerEmail;

  try {
    const emailResponse = await resend.emails.send({
      from: FROM_EMAIL,
      to: toEmail,
      subject: `${jobs.length === 1 ? 'Your job posting needs' : `${jobs.length} job postings need`} attention - No applications yet`,
      html: emailHtml,
    });

    console.log(`No applications notification email sent to ${employerEmail}:`, emailResponse);
    return emailResponse;
  } catch (error) {
    console.error(`Failed to send no applications notification email to ${employerEmail}:`, error);
    throw error;
  }
}

export async function processEmployerNotifications() {
  console.log('Starting employer notifications process...');
  
  const jobsWithoutApplications = await findJobsWithoutApplications();
  console.log(`Found ${jobsWithoutApplications.length} jobs without applications`);
  
  if (jobsWithoutApplications.length === 0) {
    console.log('No jobs found that need notifications');
    return;
  }
  
  // Group jobs by employer
  const jobsByEmployer = new Map<string, JobWithoutApplications[]>();
  
  jobsWithoutApplications.forEach(job => {
    const employerEmail = job.employer.email;
    if (!jobsByEmployer.has(employerEmail)) {
      jobsByEmployer.set(employerEmail, []);
    }
    jobsByEmployer.get(employerEmail)!.push(job);
  });
  
  console.log(`Sending notifications to ${jobsByEmployer.size} employers`);
  
  // Send notifications to each employer
  const employerEntries = Array.from(jobsByEmployer.entries());
  for (const [employerEmail, jobs] of employerEntries) {
    try {
      const employer = jobs[0].employer;
      const employerName = employer.employerProfile?.companyName || 
                          `${employer.firstName || ''} ${employer.lastName || ''}`.trim() || 
                          'there';
      
      await sendNoApplicationsNotificationEmail(employerEmail, employerName, jobs);
      
      console.log(`Notification sent to ${employerEmail} for ${jobs.length} job(s)`);
    } catch (error) {
      console.error(`Failed to send notification to ${employerEmail}:`, error);
    }
  }
  
  console.log('Employer notifications process completed');
} 