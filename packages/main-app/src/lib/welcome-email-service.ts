import { Resend } from 'resend';
import { UserRole } from '@bell-registry/shared';

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
  : 'Bell Registry <welcome@bellregistry.com>';

interface WelcomeEmailData {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export async function sendWelcomeEmail(userData: WelcomeEmailData) {
  const resendClient = getResendClient();
  
  // Use app URL for images and sign-in links
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const signInUrl = `${appUrl}/login`;
  
  // Always use production URL for images in emails (localhost won't work in emails)
  const imageBaseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'https://app.bellregistry.com';
  const logoUrl = `${imageBaseUrl}/images/brand/logo-bell-registry-email.png`;
  
  const fullName = `${userData.firstName} ${userData.lastName}`.trim();
  const isEmployer = userData.role === 'EMPLOYER' || userData.role === 'AGENCY';
  const roleText = userData.role === 'PROFESSIONAL' ? 'professional' : 
                   userData.role === 'EMPLOYER' ? 'employer' : 'agency';

  // Different messaging based on role
  const welcomeMessage = isEmployer
    ? "Thank you for joining Bell Registry, the premier platform for connecting with top-tier domestic professionals."
    : "Welcome to Bell Registry, where exceptional opportunities in luxury private service await you.";

  const nextStepsContent = isEmployer
    ? `
      <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 24px 0;">
        <h3 style="margin: 0 0 12px 0; color: #1e40af; font-size: 16px; font-weight: 600;">What's next for you:</h3>
        <ul style="margin: 0; padding-left: 16px; color: #374151; font-size: 14px; line-height: 1.6;">
          <li><strong>Complete your company profile</strong> - Add your company details, location, and what makes your household unique</li>
          <li><strong>Post your first job</strong> - Create detailed job listings to attract qualified professionals</li>
          <li><strong>Browse candidate profiles</strong> - Discover talented professionals who match your needs</li>
          <li><strong>Use our messaging system</strong> - Connect directly with candidates you're interested in</li>
        </ul>
      </div>
    `
    : `
      <div style="background-color: #f0f9ff; border-radius: 8px; padding: 20px; margin: 24px 0;">
        <h3 style="margin: 0 0 12px 0; color: #1e40af; font-size: 16px; font-weight: 600;">What's next for you:</h3>
        <ul style="margin: 0; padding-left: 16px; color: #374151; font-size: 14px; line-height: 1.6;">
          <li><strong>Complete your professional profile</strong> - Showcase your skills, experience, and certifications</li>
          <li><strong>Browse job opportunities</strong> - Explore positions with discerning families and prestigious households</li>
          <li><strong>Set up job alerts</strong> - Get notified when positions matching your preferences are posted</li>
          <li><strong>Build your network</strong> - Connect with other professionals and industry contacts</li>
          <li><strong>Stand out to employers</strong> - Upload a professional photo and detailed work history</li>
        </ul>
      </div>
    `;

  const platformBenefits = isEmployer
    ? `
      <div style="background-color: #fffbeb; border-radius: 8px; padding: 20px; margin: 24px 0;">
        <h3 style="margin: 0 0 12px 0; color: #92400e; font-size: 16px; font-weight: 600;">Why Bell Registry?</h3>
        <ul style="margin: 0; padding-left: 16px; color: #374151; font-size: 14px; line-height: 1.6;">
          <li><strong>Trusted Network</strong> - Only qualified professionals are invited to join the platform</li>
          <li><strong>Luxury market expertise</strong> - Focused on private household services</li>
          <li><strong>Confidential process</strong> - Discreet hiring with privacy protection</li>
          <li><strong>Expert support</strong> - Guidance available to help you connect with the right professionals</li>
        </ul>
      </div>
    `
    : `
      <div style="background-color: #f0fdf4; border-radius: 8px; padding: 20px; margin: 24px 0;">
        <h3 style="margin: 0 0 12px 0; color: #166534; font-size: 16px; font-weight: 600;">Why Bell Registry?</h3>
        <ul style="margin: 0; padding-left: 16px; color: #374151; font-size: 14px; line-height: 1.6;">
          <li><strong>Exclusive opportunities</strong> - Access to prestigious positions not found elsewhere</li>
          <li><strong>Quality employers</strong> - Work with respectful, professional families and households</li>
          <li><strong>Competitive compensation</strong> - Find positions offering excellent pay and benefits</li>
          <li><strong>Career advancement</strong> - Grow your career in the luxury private service sector</li>
        </ul>
      </div>
    `;

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px;">
      <div style="background-color: white; border-radius: 12px; padding: 0; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); overflow: hidden;">
        
        <!-- Header with Logo -->
        <div style="background-color: #121155; padding: 32px; text-align: center;">
          <img src="${logoUrl}" alt="Bell Registry" style="max-width: 200px; height: auto;" />
        </div>

        <!-- Main Content -->
        <div style="padding: 32px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #1f2937; font-size: 28px; font-weight: 700; margin: 0 0 16px 0;">
              Welcome to Bell Registry, ${userData.firstName}! 🎉
            </h1>
            <p style="color: #6b7280; font-size: 18px; margin: 0; line-height: 1.5;">
              ${welcomeMessage}
            </p>
          </div>

          <div style="background-color: #121155; border-radius: 8px; padding: 24px; margin: 32px 0; text-align: center;">
            <h2 style="color: white; font-size: 20px; font-weight: 600; margin: 0 0 16px 0;">
              Your account is ready to go!
            </h2>
            <p style="color: #e2e8f0; font-size: 16px; margin: 0 0 24px 0;">
              Sign in to start ${isEmployer ? 'finding exceptional talent' : 'exploring amazing opportunities'}
            </p>
            <a href="${signInUrl}" style="background-color: white; color: #121155; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block; transition: all 0.2s;">
              Sign In to Your Account
            </a>
          </div>

          ${nextStepsContent}

          ${platformBenefits}

          <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 24px 0; text-align: center;">
            <h3 style="margin: 0 0 12px 0; color: #374151; font-size: 16px; font-weight: 600;">Need help getting started?</h3>
            <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 14px;">
              Our support team is here to help you make the most of Bell Registry.
            </p>
            <a href="mailto:support@bellregistry.com" style="color: #121155; font-weight: 600; text-decoration: none;">
              Contact Support →
            </a>
          </div>

          <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0 0 8px 0;">
              Welcome to Bell Registry community of ${isEmployer ? 'distinguished employers' : 'exceptional professionals'}!
            </p>
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              Follow us on social media for industry insights and updates.
            </p>
          </div>
        </div>
      </div>
    </div>
  `;

  const toEmail = isDevelopment ? 'delivered@resend.dev' : userData.email;

  try {
    const emailResponse = await resendClient.emails.send({
      from: FROM_EMAIL,
      to: toEmail,
      subject: `Welcome to Bell Registry, ${userData.firstName}! Your account is ready`,
      html: emailHtml,
    });

    console.log(`Welcome email sent to ${userData.email}:`, emailResponse);
    return emailResponse;
  } catch (error) {
    console.error(`Failed to send welcome email to ${userData.email}:`, error);
    throw error;
  }
} 