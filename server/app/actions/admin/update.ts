'use server';

import { revalidatePath } from 'next/cache';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { UserSchema, ActionResponse, User } from './types';
import { requireSystemPermission } from '@/lib/authUtils';
import { PERMISSIONS } from '@/lib/constants';

/**
 * Update an existing user's core details (name, email, password, status, system role).
 * Requires CREATE_SCHOOL permission (system admin only).
 */
export async function updateUser(userId: string, formData: FormData): Promise<ActionResponse<User>> {
  try {
    await requireSystemPermission(PERMISSIONS.CREATE_SCHOOL);
    
    // Validate the form data
    const validatedFields = UserSchema.safeParse({
      name: formData.get('name'),
      email: formData.get('email'),
      password: formData.get('password') || undefined,
      systemRoleId: formData.get('systemRoleId') || null,
      status: formData.get('status')
    });

    // Return early if the form data is invalid
    if (!validatedFields.success) {
      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors
      };
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, systemRole: true, emailVerified: true }
    });

    if (!existingUser) {
      return {
        success: false,
        error: 'User not found'
      };
    }

    const { name, email, password, systemRoleId, status } = validatedFields.data;

    // Check if email is being changed and if the new email already exists
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findFirst({
        where: { email },
        select: { id: true }
      });

      if (emailExists && emailExists.id !== userId) {
        return {
          success: false,
          errors: { email: ['Email is already taken by another user'] }
        };
      }
    }

    // Map status to database fields (isActive, emailVerified)
    const isActive = status !== 'inactive';
    const emailVerified = status === 'active' ? (existingUser.emailVerified ?? new Date()) : existingUser.emailVerified;

    // Prepare update data
    const updateData: {
      name?: string | null;
      email?: string;
      password?: string;
      isActive?: boolean;
      emailVerified?: Date | null;
      systemRole?: string | null;
    } = {
    };

    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (emailVerified !== existingUser.emailVerified) {
      updateData.emailVerified = emailVerified;
    }
    if (systemRoleId !== undefined) {
      updateData.systemRole = systemRoleId;
    }

    // Hash and add password if provided
    if (password) {
      updateData.password = await hash(password, 12);
    }

    // Update the user in the database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
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

    // Revalidate the admin pages to reflect the updated data
    revalidatePath('/[locale]/admin');
    revalidatePath('/[locale]/admin/users');

    // Map DB result to response type
    const responseUser: User = {
      id: updatedUser.id,
      name: updatedUser.name,
      username: updatedUser.username,
      email: updatedUser.email,
      status: updatedUser.isActive ? (updatedUser.emailVerified ? 'active' : 'pending') : 'inactive',
      lastLogin: updatedUser.emailVerified,
      systemRoleName: updatedUser.systemRole
    };

    return {
      success: true,
      data: responseUser
    };
  } catch (error) {
    console.error(`Error updating user ${userId}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An error occurred while updating the user';
    // Handle specific auth errors
    if (['Unauthenticated', 'Inactive or deleted user', 'Insufficient permissions'].includes(errorMessage)) {
      return { success: false, error: errorMessage };
    }
    // Generic error response
    return {
      success: false,
      error: 'An error occurred while updating the user'
    };
  }
} 