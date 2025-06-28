/**
 * Generates a random alphanumeric string of specified length
 */
function generateRandomCode(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Converts a string to a URL-friendly slug
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Generates a unique URL slug for a job posting
 * Format: job-title-ABC123
 */
export function generateJobUrlSlug(title: string): string {
  const slugifiedTitle = slugify(title);
  const uniqueCode = generateRandomCode(6);
  return `${slugifiedTitle}-${uniqueCode}`;
}

/**
 * Extracts the unique code from a job URL slug
 */
export function extractCodeFromSlug(slug: string): string {
  const parts = slug.split('-');
  return parts[parts.length - 1];
}

/**
 * Extracts the job title from a job URL slug
 */
export function extractTitleFromSlug(slug: string): string {
  const parts = slug.split('-');
  return parts.slice(0, -1).join('-').replace(/-/g, ' ');
} 