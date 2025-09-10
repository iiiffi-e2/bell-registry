import { prisma } from "@/lib/prisma";
import { Resend } from 'resend';
import { JobStatus, Prisma } from '@bell-registry/shared';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
// Allow build to pass without API key (needed for static generation)
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

const isDevelopment = process.env.NODE_ENV === 'development';
const FROM_EMAIL = isDevelopment 
  ? 'onboarding@resend.dev'
  : `Bell Registry <${process.env.ALERTS_EMAIL || 'alerts@bellregistry.com'}>`;

interface JobWithEmployer {
  id: string;
  title: string;
  description: string;
  location: string;
  salary: any;
  requirements: string[];
  createdAt: Date;
  urlSlug: string;
  employerId: string;
  status: string;
  jobType: string | null;
  employmentType: string | null;
  expiresAt: Date | null;
  featured: boolean;
  isDemo: boolean;
  employer: {
    firstName: string | null;
    lastName: string | null;
    employerProfile: {
      companyName: string;
    } | null;
  };
}

export async function findMatchingJobs(
  roles: string[],
  locations: string[],
  since: Date
): Promise<JobWithEmployer[]> {
  const jobs = await prisma.job.findMany({
    where: {
      status: JobStatus.ACTIVE,
      createdAt: {
        gte: since,
      },
      AND: [
        // Match by role/title
        {
          OR: roles.map(role => ({
            title: {
              contains: role,
              mode: Prisma.QueryMode.insensitive,
            },
          })),
        },
        // Match by location
        {
          OR: locations.map(location => ({
            location: {
              contains: location,
              mode: Prisma.QueryMode.insensitive,
            },
          })),
        },
      ],
    },
    include: {
      employer: {
        select: {
          firstName: true,
          lastName: true,
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
    take: 10, // Limit to 10 jobs per alert
  }) as unknown as JobWithEmployer[];

  return jobs;
}

export async function sendJobAlertEmail(
  userEmail: string,
  userName: string,
  alertName: string,
  jobs: JobWithEmployer[],
  frequency: 'DAILY' | 'WEEKLY'
) {
  // Use app URL for job links and dashboard
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

  const jobsHtml = jobs.map(job => `
    <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 16px; background-color: #ffffff;">
      <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 18px; font-weight: 600;">
                        <a href="${appUrl}/jobs/${job.urlSlug}" style="color: #121155; text-decoration: none;">${job.title}</a>
      </h3>
      <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">
        ${job.employer.employerProfile?.companyName || `${job.employer.firstName} ${job.employer.lastName}`} • ${job.location}
      </p>
      <p style="margin: 0 0 12px 0; color: #374151; font-size: 14px; line-height: 1.5;">
        ${job.description.substring(0, 200)}${job.description.length > 200 ? '...' : ''}
      </p>
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
        <span style="color: #059669; font-weight: 500; font-size: 14px;">${formatSalary(job.salary)}</span>
        <a href="${appUrl}/jobs/${job.urlSlug}" style="background-color: #121155; color: white; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 500;">
          View Job
        </a>
      </div>
    </div>
  `).join('');

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px;">
      <div style="background-color: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #1f2937; font-size: 24px; font-weight: 700; margin: 0;">
            Your ${frequency.toLowerCase()} job alert: ${alertName}
          </h1>
          <p style="color: #6b7280; font-size: 16px; margin: 8px 0 0 0;">
            Hi ${userName}, we found ${jobs.length} new job${jobs.length !== 1 ? 's' : ''} matching your criteria
          </p>
        </div>

        ${jobsHtml}

        <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
                  <a href="${appUrl}/dashboard/job-alerts" style="background-color: #1f2937; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; display: inline-block;">
          Manage Your Job Alerts
        </a>
          <p style="color: #9ca3af; font-size: 12px; margin: 16px 0 0 0;">
            You're receiving this because you have an active job alert. 
            <a href="${appUrl}/dashboard/job-alerts" style="color: #6b7280;">Unsubscribe or modify your alerts</a>
          </p>
        </div>
      </div>
    </div>
  `;

  const toEmail = isDevelopment ? 'delivered@resend.dev' : userEmail;

  try {
    const emailResponse = await resend.emails.send({
      from: FROM_EMAIL,
      to: toEmail,
      subject: `${jobs.length} new job${jobs.length !== 1 ? 's' : ''} matching "${alertName}"`,
      html: emailHtml,
    });

    console.log(`Job alert email sent to ${userEmail}:`, emailResponse);
    return emailResponse;
  } catch (error) {
    console.error(`Failed to send job alert email to ${userEmail}:`, error);
    throw error;
  }
}

export async function processJobAlerts(frequency: 'DAILY' | 'WEEKLY') {
  const now = new Date();
  const since = new Date();
  
  if (frequency === 'DAILY') {
    since.setDate(since.getDate() - 1);
  } else {
    since.setDate(since.getDate() - 7);
  }

  const alerts = await prisma.jobAlert.findMany({
    where: {
      isActive: true,
      frequency,
      OR: [
        { lastSent: null },
        { lastSent: { lt: since } },
      ],
    },
    include: {
      user: {
        select: {
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  console.log(`Processing ${alerts.length} ${frequency.toLowerCase()} job alerts`);

  for (const alert of alerts) {
    try {
      const jobs = await findMatchingJobs(alert.roles, alert.locations, since);
      
      if (jobs.length > 0) {
        const userName = `${alert.user.firstName || ''} ${alert.user.lastName || ''}`.trim() || 'there';
        
        await sendJobAlertEmail(
          alert.user.email,
          userName,
          alert.name,
          jobs,
          frequency
        );
      }

      // Update lastSent timestamp
      await prisma.jobAlert.update({
        where: { id: alert.id },
        data: { lastSent: now },
      });

      console.log(`Processed alert "${alert.name}" for ${alert.user.email} - ${jobs.length} jobs found`);
    } catch (error) {
      console.error(`Failed to process alert ${alert.id}:`, error);
    }
  }
} 

