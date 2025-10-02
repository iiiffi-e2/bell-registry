/**
 * Copyright © 2025 Bell Registry. All rights reserved.
 * Unauthorized copying, distribution, modification, or use is prohibited.
 * Proprietary and confidential.
 */

import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

export async function sendVerificationCode(phoneNumber: string) {
  try {
    console.log(`Sending verification code to ${phoneNumber} using Twilio Verify`);
    
    const verification = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
      .verifications
      .create({
        to: phoneNumber,
        channel: 'sms'
      });

    console.log(`Verification sent successfully. Status: ${verification.status}, SID: ${verification.sid}`);
    return { 
      success: true, 
      verificationSid: verification.sid,
      status: verification.status 
    };
  } catch (error: any) {
    console.error('Verification sending failed:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to send verification code',
      code: error.code || 'UNKNOWN_ERROR'
    };
  }
}

export async function verifyCode(phoneNumber: string, code: string) {
  try {
    console.log(`Verifying code for ${phoneNumber}`);
    
    const verificationCheck = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID!)
      .verificationChecks
      .create({
        to: phoneNumber,
        code: code
      });

    console.log(`Verification check completed. Status: ${verificationCheck.status}`);
    return { 
      success: verificationCheck.status === 'approved',
      status: verificationCheck.status,
      verificationSid: verificationCheck.sid
    };
  } catch (error: any) {
    console.error('Code verification failed:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to verify code',
      code: error.code || 'UNKNOWN_ERROR'
    };
  }
}

export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function generateBackupCodes(): string[] {
  const codes = [];
  for (let i = 0; i < 10; i++) {
    codes.push(Math.random().toString(36).substring(2, 10).toUpperCase());
  }
  return codes;
}

export function formatPhoneNumber(phoneNumber: string): string {
  // Remove all non-digit characters
  const digits = phoneNumber.replace(/\D/g, '');
  
  // Add country code if not present (assuming US)
  if (digits.length === 10) {
    return `+1${digits}`;
  } else if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }
  
  // Return as is if it already has country code
  return `+${digits}`;
}

export function validatePhoneNumber(phoneNumber: string): boolean {
  const formatted = formatPhoneNumber(phoneNumber);
  // Basic validation for international phone numbers
  return /^\+\d{10,15}$/.test(formatted);
} 