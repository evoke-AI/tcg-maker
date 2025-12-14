'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { ActionResponse } from './types';
import { requireSystemPermission } from '@/lib/authUtils';
import { PERMISSIONS } from '@/lib/constants';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';

/**
 * Soft deletes a user by setting isActive to false.
 * Requires CREATE_SCHOOL permission (system admin only).
 * Prevents users from deleting their own account.
 */
export async function deleteUser(id: string): Promise<ActionResponse<null>> {
  try {
    await requireSystemPermission(PERMISSIONS.CREATE_SCHOOL);

    // Get current user session to prevent self-deletion
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Authentication required'
      };
    }

    // Prevent self-deletion
    if (id === session.user.id) {
      return {
        success: false,
        error: 'Cannot delete your own account'
      };
    }

    // Perform soft delete by updating isActive flag
    await prisma.user.update({
      where: { id },
      data: { 
          isActive: false,
      },
    });

    revalidatePath('/[locale]/admin');
    revalidatePath('/[locale]/admin/users');

    return {
      success: true,
      data: null
    };

  } catch (error) {
    console.error(`Error soft deleting user ${id}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An error occurred while deleting the user';
    // Handle specific auth errors
     if (['Unauthenticated', 'Inactive or deleted user', 'Insufficient permissions'].includes(errorMessage)) {
       return { success: false, error: errorMessage };
    }
    // Generic error response
    return {
      success: false,
      error: 'An error occurred while deleting the user'
    };
  }
} 