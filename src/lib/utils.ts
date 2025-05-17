import { prisma } from "@/lib/prisma";
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

function generateRandomCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export async function generateProfileSlug(firstName: string | null, lastName: string | null, userId?: string): Promise<string> {
  if (!firstName || !lastName) return '';
  
  const baseSlug = `${firstName.toLowerCase()}-${lastName.toLowerCase()}`;
  
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
  let uniqueSlug: string;
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