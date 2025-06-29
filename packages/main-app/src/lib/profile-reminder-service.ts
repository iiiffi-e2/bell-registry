import { prisma } from "@/lib/prisma";
import { Resend } from 'resend';
import { UserRole } from '@bell-registry/shared';
import { fromPrismaUserRole } from '@/lib/prisma-types';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
// Allow build to pass without API key (needed for static generation)
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

const isDevelopment = process.env.NODE_ENV === 'development';
const FROM_EMAIL = isDevelopment 
  ? 'onboarding@resend.dev'
          : 'The Bell Registry <notifications@thebellregistry.com>';

interface UserNeedingReminder {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: UserRole;
  lastLoginAt: Date | null;
  profileSlug: string | null;
  candidateProfile?: {
    updatedAt: Date;
    bio: string | null;
    skills: string[];
    title: string | null;
  } | null;
  employerProfile?: {
    updatedAt: Date;
    companyName: string;
    description: string | null;
  } | null;
}

export async function findUsersNeedingProfileReminders(): Promise<UserNeedingReminder[]> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const users = await prisma.user.findMany({
    where: {
      AND: [
        { isDeleted: false },
        { role: 'PROFESSIONAL' }, // Only professionals for now
        { lastLoginAt: { lte: thirtyDaysAgo } }, // Last login more than 30 days ago
        {
          OR: [
            { lastProfileReminderSentAt: null }, // Never sent reminder
            { lastProfileReminderSentAt: { lte: thirtyDaysAgo } } // Last reminder sent more than 30 days ago
          ]
        }
      ]
    },
    include: {
      candidateProfile: {
        select: {
          updatedAt: true,
          bio: true,
          skills: true,
          title: true,
        }
      },
      employerProfile: {
        select: {
          updatedAt: true,
          companyName: true,
          description: true,
        }
      }
    },
    take: 100 // Limit to prevent overwhelming the email service
  });

  return users.map(user => ({
    ...user,
    role: fromPrismaUserRole(user.role)
  }));
}

export async function sendProfileUpdateReminderEmail(
  userEmail: string,
  userName: string,
  userRole: UserRole,
  profileSlug: string | null,
  lastLoginDays: number,
  profileData?: any
) {
  // Use app URL for images and links
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const loginUrl = `${appUrl}/login`;
  const profileUrl = profileSlug 
    ? (userRole === 'PROFESSIONAL' 
       ? `${appUrl}/professionals/${profileSlug}` 
       : `${appUrl}/dashboard/profile`)
    : `${appUrl}/dashboard/profile`;
    
  // Always use production URL for images in emails (localhost won't work in emails)
  const imageBaseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'https://app.thebellregistry.com';

  // Analyze profile completeness
  const getProfileCompleteness = () => {
    if (userRole === 'PROFESSIONAL' && profileData) {
      const hasTitle = !!profileData.title;
      const hasBio = !!profileData.bio;
      const hasSkills = profileData.skills && profileData.skills.length > 0;
      const completedFields = [hasTitle, hasBio, hasSkills].filter(Boolean).length;
      return Math.round((completedFields / 3) * 100);
    } else if (userRole === 'EMPLOYER' && profileData) {
      const hasCompanyName = !!profileData.companyName;
      const hasDescription = !!profileData.description;
      const completedFields = [hasCompanyName, hasDescription].filter(Boolean).length;
      return Math.round((completedFields / 2) * 100);
    }
    return 50; // Default estimate
  };

  const completeness = getProfileCompleteness();
  const roleText = userRole === 'PROFESSIONAL' ? 'professional' : 'employer';
  const actionText = userRole === 'PROFESSIONAL' 
    ? 'update your skills, experience, and career goals'
    : 'update your company information and job requirements';

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px;">
      <div style="background-color: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
        <div style="text-align: center; margin-bottom: 32px;">
          <img src="${imageBaseUrl}/images/brand/logo-bell-registry-email.png" alt="The Bell Registry" style="max-width: 200px; height: auto; margin-bottom: 24px;" />
          <h1 style="color: #1f2937; font-size: 24px; font-weight: 700; margin: 0;">
            📝 Keep Your Profile Fresh & Visible
          </h1>
          <p style="color: #6b7280; font-size: 16px; margin: 8px 0 0 0;">
            Hi ${userName}, it's been ${lastLoginDays} days since your last visit!
          </p>
        </div>

        <div style="background-color: #eff6ff; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
          <h3 style="margin: 0 0 12px 0; color: #1e40af; font-size: 16px; font-weight: 600;">
            Why keep your profile updated?
          </h3>
          <ul style="margin: 0; padding-left: 16px; color: #1e40af; font-size: 14px; line-height: 1.6;">
            ${userRole === 'PROFESSIONAL' ? `
              <li>Attract better job opportunities from top employers</li>
              <li>Stay visible in recruiter searches</li>
              <li>Showcase your latest skills and achievements</li>
              <li>Get matched with roles that fit your career goals</li>
            ` : `
              <li>Attract qualified candidates to your openings</li>
              <li>Build trust with detailed company information</li>
              <li>Stand out to top talent in your industry</li>
              <li>Improve your employer brand presence</li>
            `}
          </ul>
        </div>

        <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
          <h3 style="margin: 0 0 12px 0; color: #1f2937; font-size: 16px; font-weight: 600;">
            📊 Your Profile Status
          </h3>
          <div style="background-color: #e5e7eb; border-radius: 8px; height: 8px; margin: 8px 0;">
            <div style="background-color: ${completeness >= 70 ? '#10b981' : completeness >= 40 ? '#f59e0b' : '#ef4444'}; border-radius: 8px; height: 8px; width: ${completeness}%;"></div>
          </div>
          <p style="margin: 8px 0 0 0; color: #374151; font-size: 14px;">
            <strong>${completeness}% Complete</strong> - ${completeness >= 70 ? 'Great job!' : completeness >= 40 ? 'Almost there!' : 'Let\'s improve this!'}
          </p>
        </div>

        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin-bottom: 24px;">
          <h4 style="margin: 0 0 8px 0; color: #92400e; font-size: 14px; font-weight: 600;">
            💡 Quick wins to improve your profile:
          </h4>
          <ul style="margin: 0; padding-left: 16px; color: #92400e; font-size: 13px; line-height: 1.5;">
            ${userRole === 'PROFESSIONAL' ? `
              <li>Add or update your professional title</li>
              <li>Refresh your bio with recent accomplishments</li>
              <li>Update your skills with trending technologies</li>
              <li>Add any new certifications or experiences</li>
            ` : `
              <li>Update your company description</li>
              <li>Add recent company achievements or news</li>
              <li>Refresh your job posting templates</li>
              <li>Update your company culture information</li>
            `}
          </ul>
        </div>

        <div style="text-align: center; margin-top: 32px;">
          <a href="${loginUrl}" style="background-color: #121155; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block; margin-bottom: 16px;">
            Sign In & Update Profile
          </a>
          <br>
          <a href="${profileUrl}" style="color: #6b7280; font-size: 14px; text-decoration: none;">
            View your current profile →
          </a>
        </div>

        <div style="text-align: center; margin-top: 24px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            You're receiving this because you're a valued The Bell Registry ${roleText}. 
            <br>
            <a href="${appUrl}/dashboard/settings" style="color: #6b7280;">Manage notification preferences</a>
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
      subject: `Time to refresh your ${roleText} profile - ${lastLoginDays} days and counting!`,
      html: emailHtml,
    });

    console.log(`Profile reminder email sent to ${userEmail}:`, emailResponse);
    return emailResponse;
  } catch (error) {
    console.error(`Failed to send profile reminder email to ${userEmail}:`, error);
    throw error;
  }
}

export async function processProfileReminders() {
  console.log('Starting profile reminder process...');
  
  const usersNeedingReminders = await findUsersNeedingProfileReminders();
  console.log(`Found ${usersNeedingReminders.length} users who need profile reminders`);
  
  if (usersNeedingReminders.length === 0) {
    console.log('No users found that need profile reminders');
    return;
  }
  
  let sentCount = 0;
  
  for (const user of usersNeedingReminders) {
    try {
      const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'there';
      const lastLoginDays = user.lastLoginAt 
        ? Math.ceil((Date.now() - user.lastLoginAt.getTime()) / (1000 * 60 * 60 * 24))
        : 365; // Default to 1 year if never logged in
      
      const profileData = user.role === 'PROFESSIONAL' 
        ? user.candidateProfile 
        : user.employerProfile;
      
      await sendProfileUpdateReminderEmail(
        user.email,
        userName,
        user.role,
        user.profileSlug,
        lastLoginDays,
        profileData
      );
      
      // Update the last reminder sent timestamp
      await prisma.user.update({
        where: { id: user.id },
        data: { lastProfileReminderSentAt: new Date() }
      });
      
      sentCount++;
      console.log(`Profile reminder sent to ${user.email} (${user.role}, ${lastLoginDays} days since last login)`);
    } catch (error) {
      console.error(`Failed to send profile reminder to ${user.email}:`, error);
    }
  }
  
  console.log(`Profile reminder process completed. Sent ${sentCount} reminders`);
} 