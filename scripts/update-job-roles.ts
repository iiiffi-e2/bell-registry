import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    // Find all jobs with empty professionalRole
    const jobs = await prisma.job.findMany({
      where: {
        OR: [
          { professionalRole: '' },
          { professionalRole: { equals: '' } }
        ]
      }
    })

    console.log(`Found ${jobs.length} jobs with empty professionalRole`)

    // Update each job
    for (const job of jobs) {
      await prisma.job.update({
        where: { id: job.id },
        data: {
          professionalRole: job.title.split(' - ')[0] // Use the part before the dash as the role
        }
      })
      console.log(`Updated job ${job.id}: ${job.title}`)
    }

    console.log('Successfully updated all jobs')
  } catch (error) {
    console.error('Error updating jobs:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main() 