import { PrismaClient } from '@prisma/client';
import { generateProfileSlug } from '../src/lib/utils';

const prisma = new PrismaClient();

async function generateSlugs() {
  try {
    // Get all users without a profile slug
    const users = await prisma.user.findMany({
      where: {
        profileSlug: null,
        firstName: { not: null },
        lastName: { not: null }
      }
    });

    console.log(`Found ${users.length} users without profile slugs`);

    // Generate and update slugs
    for (const user of users) {
      const slug = await generateProfileSlug(user.firstName, user.lastName, user.id);
      await prisma.user.update({
        where: { id: user.id },
        data: { profileSlug: slug }
      });
      console.log(`Generated slug for ${user.firstName} ${user.lastName}: ${slug}`);
    }

    // List all users and their slugs
    const allUsers = await prisma.user.findMany({
      select: {
        firstName: true,
        lastName: true,
        email: true,
        profileSlug: true
      }
    });

    console.log('\nAll users and their slugs:');
    console.table(allUsers);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

generateSlugs(); 