import { PrismaClient, UserRole, JobStatus } from '@prisma/client'
import { generateJobUrlSlug } from '../src/lib/job-utils'

const prisma = new PrismaClient()

const jobTitles = [
  'Private Chef - French Cuisine Specialist',
  'Estate Manager - Multiple Properties',
  'House Manager - City Residence',
  'Personal Assistant to CEO',
  'Butler - Formal Household',
  'Executive Chauffeur',
  'Head Housekeeper',
  'Governess/Nanny - Trilingual',
  'Security Director',
  'Personal Trainer & Wellness Coach',
  'Household Manager & Chef',
  'Executive Personal Assistant',
  'Private Yacht Chef',
  'Villa Manager - Seasonal Residence',
  'Family Office Manager',
  'Domestic Couple',
  'Private Flight Attendant',
  'Personal Valet',
  'Wine Cellar Manager & Sommelier',
  'Household Staff Supervisor'
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
  'Knowledge of formal service protocols',
  'Strong organizational and planning skills',
  'Ability to manage multiple properties',
  'Wine knowledge and WSET certification',
  'Experience with staff supervision',
  'Proficiency with household management software'
]

const descriptions = [
  'A distinguished UHNW family seeks an experienced professional to join their formal household staff. The ideal candidate will demonstrate exceptional attention to detail, discretion, and the ability to maintain the highest standards of service.',
  'Our client, a high-profile executive, requires a seasoned professional to manage their multiple residential properties. This role demands strong leadership abilities and experience coordinating complex household operations.',
  'A prestigious family office is seeking a dedicated professional for their principal residence. The position involves overseeing daily operations, staff supervision, and ensuring seamless household management.',
  'An international family requires a skilled professional to join their established team. The role offers excellent compensation, benefits, and opportunity for professional growth in a formal household setting.',
  'A private estate is looking for an accomplished professional to oversee their extensive property. The position requires expertise in managing staff, coordinating events, and maintaining exceptional standards.',
  'Our client seeks a highly qualified individual to join their household staff. The role involves managing complex schedules, travel arrangements, and ensuring smooth operation of the residence.',
  'A well-respected family requires a professional to manage their seasonal properties. The position demands flexibility, strong organizational skills, and experience with high-net-worth families.',
  'An exclusive residence is seeking a detail-oriented professional to join their established team. The role requires discretion, professionalism, and experience in formal service.',
  'A prominent family office requires a seasoned professional to oversee multiple aspects of their household operations. The ideal candidate will have extensive experience in private service.',
  'Our client is looking for an experienced professional to manage their luxury property portfolio. The role offers competitive compensation and benefits for the right candidate.'
]

const professionals = [
  {
    firstName: 'James',
    lastName: 'Sullivan',
    title: 'Executive Chef',
    location: 'New York, NY',
    yearsOfExperience: 15,
    bio: 'Classically trained French chef with experience in Michelin-starred restaurants and private estates. Specializes in farm-to-table cuisine and wine pairing.',
    skills: ['French Cuisine', 'Menu Planning', 'Wine Pairing', 'Special Dietary Requirements', 'Event Planning'],
    certifications: ['Culinary Institute of America Graduate', 'Level 3 WSET', 'ServSafe Certification'],
    preferredRole: 'Private Chef',
    workLocations: ['New York', 'Hamptons', 'Connecticut'],
    seekingOpportunities: ['Full-time Private Chef', 'Estate Chef', 'Seasonal Residence Chef'],
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
    seekingOpportunities: ['Estate Manager', 'Property Manager', 'Household Director'],
  },
  {
    firstName: 'William',
    lastName: 'Chen',
    title: 'Personal Security Director',
    location: 'Miami, FL',
    yearsOfExperience: 20,
    bio: 'Former military officer with extensive experience in executive protection and security management for UHNW families. Expertise in international travel security and risk assessment.',
    skills: ['Executive Protection', 'Risk Assessment', 'Security Planning', 'International Travel Security', 'Staff Training'],
    certifications: ['CPP Certification', 'Executive Protection Specialist', 'Advanced Driving Course'],
    preferredRole: 'Security Director',
    workLocations: ['Miami', 'New York', 'International'],
    seekingOpportunities: ['Security Director', 'Head of Security', 'Executive Protection'],
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
    seekingOpportunities: ['Governess', 'Private Tutor', 'Educational Coordinator'],
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
    seekingOpportunities: ['Head Butler', 'House Manager', 'Estate Manager'],
  },
  {
    firstName: 'Marie',
    lastName: 'DuBois',
    title: 'Private Chef & Culinary Instructor',
    location: 'San Francisco, CA',
    yearsOfExperience: 10,
    bio: 'French-trained chef specializing in contemporary cuisine and dietary modifications. Experience in teaching cooking classes and menu planning.',
    skills: ['French Cuisine', 'Dietary Modifications', 'Culinary Education', 'Menu Planning', 'Wine Pairing'],
    certifications: ['Le Cordon Bleu Paris', 'Certified Nutrition Coach'],
    preferredRole: 'Private Chef',
    workLocations: ['San Francisco', 'Napa Valley', 'Lake Tahoe'],
    seekingOpportunities: ['Private Chef', 'Culinary Instructor', 'Personal Chef'],
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
    seekingOpportunities: ['Executive Assistant', 'Personal Assistant', 'Chief of Staff'],
  },
  {
    firstName: 'Victoria',
    lastName: 'Hughes',
    title: 'Luxury Yacht Chief Stewardess',
    location: 'Newport, RI',
    yearsOfExperience: 12,
    bio: 'Experienced yacht professional with extensive knowledge of maritime service and guest relations. Specializes in luxury hospitality and crew management.',
    skills: ['Maritime Service', 'Crew Management', 'Interior Design', 'Event Planning', 'Guest Relations'],
    certifications: ['STCW Certification', 'Silver Service Certification', 'Wine & Spirit Education Trust Level 2'],
    preferredRole: 'Chief Stewardess',
    workLocations: ['Newport', 'Mediterranean', 'Caribbean'],
    seekingOpportunities: ['Chief Stewardess', 'Yacht Manager', 'Estate Manager'],
  },
  {
    firstName: 'David',
    lastName: 'Foster',
    title: 'Estate Grounds Manager',
    location: 'Greenwich, CT',
    yearsOfExperience: 18,
    bio: 'Experienced grounds manager specializing in large estate maintenance and landscape design. Expert in sustainable practices and garden planning.',
    skills: ['Landscape Design', 'Project Management', 'Staff Supervision', 'Sustainable Practices', 'Budget Management'],
    certifications: ['Certified Landscape Professional', 'Horticulture Specialist', 'Pesticide Applicator License'],
    preferredRole: 'Grounds Manager',
    workLocations: ['Greenwich', 'Hamptons', 'Connecticut'],
    seekingOpportunities: ['Estate Manager', 'Grounds Manager', 'Landscape Director'],
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
    seekingOpportunities: ['Private Flight Attendant', 'Corporate Aviation', 'Luxury Travel Coordinator'],
  },
  {
    firstName: 'Marcus',
    lastName: 'Bennett',
    title: 'Executive Protection Specialist',
    location: 'Beverly Hills, CA',
    yearsOfExperience: 15,
    bio: 'Former Special Forces operator with extensive experience in VIP protection. Specialized in international security operations and threat assessment.',
    skills: ['Executive Protection', 'Threat Assessment', 'Security Planning', 'Defensive Driving', 'Crisis Management'],
    certifications: ['Executive Protection Institute', 'Advanced Defensive Driving', 'EMT Certified'],
    preferredRole: 'Security Specialist',
    workLocations: ['Beverly Hills', 'International', 'New York'],
    seekingOpportunities: ['Executive Protection', 'Security Director', 'Family Security'],
  },
  {
    firstName: 'Olivia',
    lastName: 'Chang',
    title: 'Household Operations Director',
    location: 'San Francisco, CA',
    yearsOfExperience: 14,
    bio: 'Experienced household director with MBA and background in luxury hospitality. Specializes in staff development and operational efficiency.',
    skills: ['Staff Management', 'Operations', 'Budget Planning', 'Project Management', 'Vendor Relations'],
    certifications: ['MBA Hospitality Management', 'PMP Certification', 'HR Management'],
    preferredRole: 'Household Director',
    workLocations: ['San Francisco', 'Silicon Valley', 'Lake Tahoe'],
    seekingOpportunities: ['Household Director', 'Estate Manager', 'Chief of Staff'],
  },
  {
    firstName: 'Thomas',
    lastName: 'Blackwood',
    title: 'Wine Director & Sommelier',
    location: 'Napa Valley, CA',
    yearsOfExperience: 16,
    bio: 'Master Sommelier with extensive experience managing private wine collections. Expert in wine acquisition, cellar management, and wine education.',
    skills: ['Wine Collection Management', 'Wine Education', 'Cellar Design', 'Wine Service', 'Collection Valuation'],
    certifications: ['Master Sommelier', 'WSET Diploma', 'Fine Wine Specialist'],
    preferredRole: 'Wine Director',
    workLocations: ['Napa Valley', 'New York', 'International'],
    seekingOpportunities: ['Private Wine Director', 'Estate Sommelier', 'Collection Manager'],
  },
  {
    firstName: 'Grace',
    lastName: 'Kim',
    title: 'Private Yoga & Wellness Coach',
    location: 'Malibu, CA',
    yearsOfExperience: 8,
    bio: 'Holistic wellness professional specializing in private yoga instruction and wellness programming. Expertise in nutrition and stress management.',
    skills: ['Yoga Instruction', 'Wellness Planning', 'Nutrition Coaching', 'Meditation', 'Fitness Training'],
    certifications: ['E-RYT 500', 'Certified Nutritionist', 'Wellness Coach'],
    preferredRole: 'Wellness Coach',
    workLocations: ['Malibu', 'Los Angeles', 'Remote'],
    seekingOpportunities: ['Private Wellness Coach', 'Family Health Coordinator', 'Lifestyle Manager'],
  },
  {
    firstName: 'Daniel',
    lastName: 'Morgan',
    title: 'Estate Technical Director',
    location: 'Seattle, WA',
    yearsOfExperience: 10,
    bio: 'IT professional specializing in smart home technology and cybersecurity for luxury residences. Expert in integrated home automation systems.',
    skills: ['Home Automation', 'Cybersecurity', 'Network Management', 'AV Systems', 'Smart Home Integration'],
    certifications: ['CEDIA Certified', 'Cybersecurity Specialist', 'Network+ Certified'],
    preferredRole: 'Technical Director',
    workLocations: ['Seattle', 'San Francisco', 'Remote'],
    seekingOpportunities: ['Estate Technology Manager', 'Smart Home Director', 'IT Director'],
  },
  {
    firstName: 'Sophia',
    lastName: 'Petrov',
    title: 'Art Collection Manager',
    location: 'New York, NY',
    yearsOfExperience: 12,
    bio: 'Art historian and collection manager with expertise in fine art acquisition and preservation. Experience managing multiple private collections.',
    skills: ['Collection Management', 'Art Acquisition', 'Conservation', 'Exhibition Planning', 'Art Transportation'],
    certifications: ['MA Art History', 'Certified Appraiser', 'Collection Care Specialist'],
    preferredRole: 'Art Manager',
    workLocations: ['New York', 'Miami', 'International'],
    seekingOpportunities: ['Collection Manager', 'Art Advisor', 'Estate Curator'],
  },
  {
    firstName: 'Lucas',
    lastName: 'Rivera',
    title: 'Private Performance Coach',
    location: 'Miami, FL',
    yearsOfExperience: 11,
    bio: 'Elite performance coach with background in professional sports. Specializes in personalized fitness programs and athletic development.',
    skills: ['Performance Training', 'Nutrition Planning', 'Recovery Techniques', 'Sports Science', 'Injury Prevention'],
    certifications: ['CSCS', 'Performance Enhancement Specialist', 'Nutrition Coach'],
    preferredRole: 'Performance Coach',
    workLocations: ['Miami', 'Los Angeles', 'International'],
    seekingOpportunities: ['Private Coach', 'Family Fitness Director', 'Wellness Coordinator'],
  },
  {
    firstName: 'Emma',
    lastName: 'Sinclair',
    title: 'Wardrobe Manager & Stylist',
    location: 'Beverly Hills, CA',
    yearsOfExperience: 9,
    bio: 'Celebrity stylist and wardrobe manager with expertise in luxury fashion. Specializes in personal shopping and closet organization.',
    skills: ['Personal Shopping', 'Wardrobe Management', 'Style Consultation', 'Event Styling', 'Closet Organization'],
    certifications: ['Fashion Merchandising Degree', 'Certified Image Consultant', 'Color Analysis Specialist'],
    preferredRole: 'Wardrobe Manager',
    workLocations: ['Beverly Hills', 'New York', 'International'],
    seekingOpportunities: ['Personal Stylist', 'Wardrobe Director', 'Image Consultant'],
  },
  {
    firstName: 'Benjamin',
    lastName: 'Crawford',
    title: 'Private Aircraft Manager',
    location: 'Dallas, TX',
    yearsOfExperience: 17,
    bio: 'Aviation professional with extensive experience in private aircraft operations and management. Expert in fleet coordination and aviation compliance.',
    skills: ['Aircraft Management', 'Flight Operations', 'Crew Coordination', 'Aviation Compliance', 'Fleet Planning'],
    certifications: ['Aviation Management Degree', 'FAA Dispatcher License', 'IS-BAO Certification'],
    preferredRole: 'Aviation Manager',
    workLocations: ['Dallas', 'New York', 'International'],
    seekingOpportunities: ['Aircraft Manager', 'Aviation Director', 'Fleet Manager'],
  },
  {
    firstName: 'Natalie',
    lastName: 'Windsor',
    title: 'Social Secretary & Event Director',
    location: 'Palm Beach, FL',
    yearsOfExperience: 13,
    bio: 'Experienced social secretary with background in high-society events. Expert in protocol, etiquette, and exclusive event planning.',
    skills: ['Event Planning', 'Social Coordination', 'Protocol', 'Vendor Management', 'Guest Relations'],
    certifications: ['Certified Event Planner', 'Protocol Officer', 'Etiquette Consultant'],
    preferredRole: 'Social Secretary',
    workLocations: ['Palm Beach', 'New York', 'Hamptons'],
    seekingOpportunities: ['Social Secretary', 'Event Director', 'Protocol Officer'],
  },
  {
    firstName: 'Christopher',
    lastName: 'Sterling',
    title: 'Marine Operations Manager',
    location: 'Fort Lauderdale, FL',
    yearsOfExperience: 15,
    bio: 'Former yacht captain with extensive experience in marine operations and crew management. Specializes in yacht management and maritime compliance.',
    skills: ['Marine Operations', 'Crew Management', 'Yacht Maintenance', 'Maritime Compliance', 'Budget Management'],
    certifications: ['Master 3000GT License', 'ISM Certified', 'STCW Certification'],
    preferredRole: 'Marine Manager',
    workLocations: ['Fort Lauderdale', 'Mediterranean', 'Caribbean'],
    seekingOpportunities: ['Marine Director', 'Fleet Manager', 'Yacht Manager'],
  },
  {
    firstName: 'Amelia',
    lastName: 'Fairfax',
    title: 'Etiquette & Protocol Consultant',
    location: 'Washington, DC',
    yearsOfExperience: 20,
    bio: 'International protocol expert with diplomatic background. Specializes in cultural etiquette, staff training, and formal household protocols.',
    skills: ['Protocol Training', 'Cultural Etiquette', 'Staff Development', 'Social Etiquette', 'International Relations'],
    certifications: ['Protocol School of Washington', 'International Etiquette Consultant', 'Cultural Training Specialist'],
    preferredRole: 'Protocol Consultant',
    workLocations: ['Washington DC', 'New York', 'International'],
    seekingOpportunities: ['Protocol Director', 'Household Trainer', 'Etiquette Consultant'],
  },
  {
    firstName: 'Harrison',
    lastName: 'Pierce',
    title: 'Automotive Collection Manager',
    location: 'Greenwich, CT',
    yearsOfExperience: 14,
    bio: 'Classic car expert specializing in luxury and vintage automobile collection management. Experience with restoration projects and collection maintenance.',
    skills: ['Collection Management', 'Vehicle Maintenance', 'Restoration Management', 'Event Transportation', 'Acquisition'],
    certifications: ['Automotive Management', 'Classic Car Specialist', 'ASE Master Technician'],
    preferredRole: 'Collection Manager',
    workLocations: ['Greenwich', 'Hamptons', 'International'],
    seekingOpportunities: ['Collection Manager', 'Automotive Director', 'Fleet Manager'],
  },
  {
    firstName: 'Charlotte',
    lastName: 'Beaumont',
    title: 'Children\'s Education Coordinator',
    location: 'Boston, MA',
    yearsOfExperience: 11,
    bio: 'Education specialist with focus on personalized learning programs. Experience in curriculum development and educational planning for private families.',
    skills: ['Education Planning', 'Curriculum Development', 'Learning Assessment', 'Educational Technology', 'Student Support'],
    certifications: ['M.Ed. Curriculum Development', 'Gifted Education Specialist', 'Educational Consultant'],
    preferredRole: 'Education Coordinator',
    workLocations: ['Boston', 'New York', 'International'],
    seekingOpportunities: ['Education Director', 'Learning Coordinator', 'Academic Advisor'],
  },
  {
    firstName: 'Julian',
    lastName: 'Ashworth',
    title: 'Fine Dining Service Director',
    location: 'Aspen, CO',
    yearsOfExperience: 16,
    bio: 'Former Michelin-star restaurant manager specializing in formal dining service and staff training. Expert in wine service and fine dining protocols.',
    skills: ['Fine Dining Service', 'Wine Service', 'Staff Training', 'Event Management', 'Menu Planning'],
    certifications: ['Advanced Sommelier', 'Hospitality Management', 'Service Excellence Trainer'],
    preferredRole: 'Service Director',
    workLocations: ['Aspen', 'New York', 'International'],
    seekingOpportunities: ['Service Director', 'Dining Manager', 'Butler'],
  },
  {
    firstName: 'Penelope',
    lastName: 'Rothschild',
    title: 'Lifestyle & Travel Coordinator',
    location: 'Manhattan, NY',
    yearsOfExperience: 10,
    bio: 'Luxury lifestyle manager with expertise in high-end travel planning and lifestyle curation. Specializes in exclusive experiences and personal concierge services.',
    skills: ['Travel Planning', 'Lifestyle Management', 'Event Planning', 'Concierge Services', 'Experience Curation'],
    certifications: ['Luxury Lifestyle Management', 'Travel Specialist', 'Concierge Certification'],
    preferredRole: 'Lifestyle Manager',
    workLocations: ['Manhattan', 'Hamptons', 'International'],
    seekingOpportunities: ['Lifestyle Director', 'Travel Coordinator', 'Personal Concierge'],
  },
  {
    firstName: 'Sebastian',
    lastName: 'Voss',
    title: 'Estate Sommelier & Beverage Director',
    location: 'Santa Barbara, CA',
    yearsOfExperience: 13,
    bio: 'Advanced Sommelier with expertise in wine collection management and beverage program development. Experience in private wine education and cellar design.',
    skills: ['Wine Service', 'Cellar Management', 'Wine Education', 'Beverage Programming', 'Collection Development'],
    certifications: ['Advanced Sommelier', 'WSET Level 4', 'Certified Specialist of Wine'],
    preferredRole: 'Beverage Director',
    workLocations: ['Santa Barbara', 'Napa Valley', 'International'],
    seekingOpportunities: ['Estate Sommelier', 'Wine Director', 'Beverage Manager'],
  },
  {
    firstName: 'Gabrielle',
    lastName: 'Laurent',
    title: 'Private Patisserie Chef',
    location: 'Newport, RI',
    yearsOfExperience: 9,
    bio: 'French-trained pastry chef specializing in fine desserts and chocolate work. Experience in menu development and special dietary requirements.',
    skills: ['Pastry Arts', 'Chocolate Work', 'Menu Development', 'Special Diets', 'Event Planning'],
    certifications: ['Le Cordon Bleu Patisserie', 'Chocolate Master', 'Specialty Dietary Training'],
    preferredRole: 'Pastry Chef',
    workLocations: ['Newport', 'New York', 'International'],
    seekingOpportunities: ['Private Pastry Chef', 'Estate Chef', 'Culinary Director'],
  },
  {
    firstName: 'Maxwell',
    lastName: 'Thorne',
    title: 'Smart Home Systems Director',
    location: 'Silicon Valley, CA',
    yearsOfExperience: 12,
    bio: 'Technology expert specializing in luxury smart home integration and automation. Experience in cybersecurity and private network management.',
    skills: ['Home Automation', 'System Integration', 'Network Security', 'AV Systems', 'Project Management'],
    certifications: ['CEDIA Designer', 'Network Security Specialist', 'Home Technology Professional'],
    preferredRole: 'Technology Director',
    workLocations: ['Silicon Valley', 'Los Angeles', 'New York'],
    seekingOpportunities: ['Technology Director', 'Systems Manager', 'Integration Specialist'],
  }
]

const professionalRoles = {
  'Private Chef': 'Private Chef',
  'Estate Manager': 'Estate Manager',
  'House Manager': 'House Manager',
  'Personal Assistant': 'Personal Assistant',
  'Butler': 'Butler',
  'Executive Chauffeur': 'Driver',
  'Head Housekeeper': 'Housekeeper',
  'Governess/Nanny': 'Governess',
  'Security Director': 'Security Director',
  'Personal Trainer': 'Personal Trainer',
  'Household Manager': 'House Manager',
  'Executive Personal Assistant': 'Personal Assistant',
  'Private Yacht Chef': 'Private Chef',
  'Villa Manager': 'Estate Manager',
  'Family Office Manager': 'Family Office Manager',
  'Domestic Couple': 'Estate Couple',
  'Private Flight Attendant': 'Flight Attendant',
  'Personal Valet': 'Butler',
  'Wine Cellar Manager': 'Wine Cellar Manager',
  'Household Staff Supervisor': 'House Manager'
}

async function main() {
  // Create a demo employer
  const employer = await prisma.user.upsert({
    where: { email: 'employer@bellregistry.com' },
    update: {},
    create: {
      email: 'employer@bellregistry.com',
      firstName: 'Victoria',
      lastName: 'Bell',
      role: UserRole.EMPLOYER,
      isDemo: true,
      employerProfile: {
        create: {
          companyName: 'Bell Registry',
          industry: 'Private Service',
          location: 'New York, NY',
          description: 'A premier domestic staffing agency specializing in placement for UHNW households.'
        }
      }
    }
  })

  // Create professionals
  console.log('Creating demo professionals...')
  for (const prof of professionals) {
    const email = `${prof.firstName.toLowerCase()}.${prof.lastName.toLowerCase()}@gmail.com`
    const profileSlug = `${prof.firstName.toLowerCase()}-${prof.lastName.toLowerCase()}`
    
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        firstName: prof.firstName,
        lastName: prof.lastName,
        role: UserRole.PROFESSIONAL,
        profileSlug,
        isDemo: true,
        candidateProfile: {
          upsert: {
            create: {
              title: prof.title,
              bio: prof.bio,
              location: prof.location,
              yearsOfExperience: prof.yearsOfExperience,
              skills: prof.skills,
              certifications: prof.certifications,
              preferredRole: prof.preferredRole,
              workLocations: prof.workLocations,
              seekingOpportunities: prof.seekingOpportunities,
              openToRelocation: true,
              payRangeMin: 80000,
              payRangeMax: 200000,
              payCurrency: 'USD',
              whatImSeeking: 'Seeking a position that allows me to utilize my expertise while maintaining the highest standards of service.',
              whyIEnjoyThisWork: 'I am passionate about delivering exceptional service and creating memorable experiences.',
              whatSetsApartMe: 'My attention to detail, discretion, and commitment to excellence sets me apart.',
              idealEnvironment: 'A professional environment that values excellence, teamwork, and continuous growth.'
            },
            update: {
              title: prof.title,
              bio: prof.bio,
              location: prof.location,
              yearsOfExperience: prof.yearsOfExperience,
              skills: prof.skills,
              certifications: prof.certifications,
              preferredRole: prof.preferredRole,
              workLocations: prof.workLocations,
              seekingOpportunities: prof.seekingOpportunities,
            }
          }
        }
      },
      create: {
        email,
        firstName: prof.firstName,
        lastName: prof.lastName,
        role: UserRole.PROFESSIONAL,
        profileSlug,
        isDemo: true,
        candidateProfile: {
          create: {
            title: prof.title,
            bio: prof.bio,
            location: prof.location,
            yearsOfExperience: prof.yearsOfExperience,
            skills: prof.skills,
            certifications: prof.certifications,
            preferredRole: prof.preferredRole,
            workLocations: prof.workLocations,
            seekingOpportunities: prof.seekingOpportunities,
            openToRelocation: true,
            payRangeMin: 80000,
            payRangeMax: 200000,
            payCurrency: 'USD',
            whatImSeeking: 'Seeking a position that allows me to utilize my expertise while maintaining the highest standards of service.',
            whyIEnjoyThisWork: 'I am passionate about delivering exceptional service and creating memorable experiences.',
            whatSetsApartMe: 'My attention to detail, discretion, and commitment to excellence sets me apart.',
            idealEnvironment: 'A professional environment that values excellence, teamwork, and continuous growth.'
          }
        }
      }
    })
    console.log(`Created/updated professional profile for ${prof.firstName} ${prof.lastName}`)
  }

  // Create 50 jobs
  const jobs = []
  for (let i = 0; i < 50; i++) {
    const title = jobTitles[Math.floor(Math.random() * jobTitles.length)]
    const location = locations[Math.floor(Math.random() * locations.length)]
    const description = descriptions[Math.floor(Math.random() * descriptions.length)]
    
    // Select 4-7 random requirements
    const jobRequirements = [...requirements]
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.floor(Math.random() * 4) + 4)

    // Generate realistic salary ranges based on job title
    let minSalary, maxSalary
    if (title.includes('Director') || title.includes('Estate Manager')) {
      minSalary = Math.floor(Math.random() * 50000) + 150000 // 150k-200k
      maxSalary = Math.floor(Math.random() * 100000) + 200000 // 200k-300k
    } else if (title.includes('Chef') || title.includes('Butler') || title.includes('Manager')) {
      minSalary = Math.floor(Math.random() * 40000) + 100000 // 100k-140k
      maxSalary = Math.floor(Math.random() * 60000) + 140000 // 140k-200k
    } else {
      minSalary = Math.floor(Math.random() * 30000) + 80000 // 80k-110k
      maxSalary = Math.floor(Math.random() * 40000) + 110000 // 110k-150k
    }

    const salary = {
      min: minSalary,
      max: maxSalary,
      currency: 'USD'
    }

    // Make some jobs featured (10% chance)
    const featured = Math.random() < 0.1

    // Set expiry date between 2-6 weeks from now
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + Math.floor(Math.random() * 28) + 14)

    // Randomly select job type and employment type
    const jobTypes = ["Full-time", "Part-time", "Contract", "Temporary"]
    const employmentTypes = ["On-site", "Remote", "Hybrid"]
    const jobType = jobTypes[Math.floor(Math.random() * jobTypes.length)]
    const employmentType = employmentTypes[Math.floor(Math.random() * employmentTypes.length)]

    const job = await prisma.job.create({
      data: {
        employerId: employer.id,
        title,
        professionalRole: professionalRoles[title.split(' - ')[0]] || title.split(' - ')[0],
        description,
        location,
        requirements: jobRequirements,
        salary,
        featured,
        status: JobStatus.ACTIVE,
        expiresAt,
        jobType,
        employmentType,
        isDemo: true,
        urlSlug: generateJobUrlSlug(title),
      }
    })
    jobs.push(job)
  }

  console.log(`Created ${jobs.length} jobs (${jobs.filter(j => j.featured).length} featured)`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 