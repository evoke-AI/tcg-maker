'use server';

import { getFeatureTranslations } from '@/app/utils/getFeatureTranslations';
import { prisma } from '@/lib/prisma';
import { User, ActionResponse } from './types';
import { requireSystemPermission } from '@/lib/authUtils';
import { 
  PERMISSIONS
} from '@/lib/constants'

/**
 * Get admin dashboard data (stats and recent users).
 * Translations are handled client-side now.
 * Requires ACCESS_ADMIN_DASHBOARD permission.
 */
export async function getAdminDashboardData(/* locale: string */) {
  try {
    await requireSystemPermission(PERMISSIONS.CREATE_SCHOOL); // Only SUPER_ADMIN can access dashboard

    // Get user statistics from the database
    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({ where: { isActive: true }});
    
    // Count SUPER_ADMIN users
    const adminUsers = await prisma.user.count({
      where: { systemRole: 'SUPER_ADMIN' }
    });
    
    // Get the most recent users
    const recentUsers = await prisma.user.findMany({
      take: 5,
      orderBy: { email: 'asc' },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        emailVerified: true,
        isActive: true,
        systemRole: true,
        schoolMemberships: {
          select: {
            school: {
              select: {
                name: true,
                email: true
              }
            },
            role: true
          }
        }
      }
    });
    
    // Transform the users to match our UI expectations
    const users: User[] = recentUsers.map((user: typeof recentUsers[0]) => ({
      id: user.id,
      name: user.name || 'Unnamed User',
      username: user.username,
      email: user.email,
      status: user.isActive ? (user.emailVerified ? 'active' : 'pending') : 'inactive',
      lastLogin: user.emailVerified,
      systemRoleName: user.systemRole ?? null,
      schools: user.schoolMemberships.map(membership => ({
        name: membership.school.name,
        email: membership.school.email,
        role: membership.role
      }))
    }));
    
    // Dashboard data
    const dashboardData = {
      count: totalUsers,
      activeUsers,
      adminUsers,
      users,
      lastUpdated: new Date().toISOString()
    };
    
    // Return only the serializable dashboard data
    return {
      data: dashboardData
    };
  } catch (error) {
    console.error('Error fetching admin dashboard data:', error);
    if (error instanceof Error && ['Unauthenticated', 'Inactive or deleted user', 'Insufficient permissions'].includes(error.message)) {
      throw error;
    }
    throw new Error('Failed to load admin dashboard data.');
  }
}

/**
 * Get all users (DEPRECATED? - Consider using getUsers with pagination)
 * Requires VIEW_USERS_PERMISSION permission.
 */
export async function getAllUsers(locale: string) {
  try {
    await requireSystemPermission(PERMISSIONS.CREATE_SCHOOL);
    
    // Get feature-specific translations
    const { admin, common } = await getFeatureTranslations(locale, 'admin');
    
    // Get all users from the database
    const dbUsers = await prisma.user.findMany({
      orderBy: { email: 'asc' },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        emailVerified: true,
        isActive: true,
        systemRole: true,
        schoolMemberships: {
          select: {
            school: {
              select: {
                name: true,
                email: true
              }
            },
            role: true
          }
        }
      }
    });
    
    // Transform the users to match our UI expectations
    const users: User[] = dbUsers.map((user: typeof dbUsers[0]) => ({
      id: user.id,
      name: user.name || 'Unnamed User',
      username: user.username,
      email: user.email,
      status: user.isActive ? (user.emailVerified ? 'active' : 'pending') : 'inactive',
      lastLogin: user.emailVerified,
      systemRoleName: user.systemRole ?? null,
      schools: user.schoolMemberships.map(membership => ({
        name: membership.school.name,
        email: membership.school.email,
        role: membership.role
      }))
    }));
    
    return {
      translations: {
        admin,
        common
      },
      users
    };
  } catch (error) {
    console.error('Error fetching all users:', error);
    if (error instanceof Error && ['Unauthenticated', 'Inactive or deleted user', 'Insufficient permissions'].includes(error.message)) {
      throw error;
    }
    throw new Error('Failed to load users.');
  }
}

/**
 * Get a single user by ID
 * Requires VIEW_USER_DETAILS_PERMISSION permission.
 */
export async function getUserById(id: string): Promise<ActionResponse<User>> {
  try {
    await requireSystemPermission(PERMISSIONS.CREATE_SCHOOL);
    
    // Get user from the database
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        emailVerified: true,
        isActive: true,
        systemRole: true,
        schoolMemberships: {
          select: {
            school: {
              select: {
                name: true,
                email: true
              }
            },
            role: true
          }
        }
      }
    });
    
    if (!user) {
      return {
        success: false,
        error: 'User not found'
      };
    }
    
    // Transform the user to match our UI expectations
    const transformedUser: User = {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      status: user.isActive ? (user.emailVerified ? 'active' : 'pending') : 'inactive',
      lastLogin: user.emailVerified,
      systemRoleName: user.systemRole ?? null,
      schools: user.schoolMemberships.map(membership => ({
        name: membership.school.name,
        email: membership.school.email,
        role: membership.role
      }))
    };
    
    return {
      success: true,
      data: transformedUser
    };
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    const errorMessage = error instanceof Error ? error.message : 'An error occurred while fetching the user';
    if (['Unauthenticated', 'Inactive or deleted user', 'Insufficient permissions'].includes(errorMessage)) {
       return { success: false, error: errorMessage };
    }
    return {
      success: false,
      error: 'An error occurred while fetching the user'
    };
  }
}

/**
 * Fetches a list of users with pagination, sorting, and filtering.
 * Requires CREATE_SCHOOL permission (SUPER_ADMIN only).
 */
export async function getUsers({
  page = 1,
  limit = 20,
  sortBy = 'email',
  sortOrder = 'asc',
  searchTerm = '',
  systemRole = '',
  status = ''
}: {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  searchTerm?: string;
  systemRole?: string;
  status?: string;
} = {}): Promise<ActionResponse<{ users: User[]; total: number; pagination: { page: number; limit: number; totalPages: number } }>> {
  try {
    await requireSystemPermission(PERMISSIONS.CREATE_SCHOOL);

    // Build where clause with search, role, and status filters
    const whereClause: {
      OR?: Array<{ email?: { contains: string }; name?: { contains: string } }>;
      systemRole?: string | null;
      isActive?: boolean;
      emailVerified?: { not: null } | null;
    } = {};
    
    // Search filter
    if (searchTerm) {
      whereClause.OR = [
        { email: { contains: searchTerm } },
        { name: { contains: searchTerm } }
      ];
    }
    
    // System role filter
    if (systemRole) {
      if (systemRole === 'SUPER_ADMIN') {
        whereClause.systemRole = 'SUPER_ADMIN';
      } else if (systemRole === 'USER') {
        whereClause.systemRole = null;
      }
    }
    
    // Status filter
    if (status) {
      if (status === 'active') {
        whereClause.isActive = true;
        whereClause.emailVerified = { not: null };
      } else if (status === 'pending') {
        whereClause.isActive = true;
        whereClause.emailVerified = null;
      } else if (status === 'inactive') {
        whereClause.isActive = false;
      }
    }

    const total = await prisma.user.count({ where: whereClause });
    const totalPages = Math.ceil(total / limit);

    const dbUsers = await prisma.user.findMany({
      where: whereClause,
      select: { 
        id: true,
        name: true,
        username: true,
        email: true,
        emailVerified: true,
        isActive: true,
        systemRole: true,
        schoolMemberships: {
          select: {
            school: {
              select: {
                name: true,
                email: true
              }
            },
            role: true
          }
        }
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sortBy]: sortOrder }
    });

    const responseUsers: User[] = dbUsers.map((user: typeof dbUsers[0]) => ({
      id: user.id,
      name: user.name || 'Unnamed User',
      username: user.username,
      email: user.email,
      status: user.isActive ? (user.emailVerified ? 'active' : 'pending') : 'inactive',
      lastLogin: user.emailVerified,
      systemRoleName: user.systemRole ?? null,
      schools: user.schoolMemberships.map(membership => ({
        name: membership.school.name,
        email: membership.school.email,
        role: membership.role
      }))
    }));

    return {
      success: true,
      data: { 
        users: responseUsers, 
        total,
        pagination: {
          page,
          limit,
          totalPages
        }
      }
    };

  } catch (error) {
    console.error('Error fetching users:', error);
    const errorMessage = error instanceof Error ? error.message : 'An error occurred while fetching users';
    if (['Unauthenticated', 'Inactive or deleted user', 'Insufficient permissions'].includes(errorMessage)) {
       return { success: false, error: errorMessage };
    }
    return {
      success: false,
      error: 'An error occurred while fetching users'
    };
  }
}

/**
 * Fetches a list of available system roles.
 * Since we simplified to just use string roles, this returns the available system roles.
 */
export async function getSystemRoles(): Promise<ActionResponse<{ id: string; name: string }[]>> {
  try {
    await requireSystemPermission(PERMISSIONS.CREATE_SCHOOL);

    // Return the available system roles as constants
    const roles = [
      { id: 'SUPER_ADMIN', name: 'Super Admin' }
    ];

    return { success: true, data: roles };

  } catch (error) {
    console.error('Error fetching system roles:', error);
    const errorMessage = error instanceof Error ? error.message : 'An error occurred while fetching roles';
    if (['Unauthenticated', 'Inactive or deleted user', 'Insufficient permissions'].includes(errorMessage)) {
      return { success: false, error: errorMessage };
    }
    return {
      success: false,
      error: 'An error occurred while fetching roles'
    };
  }
}

/**
 * Fetches the systemRole for a specific user.
 * Requires VIEW_USER_DETAILS_PERMISSION.
 */
export async function getUserSystemRole(userId: string): Promise<ActionResponse<{ systemRole: string | null }>> {
  if (!userId) {
    return { success: false, error: 'User ID is required.' };
  }
  try {
    // Check permission to view user details
    await requireSystemPermission(PERMISSIONS.CREATE_SCHOOL);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { systemRole: true },
    });

    if (!user) {
      return { success: false, error: 'User not found.' };
    }

    return { success: true, data: { systemRole: user.systemRole } };

  } catch (error) {
    console.error(`Error fetching system role for user ${userId}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An error occurred while fetching user role';
    if (['Unauthenticated', 'Inactive or deleted user', 'Insufficient permissions'].includes(errorMessage)) {
      return { success: false, error: errorMessage };
    }
    return {
      success: false,
      error: 'An error occurred while fetching user role'
    };
  }
}

// TODO: Add getAdminMetadata function if it exists and needs updating
// async function getAdminMetadata(locale: string) { ... } 