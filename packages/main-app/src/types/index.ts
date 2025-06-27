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