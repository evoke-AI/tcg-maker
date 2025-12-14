import { getServerSession } from 'next-auth'
import { authOptions } from '../app/api/auth/[...nextauth]/options'
import { prisma } from './prisma'
import { redirect } from 'next/navigation'
import { 
  checkSystemPermission, 
  checkSchoolPermission,
  type Permission
} from './permissions'
import { PERMISSIONS } from './constants'

/**
 * Validates session and redirects appropriately based on authentication state.
 * This prevents redirect loops when a user has a valid session but was deleted from the database.
 * 
 * @returns {Promise<{ userId: string }>} - The user ID if authenticated and user exists.
 * @throws {never} - Redirects to /login if no session exists.
 * @throws {never} - Redirects to signout if user is deleted or inactive.
 */
export async function requireAuthWithSignout(): Promise<{ userId: string }> {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id || session.user.id === '') {
    console.log('requireAuthWithSignout: No session or invalid session detected.')
    redirect('/login')
  }

  const userId = session.user.id

  // Check if user exists and is active (this should now be handled by NextAuth callbacks)
  // But we keep this as a safety check
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, isActive: true }
  })

  if (!user) {
    console.log(`requireAuthWithSignout: User ${userId} not found in database, signing out`)
    redirect('/api/auth/signout?callbackUrl=/login')
  }

  if (!user.isActive) {
    console.log(`requireAuthWithSignout: User ${userId} is inactive, signing out`)
    redirect('/api/auth/signout?callbackUrl=/login')
  }

  console.log(`requireAuthWithSignout: User ${userId} authenticated successfully.`)
  return { userId }
}

/**
 * Requires authentication and returns the authenticated user's ID.
 * 
 * @returns {Promise<{ userId: string }>} - The user ID if authenticated.
 * @throws {Error} - 'Unauthenticated' if no session exists.
 * @throws {Error} - 'Inactive or deleted user' if the user is inactive or doesn't exist.
 */
export async function requireAuth(): Promise<{ userId: string }> {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    console.log('requireAuth: No session found or session missing user ID.')
    throw new Error('Unauthenticated')
  }

  const userId = session.user.id

  // Check if user exists and is active
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, isActive: true }
  })

  if (!user) {
    console.log(`requireAuth: User ${userId} not found in database.`)
    throw new Error('Inactive or deleted user')
  }

  if (!user.isActive) {
    console.log(`requireAuth: User ${userId} is inactive.`)
    throw new Error('Inactive or deleted user')
  }

  console.log(`requireAuth: User ${userId} authenticated successfully.`)
  return { userId }
}

/**
 * Requires a specific system-level permission.
 * 
 * @param {string} permissionName - The name of the system permission required.
 * 
 * @returns {Promise<{ userId: string }>} - The user ID if authenticated and authorized.
 * @throws {Error} - 'Unauthenticated' if no session exists.
 * @throws {Error} - 'Inactive or deleted user' if the user is inactive or doesn't exist.
 * @throws {Error} - 'Insufficient permissions' if the user lacks the system permission.
 */
export async function requireSystemPermission(permissionName: Permission): Promise<{ userId: string }> {
  const { userId } = await requireAuth()

  const hasPermission = await checkSystemPermission(userId, permissionName)

  if (!hasPermission) {
    console.log(`requireSystemPermission: User ${userId} lacks system permission '${permissionName}'.`)
    throw new Error('Insufficient permissions')
  }

  console.log(`requireSystemPermission: User ${userId} authorized for system permission '${permissionName}'.`)
  return { userId }
}

/**
 * Requires SUPER_ADMIN system role.
 * 
 * @returns {Promise<{ userId: string }>} - The user ID if authenticated and is SUPER_ADMIN.
 * @throws {Error} - 'Unauthenticated' if no session exists.
 * @throws {Error} - 'Inactive or deleted user' if the user is inactive or doesn't exist.
 * @throws {Error} - 'Insufficient permissions' if the user is not SUPER_ADMIN.
 */
export async function requireSuperAdmin(): Promise<{ userId: string }> {
  return requireSystemPermission(PERMISSIONS.CREATE_SCHOOL)
}

/**
 * Requires a specific school-level permission.
 * 
 * @param {string} schoolId - The ID of the school context.
 * @param {string} permissionName - The name of the school permission required ('MANAGE_SCHOOL' or 'MANAGE_ASSIGNMENTS').
 * 
 * @returns {Promise<{ userId: string }>} - The user ID if authenticated and authorized.
 * @throws {Error} - 'Unauthenticated' if no session exists.
 * @throws {Error} - 'Inactive or deleted user' if the user is inactive or doesn't exist.
 * @throws {Error} - 'Insufficient permissions' if the user lacks the permission in the specified school.
 */

export async function requireSchoolPermission(schoolId: string, permissionName: Permission): Promise<{ userId: string }> {
  console.log(`requireSchoolPermission: Starting check for permission '${permissionName}' in school '${schoolId}'`);
  
  const { userId } = await requireAuth()
  console.log(`requireSchoolPermission: User ${userId} authenticated`);

  if (!schoolId) {
    console.error('requireSchoolPermission: schoolId was not provided.');
    throw new Error('School context is required for this permission check.');
  }

  // SIMPLIFIED LOGIC: Check if user is SUPER_ADMIN first
  const isSuperAdmin = await checkSystemPermission(userId, PERMISSIONS.CREATE_SCHOOL);
  console.log(`requireSchoolPermission: User ${userId} isSuperAdmin: ${isSuperAdmin}`);
  
  if (isSuperAdmin) {
    console.log(`requireSchoolPermission: User ${userId} authorized as SUPER_ADMIN for permission '${permissionName}' in school '${schoolId}'.`);
    return { userId };
  }

  // If not SUPER_ADMIN, check school-specific permissions
  console.log(`requireSchoolPermission: Checking school-specific permissions for user ${userId}`);
  const hasPermission = await checkSchoolPermission(userId, schoolId, permissionName);
  console.log(`requireSchoolPermission: User ${userId} hasPermission '${permissionName}' in school '${schoolId}': ${hasPermission}`);

  if (!hasPermission) {
    console.log(`requireSchoolPermission: User ${userId} lacks permission '${permissionName}' in school '${schoolId}'.`);
    throw new Error('Insufficient permissions');
  }

  console.log(`requireSchoolPermission: User ${userId} authorized for permission '${permissionName}' in school '${schoolId}'.`);
  return { userId };
}

/**
 * Gets all schools where the current user has a specific permission.
 * SIMPLIFIED: SUPER_ADMIN gets ALL schools.
 * 
 * @param {string} permissionName - The name of the permission required.
 * @returns {Promise<string[]>} - Array of school IDs where the user has the permission.
 */
export async function getUserManagedSchools(permissionName: Permission): Promise<string[]> {
  try {
    const { userId } = await requireAuth();
    
    // SIMPLIFIED: SUPER_ADMIN gets ALL schools
    const isSuperAdmin = await checkSystemPermission(userId, PERMISSIONS.CREATE_SCHOOL);
    if (isSuperAdmin) {
      const allSchools = await prisma.school.findMany({
        select: { id: true },
      });
      return allSchools.map(s => s.id);
    }
    
    // Otherwise get schools based on specific permissions
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

    // Filter based on role permissions using constants
    const validSchoolIds = memberships
      .filter(membership => {
        // Check if this role has the required permission
        if (permissionName === PERMISSIONS.MANAGE_SCHOOL) {
          return membership.role === 'ADMIN';
        }
        if (permissionName === PERMISSIONS.MANAGE_ASSIGNMENTS) {
          return membership.role === 'TEACHER' || membership.role === 'ADMIN';
        }
        return false;
      })
      .map(membership => membership.schoolId);

    return validSchoolIds;
    
  } catch (error) {
    console.error('Error getting managed schools:', error);
    return [];
  }
}

/**
 * Checks if the current user can manage a specific school.
 * SIMPLIFIED: SUPER_ADMIN can manage any school.
 * 
 * @param {string} schoolId - The ID of the school to check.
 * @param {string} permissionName - The permission required (defaults to 'MANAGE_SCHOOL').
 * @returns {Promise<boolean>} - True if the user can manage the school, false otherwise.
 */
export async function canManageSchool(schoolId: string, permissionName: Permission = PERMISSIONS.MANAGE_SCHOOL): Promise<boolean> {
  try {
    const { userId } = await requireAuth();
    
    // SIMPLIFIED: SUPER_ADMIN can manage any school
    const isSuperAdmin = await checkSystemPermission(userId, PERMISSIONS.CREATE_SCHOOL);
    if (isSuperAdmin) {
      return true;
    }
    
    // Otherwise check school-specific permissions
    await requireSchoolPermission(schoolId, permissionName);
    return true;
  } catch {
    return false;
  }
}

/**
 * Gets the current user's school memberships with roles.
 * 
 * @returns {Promise<Array>} - Array of school memberships with role information.
 */
export async function getUserSchoolMemberships(): Promise<Array<{
  schoolId: string;
  schoolName: string;
  schoolCode: string;
  roleName: string;
  roleType: string;
}>> {
  try {
    const { userId } = await requireAuth();
    
    const memberships = await prisma.schoolMembership.findMany({
      where: {
        userId,
        isActive: true,
      },
      select: {
        school: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        role: true,
      },
    });

    return memberships.map(membership => ({
      schoolId: membership.school.id,
      schoolName: membership.school.name,
      schoolCode: membership.school.code || '',
      roleName: membership.role,
      roleType: 'SCHOOL',
    }));
    
  } catch (error) {
    console.error('Error getting school memberships:', error);
    return [];
  }
}

/**
 * Validates that a username is unique within a school context.
 * 
 * @param {string} username - The username to validate.
 * @param {string} schoolId - The school context.
 * @param {string} excludeUserId - Optional user ID to exclude from the check.
 * @returns {Promise<boolean>} - True if username is unique within the school.
 */
export async function validateUsernameInSchool(username: string, schoolId: string, excludeUserId?: string): Promise<boolean> {
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
    console.error('Error validating username:', error);
    return false;
  }
}

// Legacy function for backward compatibility
export async function requireOrgPermission(organizationId: string, permissionName: Permission): Promise<{ userId: string }> {
  console.warn('requireOrgPermission is deprecated. Use requireSchoolPermission instead.');
  return requireSchoolPermission(organizationId, permissionName);
}

/**
 * Computes the full name in Hong Kong style: lastName + firstName
 * @param firstName User's first name
 * @param lastName User's last name
 * @returns Combined name in HK format
 */
export function computeHKName(firstName?: string | null, lastName?: string | null): string | null {
  if (!firstName && !lastName) return null;
  const first = firstName?.trim() || '';
  const last = lastName?.trim() || '';
  return `${last} ${first}`.trim() || null;
}

/**
 * Parses a login identifier to extract username and school email
 * Supports both legacy formats and new username@school-email format
 * @param identifier Login identifier (username@school-email or legacy username/email)
 * @returns Object with username and schoolEmail, or null if invalid format
 */
export function parseLoginIdentifier(identifier: string): { username: string; schoolEmail: string } | null {
  if (!identifier || typeof identifier !== 'string') return null;
  
  const trimmed = identifier.trim();
  if (!trimmed) return null;
  
  // Check if it's in username@school-email format
  const atIndex = trimmed.indexOf('@');
  if (atIndex > 0 && atIndex < trimmed.length - 1) {
    const username = trimmed.substring(0, atIndex);
    const schoolEmail = trimmed.substring(atIndex + 1);
    
    // Validate that both parts exist and school email looks like an email
    if (username && schoolEmail && schoolEmail.includes('.')) {
      return { username, schoolEmail };
    }
  }
  
  return null;
}

/**
 * Extracts the domain from a school contact email
 * @param contactEmail Full contact email (e.g., "contact@demo-sku.edu")
 * @returns Domain part (e.g., "demo-sku.edu") or the original if no @ found
 */
export function extractSchoolDomain(contactEmail: string): string {
  if (!contactEmail || typeof contactEmail !== 'string') return contactEmail;
  
  const atIndex = contactEmail.indexOf('@');
  if (atIndex > 0 && atIndex < contactEmail.length - 1) {
    return contactEmail.substring(atIndex + 1);
  }
  
  return contactEmail; // Return original if not in email format
}

/**
 * Constructs the full login identifier from username and school email
 * @param username User's username
 * @param schoolContactEmail School's contact email (will extract domain)
 * @returns Full login identifier in username@school-domain format
 */
export function constructLoginIdentifier(username: string, schoolContactEmail: string): string {
  const domain = extractSchoolDomain(schoolContactEmail);
  return `${username}@${domain}`;
}

/**
 * Validates that a school email is in proper format
 * @param email School email to validate
 * @returns True if valid school email format
 */
export function isValidSchoolEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  
  const trimmed = email.trim();
  // Basic email validation - must contain @ and at least one dot after @
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(trimmed);
} 