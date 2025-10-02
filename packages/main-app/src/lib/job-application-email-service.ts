/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

import { Resend } from 'resend';

// Lazy initialization of Resend client
let resend: Resend | null = null;

function getResendClient(): Resend {
  if (!resend) {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured');
    }
    resend = new Resend(RESEND_API_KEY);
  }
  return resend;
}

const isDevelopment = process.env.NODE_ENV === 'development';
const FROM_EMAIL = isDevelopment 
  ? 'onboarding@resend.dev'
  : `Bell Registry <${process.env.FROM_EMAIL || 'noreply@bellregistry.com'}>`;

interface JobApplicationEmailData {
  employerEmail: string;
  employerName: string;
  companyName: string;
  jobTitle: string;
  jobLocation: string;
  candidateName: string;
  candidateEmail: string;
  applicationId: string;
  resumeUrl: string;
  coverLetterUrl?: string;
  message?: string;
  applicationDate: Date;
}

export async function sendJobApplicationNotificationEmail(data: JobApplicationEmailData) {
  try {
    const resendClient = getResendClient();
    const appUrl = process.env.NEXTAUTH_URL || 'https://bellregistry.com';
    
    // Format the application date
    const formattedDate = data.applicationDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Create the email HTML
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px;">
        <div style="background-color: white; border-radius: 12px; padding: 0; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); overflow: hidden;">
          
          <!-- Header with Logo -->
          <div style="background-color: #121155; padding: 32px; text-align: center;">
            <img src="${appUrl}/images/brand/bell-registry-b-white-on-blue.png" alt="Bell Registry" style="height: 40px; margin-bottom: 16px;">
            <h1 style="color: white; font-size: 24px; font-weight: 700; margin: 0;">
              New Job Application Received
            </h1>
            <p style="color: #e5e7eb; font-size: 16px; margin: 8px 0 0 0;">
              A professional has applied for your job posting
            </p>
          </div>

          <!-- Main Content -->
          <div style="padding: 32px;">
            <!-- Job Details -->
            <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
              <h3 style="margin: 0 0 16px 0; color: #1f2937; font-size: 18px; font-weight: 600;">
                Job Details
              </h3>
              <div style="color: #374151; font-size: 14px; line-height: 1.6;">
                <p style="margin: 0 0 8px 0;"><strong>Position:</strong> ${data.jobTitle}</p>
                <p style="margin: 0 0 8px 0;"><strong>Location:</strong> ${data.jobLocation}</p>
                <p style="margin: 0;"><strong>Company:</strong> ${data.companyName}</p>
              </div>
            </div>

            <!-- Candidate Details -->
            <div style="background-color: #eff6ff; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
              <h3 style="margin: 0 0 16px 0; color: #1e40af; font-size: 18px; font-weight: 600;">
                Applicant Information
              </h3>
              <div style="color: #1e40af; font-size: 14px; line-height: 1.6;">
                <p style="margin: 0 0 8px 0;"><strong>Name:</strong> ${data.candidateName}</p>
                <p style="margin: 0 0 8px 0;"><strong>Email:</strong> ${data.candidateEmail}</p>
                <p style="margin: 0;"><strong>Applied:</strong> ${formattedDate}</p>
              </div>
            </div>

            <!-- Application Message (if provided) -->
            ${data.message ? `
              <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <h4 style="margin: 0 0 12px 0; color: #166534; font-size: 16px; font-weight: 600;">Cover Message</h4>
                <p style="margin: 0; color: #166534; font-size: 14px; line-height: 1.6;">
                  ${data.message}
                </p>
              </div>
            ` : ''}

            <!-- Attachments Section -->
            <div style="background-color: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
              <h4 style="margin: 0 0 12px 0; color: #92400e; font-size: 16px; font-weight: 600;">
                📎 Application Documents
              </h4>
              <div style="color: #92400e; font-size: 14px; line-height: 1.6;">
                <p style="margin: 0 0 8px 0;">
                  <strong>Resume:</strong> 
                  <a href="${data.resumeUrl}" style="color: #dc2626; text-decoration: none; font-weight: 500;">
                    Download Resume
                  </a>
                </p>
                ${data.coverLetterUrl ? `
                  <p style="margin: 0;">
                    <strong>Cover Letter:</strong> 
                    <a href="${data.coverLetterUrl}" style="color: #dc2626; text-decoration: none; font-weight: 500;">
                      Download Cover Letter
                    </a>
                  </p>
                ` : ''}
              </div>
            </div>

            <!-- Action Buttons -->
            <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
              <a href="${appUrl}/dashboard/employer/applications" style="background-color: #121155; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; display: inline-block; margin-right: 12px; margin-bottom: 8px;">
                View All Applications
              </a>
              <a href="mailto:${data.candidateEmail}?subject=Re: Your application for ${data.jobTitle}" style="background-color: #059669; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; display: inline-block;">
                Contact Applicant
              </a>
            </div>

            <!-- Footer -->
            <div style="text-align: center; margin-top: 16px;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                This is an automated notification from Bell Registry. 
                You can manage your job applications and settings from your employer dashboard.
              </p>
            </div>
          </div>
        </div>
      </div>
    `;

    const toEmail = isDevelopment ? 'delivered@resend.dev' : data.employerEmail;
    
    console.log('[JOB_APPLICATION_NOTIFICATION] Sending application notification email to:', data.employerEmail);

    const emailResponse = await resendClient.emails.send({
      from: FROM_EMAIL,
      to: toEmail,
      subject: `New Application: ${data.candidateName} applied for ${data.jobTitle}`,
      html: emailHtml,
    });

    console.log('[JOB_APPLICATION_NOTIFICATION] Application notification email sent successfully:', emailResponse);

    if (isDevelopment) {
      return {
        message: "Development mode: Application notification email simulated.",
        debug: {
          originalEmail: data.employerEmail,
          testEmail: toEmail,
          isDevelopment,
          emailResponse
        }
      };
    }

    return emailResponse;
  } catch (error) {
    console.error('[JOB_APPLICATION_NOTIFICATION] Error sending application notification email:', error);
    throw error;
  }
} 