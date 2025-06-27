export enum UserRole {
  PROFESSIONAL = "PROFESSIONAL",
  EMPLOYER = "EMPLOYER",
  AGENCY = "AGENCY",
  ADMIN = "ADMIN",
}

export const UserRoleValues = {
  PROFESSIONAL: UserRole.PROFESSIONAL,
  EMPLOYER: UserRole.EMPLOYER,
  AGENCY: UserRole.AGENCY,
  ADMIN: UserRole.ADMIN,
} as const;

export type User = {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
  image?: string;
};

// Admin-specific types
export enum ProfileStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  SUSPENDED = "SUSPENDED",
}

export enum JobAdminStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export type AdminAuditAction = 
  | "PROFILE_APPROVED"
  | "PROFILE_REJECTED"
  | "PROFILE_SUSPENDED"
  | "JOB_APPROVED"
  | "JOB_REJECTED"
  | "USER_SUSPENDED"
  | "USER_DELETED"
  | "ADMIN_LOGIN"
  | "ADMIN_LOGOUT";

export interface AdminAuditLog {
  id: string;
  adminId: string;
  action: AdminAuditAction;
  targetId?: string;
  targetType?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export interface AdminStats {
  totalUsers: number;
  totalProfessionals: number;
  totalEmployers: number;
  pendingProfiles: number;
  pendingJobs: number;
  totalJobs: number;
  totalApplications: number;
  activeConversations: number;
}

export interface AdminUser extends User {
  role: UserRole.ADMIN;
  permissions: AdminPermission[];
}

export type AdminPermission = 
  | "MANAGE_PROFILES"
  | "MANAGE_JOBS"
  | "MANAGE_USERS"
  | "VIEW_ANALYTICS"
  | "SYSTEM_CONFIG"; 