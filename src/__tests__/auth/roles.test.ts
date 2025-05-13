import { UserRole } from "@/types";
import { toPrismaUserRole, fromPrismaUserRole } from "@/lib/prisma-types";
import { describe, it, expect } from "vitest";

describe("Role Type Conversions", () => {
  it("should correctly convert local UserRole to Prisma UserRole", () => {
    const roles = [
      UserRole.PROFESSIONAL,
      UserRole.EMPLOYER,
      UserRole.AGENCY,
      UserRole.ADMIN,
    ];

    roles.forEach(role => {
      const prismaRole = toPrismaUserRole(role);
      expect(prismaRole).toBe(role);
    });
  });

  it("should correctly convert Prisma UserRole to local UserRole", () => {
    const prismaRoles = [
      "PROFESSIONAL",
      "EMPLOYER",
      "AGENCY",
      "ADMIN",
    ] as const;

    prismaRoles.forEach(role => {
      const localRole = fromPrismaUserRole(role);
      expect(localRole).toBe(role);
    });
  });
});

describe("Role Type Safety", () => {
  it("should not allow invalid role values", () => {
    // @ts-expect-error - Testing type safety
    const invalidRole: UserRole = "INVALID_ROLE";
    
    // This should still work at runtime due to the type casting
    const prismaRole = toPrismaUserRole(invalidRole);
    expect(prismaRole).toBe("INVALID_ROLE");
  });
}); 