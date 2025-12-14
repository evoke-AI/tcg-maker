'use server';

import { revalidatePath } from 'next/cache';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { ActionResponse, User } from './types';
import { requireSchoolPermission, requireSystemPermission } from '@/lib/authUtils';
import { PERMISSIONS } from '@/lib/constants';

/**
 * Create a new user within a school context.
 * Requires MANAGE_SCHOOL permission for the specific school.
 */
export async function createUser(formData: FormData): Promise<ActionResponse<User>> {
  try {
    const schoolId = formData.get('schoolId') as string;
    if (!schoolId) {
      return {
        success: false,
        error: 'School ID is required'
      };
    }

    await requireSchoolPermission(schoolId, PERMISSIONS.MANAGE_SCHOOL);
  } catch (error) {
    console.error('Authentication failed in createUser:', error);
    return {
      success: false,
      error: 'Insufficient permissions'
    };
  }

  try {
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const username = formData.get('username') as string;
    const email = formData.get('email') as string | null;
    const password = formData.get('password') as string;
    const systemRoleId = formData.get('systemRoleId') as string | null;

    // Basic validation
    if (!firstName || firstName.trim().length < 1) {
      return {
        success: false,
        errors: { firstName: ['First name is required'] }
      };
    }

    if (!lastName || lastName.trim().length < 1) {
      return {
        success: false,
        errors: { lastName: ['Last name is required'] }
      };
    }

    if (!username || username.trim().length < 1) {
      return {
        success: false,
        errors: { username: ['Username is required'] }
      };
    }

    if (!password || password.length < 8) {
      return {
        success: false,
        errors: { password: ['Password must be at least 8 characters'] }
      };
    }

    // Check for existing user by email if email is provided
    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: { email },
        select: { id: true }
      });

      if (existingUser) {
        return {
          success: false,
          errors: { email: ['User with this email already exists'] }
        };
      }
    }

    const hashedPassword = await hash(password, 12);

    // Compute the full name (HK style: lastName + firstName)
    const fullName = `${lastName} ${firstName}`;

    const newUser = await prisma.user.create({
      data: {
        firstName,
        lastName,
        name: fullName,
        username,
        email: email || undefined,
        password: hashedPassword,
        systemRole: systemRoleId || undefined,
        emailVerified: null,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        username: true,
        email: true,
        emailVerified: true,
        isActive: true,
        systemRole: true
      }
    });

    revalidatePath('/[locale]/admin');
    revalidatePath('/[locale]/admin/users');

    const responseUser: User = {
      id: newUser.id,
      name: newUser.name,
      username: newUser.username,
      email: newUser.email,
      status: newUser.isActive ? (newUser.emailVerified ? 'active' : 'pending') : 'inactive',
      lastLogin: newUser.emailVerified,
      systemRoleName: newUser.systemRole ?? null
    };

    return {
      success: true,
      data: responseUser
    };
  } catch (error) {
    console.error('Error creating user:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred while creating the user'
    };
  }
}

/**
 * Create a new system user (Super Admin) without school context.
 * Requires CREATE_SCHOOL permission (SUPER_ADMIN only).
 */
export async function createSystemUser(formData: FormData): Promise<ActionResponse<User>> {
  try {
    await requireSystemPermission(PERMISSIONS.CREATE_SCHOOL);
  } catch (error) {
    console.error('Authentication failed in createSystemUser:', error);
    return {
      success: false,
      error: 'Insufficient permissions'
    };
  }

  try {
    const name = formData.get('name') as string;
    const username = formData.get('username') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const systemRoleId = formData.get('systemRoleId') as string | null;

    // Basic validation
    if (!username || username.trim().length < 3) {
      return {
        success: false,
        errors: { username: ['Username is required and must be at least 3 characters'] }
      };
    }

    if (!email || email.trim().length < 1) {
      return {
        success: false,
        errors: { email: ['Email is required'] }
      };
    }

    if (!password || password.length < 8) {
      return {
        success: false,
        errors: { password: ['Password must be at least 8 characters'] }
      };
    }

    // Check for existing user by email
    const existingEmailUser = await prisma.user.findFirst({
      where: { email },
      select: { id: true }
    });

    if (existingEmailUser) {
      return {
        success: false,
        errors: { email: ['User with this email already exists'] }
      };
    }

    // Check for existing user by username
    const existingUsernameUser = await prisma.user.findFirst({
      where: { username },
      select: { id: true }
    });

    if (existingUsernameUser) {
      return {
        success: false,
        errors: { username: ['Username already exists'] }
      };
    }

    const hashedPassword = await hash(password, 12);

    const newUser = await prisma.user.create({
      data: {
        name: name || username, // Use name if provided, otherwise use username
        firstName: name ? name.split(' ')[0] : username, // Extract first name or use username
        lastName: name ? (name.split(' ').slice(1).join(' ') || 'Admin') : 'Admin', // Extract last name or default to 'Admin'
        username: username.trim(), // Use provided username
        email,
        password: hashedPassword,
        systemRole: systemRoleId === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : null,
        emailVerified: new Date(), // System users are auto-verified
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        emailVerified: true,
        isActive: true,
        systemRole: true
      }
    });

    revalidatePath('/[locale]/admin');
    revalidatePath('/[locale]/admin/users');

    const responseUser: User = {
      id: newUser.id,
      name: newUser.name,
      username: newUser.username,
      email: newUser.email,
      status: newUser.isActive ? (newUser.emailVerified ? 'active' : 'pending') : 'inactive',
      lastLogin: newUser.emailVerified,
      systemRoleName: newUser.systemRole ?? null
    };

    return {
      success: true,
      data: responseUser
    };
  } catch (error) {
    console.error('Error creating system user:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred while creating the system user'
    };
  }
} 