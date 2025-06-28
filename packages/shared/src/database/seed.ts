import { PrismaClient, UserRole, JobStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Utility functions (copied from the main app)
function generateRandomCode(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

function generateJobUrlSlug(title: string): string {
  const slugifiedTitle = slugify(title);
  const uniqueCode = generateRandomCode(6);
  return `${slugifiedTitle}-${uniqueCode}`;
}

function generateRandomProfileCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

async function generateProfileSlug(firstName: string | null, lastName: string | null, userId?: string): Promise<string> {
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
  let uniqueSlug: string = `${baseSlug}-${generateRandomProfileCode()}`;
  let isUnique = false;

  while (!isUnique) {
    uniqueSlug = `${baseSlug}-${generateRandomProfileCode()}`;
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

// Professional roles constant
const PROFESSIONAL_ROLES = [
  "Head Gardener",
  "Executive Housekeeper",
  "Driver",
  "Executive Protection",
  "Butler",
  "Governess",
  "Private Teacher",
  "Nanny | Educator",
  "Nanny",
  "Family Assistant",
  "Personal Assistant",
  "Laundress",
  "Housekeeper",
  "Houseman",
  "Estate Couple",
  "Property Caretaker",
  "House Manager",
  "Estate Manager",
  "Personal Chef",
  "Private Chef",
  "Event Chef",
  "Drop-Off Chef",
  "Seasonal Chef",
  "Office Chef",
  "Yacht Chef",
  "Jet Chef",
  "Family Office CEO",
  "Family Office COO",
  "Executive Assistant",
  "Administrative Assistant",
  "Office Manager",
  "Human Resources Director",
  "Director of Residences",
  "Chief of Staff",
  "Estate Hospitality Manager",
  "Estate IT Director",
  "Estate Security Director",
  "Director of Operations",
  "Director of Real Estate and Construction",
  "Construction Manager",
  "Facilities Manager",
  "Property Manager",
  "Landscape Director",
  "Yacht Captain",
  "Yacht Steward | Stewardess",
  "Yacht Engineer",
  "Flight Attendant",
  "Other"
];

// Seed data
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
  'Martha\'s Vineyard, MA',
  'Lake Tahoe, CA',
  'Scottsdale, AZ',
  'Dallas, TX',
  'Naples, FL'
]

const requirements = [
  'Minimum 5 years of experience in private service',
  'Excellent communication and interpersonal skills',
  'Valid driver\'s license and clean driving record',
  'Flexible schedule including evenings and weekends',
  'Background check and references required',
  'Current CPR and First Aid certification',
  'Culinary degree from accredited institution',
  'Estate management experience',
  'Multi-lingual (French, Spanish, Mandarin preferred)',
  'Security clearance and relevant certifications',
  'Proven discretion and confidentiality',
  'International travel required',
  'Live-in position available',
  'Experience with UHNW families',
  'Knowledge of formal service protocols'
]

const descriptions = [
  'A distinguished UHNW family seeks an experienced professional to join their formal household staff. The ideal candidate will demonstrate exceptional attention to detail, discretion, and the ability to maintain the highest standards of service.',
  'Our client, a high-profile executive, requires a seasoned professional to manage their multiple residential properties. This role demands strong leadership abilities and experience coordinating complex household operations.',
  'A prestigious family office is seeking a dedicated professional for their principal residence. The position involves overseeing daily operations, staff supervision, and ensuring seamless household management.',
  'An international family requires a skilled professional to join their established team. The role offers excellent compensation, benefits, and opportunity for professional growth in a formal household setting.',
  'A private estate is looking for an accomplished professional to oversee their extensive property. The position requires expertise in managing staff, coordinating events, and maintaining exceptional standards.'
]

// Professional profiles data
const professionals = [
  {
    firstName: 'James',
    lastName: 'Sullivan',
    title: 'Private Chef',
    location: 'New York, NY',
    yearsOfExperience: 15,
    bio: 'Classically trained French chef with experience in Michelin-starred restaurants and private estates. Specializes in farm-to-table cuisine and wine pairing.',
    skills: ['French Cuisine', 'Menu Planning', 'Wine Pairing', 'Special Dietary Requirements', 'Event Planning'],
    certifications: ['Culinary Institute of America Graduate', 'Level 3 WSET', 'ServSafe Certification'],
    preferredRole: 'Private Chef',
    workLocations: ['New York', 'Hamptons', 'Connecticut'],
    seekingOpportunities: ['Private Chef', 'Personal Chef', 'Estate Chef'],
  },
  {
    firstName: 'Elizabeth',
    lastName: 'Parker',
    title: 'Senior Estate Manager',
    location: 'Los Angeles, CA',
    yearsOfExperience: 12,
    bio: 'Seasoned estate manager with expertise in managing multiple properties and coordinating large household staff. Strong background in project management and vendor relations.',
    skills: ['Staff Management', 'Property Maintenance', 'Event Coordination', 'Budget Management', 'Vendor Relations'],
    certifications: ['Estate Management Professional', 'Project Management Professional'],
    preferredRole: 'Estate Manager',
    workLocations: ['Los Angeles', 'Beverly Hills', 'Santa Barbara'],
    seekingOpportunities: ['Estate Manager', 'Property Manager', 'Director of Residences'],
  },
  {
    firstName: 'William',
    lastName: 'Chen',
    title: 'Executive Protection Specialist',
    location: 'Miami, FL',
    yearsOfExperience: 20,
    bio: 'Former military officer with extensive experience in executive protection and security management for UHNW families. Expertise in international travel security and risk assessment.',
    skills: ['Executive Protection', 'Risk Assessment', 'Security Planning', 'International Travel Security', 'Staff Training'],
    certifications: ['CPP Certification', 'Executive Protection Specialist', 'Advanced Driving Course'],
    preferredRole: 'Executive Protection',
    workLocations: ['Miami', 'New York', 'International'],
    seekingOpportunities: ['Executive Protection', 'Estate Security Director', 'Security Consultant'],
  },
  {
    firstName: 'Sofia',
    lastName: 'Martinez',
    title: 'Trilingual Governess',
    location: 'Greenwich, CT',
    yearsOfExperience: 8,
    bio: 'Experienced governess fluent in English, Spanish, and French. Masters in Early Childhood Education with focus on developmental psychology.',
    skills: ['Early Childhood Education', 'Language Instruction', 'Curriculum Development', 'Child Development', 'Educational Planning'],
    certifications: ['M.Ed. Early Childhood Education', 'Montessori Certification', 'First Aid & CPR'],
    preferredRole: 'Governess',
    workLocations: ['Greenwich', 'New York', 'International'],
    seekingOpportunities: ['Governess', 'Private Teacher', 'Nanny | Educator'],
  },
  {
    firstName: 'Richard',
    lastName: 'Thompson',
    title: 'Butler & House Manager',
    location: 'Palm Beach, FL',
    yearsOfExperience: 25,
    bio: 'Traditional British-trained butler with extensive experience in formal service. Expert in wine cellar management and formal dining protocols.',
    skills: ['Formal Service', 'Wine Service', 'Staff Training', 'Household Management', 'Event Planning'],
    certifications: ['Guild of Professional English Butlers', 'Wine & Spirit Education Trust Level 3'],
    preferredRole: 'Butler',
    workLocations: ['Palm Beach', 'New York', 'London'],
    seekingOpportunities: ['Butler', 'House Manager', 'Estate Manager'],
  },
  {
    firstName: 'Marie',
    lastName: 'DuBois',
    title: 'Executive Housekeeper',
    location: 'San Francisco, CA',
    yearsOfExperience: 10,
    bio: 'Detail-oriented executive housekeeper with experience managing luxury residences and supervising housekeeping teams. Specializes in fine textile care and formal entertaining preparation.',
    skills: ['Team Leadership', 'Inventory Management', 'Quality Control', 'Fine Textile Care', 'Event Preparation'],
    certifications: ['Professional Housekeeping Certification', 'Textile Care Specialist', 'First Aid Certified'],
    preferredRole: 'Executive Housekeeper',
    workLocations: ['San Francisco', 'Napa Valley', 'Lake Tahoe'],
    seekingOpportunities: ['Executive Housekeeper', 'Head Housekeeper', 'House Manager'],
  },
  {
    firstName: 'Alexander',
    lastName: 'Wright',
    title: 'Executive Personal Assistant',
    location: 'Chicago, IL',
    yearsOfExperience: 7,
    bio: 'Detail-oriented personal assistant with experience supporting C-level executives. Strong background in calendar management and travel coordination.',
    skills: ['Calendar Management', 'Travel Planning', 'Event Coordination', 'Project Management', 'Communication'],
    certifications: ['Certified Administrative Professional', 'Project Management Certification'],
    preferredRole: 'Personal Assistant',
    workLocations: ['Chicago', 'New York', 'Remote'],
    seekingOpportunities: ['Personal Assistant', 'Executive Assistant', 'Chief of Staff'],
  },
  {
    firstName: 'Victoria',
    lastName: 'Hughes',
    title: 'Yacht Stewardess',
    location: 'Newport, RI',
    yearsOfExperience: 12,
    bio: 'Experienced yacht professional with extensive knowledge of maritime service and guest relations. Specializes in luxury hospitality and crew management.',
    skills: ['Maritime Service', 'Crew Management', 'Interior Design', 'Event Planning', 'Guest Relations'],
    certifications: ['STCW Certification', 'Silver Service Certification', 'Wine & Spirit Education Trust Level 2'],
    preferredRole: 'Yacht Steward | Stewardess',
    workLocations: ['Newport', 'Mediterranean', 'Caribbean'],
    seekingOpportunities: ['Yacht Steward | Stewardess', 'Interior Manager', 'Guest Relations'],
  },
  {
    firstName: 'David',
    lastName: 'Foster',
    title: 'Head Gardener & Landscape Manager',
    location: 'Greenwich, CT',
    yearsOfExperience: 18,
    bio: 'Master gardener with expertise in landscape design, horticulture, and estate grounds management. Specializes in sustainable practices and seasonal garden planning.',
    skills: ['Landscape Design', 'Horticulture', 'Grounds Management', 'Sustainable Practices', 'Team Leadership'],
    certifications: ['Master Gardener Certification', 'Landscape Design Professional', 'Pesticide Applicator License'],
    preferredRole: 'Head Gardener',
    workLocations: ['Greenwich', 'Hamptons', 'Connecticut'],
    seekingOpportunities: ['Head Gardener', 'Landscape Director', 'Grounds Manager'],
  },
  {
    firstName: 'Isabella',
    lastName: 'Romano',
    title: 'Private Flight Attendant',
    location: 'Los Angeles, CA',
    yearsOfExperience: 9,
    bio: 'Luxury private aviation professional with experience on various aircraft types. Expertise in high-end service and international protocols.',
    skills: ['In-Flight Service', 'Safety Procedures', 'Menu Planning', 'Wine Service', 'International Etiquette'],
    certifications: ['FAA Certification', 'Advanced First Aid', 'Food Safety Manager'],
    preferredRole: 'Flight Attendant',
    workLocations: ['Los Angeles', 'New York', 'International'],
    seekingOpportunities: ['Flight Attendant', 'Corporate Aviation', 'Private Jet Service'],
  }
]

// Map job titles to official professional roles
const jobTitleToRole: Record<string, string> = {
  'Private Chef - French Cuisine Specialist': 'Private Chef',
  'Personal Chef - Plant-Based Specialist': 'Personal Chef',
  'Estate Manager - Multiple Properties': 'Estate Manager',
  'House Manager - City Residence': 'House Manager',
  'Executive Housekeeper - Formal Residence': 'Executive Housekeeper',
  'Butler - Formal Household': 'Butler',
  'Professional Driver - UHNW Family': 'Driver',
  'Executive Protection Specialist': 'Executive Protection',
  'Governess - International Education': 'Governess',
  'Private Teacher - IB Curriculum': 'Private Teacher',
  'Nanny Educator - Multiple Languages': 'Nanny | Educator',
  'Family Assistant - Household Coordinator': 'Family Assistant',
  'Executive Personal Assistant': 'Personal Assistant',
  'Head of Housekeeping': 'Executive Housekeeper',
  'Landscape Director - Estate Grounds': 'Landscape Director',
  'Property Manager - Luxury Residences': 'Property Manager',
  'Yacht Captain - Mediterranean': 'Yacht Captain',
  'Yacht Steward/ess - Luxury Vessels': 'Yacht Steward | Stewardess',
  'Private Flight Attendant': 'Flight Attendant',
  'Chief of Staff - UHNW Family': 'Chief of Staff'
}

const jobTitles = Object.keys(jobTitleToRole)

function getRandomItems<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}

function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

async function createAdminUser() {
  console.log('👤 Creating admin user...');
  
  const adminEmail = 'admin@bellregistry.com';
  const adminPassword = 'AdminPassword123!';
  
  // Check if admin user already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  });

  if (existingAdmin) {
    console.log('👤 Admin user already exists, updating role...');
    
    const updatedAdmin = await prisma.user.update({
      where: { email: adminEmail },
      data: { 
        role: UserRole.ADMIN,
        isDeleted: false,
      }
    });
    
    console.log(`✅ Admin user updated: ${updatedAdmin.email}`);
    return updatedAdmin;
  }

  // Create new admin user
  const hashedPassword = await bcrypt.hash(adminPassword, 12);
  
  const newAdmin = await prisma.user.create({
    data: {
      email: adminEmail,
      password: hashedPassword,
      role: UserRole.ADMIN,
      firstName: 'Admin',
      lastName: 'User',
      emailVerified: new Date(),
      lastLoginAt: new Date(),
    }
  });

  console.log(`✅ Admin user created: ${newAdmin.email} (password: ${adminPassword})`);
  return newAdmin;
}

async function main() {
  console.log('🌱 Starting database seeding...')

  // Create admin user
  await createAdminUser();

  // Create test employer
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
  });

  // Create professional profiles
  console.log('Creating professional profiles...');
  
  for (const professional of professionals) {
    const email = `${professional.firstName.toLowerCase()}.${professional.lastName.toLowerCase()}@example.com`;
    const profileSlug = await generateProfileSlug(professional.firstName, professional.lastName);
    
    // First, upsert the user
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        // Update existing user if needed
        firstName: professional.firstName,
        lastName: professional.lastName,
        role: UserRole.PROFESSIONAL,
        profileSlug,
      },
      create: {
        email,
        firstName: professional.firstName,
        lastName: professional.lastName,
        role: UserRole.PROFESSIONAL,
        emailVerified: new Date(),
        profileSlug,
      }
    });

    // Then handle the candidate profile separately
    await prisma.candidateProfile.upsert({
      where: { userId: user.id },
      update: {
        title: professional.title,
        bio: professional.bio,
        location: professional.location,
        yearsOfExperience: professional.yearsOfExperience,
        skills: professional.skills,
        certifications: professional.certifications,
        preferredRole: professional.preferredRole,
        workLocations: professional.workLocations,
        seekingOpportunities: professional.seekingOpportunities,
        openToWork: true,
      },
      create: {
        userId: user.id,
        title: professional.title,
        bio: professional.bio,
        location: professional.location,
        yearsOfExperience: professional.yearsOfExperience,
        skills: professional.skills,
        certifications: professional.certifications,
        preferredRole: professional.preferredRole,
        workLocations: professional.workLocations,
        seekingOpportunities: professional.seekingOpportunities,
        openToWork: true,
      }
    });
  }

  console.log(`✅ Created ${professionals.length} professional profiles`);

  // Generate job postings
  console.log('Creating 50 job postings...');
  
  for (let i = 0; i < 50; i++) {
    const jobTitle = getRandomItem(jobTitles);
    const professionalRole = jobTitleToRole[jobTitle];
    
    if (!PROFESSIONAL_ROLES.includes(professionalRole)) {
      throw new Error(`Invalid professional role: ${professionalRole}`);
    }

    const jobReqs = getRandomItems(requirements, Math.floor(Math.random() * 5) + 3);
    const description = getRandomItem(descriptions);
    const location = getRandomItem(locations);
    const minSalary = Math.floor(Math.random() * 150000) + 50000;
    const maxSalary = minSalary + Math.floor(Math.random() * 100000);

    const urlSlug = generateJobUrlSlug(jobTitle);

    await prisma.job.upsert({
      where: { urlSlug },
      update: {
        // Update existing job if needed
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
      },
      create: {
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
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      }
    });

    if ((i + 1) % 10 === 0) {
      console.log(`Created ${i + 1} job postings...`);
    }
  }

  console.log('🎉 Seed completed successfully!');
  console.log('📊 Summary:');
  console.log(`   • 1 Admin user (admin@bellregistry.com)`);
  console.log(`   • 1 Test employer`);
  console.log(`   • ${professionals.length} Professional profiles`);
  console.log(`   • 50 Job postings`);
}

main()
  .catch((e) => {
    console.error('💥 Seed process failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 