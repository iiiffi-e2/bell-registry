import { NextRequest } from 'next/server';

interface ValidationErrorLog {
  timestamp: string;
  userId: string;
  userEmail: string;
  userRole: string;
  sessionId?: string;
  userAgent: string;
  ipAddress: string;
  validationErrors: Array<{
    field: string;
    message: string;
    value?: any;
    rule?: string;
  }>;
  formData: {
    providedFields: string[];
    missingRequiredFields: string[];
    fieldLengths: Record<string, number>;
  };
  context: {
    profileType: 'candidate' | 'employer' | 'agency';
    attemptNumber?: number;
    timeOnPage?: number;
    referrer?: string;
  };
  searchable: {
    errorTypes: string[];
    commonIssues: string[];
    userSegment: string;
  };
}

/**
 * Logs validation errors with comprehensive context for analysis
 */
export function logValidationErrors(
  session: any,
  validationErrors: any,
  formData: any,
  req: NextRequest,
  context: {
    profileType: 'candidate' | 'employer' | 'agency';
    attemptNumber?: number;
    timeOnPage?: number;
    referrer?: string;
  }
) {
  try {
    const ipAddress = req.ip || 
      req.headers.get('x-forwarded-for') || 
      req.headers.get('x-real-ip') || 
      'unknown';
    
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const sessionId = req.headers.get('x-session-id') || undefined;
    
    // Parse validation errors into structured format
    const structuredErrors = Object.entries(validationErrors).map(([field, error]: [string, any]) => ({
      field,
      message: error?.message || 'Unknown error',
      value: formData[field] || null,
      rule: extractValidationRule(error?.message || ''),
    }));

    // Analyze form data completeness
    const providedFields = Object.keys(formData).filter(key => 
      formData[key] !== null && 
      formData[key] !== undefined && 
      formData[key] !== ''
    );
    
    const missingRequiredFields = getMissingRequiredFields(formData, context.profileType);
    
    const fieldLengths = Object.entries(formData).reduce((acc, [key, value]) => {
      if (typeof value === 'string') {
        acc[key] = value.length;
      }
      return acc;
    }, {} as Record<string, number>);

    // Categorize error types for easy searching
    const errorTypes = categorizeErrorTypes(structuredErrors);
    const commonIssues = identifyCommonIssues(structuredErrors, formData);
    const userSegment = categorizeUserSegment(session, formData);

    const logEntry: ValidationErrorLog = {
      timestamp: new Date().toISOString(),
      userId: session.user.id,
      userEmail: session.user.email,
      userRole: session.user.role,
      sessionId,
      userAgent,
      ipAddress,
      validationErrors: structuredErrors,
      formData: {
        providedFields,
        missingRequiredFields,
        fieldLengths,
      },
      context,
      searchable: {
        errorTypes,
        commonIssues,
        userSegment,
      },
    };

    // Log in a structured format that's easy to search
    console.log(`[VALIDATION_ERROR] ${JSON.stringify(logEntry)}`);
    
    // Also log a simplified version for quick scanning
    console.log(`[VALIDATION_SUMMARY] User: ${session.user.email} | Role: ${session.user.role} | Errors: ${structuredErrors.length} | Types: ${errorTypes.join(', ')} | Issues: ${commonIssues.join(', ')}`);
    
    return logEntry;
  } catch (error) {
    console.error('[VALIDATION_LOGGER_ERROR]', error);
  }
}

/**
 * Extract validation rule from error message
 */
function extractValidationRule(message: string): string {
  const rules: Record<string, string> = {
    'required': 'REQUIRED_FIELD',
    'minimum': 'MIN_LENGTH',
    'maximum': 'MAX_LENGTH',
    'invalid': 'INVALID_FORMAT',
    'regex': 'PATTERN_MISMATCH',
    'email': 'INVALID_EMAIL',
    'url': 'INVALID_URL',
  };
  
  for (const [key, rule] of Object.entries(rules)) {
    if (message.toLowerCase().includes(key)) {
      return rule;
    }
  }
  
  return 'CUSTOM_VALIDATION';
}

/**
 * Get missing required fields based on profile type
 */
function getMissingRequiredFields(formData: any, profileType: string): string[] {
  const requiredFields: Record<string, string[]> = {
    candidate: ['firstName', 'lastName', 'preferredRole', 'location', 'bio'],
    employer: ['description', 'location'],
    agency: ['companyName', 'description', 'location'],
  };
  
  const fields = requiredFields[profileType] || [];
  return fields.filter(field => !formData[field] || formData[field].toString().trim() === '');
}

/**
 * Categorize error types for easy searching
 */
function categorizeErrorTypes(errors: any[]): string[] {
  const types = new Set<string>();
  
  errors.forEach(error => {
    if (error.rule) {
      types.add(error.rule);
    }
    if (error.message.includes('required')) {
      types.add('REQUIRED_FIELD');
    }
    if (error.message.includes('minimum') || error.message.includes('at least')) {
      types.add('MIN_LENGTH');
    }
    if (error.message.includes('maximum') || error.message.includes('too long')) {
      types.add('MAX_LENGTH');
    }
  });
  
  return Array.from(types);
}

/**
 * Identify common issues for pattern analysis
 */
function identifyCommonIssues(errors: any[], formData: any): string[] {
  const issues: string[] = [];
  
  // Check for incomplete profiles
  const requiredFields = ['firstName', 'lastName', 'preferredRole', 'location', 'bio'];
  const missingRequired = requiredFields.filter(field => 
    !formData[field] || formData[field].toString().trim() === ''
  );
  
  if (missingRequired.length > 2) {
    issues.push('INCOMPLETE_PROFILE');
  }
  
  // Check for bio length issues
  if (formData.bio && formData.bio.length < 50) {
    issues.push('SHORT_BIO');
  }
  
  // Check for name issues
  if (errors.some(e => e.field === 'firstName' || e.field === 'lastName')) {
    issues.push('NAME_VALIDATION');
  }
  
  // Check for location issues
  if (errors.some(e => e.field === 'location')) {
    issues.push('LOCATION_VALIDATION');
  }
  
  // Check for role selection issues
  if (errors.some(e => e.field === 'preferredRole')) {
    issues.push('ROLE_SELECTION');
  }
  
  return issues;
}

/**
 * Categorize user segment for analysis
 */
function categorizeUserSegment(session: any, formData: any): string {
  if (session.user.role === 'EMPLOYER') return 'EMPLOYER';
  if (session.user.role === 'AGENCY') return 'AGENCY';
  
  // For candidates, segment by profile completeness
  const requiredFields = ['firstName', 'lastName', 'preferredRole', 'location', 'bio'];
  const completedFields = requiredFields.filter(field => 
    formData[field] && formData[field].toString().trim() !== ''
  );
  
  if (completedFields.length === 0) return 'NEW_CANDIDATE';
  if (completedFields.length < 3) return 'PARTIAL_CANDIDATE';
  if (completedFields.length >= 3) return 'ACTIVE_CANDIDATE';
  
  return 'UNKNOWN';
}

/**
 * Helper function to create searchable log queries
 */
export function createSearchQueries() {
  return {
    // Common search patterns for analysis
    allValidationErrors: 'grep "[VALIDATION_ERROR]" logs/app.log',
    errorByType: (type: string) => `grep "VALIDATION_ERROR" logs/app.log | grep "${type}"`,
    errorByUserRole: (role: string) => `grep "VALIDATION_ERROR" logs/app.log | grep '"userRole":"${role}"'`,
    errorByField: (field: string) => `grep "VALIDATION_ERROR" logs/app.log | grep '"field":"${field}"'`,
    incompleteProfiles: 'grep "INCOMPLETE_PROFILE" logs/app.log',
    shortBioIssues: 'grep "SHORT_BIO" logs/app.log',
    locationIssues: 'grep "LOCATION_VALIDATION" logs/app.log',
    
    // Summary queries
    errorSummary: 'grep "[VALIDATION_SUMMARY]" logs/app.log',
    topErrorTypes: 'grep "[VALIDATION_ERROR]" logs/app.log | jq -r ".searchable.errorTypes[]" | sort | uniq -c | sort -nr',
    topCommonIssues: 'grep "[VALIDATION_ERROR]" logs/app.log | jq -r ".searchable.commonIssues[]" | sort | uniq -c | sort -nr',
  };
}
