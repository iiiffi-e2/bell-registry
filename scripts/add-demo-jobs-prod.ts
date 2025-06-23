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

// Import the job title mapping and locations
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
  'Property Management Director': 'Property Manager',
  'Facilities Operations Manager': 'Facilities Manager',
  'Landscape & Grounds Director': 'Landscape Director',

  // Family Office roles
  'Family Office Chief Executive': 'Family Office CEO',
  'Family Office Operations Director': 'Family Office COO',
  'Family Office Manager': 'Family Office COO',
  'Chief of Staff - UHNW Family': 'Chief of Staff',
  'HR Director - Family Office': 'Human Resources Director',
  'Household Administrative Director': 'Chief of Staff',
  'Executive Assistant to CEO': 'Executive Assistant',
  'Administrative Support Manager': 'Administrative Assistant',
  'Office Operations Manager': 'Office Manager',

  // Household Staff roles
  'Head Butler': 'Butler',
  'Executive Housekeeper - Multiple Properties': 'Executive Housekeeper',
  'Private Driver & Security': 'Driver',
  'Security Team Lead': 'Executive Protection',
  'Head Governess': 'Governess',
  'Private Education Coordinator': 'Private Teacher',
  'Nanny-Educator': 'Nanny | Educator',
  'Professional Nanny': 'Nanny',
  'Family Assistant & Coordinator': 'Family Assistant',
  'Personal Assistant to Principal': 'Personal Assistant',
  'Head of Laundry Services': 'Laundress',
  'Senior Housekeeper': 'Housekeeper',
  'Houseman & Maintenance': 'Houseman',
  'Estate Management Couple': 'Estate Couple',
  'Property Maintenance Manager': 'Property Caretaker',
  'Head Gardener & Grounds': 'Head Gardener',

  // Yacht & Aviation roles
  'Yacht Captain - Mediterranean': 'Yacht Captain',
  'Yacht Engineer - Luxury Vessels': 'Yacht Engineer',
  'Yacht Chief Steward/ess': 'Yacht Steward | Stewardess',
  'Private Aviation Attendant': 'Flight Attendant',
  'Private Flight Attendant': 'Flight Attendant',
  'Corporate Flight Attendant': 'Flight Attendant'
}

// Arrays for creative title generation
const locations = [
  'New York, NY',
  'Los Angeles, CA',
  'Miami, FL',
  'San Francisco, CA',
  'Chicago, IL',
  'Boston, MA',
  'Washington, DC',
  'Houston, TX',
  'Seattle, WA',
  'Beverly Hills, CA'
]

const titleModifiers = {
  BUTLER: [
    'Head', 'Senior', 'Executive', 'Principal', 'Lead', 'Chief', 
    'Estate', 'Private Residence', 'Formal', 'Traditional'
  ],
  CHIEF_OF_STAFF: [
    'Executive', 'Senior', 'Family Office', 'Private Office', 'Principal',
    'Corporate', 'Residential', 'Estate', 'Personal', 'Senior Executive'
  ],
  ESTATE_MANAGER: [
    'Senior', 'Executive', 'Head', 'Lead', 'Private Estate',
    'Luxury Estate', 'Multi-Property', 'Residential', 'Principal', 'Master'
  ],
  PERSONAL_ASSISTANT: [
    'Executive', 'Senior', 'Personal Executive', 'Private', 'Confidential',
    'High-Profile', 'Family Office', 'Corporate', 'Professional', 'Administrative'
  ],
  HOUSE_MANAGER: [
    'Senior', 'Head', 'Executive', 'Lead', 'Private Residence',
    'Estate', 'Principal', 'Professional', 'Luxury Property', 'Residential'
  ],
  PRIVATE_CHEF: [
    'Executive', 'Head', 'Personal', 'Private Family', 'Estate',
    'Luxury Residence', 'Professional', 'Gourmet', 'Master', 'Celebrity'
  ],
  SOUS_CHEF: [
    'Senior', 'Lead', 'Executive', 'Private Estate', 'Head',
    'First', 'Principal', 'Private Residence', 'Professional', 'Family'
  ],
  CHEF_DE_PARTIE: [
    'Senior', 'Lead', 'Private Estate', 'Luxury Residence', 'Executive',
    'Professional', 'Private Household', 'Principal', 'First', 'Master'
  ],
  PERSONAL_DRIVER: [
    'Executive', 'Private', 'Personal Security', 'Family', 'Professional',
    'Estate', 'Corporate', 'Lead', 'Senior', 'Principal'
  ],
  SECURITY_PROFESSIONAL: [
    'Executive', 'Head', 'Senior', 'Lead', 'Chief',
    'Estate Security', 'Private Security', 'Principal', 'Professional', 'Corporate'
  ]
}

const titleSuffixes = {
  BUTLER: [
    'for Distinguished Family',
    'for Luxury Estate',
    'for Private Residence',
    'for High-Profile Principal',
    'for International Family'
  ],
  CHIEF_OF_STAFF: [
    'for Family Office',
    'for Private Office',
    'for Executive Principal',
    'for Distinguished Family',
    'for International Organization'
  ],
  ESTATE_MANAGER: [
    'for Luxury Property',
    'for Multi-Property Estate',
    'for Private Family Compound',
    'for International Portfolio',
    'for Distinguished Residence'
  ],
  PERSONAL_ASSISTANT: [
    'to High-Profile Principal',
    'to Executive Family',
    'to Distinguished Professional',
    'for Private Office',
    'for Family Office'
  ],
  HOUSE_MANAGER: [
    'for Luxury Estate',
    'for Private Residence',
    'for Distinguished Family',
    'for Multiple Properties',
    'for International Family'
  ],
  PRIVATE_CHEF: [
    'for Distinguished Family',
    'for Private Estate',
    'for International Family',
    'for Executive Household',
    'for Luxury Residence'
  ],
  SOUS_CHEF: [
    'for Private Estate',
    'for Distinguished Family',
    'for Luxury Residence',
    'for Executive Household',
    'for International Family'
  ],
  CHEF_DE_PARTIE: [
    'for Private Kitchen',
    'for Luxury Estate',
    'for Distinguished Family',
    'for Executive Household',
    'for Private Residence'
  ],
  PERSONAL_DRIVER: [
    'for Executive Principal',
    'for Distinguished Family',
    'for Private Office',
    'for International Family',
    'for Corporate Executive'
  ],
  SECURITY_PROFESSIONAL: [
    'for Private Estate',
    'for Executive Protection',
    'for Distinguished Family',
    'for International Principal',
    'for High-Profile Client'
  ]
}

function generateCreativeTitle(baseJobTitle: string, professionalRole: string, iteration: number): string {
  // Cast the role to the correct type for our mapping
  const roleKey = professionalRole.toUpperCase().replace(/ /g, '_') as keyof typeof titleModifiers
  const modifiers = titleModifiers[roleKey] || []
  const suffixes = titleSuffixes[roleKey] || []
  
  if (iteration === 0) {
    return baseJobTitle
  }
  
  // Randomly decide whether to use a modifier, suffix, or both
  const useModifier = Math.random() < 0.8 // 80% chance
  const useSuffix = Math.random() < 0.6 // 60% chance
  
  let title = baseJobTitle
  
  if (useModifier && modifiers.length > 0) {
    const modifier = modifiers[Math.floor(Math.random() * modifiers.length)]
    title = `${modifier} ${title}`
  }
  
  if (useSuffix && suffixes.length > 0) {
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)]
    title = `${title} ${suffix}`
  }
  
  // Add location variation occasionally
  if (!useSuffix && Math.random() < 0.3) { // 30% chance if no suffix was used
    const location = locations[Math.floor(Math.random() * locations.length)]
    title = `${title} (${location})`
  }
  
  return title
}

async function main() {
  try {
    console.log('Starting demo jobs creation...')

    // Create a system employer if it doesn't exist
    const systemEmployer = await prisma.user.upsert({
      where: { email: 'system@bellregistry.com' },
      update: {},
      create: {
        email: 'system@bellregistry.com',
        firstName: 'Bell Registry',
        lastName: 'System',
        role: UserRole.EMPLOYER,
        emailVerified: new Date(),
        isDemo: true,
        employerProfile: {
          create: {
            companyName: 'Bell Registry',
            description: 'System account for demo jobs',
            location: 'New York, NY'
          }
        }
      }
    })

    console.log('System employer account ready')
    console.log('Adding demo job postings...')
    
    let successCount = 0
    let errorCount = 0
    const targetJobCount = 300
    const jobTitles = Object.entries(jobTitleToRole)
    const jobsPerTitle = Math.ceil(targetJobCount / jobTitles.length)
    
    // Create multiple jobs for each title to reach our target
    for (const [baseJobTitle, professionalRole] of jobTitles) {
      for (let i = 0; i < jobsPerTitle && successCount < targetJobCount; i++) {
        try {
          if (!PROFESSIONAL_ROLES.includes(professionalRole)) {
            console.error(`Skipping invalid professional role: ${professionalRole}`)
            continue
          }

          // Generate creative title variation
          const jobTitle = generateCreativeTitle(baseJobTitle, professionalRole, i)

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
              employerId: systemEmployer.id,
              urlSlug,
              expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
              isDemo: true
            }
          })

          successCount++
          if (successCount % 50 === 0) {
            console.log(`Added ${successCount}/300 demo job postings...`)
          }
        } catch (error) {
          console.error(`Error adding job "${baseJobTitle}":`, error)
          errorCount++
        }
      }
    }

    console.log('\nDemo jobs creation completed:')
    console.log(`Successfully added: ${successCount} jobs`)
    if (errorCount > 0) {
      console.log(`Failed to add: ${errorCount} jobs`)
    }

  } catch (error) {
    console.error('Fatal error adding demo jobs:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((error) => {
    console.error('Script failed:', error)
    process.exit(1)
  }) 