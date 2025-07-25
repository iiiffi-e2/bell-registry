import { UserRole } from "../types";

interface WelcomeEmailData {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export async function sendWelcomeEmail(userData: WelcomeEmailData) {
  // For now, just log the welcome email (can be enhanced later)
  console.log(`Welcome email would be sent to ${userData.email} (${userData.firstName} ${userData.lastName}) - Role: ${userData.role}`);
  
  // Return a mock response similar to what Resend would return
  return {
    id: `mock-${Date.now()}`,
    to: userData.email,
    from: 'welcome@thebellregistry.com'
  };
} 