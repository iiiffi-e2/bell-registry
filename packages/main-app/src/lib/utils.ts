import { prisma } from "@/lib/prisma";
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

function generateRandomCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export async function generateProfileSlug(firstName: string | null, lastName: string | null, userId?: string): Promise<string> {
  if (!firstName || !lastName) return '';
  
  // Replace spaces with dashes and convert to lowercase for both names
  const cleanFirstName = firstName.trim().replace(/\s+/g, '-').toLowerCase();
  const cleanLastName = lastName.trim().replace(/\s+/g, '-').toLowerCase();
  
  const baseSlug = `${cleanFirstName}-${cleanLastName}`;
  
  // If we're updating an existing profile, check if we already have a unique slug
  if (userId) {
    const existingProfile = await prisma.user.findUnique({
      where: { id: userId },
      select: { profileSlug: true }
    });
    if (existingProfile?.profileSlug) {
      return existingProfile.profileSlug;
    }
  }

  // Check if the base slug exists
  const existingUser = await prisma.user.findFirst({
    where: {
      profileSlug: baseSlug
    }
  });

  // If no duplicate exists, use the base slug
  if (!existingUser) {
    return baseSlug;
  }

  // If duplicate exists, generate a unique slug with random code
  let uniqueSlug: string = `${baseSlug}-${generateRandomCode()}`;
  let isUnique = false;

  while (!isUnique) {
    uniqueSlug = `${baseSlug}-${generateRandomCode()}`;
    const exists = await prisma.user.findFirst({
      where: {
        profileSlug: uniqueSlug
      }
    });
    if (!exists) {
      isUnique = true;
    }
  }

  return uniqueSlug;
}

export function generateProfileUrl(slug: string | null): string {
  if (!slug) return '';
  return `/professionals/${slug}`;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  let interval = seconds / 31536000; // years
  if (interval > 1) return Math.floor(interval) + " years ago";
  
  interval = seconds / 2592000; // months
  if (interval > 1) return Math.floor(interval) + " months ago";
  
  interval = seconds / 86400; // days
  if (interval > 1) return Math.floor(interval) + " days ago";
  
  interval = seconds / 3600; // hours
  if (interval > 1) return Math.floor(interval) + " hours ago";
  
  interval = seconds / 60; // minutes
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  
  return "just now";
}

export function truncateWords(text: string, wordLimit: number): string {
  if (!text) return '';
  const words = text.trim().split(/\s+/);
  if (words.length <= wordLimit) return text;
  return words.slice(0, wordLimit).join(' ') + '...';
}

export function stripHtml(html: string): string {
  if (!html) return '';
  // Remove HTML tags while preserving line breaks and spacing
  return html
    .replace(/<br\s*\/?>/gi, ' ') // Replace <br> tags with spaces
    .replace(/<\/p>/gi, ' ') // Replace </p> tags with spaces
    .replace(/<[^>]*>/g, '') // Remove all other HTML tags
    .replace(/\s+/g, ' ') // Normalize multiple spaces to single spaces
    .trim();
}

export function stripHtmlAndTruncate(html: string, wordLimit: number): string {
  if (!html) return '';
  const plainText = stripHtml(html);
  return truncateWords(plainText, wordLimit);
}

export function splitTextIntoParagraphs(text: string | null): string[] {
  if (!text) return [];
  
  // Split text by double line breaks (paragraph breaks)
  const paragraphs = text
    .split(/\n\s*\n/) // Split on double line breaks (paragraph separators)
    .map(paragraph => paragraph.trim())
    .filter(paragraph => paragraph.length > 0);
  
  return paragraphs;
}

export function validateNameNotInText(text: string, firstName: string, lastName: string): { isValid: boolean; errorMessage?: string } {
  if (!text || !firstName || !lastName) {
    return { isValid: true };
  }

  const normalizedText = text.toLowerCase().trim();
  const normalizedFirstName = firstName.toLowerCase().trim();
  const normalizedLastName = lastName.toLowerCase().trim();
  const normalizedFullName = `${normalizedFirstName} ${normalizedLastName}`;

  // Check for first name only
  if (normalizedText.includes(normalizedFirstName)) {
    return {
      isValid: false,
      errorMessage: `Please don't include your first name "${firstName}" in this field.`
    };
  }

  // Check for last name only
  if (normalizedText.includes(normalizedLastName)) {
    return {
      isValid: false,
      errorMessage: `Please don't include your last name "${lastName}" in this field.`
    };
  }

  // Check for full name
  if (normalizedText.includes(normalizedFullName)) {
    return {
      isValid: false,
      errorMessage: `Please don't include your full name "${firstName} ${lastName}" in this field.`
    };
  }

  return { isValid: true };
}

// Test function to verify validation works (can be removed in production)
export function testNameValidation() {
  const testCases = [
    {
      text: "My name is John and I love cooking",
      firstName: "John",
      lastName: "Doe",
      expected: false,
      description: "Should detect first name"
    },
    {
      text: "I am a professional Doe with 10 years experience",
      firstName: "John",
      lastName: "Doe",
      expected: false,
      description: "Should detect last name"
    },
    {
      text: "John Doe is a great chef",
      firstName: "John",
      lastName: "Doe",
      expected: false,
      description: "Should detect full name"
    },
    {
      text: "I am a professional chef with 10 years experience",
      firstName: "John",
      lastName: "Doe",
      expected: true,
      description: "Should pass validation"
    },
    {
      text: "My colleague Johnny is great",
      firstName: "John",
      lastName: "Doe",
      expected: true,
      description: "Should not detect partial matches"
    }
  ];

  console.log("Testing name validation function:");
  testCases.forEach((testCase, index) => {
    const result = validateNameNotInText(testCase.text, testCase.firstName, testCase.lastName);
    const passed = result.isValid === testCase.expected;
    console.log(`Test ${index + 1}: ${passed ? "✅ PASS" : "❌ FAIL"} - ${testCase.description}`);
    if (!passed) {
      console.log(`  Expected: ${testCase.expected}, Got: ${result.isValid}`);
      if (result.errorMessage) {
        console.log(`  Error: ${result.errorMessage}`);
      }
    }
  });
}