import { prisma } from "./prisma";
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

export function splitTextIntoParagraphs(text: string | null): string[] {
  if (!text) return [];
  
  // Split text by double line breaks (paragraph breaks)
  const paragraphs = text
    .split(/\n\s*\n/) // Split on double line breaks (paragraph separators)
    .map(paragraph => paragraph.trim())
    .filter(paragraph => paragraph.length > 0);
  
  return paragraphs;
}