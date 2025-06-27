export type RoleContent = {
  descriptions: string[];
  requirements: string[];
};

export const roleSpecificContent: Record<string, RoleContent> = {
  'Head Gardener': {
    descriptions: [
      'Seeking an experienced Head Gardener to manage extensive estate grounds. The role involves landscape maintenance, garden design, and staff supervision.',
      'Our client requires a skilled Head Gardener to oversee multiple gardens. The position includes seasonal planning and sustainable practices.',
      'A private estate is seeking a Head Gardener to maintain formal gardens. The role involves plant care, design implementation, and team leadership.'
    ],
    requirements: [
      'Advanced degree in Horticulture or related field',
      'Minimum 7 years experience in estate gardening',
      'Expert knowledge of plant care and maintenance',
      'Experience managing gardening staff',
      'Proficiency in landscape design software',
      'Knowledge of irrigation systems',
      'Pesticide application certification',
      'Equipment maintenance expertise'
    ]
  },
  'Driver': {
    descriptions: [
      'Seeking a professional Driver for a high-profile family. The role involves safe transportation and maintaining luxury vehicles.',
      'Our client requires an experienced Driver with security awareness. The position includes international driving and travel coordination.',
      'A private household is seeking a Driver with executive transportation experience. The role involves schedule management and vehicle maintenance.'
    ],
    requirements: [
      'Valid driver\'s license with perfect record',
      'Minimum 5 years professional driving experience',
      'Advanced driving certifications',
      'Knowledge of luxury vehicle maintenance',
      'Security awareness training',
      'International driving experience',
      'First aid and CPR certification',
      'Flexible schedule availability'
    ]
  },
  'Nanny': {
    descriptions: [
      'Seeking an experienced Nanny for a private family. The role involves childcare, activity planning, and developmental support.',
      'Our client requires a professional Nanny with newborn experience. The position includes daily care routines and educational activities.',
      'A family is seeking a Nanny to provide dedicated childcare. The role involves schedule management and activity coordination.'
    ],
    requirements: [
      'Degree in Early Childhood Education or related field',
      'Minimum 5 years professional nanny experience',
      'Current First Aid and CPR certification',
      'Experience with multiple age groups',
      'Strong understanding of child development',
      'Valid driver\'s license',
      'Swimming certification preferred',
      'Ability to travel with family'
    ]
  },
  'Family Assistant': {
    descriptions: [
      'Seeking a Family Assistant to support daily operations. The role involves calendar management, errands, and family support.',
      'Our client requires a Family Assistant to coordinate activities. The position includes household organization and schedule coordination.',
      'A private family is seeking an Assistant to manage daily tasks. The role involves personal shopping and family logistics.'
    ],
    requirements: [
      'Minimum 3 years family assistant experience',
      'Strong organizational and planning skills',
      'Valid driver\'s license and clean record',
      'Experience with calendar management',
      'Knowledge of household operations',
      'Excellent communication abilities',
      'Flexibility for varied schedules',
      'Basic budgeting skills'
    ]
  },
  'Personal Assistant': {
    descriptions: [
      'Seeking a Personal Assistant for a high-profile individual. The role involves complex scheduling and personal task management.',
      'Our client requires an experienced Personal Assistant. The position includes travel coordination and lifestyle management.',
      'A UHNW individual is seeking a Personal Assistant. The role involves daily support and project coordination.'
    ],
    requirements: [
      'Minimum 5 years personal assistant experience',
      'Strong technical and organizational skills',
      'Experience with travel arrangements',
      'Knowledge of luxury lifestyle services',
      'Excellent written communication',
      'Project management abilities',
      'Discretion and confidentiality',
      'Flexibility for on-call duties'
    ]
  },
  'Estate Couple': {
    descriptions: [
      'Seeking an experienced Estate Couple to manage a private property. The role involves property maintenance and household management.',
      'Our client requires a professional Estate Couple for their seasonal residence. The position includes caretaking and staff supervision.',
      'A luxury estate is seeking an Estate Couple to oversee operations. The role involves property maintenance and household coordination.'
    ],
    requirements: [
      'Minimum 7 years combined estate experience',
      'Strong maintenance and housekeeping skills',
      'Experience managing staff and vendors',
      'Valid drivers\' licenses for both',
      'Knowledge of property management',
      'Household management expertise',
      'Flexibility to live on property',
      'Emergency response capabilities'
    ]
  },
  'Property Caretaker': {
    descriptions: [
      'Seeking a Property Caretaker for a private estate. The role involves maintenance oversight and security monitoring.',
      'Our client requires an experienced Caretaker for their seasonal property. The position includes maintenance coordination and property checks.',
      'A luxury residence is seeking a Property Caretaker. The role involves general maintenance and property preservation.'
    ],
    requirements: [
      'Minimum 5 years caretaking experience',
      'Strong maintenance and repair skills',
      'Knowledge of security systems',
      'Valid driver\'s license',
      'Emergency response training',
      'Experience with vendor management',
      'Ability to live on property',
      'Physical capability for manual tasks'
    ]
  },
  'Personal Chef': {
    descriptions: [
      'Seeking a Personal Chef for a private family. The role involves menu planning and dietary accommodation.',
      'Our client requires an experienced Personal Chef for daily meal preparation. The position includes shopping and kitchen management.',
      'A family is seeking a Personal Chef with diverse culinary expertise. The role involves customized meal planning and preparation.'
    ],
    requirements: [
      'Culinary degree or equivalent experience',
      'Minimum 5 years personal chef experience',
      'Knowledge of dietary restrictions',
      'Food safety certification',
      'Menu planning expertise',
      'Experience with organic cooking',
      'Strong organizational skills',
      'Flexibility with scheduling'
    ]
  },
  'Event Chef': {
    descriptions: [
      'Seeking an Event Chef for high-profile gatherings. The role involves menu design and event execution.',
      'Our client requires an experienced Event Chef for formal entertaining. The position includes staff supervision and event planning.',
      'A private estate is seeking an Event Chef for special occasions. The role involves creative presentation and guest satisfaction.'
    ],
    requirements: [
      'Culinary degree and event experience',
      'Minimum 7 years catering experience',
      'Experience with large-scale events',
      'Staff management expertise',
      'Food safety certification',
      'Creative presentation skills',
      'Budget management ability',
      'Flexible schedule for events'
    ]
  },
  'Drop-Off Chef': {
    descriptions: [
      'Seeking a Drop-Off Chef for weekly meal service. The role involves menu planning and meal preparation.',
      'Our client requires a Chef for prepared meal delivery. The position includes dietary customization and portion planning.',
      'A family is seeking a Drop-Off Chef for regular meal service. The role involves nutritional planning and food preparation.'
    ],
    requirements: [
      'Culinary training and certification',
      'Minimum 3 years meal prep experience',
      'Knowledge of nutrition and dietary needs',
      'Food safety certification',
      'Experience with meal planning',
      'Strong organizational skills',
      'Valid driver\'s license',
      'Reliable transportation'
    ]
  },
  'Seasonal Chef': {
    descriptions: [
      'Seeking a Seasonal Chef for a summer residence. The role involves menu planning and event catering.',
      'Our client requires a Chef for their seasonal property. The position includes staff supervision and kitchen management.',
      'A private estate is seeking a Seasonal Chef. The role involves menu creation and formal entertaining.'
    ],
    requirements: [
      'Culinary degree and seasonal experience',
      'Minimum 5 years private chef experience',
      'Experience with formal service',
      'Staff management expertise',
      'Food safety certification',
      'Wine pairing knowledge',
      'Flexibility to relocate seasonally',
      'Event planning experience'
    ]
  },
  'Office Chef': {
    descriptions: [
      'Seeking an Office Chef for a corporate environment. The role involves menu planning and meal service.',
      'Our client requires a Chef for their corporate dining program. The position includes staff management and budget oversight.',
      'A family office is seeking an Office Chef. The role involves daily meal preparation and catering services.'
    ],
    requirements: [
      'Culinary degree and corporate experience',
      'Minimum 5 years professional cooking experience',
      'Experience with volume cooking',
      'Staff management expertise',
      'Food safety certification',
      'Budget management skills',
      'Knowledge of dietary restrictions',
      'Corporate catering experience'
    ]
  },
  'Yacht Chef': {
    descriptions: [
      'Seeking a Yacht Chef for a luxury vessel. The role involves menu planning and provisioning at sea.',
      'Our client requires an experienced Chef for their private yacht. The position includes international cuisine and guest satisfaction.',
      'A private owner is seeking a Yacht Chef. The role involves creative menu design and formal service.'
    ],
    requirements: [
      'Maritime culinary certification',
      'Minimum 5 years yacht chef experience',
      'STCW certification',
      'International cuisine expertise',
      'Provisioning experience',
      'Knowledge of food storage at sea',
      'Wine and beverage service',
      'Ability for extended travel'
    ]
  },
  'Jet Chef': {
    descriptions: [
      'Seeking a Private Jet Chef for international flights. The role involves menu planning and in-flight service.',
      'Our client requires an experienced Chef for their private aircraft. The position includes meal preparation and service coordination.',
      'A UHNW family is seeking a Jet Chef. The role involves high-altitude cooking and menu customization.'
    ],
    requirements: [
      'Culinary degree and aviation experience',
      'Minimum 5 years private aviation experience',
      'Knowledge of high-altitude cooking',
      'Food safety certification',
      'International cuisine expertise',
      'Experience with limited space cooking',
      'Valid passport',
      'Flexibility for international travel'
    ]
  },
  'Family Office COO': {
    descriptions: [
      'Seeking a Family Office COO to oversee operations. The role involves strategic planning and team leadership.',
      'Our client requires an experienced COO for their family office. The position includes operational oversight and process improvement.',
      'A UHNW family is seeking a COO. The role involves managing complex family office operations.'
    ],
    requirements: [
      'MBA or advanced degree',
      'Minimum 15 years executive experience',
      'Family office expertise',
      'Strong financial acumen',
      'Strategic planning skills',
      'Team leadership experience',
      'Process improvement expertise',
      'Multi-entity management experience'
    ]
  },
  'Administrative Assistant': {
    descriptions: [
      'Seeking an Administrative Assistant for a family office. The role involves office management and administrative support.',
      'Our client requires an experienced Administrative Assistant. The position includes document management and communication coordination.',
      'A private office is seeking an Administrative Assistant. The role involves calendar management and office operations.'
    ],
    requirements: [
      'Minimum 5 years administrative experience',
      'Strong technical skills',
      'Experience with office management',
      'Excellent organizational abilities',
      'Proficiency in MS Office Suite',
      'Communication skills',
      'Multi-tasking capabilities',
      'Attention to detail'
    ]
  },
  'Office Manager': {
    descriptions: [
      'Seeking an Office Manager for a family office. The role involves operational oversight and team coordination.',
      'Our client requires an experienced Office Manager. The position includes administrative leadership and process improvement.',
      'A private office is seeking an Office Manager. The role involves staff supervision and office operations.'
    ],
    requirements: [
      'Minimum 7 years office management experience',
      'Strong leadership abilities',
      'Experience with process improvement',
      'Staff supervision expertise',
      'Budget management skills',
      'Technology proficiency',
      'Vendor management experience',
      'Project management capabilities'
    ]
  },
  'Human Resources Director': {
    descriptions: [
      'Seeking an HR Director for a family office. The role involves HR strategy and staff development.',
      'Our client requires an experienced HR Director. The position includes policy development and employee relations.',
      'A private organization is seeking an HR Director. The role involves recruitment and HR management.'
    ],
    requirements: [
      'Advanced degree in HR or related field',
      'Minimum 10 years HR experience',
      'SHRM certification',
      'Experience in private service',
      'Knowledge of employment law',
      'Strong interpersonal skills',
      'Policy development expertise',
      'Recruitment and retention experience'
    ]
  },
  'Director of Residences': {
    descriptions: [
      'Seeking a Director of Residences to oversee multiple properties. The role involves property management and staff coordination.',
      'Our client requires an experienced Director of Residences. The position includes operational oversight and standards maintenance.',
      'A UHNW family is seeking a Director of Residences. The role involves property portfolio management.'
    ],
    requirements: [
      'Minimum 10 years luxury property management',
      'Multi-property management experience',
      'Staff leadership expertise',
      'Strong project management skills',
      'Budget oversight experience',
      'Vendor management proficiency',
      'Knowledge of luxury standards',
      'International property experience'
    ]
  },
  'Estate Hospitality Manager': {
    descriptions: [
      'Seeking an Estate Hospitality Manager for a luxury property. The role involves guest services and event coordination.',
      'Our client requires an experienced Hospitality Manager. The position includes service standards and staff training.',
      'A private estate is seeking a Hospitality Manager. The role involves guest experience and event management.'
    ],
    requirements: [
      'Degree in Hospitality Management',
      'Minimum 7 years luxury hospitality experience',
      'Event planning expertise',
      'Staff training experience',
      'Knowledge of formal service',
      'Strong guest relations skills',
      'Wine and beverage knowledge',
      'International protocol experience'
    ]
  },
  'Estate IT Director': {
    descriptions: [
      'Seeking an IT Director for a private estate. The role involves technology management and security oversight.',
      'Our client requires an experienced IT Director. The position includes system administration and cybersecurity.',
      'A UHNW family is seeking an IT Director. The role involves technology infrastructure and support.'
    ],
    requirements: [
      'Advanced degree in IT or related field',
      'Minimum 10 years IT management experience',
      'Cybersecurity expertise',
      'Network administration skills',
      'Smart home technology experience',
      'Project management capabilities',
      'Vendor management experience',
      'On-call availability'
    ]
  },
  'Estate Security Director': {
    descriptions: [
      'Seeking a Security Director for a private estate. The role involves security operations and team management.',
      'Our client requires an experienced Security Director. The position includes risk assessment and protocol development.',
      'A UHNW family is seeking a Security Director. The role involves comprehensive security management.'
    ],
    requirements: [
      'Law enforcement or military background',
      'Minimum 10 years security management',
      'Advanced security certifications',
      'Team leadership experience',
      'Risk assessment expertise',
      'Technology systems knowledge',
      'Emergency response planning',
      'International security experience'
    ]
  },
  'Director of Real Estate and Construction': {
    descriptions: [
      'Seeking a Director of Real Estate and Construction for multiple properties. The role involves project oversight and development management.',
      'Our client requires an experienced Real Estate Director. The position includes construction management and property acquisition.',
      'A UHNW family is seeking a Real Estate Director. The role involves portfolio management and development projects.'
    ],
    requirements: [
      'Advanced degree in Real Estate or Construction',
      'Minimum 15 years industry experience',
      'Real estate license required',
      'Construction management expertise',
      'Project development experience',
      'Strong financial acumen',
      'Vendor management skills',
      'International project experience'
    ]
  },
  'Construction Manager': {
    descriptions: [
      'Seeking a Construction Manager for luxury properties. The role involves project oversight and contractor management.',
      'Our client requires an experienced Construction Manager. The position includes renovation management and quality control.',
      'A private estate is seeking a Construction Manager. The role involves project coordination and timeline management.'
    ],
    requirements: [
      'Degree in Construction Management',
      'Minimum 10 years luxury construction',
      'Project management certification',
      'Contractor management experience',
      'Budget oversight expertise',
      'Knowledge of high-end finishes',
      'Strong technical knowledge',
      'Quality control experience'
    ]
  },
  'Facilities Manager': {
    descriptions: [
      'Seeking a Facilities Manager for a luxury estate. The role involves systems maintenance and vendor coordination.',
      'Our client requires an experienced Facilities Manager. The position includes preventive maintenance and operations oversight.',
      'A private property is seeking a Facilities Manager. The role involves infrastructure management and maintenance planning.'
    ],
    requirements: [
      'Degree in Facilities Management',
      'Minimum 7 years facilities experience',
      'Technical systems knowledge',
      'Preventive maintenance expertise',
      'Vendor management skills',
      'Emergency response capability',
      'Budget management experience',
      'On-call availability'
    ]
  },
  'Property Manager': {
    descriptions: [
      'Seeking a Property Manager for a luxury residence. The role involves operations oversight and maintenance coordination.',
      'Our client requires an experienced Property Manager. The position includes vendor management and property preservation.',
      'A private estate is seeking a Property Manager. The role involves daily operations and staff supervision.'
    ],
    requirements: [
      'Property Management certification',
      'Minimum 5 years luxury property experience',
      'Staff supervision expertise',
      'Vendor management skills',
      'Maintenance coordination experience',
      'Budget management ability',
      'Strong organizational skills',
      'Emergency response capability'
    ]
  },
  'Landscape Director': {
    descriptions: [
      'Seeking a Landscape Director for extensive grounds. The role involves design implementation and team management.',
      'Our client requires an experienced Landscape Director. The position includes project management and sustainability planning.',
      'A private estate is seeking a Landscape Director. The role involves grounds maintenance and garden development.'
    ],
    requirements: [
      'Degree in Landscape Architecture',
      'Minimum 10 years estate experience',
      'Design and planning expertise',
      'Staff management experience',
      'Project management skills',
      'Sustainability knowledge',
      'Budget oversight ability',
      'Seasonal planning expertise'
    ]
  }
}; 