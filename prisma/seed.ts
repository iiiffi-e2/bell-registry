import { PrismaClient, UserRole, JobStatus } from '@prisma/client'
const prisma = new PrismaClient()

const jobTitles = [
  'Private Chef',
  'Estate Manager',
  'House Manager',
  'Personal Assistant',
  'Butler',
  'Chauffeur',
  'Housekeeper',
  'Nanny',
  'Security Professional',
  'Personal Trainer',
]

const locations = [
  'New York, NY',
  'Los Angeles, CA',
  'Miami, FL',
  'San Francisco, CA',
  'Chicago, IL',
  'Boston, MA',
  'Houston, TX',
  'Washington, DC',
  'Seattle, WA',
  'Beverly Hills, CA'
]

const requirements = [
  'Minimum 5 years of experience',
  'Excellent communication skills',
  'Valid driver\'s license',
  'Flexible schedule',
  'Background check required',
  'CPR certification',
  'Culinary degree',
  'Management experience',
  'Multi-lingual preferred',
  'Security clearance',
  'Discretion and professionalism',
  'Travel required',
  'Available for live-in position',
  'Experience with high-net-worth families',
  'Knowledge of formal service'
]

const descriptions = [
  'We are seeking an experienced professional to join our client\'s household staff. The ideal candidate will be detail-oriented, discreet, and possess excellent organizational skills.',
  'A high-net-worth family is looking for a dedicated professional to manage their private residence. This role requires exceptional attention to detail and strong management abilities.',
  'Our client is seeking a skilled professional to join their team. The position offers competitive compensation and benefits for the right candidate.',
  'A prestigious family office is hiring for their principal residence. The role involves managing day-to-day operations and coordinating with other household staff.',
  'We are looking for a seasoned professional to oversee multiple properties. The position requires strong leadership skills and the ability to manage complex schedules.'
]

async function main() {
  // First create a dummy employer
  const employer = await prisma.user.upsert({
    where: { email: 'employer@example.com' },
    update: {},
    create: {
      email: 'employer@example.com',
      firstName: 'John',
      lastName: 'Smith',
      role: UserRole.EMPLOYER,
      employerProfile: {
        create: {
          companyName: 'Smith Family Office',
          industry: 'Private Service',
          location: 'New York, NY',
          description: 'A prestigious family office managing multiple high-net-worth households.'
        }
      }
    }
  })

  // Create 50 jobs
  const jobs = []
  for (let i = 0; i < 50; i++) {
    const title = jobTitles[Math.floor(Math.random() * jobTitles.length)]
    const location = locations[Math.floor(Math.random() * locations.length)]
    const description = descriptions[Math.floor(Math.random() * descriptions.length)]
    
    // Select 3-5 random requirements
    const jobRequirements = [...requirements]
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.floor(Math.random() * 3) + 3)

    const salary = {
      min: Math.floor(Math.random() * 50000) + 50000, // 50k-100k
      max: Math.floor(Math.random() * 100000) + 100000, // 100k-200k
      currency: 'USD'
    }

    const job = await prisma.job.create({
      data: {
        employerId: employer.id,
        title,
        description,
        location,
        requirements: jobRequirements,
        salary,
        status: JobStatus.ACTIVE,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      }
    })
    jobs.push(job)
  }

  console.log(`Created ${jobs.length} jobs`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 