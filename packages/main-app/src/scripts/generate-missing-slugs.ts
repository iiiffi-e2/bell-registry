import { prisma } from "@/lib/prisma";
import { generateProfileSlug } from "@/lib/utils";

async function generateMissingSlugs() {
  try {
    // Get all users without profile slugs
    const users = await prisma.user.findMany({
      where: {
        profileSlug: null,
        role: "PROFESSIONAL",
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    });

    console.log(`Found ${users.length} users without profile slugs`);

    // Generate and update slugs
    for (const user of users) {
      const profileSlug = await generateProfileSlug(user.firstName, user.lastName, user.id);
      if (profileSlug) {
        await prisma.user.update({
          where: { id: user.id },
          data: { profileSlug },
        });
        console.log(`Generated slug for user ${user.id}: ${profileSlug}`);
      }
    }

    console.log('Finished generating profile slugs');
  } catch (error) {
    console.error('Error generating profile slugs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

generateMissingSlugs(); 