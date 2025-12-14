import { prisma } from './prisma'; // Assuming prisma client is exported from 'lib/prisma'
import { 
  PERMISSIONS,
  roleHasPermission,
  type Permission,
  type SystemRole,
  type SchoolRole
} from './constants';

// Re-export the Permission type for use in other modules
export type { Permission } from './constants';

/**
 * Checks if a user has a specific system-level permission.
 * @param userId The ID of the user to check.
 * @param permissionName The name of the permission required (e.g., 'CREATE_SCHOOL').
 * @returns True if the user has the permission via their system role, false otherwise.
 */
export async function checkSystemPermission(userId: string, permissionName: Permission): Promise<boolean> {
  if (!userId || !permissionName) {
    return false;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        systemRole: true,
      },
    });

    if (!user?.systemRole) {
      return false;
    }

    // Check if the user's system role has the required permission
    return roleHasPermission(user.systemRole as SystemRole, permissionName);

  } catch (error) {
    console.error(`Error checking system permission '${permissionName}' for user ${userId}:`, error);
    return false; // Fail safely
  }
}

/**
 * Checks if a user has a specific permission within the context of a school.
 * @param userId The ID of the user to check.
 * @param schoolId The ID of the school context.
 * @param permissionName The name of the permission required ('MANAGE_SCHOOL' or 'MANAGE_ASSIGNMENTS').
 * @returns True if the user has the permission via their role in that specific school, false otherwise.
 */
export async function checkSchoolPermission(userId: string, schoolId: string, permissionName: Permission): Promise<boolean> {
  console.log(`checkSchoolPermission: Checking permission '${permissionName}' for user ${userId} in school ${schoolId}`);
  
  if (!userId || !schoolId || !permissionName) {
    console.log(`checkSchoolPermission: Missing parameters - userId: ${userId}, schoolId: ${schoolId}, permissionName: ${permissionName}`);
    return false;
  }

  try {
    const membership = await prisma.schoolMembership.findUnique({
      where: {
        userId_schoolId: { userId, schoolId },
      },
      select: {
        isActive: true,
        role: true,
      },
    });

    console.log(`checkSchoolPermission: Found membership for user ${userId} in school ${schoolId}:`, membership);

    if (!membership?.isActive || !membership?.role) {
      console.log(`checkSchoolPermission: No active membership found for user ${userId} in school ${schoolId}`);
      return false;
    }

    // Check if the user's school role has the required permission
    const hasPermission = roleHasPermission(membership.role as SchoolRole, permissionName);
    console.log(`checkSchoolPermission: Role '${membership.role}' has permission '${permissionName}': ${hasPermission}`);
    
    return hasPermission;

  } catch (error) {
    console.error(`Error checking school permission '${permissionName}' for user ${userId} in school ${schoolId}:`, error);
    return false; // Fail safely
  }
}

/**
 * Checks if a user can manage school (admin functions).
 * Convenience function for checking MANAGE_SCHOOL permission.
 * @param userId The ID of the user to check.
 * @param schoolId The ID of the school context.
 * @returns True if the user can manage the school, false otherwise.
 */
export async function canManageSchool(userId: string, schoolId: string): Promise<boolean> {
  return checkSchoolPermission(userId, schoolId, PERMISSIONS.MANAGE_SCHOOL);
}

/**
 * Checks if a user can manage assignments (teacher functions).
 * Convenience function for checking MANAGE_ASSIGNMENTS permission.
 * @param userId The ID of the user to check.
 * @param schoolId The ID of the school context.
 * @returns True if the user can manage assignments, false otherwise.
 */
export async function canManageAssignments(userId: string, schoolId: string): Promise<boolean> {
  return checkSchoolPermission(userId, schoolId, PERMISSIONS.MANAGE_ASSIGNMENTS);
}

/**
 * Gets all schools where a user has a specific permission.
 * Useful for determining which schools a user can manage.
 * @param userId The ID of the user to check.
 * @param permissionName The name of the permission required.
 * @returns Array of school IDs where the user has the permission.
 */
export async function getUserSchoolsWithPermission(userId: string, permissionName: Permission): Promise<string[]> {
  if (!userId || !permissionName) {
    return [];
  }

  try {
    const memberships = await prisma.schoolMembership.findMany({
      where: {
        userId,
        isActive: true,
      },
      select: {
        schoolId: true,
        role: true,
      },
    });

    // Filter memberships where the role has the required permission
    const validSchoolIds = memberships
      .filter(membership => roleHasPermission(membership.role as SchoolRole, permissionName))
      .map(membership => membership.schoolId);

    return validSchoolIds;

  } catch (error) {
    console.error(`Error getting schools with permission '${permissionName}' for user ${userId}:`, error);
    return [];
  }
}

/**
 * Checks if a username is unique within a specific school.
 * @param username The username to check.
 * @param schoolId The ID of the school context.
 * @param excludeUserId Optional user ID to exclude from the check (for updates).
 * @returns True if the username is unique within the school, false otherwise.
 */
export async function isUsernameUniqueInSchool(username: string, schoolId: string, excludeUserId?: string): Promise<boolean> {
  if (!username || !schoolId) {
    return false;
  }

  try {
    const existingUser = await prisma.user.findFirst({
      where: {
        username,
        id: excludeUserId ? { not: excludeUserId } : undefined,
        schoolMemberships: {
          some: {
            schoolId,
            isActive: true,
          },
        },
      },
    });

    return !existingUser;

  } catch (error) {
    console.error(`Error checking username uniqueness for '${username}' in school ${schoolId}:`, error);
    return false;
  }
}

// Legacy function for backward compatibility - now redirects to school permission
export async function checkOrgPermission(userId: string, organizationId: string, permissionName: string): Promise<boolean> {
  console.warn('checkOrgPermission is deprecated. Use checkSchoolPermission instead.');
  return checkSchoolPermission(userId, organizationId, permissionName as Permission);
}

// We can add requireSystemPermission and requireOrgPermission wrapper functions here later 