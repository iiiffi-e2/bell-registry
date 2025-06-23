import { PrismaClient, UserRole, JobStatus } from '@prisma/client'
import { generateJobUrlSlug } from '../src/lib/job-utils'
import { PROFESSIONAL_ROLES } from '../src/lib/constants'
import { roleSpecificContent } from '../src/data/role-specific-content'

const prisma = new PrismaClient()

// Default content for roles not specifically defined
const defaultContent = {
  descriptions: [
    'We are seeking an experienced professional to join our client\'s household staff. The ideal candidate will have a proven track record in similar roles.',
    'Our distinguished client is looking for a skilled individual to join their team. This role requires strong attention to detail and professional experience.',
    'A high-net-worth family is seeking a dedicated professional. The position offers excellent compensation and benefits for the right candidate.'
  ],
  requirements: [
    'Minimum 5 years of experience in a similar role',
    'Strong organizational and communication skills',
    'Ability to maintain strict confidentiality',
    'Flexible schedule including evenings and weekends when required',
    'Valid driver\'s license and clean driving record',
    'Professional certification in relevant field',
    'Experience working with UHNW families',
    'Excellent references from previous employers'
  ]
}

// Import the job title mapping and locations from seed.ts
const jobTitleToRole: Record<string, string> = {
  // Chef roles
  'Private Chef - French Cuisine Specialist': 'Private Chef',
  'Personal Chef - Plant-Based Specialist': 'Personal Chef',
  'Private Yacht Chef': 'Yacht Chef',
  'Private Yacht Chef - Mediterranean Cuisine': 'Yacht Chef',
  'Event Chef - Special Occasions': 'Event Chef',
  'Drop-Off Chef - Weekly Meal Service': 'Drop-Off Chef',
  'Seasonal Chef - Summer Residence': 'Seasonal Chef',
  'Office Chef - Corporate Dining': 'Office Chef',
  'Private Jet Chef': 'Jet Chef',
  'Household Manager & Chef': 'Private Chef',

  // Estate & Property Management roles
  'Estate Manager - Multiple Properties': 'Estate Manager',
  'House Manager - City Residence': 'House Manager',
  'Estate Operations Director': 'Director of Operations',
  'Estate Hospitality Director': 'Estate Hospitality Manager',
  'Estate IT Systems Manager': 'Estate IT Director',
  'Director of Real Estate Portfolio': 'Director of Real Estate and Construction',
  'Construction & Development Manager': 'Construction Manager',

  // Family Office roles
  'Family Office Chief Executive': 'Family Office CEO',
  'Family Office Operations Director': 'Family Office COO',
  'Family Office Manager': 'Family Office COO',
  'Chief of Staff - UHNW Family': 'Chief of Staff',
  'HR Director - Family Office': 'Human Resources Director',
  'Household Administrative Director': 'Chief of Staff',

  // Yacht & Aviation roles
  'Yacht Captain - Mediterranean': 'Yacht Captain',
  'Yacht Engineer - Luxury Vessels': 'Yacht Engineer',
  'Yacht Chief Steward/ess': 'Yacht Steward | Stewardess',
  'Private Aviation Attendant': 'Flight Attendant',
  'Private Flight Attendant': 'Flight Attendant',
  'Corporate Flight Attendant': 'Flight Attendant',

  // Security roles
  'Executive Protection Specialist': 'Executive Protection',
  'Head of Estate Security': 'Estate Security Director',
  'Security Operations Manager': 'Executive Protection',
  'Personal Protection Specialist': 'Executive Protection',
  'Security Director': 'Estate Security Director',
  'Private Security Team Lead': 'Executive Protection',
  'Estate Security Specialist': 'Estate Security Director'
}

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
  'Beverly Hills, CA',
  'Greenwich, CT',
  'Palm Beach, FL',
  'Aspen, CO',
  'Hamptons, NY',
  'Newport, RI',
  "Martha's Vineyard, MA",
  'Lake Tahoe, CA',
  'Scottsdale, AZ',
  'Dallas, TX',
  'Naples, FL'
]

async function getExistingJobCount() {
  return await prisma.job.count()
}

async function main() {
  try {
    const existingCount = await getExistingJobCount()
    console.log(`Current number of jobs in database: ${existingCount}`)

    // Create a test employer if it doesn't exist
    const testEmployer = await prisma.user.upsert({
      where: { email: 'employer@test.com' },
      update: {},
      create: {
        email: 'employer@test.com',
        firstName: 'Test',
        lastName: 'Employer',
        role: UserRole.EMPLOYER,
        emailVerified: new Date(),
        employerProfile: {
          create: {
            companyName: 'Test Employer Services',
            description: 'A leading provider of private service professionals.',
            website: 'https://example.com',
            location: 'New York, NY'
          }
        }
      }
    })

    // Calculate how many more jobs we need to reach 300
    const jobsToAdd = 300 - existingCount
    
    if (jobsToAdd <= 0) {
      console.log('Database already has 300 or more jobs. No additional jobs needed.')
      return
    }

    console.log(`Adding ${jobsToAdd} new job postings...`)
    
    let count = 0
    for (let i = 0; i < jobsToAdd; i++) {
      // Generate random job details
      const jobTitle = Object.keys(jobTitleToRole)[Math.floor(Math.random() * Object.keys(jobTitleToRole).length)]
      const professionalRole = jobTitleToRole[jobTitle]

      if (!PROFESSIONAL_ROLES.includes(professionalRole)) {
        throw new Error(`Invalid professional role: ${professionalRole}`)
      }

      // Get role-specific or default content
      const roleContent = roleSpecificContent[professionalRole] || defaultContent
      const description = roleContent.descriptions[Math.floor(Math.random() * roleContent.descriptions.length)]
      const jobReqs = roleContent.requirements.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 3) + 5)

      const location = locations[Math.floor(Math.random() * locations.length)]
      const minSalary = Math.floor(Math.random() * 150000) + 50000
      const maxSalary = minSalary + Math.floor(Math.random() * 100000)

      const urlSlug = await generateJobUrlSlug(jobTitle)

      // Create the job posting
      await prisma.job.create({
        data: {
          title: jobTitle,
          professionalRole,
          description,
          location,
          requirements: jobReqs,
          salary: {
            min: minSalary,
            max: maxSalary,
            currency: 'USD'
          },
          status: JobStatus.ACTIVE,
          featured: Math.random() < 0.2,
          employerId: testEmployer.id,
          urlSlug,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          isDemo: true
        }
      })

      count++
      if (count % 50 === 0) {
        console.log(`Added ${count}/${jobsToAdd} job postings...`)
      }
    }

    console.log('Successfully added new job postings')

    const finalCount = await getExistingJobCount()
    console.log(`Final number of jobs in database: ${finalCount}`)

  } catch (error) {
    console.error('Error adding jobs:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main() 