import { PrismaClient, UserRole, JobStatus, Job } from '@prisma/client'
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
    preferredRole: 'Executive Protection',
    workLocations: ['Beverly Hills', 'International', 'New York'],
    seekingOpportunities: ['Executive Protection', 'Estate Security Director', 'Security Consultant'],
  },
  {
    firstName: 'Olivia',
    lastName: 'Chang',
    title: 'House Manager',
    location: 'San Francisco, CA',
    yearsOfExperience: 14,
    bio: 'Experienced house manager with strong organizational skills and attention to detail. Expert in coordinating household operations, managing staff schedules, and maintaining luxury residences.',
    skills: ['Household Operations', 'Staff Coordination', 'Maintenance Management', 'Event Planning', 'Budget Management'],
    certifications: ['House Manager Professional', 'Project Management', 'Facilities Management'],
    preferredRole: 'House Manager',
    workLocations: ['San Francisco', 'Silicon Valley', 'Lake Tahoe'],
    seekingOpportunities: ['House Manager', 'Estate Manager', 'Property Manager'],
  },
  {
    firstName: 'Thomas',
    lastName: 'Blackwood',
    title: 'Professional Driver',
    location: 'Napa Valley, CA',
    yearsOfExperience: 16,
    bio: 'Professional chauffeur with extensive experience driving luxury vehicles and providing transportation services for high-profile clients. Specializes in security-conscious driving and route planning.',
    skills: ['Defensive Driving', 'Route Planning', 'Vehicle Maintenance', 'Security Protocols', 'Customer Service'],
    certifications: ['Professional Chauffeur License', 'Defensive Driving Instructor', 'First Aid Certified'],
    preferredRole: 'Driver',
    workLocations: ['Napa Valley', 'San Francisco', 'International'],
    seekingOpportunities: ['Driver', 'Executive Chauffeur', 'Family Driver'],
  },
  {
    firstName: 'Grace',
    lastName: 'Kim',
    title: 'Nanny & Educator',
    location: 'Malibu, CA',
    yearsOfExperience: 8,
    bio: 'Nurturing nanny with background in early childhood education. Experienced in creating educational activities, managing daily routines, and supporting child development.',
    skills: ['Child Care', 'Educational Activities', 'Routine Management', 'Child Development', 'Safety Management'],
    certifications: ['Early Childhood Education', 'CPR & First Aid', 'Nanny Professional Certification'],
    preferredRole: 'Nanny | Educator',
    workLocations: ['Malibu', 'Los Angeles', 'Remote'],
    seekingOpportunities: ['Nanny | Educator', 'Nanny', 'Child Care Specialist'],
  },
  {
    firstName: 'Daniel',
    lastName: 'Morgan',
    title: 'Estate IT Director',
    location: 'Seattle, WA',
    yearsOfExperience: 10,
    bio: 'Technology professional specializing in smart home integration and cybersecurity for luxury estates. Expert in home automation, network security, and tech support.',
    skills: ['Smart Home Technology', 'Network Security', 'Home Automation', 'IT Support', 'System Integration'],
    certifications: ['CEDIA Designer', 'Network Security Professional', 'Smart Home Professional'],
    preferredRole: 'Estate IT Director',
    workLocations: ['Seattle', 'San Francisco', 'Remote'],
    seekingOpportunities: ['Estate IT Director', 'Technology Manager', 'Smart Home Specialist'],
  },
  {
    firstName: 'Sophia',
    lastName: 'Petrov',
    title: 'Family Assistant',
    location: 'New York, NY',
    yearsOfExperience: 12,
    bio: 'Dedicated family assistant with experience supporting busy families with children. Expert in organizing family schedules, coordinating activities, and providing reliable support.',
    skills: ['Family Coordination', 'Schedule Management', 'Child Care Support', 'Event Planning', 'Organization'],
    certifications: ['Family Assistant Professional', 'CPR & First Aid', 'Child Development Associate'],
    preferredRole: 'Family Assistant',
    workLocations: ['New York', 'Miami', 'International'],
    seekingOpportunities: ['Family Assistant', 'Personal Assistant', 'Household Coordinator'],
  },
  {
    firstName: 'Lucas',
    lastName: 'Rivera',
    title: 'Yacht Captain',
    location: 'Miami, FL',
    yearsOfExperience: 11,
    bio: 'Licensed yacht captain with extensive experience commanding luxury vessels. Expert in navigation, crew management, and providing exceptional guest experiences on the water.',
    skills: ['Yacht Operations', 'Navigation', 'Crew Management', 'Maritime Safety', 'Guest Services'],
    certifications: ['Master 200GT License', 'STCW Certification', 'MCA Certified'],
    preferredRole: 'Yacht Captain',
    workLocations: ['Miami', 'Caribbean', 'International'],
    seekingOpportunities: ['Yacht Captain', 'Marine Operations', 'Fleet Manager'],
  },
  {
    firstName: 'Emma',
    lastName: 'Sinclair',
    title: 'Laundress Specialist',
    location: 'Beverly Hills, CA',
    yearsOfExperience: 9,
    bio: 'Professional laundress with expertise in fine textile care and garment preservation. Specializes in luxury clothing, delicate fabrics, and wardrobe management.',
    skills: ['Fine Textile Care', 'Garment Preservation', 'Stain Removal', 'Wardrobe Organization', 'Fabric Knowledge'],
    certifications: ['Textile Care Professional', 'Dry Cleaning Specialist', 'Garment Care Expert'],
    preferredRole: 'Laundress',
    workLocations: ['Beverly Hills', 'West Hollywood', 'International'],
    seekingOpportunities: ['Laundress', 'Wardrobe Manager', 'Textile Specialist'],
  },
  {
    firstName: 'Benjamin',
    lastName: 'Crawford',
    title: 'Construction Manager',
    location: 'Dallas, TX',
    yearsOfExperience: 17,
    bio: 'Experienced construction manager specializing in luxury residential projects and estate renovations. Expert in project coordination, quality control, and vendor management.',
    skills: ['Construction Management', 'Project Coordination', 'Quality Control', 'Vendor Relations', 'Budget Management'],
    certifications: ['Construction Management Professional', 'OSHA 30 Certified', 'Project Management Professional'],
    preferredRole: 'Construction Manager',
    workLocations: ['Dallas', 'New York', 'International'],
    seekingOpportunities: ['Construction Manager', 'Project Manager', 'Facilities Manager'],
  },
  {
    firstName: 'Natalie',
    lastName: 'Windsor',
    title: 'Executive Assistant',
    location: 'Palm Beach, FL',
    yearsOfExperience: 13,
    bio: 'Highly organized executive assistant with experience supporting UHNW individuals and families. Expert in complex calendar management, travel coordination, and confidential communications.',
    skills: ['Calendar Management', 'Travel Coordination', 'Project Management', 'Communication', 'Confidentiality'],
    certifications: ['Certified Administrative Professional', 'Project Management Professional', 'Executive Assistant Certification'],
    preferredRole: 'Executive Assistant',
    workLocations: ['Palm Beach', 'New York', 'Hamptons'],
    seekingOpportunities: ['Executive Assistant', 'Personal Assistant', 'Chief of Staff'],
  },
  {
    firstName: 'Christopher',
    lastName: 'Sterling',
    title: 'Yacht Engineer',
    location: 'Fort Lauderdale, FL',
    yearsOfExperience: 15,
    bio: 'Marine engineer with extensive experience in yacht mechanical systems and maintenance. Expert in engine repair, electrical systems, and vessel operations.',
    skills: ['Marine Engineering', 'Engine Maintenance', 'Electrical Systems', 'Hydraulics', 'Troubleshooting'],
    certifications: ['Marine Engineer License', 'STCW Certification', 'Marine Electrical Specialist'],
    preferredRole: 'Yacht Engineer',
    workLocations: ['Fort Lauderdale', 'Mediterranean', 'Caribbean'],
    seekingOpportunities: ['Yacht Engineer', 'Marine Technician', 'Fleet Engineer'],
  },
  {
    firstName: 'Amelia',
    lastName: 'Fairfax',
    title: 'Private Teacher',
    location: 'Washington, DC',
    yearsOfExperience: 20,
    bio: 'Certified private teacher with Masters in Education and experience in personalized learning programs. Specializes in curriculum development and academic enrichment.',
    skills: ['Curriculum Development', 'Personalized Learning', 'Academic Assessment', 'Educational Technology', 'Student Mentoring'],
    certifications: ['M.Ed. Curriculum & Instruction', 'Teaching Credential', 'Gifted Education Specialist'],
    preferredRole: 'Private Teacher',
    workLocations: ['Washington DC', 'New York', 'International'],
    seekingOpportunities: ['Private Teacher', 'Educational Consultant', 'Academic Tutor'],
  },
  {
    firstName: 'Harrison',
    lastName: 'Pierce',
    title: 'Property Manager',
    location: 'Greenwich, CT',
    yearsOfExperience: 14,
    bio: 'Experienced property manager specializing in luxury mountain residences and seasonal properties. Expert in maintenance coordination, vendor management, and property care.',
    skills: ['Property Maintenance', 'Vendor Management', 'Seasonal Preparation', 'Budget Planning', 'Emergency Response'],
    certifications: ['Property Management Professional', 'Mountain Property Specialist', 'HVAC Certified'],
    preferredRole: 'Property Manager',
    workLocations: ['Greenwich', 'Hamptons', 'International'],
    seekingOpportunities: ['Property Manager', 'Estate Caretaker', 'Facilities Manager'],
  },
  {
    firstName: 'Charlotte',
    lastName: 'Beaumont',
    title: 'Housekeeper',
    location: 'Boston, MA',
    yearsOfExperience: 11,
    bio: 'Professional housekeeper with experience in luxury residential cleaning and maintenance. Specializes in attention to detail, discretion, and maintaining pristine environments.',
    skills: ['Deep Cleaning', 'Organization', 'Laundry Care', 'Surface Care', 'Inventory Management'],
    certifications: ['Professional Housekeeping Certification', 'Green Cleaning Specialist', 'First Aid Certified'],
    preferredRole: 'Housekeeper',
    workLocations: ['Boston', 'New York', 'International'],
    seekingOpportunities: ['Housekeeper', 'Head Housekeeper', 'Residential Cleaner'],
  },
  {
    firstName: 'Julian',
    lastName: 'Ashworth',
    title: 'Houseman',
    location: 'Aspen, CO',
    yearsOfExperience: 16,
    bio: 'Dedicated houseman with experience in luxury residential care and maintenance. Expert in household repairs, guest services, and supporting daily operations.',
    skills: ['Household Maintenance', 'Guest Services', 'Cleaning Protocols', 'Basic Repairs', 'Inventory Management'],
    certifications: ['Household Professional Certification', 'First Aid Certified', 'Basic Electrical Certification'],
    preferredRole: 'Houseman',
    workLocations: ['Aspen', 'New York', 'International'],
    seekingOpportunities: ['Houseman', 'Household Assistant', 'Property Caretaker'],
  },
  {
    firstName: 'Penelope',
    lastName: 'Rothschild',
    title: 'Office Manager',
    location: 'Manhattan, NY',
    yearsOfExperience: 10,
    bio: 'Professional office manager with experience in family office environments. Expert in administrative operations, vendor coordination, and maintaining efficient office systems.',
    skills: ['Office Administration', 'Vendor Coordination', 'Systems Management', 'Budget Tracking', 'Communication'],
    certifications: ['Office Management Professional', 'Administrative Excellence', 'Family Office Specialist'],
    preferredRole: 'Office Manager',
    workLocations: ['Manhattan', 'Hamptons', 'International'],
    seekingOpportunities: ['Office Manager', 'Administrative Manager', 'Family Office Coordinator'],
  },
  {
    firstName: 'Sebastian',
    lastName: 'Voss',
    title: 'Landscape Director',
    location: 'Santa Barbara, CA',
    yearsOfExperience: 13,
    bio: 'Landscape architect and director with expertise in desert landscaping and estate grounds management. Specializes in sustainable design and water-efficient gardens.',
    skills: ['Landscape Architecture', 'Desert Landscaping', 'Water Management', 'Sustainable Design', 'Project Management'],
    certifications: ['Landscape Architecture License', 'Water Efficiency Specialist', 'Desert Landscape Professional'],
    preferredRole: 'Landscape Director',
    workLocations: ['Santa Barbara', 'Napa Valley', 'International'],
    seekingOpportunities: ['Landscape Director', 'Head Gardener', 'Grounds Manager'],
  },
  {
    firstName: 'Gabrielle',
    lastName: 'Laurent',
    title: 'Personal Chef',
    location: 'Newport, RI',
    yearsOfExperience: 9,
    bio: 'French-trained pastry chef specializing in fine desserts and chocolate work. Experience in menu development and special dietary requirements.',
    skills: ['Pastry Arts', 'Chocolate Work', 'Menu Development', 'Special Diets', 'Event Planning'],
    certifications: ['Le Cordon Bleu Patisserie', 'Chocolate Master', 'Specialty Dietary Training'],
    preferredRole: 'Personal Chef',
    workLocations: ['Newport', 'New York', 'International'],
    seekingOpportunities: ['Personal Chef', 'Private Chef', 'Estate Chef'],
  },
  {
    firstName: 'Maxwell',
    lastName: 'Thorne',
    title: 'Chief of Staff',
    location: 'Silicon Valley, CA',
    yearsOfExperience: 12,
    bio: 'Experienced chief of staff with background in executive support and operations management. Expert in strategic planning, staff coordination, and complex project management.',
    skills: ['Strategic Planning', 'Operations Management', 'Staff Leadership', 'Project Coordination', 'Executive Support'],
    certifications: ['Executive Leadership Certificate', 'Operations Management Professional', 'Strategic Planning Specialist'],
    preferredRole: 'Chief of Staff',
    workLocations: ['Silicon Valley', 'Los Angeles', 'New York'],
    seekingOpportunities: ['Chief of Staff', 'Operations Director', 'Executive Assistant'],
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

const EMPLOYMENT_TYPES = [
  "Full-time",
  "Part-time", 
  "Event",
  "Contract",
  "Seasonal"
] as const;

async function main() {
  // Create a demo employer
  const employer = await prisma.user.upsert({
          where: { email: 'employer@thebellregistry.com' },
    update: {},
    create: {
              email: 'employer@thebellregistry.com',
      firstName: 'Victoria',
      lastName: 'Bell',
      role: UserRole.EMPLOYER,
      isDemo: true,
      employerProfile: {
        create: {
          companyName: 'The Bell Registry',
          industry: 'Private Service',
          location: 'New York, NY',
          description: 'A premier domestic staffing agency specializing in placement for UHNW households.'
        }
      }
    }
  })

  // Create professionals
  console.log('Creating demo professionals...')
  for (let i = 0; i < professionals.length; i++) {
    const prof = professionals[i];
    const email = `${prof.firstName.toLowerCase()}.${prof.lastName.toLowerCase()}@gmail.com`
    const profileSlug = `${prof.firstName.toLowerCase()}-${prof.lastName.toLowerCase()}`
    
    // Assign employment type based on professional role (with some variety)
    let employmentType: string;
    if (prof.preferredRole.includes('Event') || prof.preferredRole.includes('Yacht') || prof.preferredRole.includes('Jet')) {
      employmentType = i % 2 === 0 ? 'Event' : 'Contract';
    } else if (prof.preferredRole.includes('Seasonal') || prof.preferredRole.includes('Caretaker')) {
      employmentType = 'Seasonal';
    } else if (prof.preferredRole.includes('Assistant') && i % 3 === 0) {
      employmentType = 'Part-time';
    } else {
      employmentType = i % 4 === 0 ? 'Contract' : 'Full-time';
    }
    
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
              payType: 'Salary',
              employmentType: employmentType,
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
            payType: 'Salary',
            employmentType: employmentType,
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
  const jobs: Job[] = []
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
        professionalRole: (professionalRoles as Record<string, string>)[title.split(' - ')[0]] || title.split(' - ')[0],
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