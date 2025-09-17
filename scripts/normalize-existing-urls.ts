import { PrismaClient } from '@bell-registry/shared';

const prisma = new PrismaClient();

async function normalizeExistingUrls() {
  console.log('Starting URL normalization for existing jobs...');
  
  try {
    // Get all jobs that have customApplicationUrl
    const jobs = await prisma.job.findMany({
      where: {
        customApplicationUrl: {
          not: null,
        },
      },
      select: {
        id: true,
        title: true,
        customApplicationUrl: true,
      },
    });

    console.log(`Found ${jobs.length} jobs with custom application URLs`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const job of jobs) {
      if (!job.customApplicationUrl) {
        skippedCount++;
        continue;
      }

      const originalUrl = job.customApplicationUrl;
      let normalizedUrl = originalUrl.trim();

      // Only normalize if it doesn't already start with http:// or https://
      if (!normalizedUrl.startsWith("http://") && !normalizedUrl.startsWith("https://")) {
        normalizedUrl = "https://" + normalizedUrl;

        // Update the job with the normalized URL
        await prisma.job.update({
          where: { id: job.id },
          data: { customApplicationUrl: normalizedUrl },
        });

        console.log(`Updated job "${job.title}":`);
        console.log(`  From: ${originalUrl}`);
        console.log(`  To:   ${normalizedUrl}`);
        console.log('');

        updatedCount++;
      } else {
        console.log(`Skipped job "${job.title}" - already has protocol: ${originalUrl}`);
        skippedCount++;
      }
    }

    console.log(`\nNormalization complete!`);
    console.log(`- Updated: ${updatedCount} jobs`);
    console.log(`- Skipped: ${skippedCount} jobs (already had protocol)`);

  } catch (error) {
    console.error('Error normalizing URLs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the normalization
normalizeExistingUrls();
