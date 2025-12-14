'use server';

import { revalidatePath } from 'next/cache';
import { hashPassword, verifyPassword } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/authUtils';
import { z } from 'zod';

// Types for profile actions
export interface ActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface UserProfile {
  id: string;
  username: string;
  name: string | null;
  firstName: string;
  lastName: string;
  email: string | null;
  studentId: string | null;
  gradeLevel: string | null;
  department: string | null;
  systemRole: string | null;
  isActive: boolean;
  emailVerified: Date | null;
  createdAt: Date;
  schools: Array<{
    schoolId: string;
    schoolName: string;
    schoolCode: string | null;
    role: string;
    joinedAt: Date;
  }>;
}

// Validation schemas
const UpdateProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
  email: z.string().email('Invalid email format').optional().nullable(),
  studentId: z.string().max(20, 'Student ID too long').optional().nullable(),
  gradeLevel: z.string().max(10, 'Grade level too long').optional().nullable(),
  department: z.string().max(50, 'Department too long').optional().nullable(),
});

const UpdatePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your new password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "New passwords don't match",
  path: ["confirmPassword"],
});

/**
 * Get current user's profile information
 */
export async function getUserProfile(): Promise<ActionResponse<UserProfile>> {
  try {
    const { userId } = await requireAuth();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        accounts: {
          select: {
            id: true,
          },
          take: 1,
        },
        schoolMemberships: {
          where: { isActive: true },
          select: {
            schoolId: true,
            role: true,
            joinedAt: true,
            school: {
              select: {
                name: true,
                code: true,
              },
            },
          },
          orderBy: {
            joinedAt: 'asc',
          },
        },
      },
    });

    if (!user) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    // Use a reasonable default for account creation date
    const createdAt = user.emailVerified || new Date();

    const profile: UserProfile = {
      id: user.id,
      username: user.username,
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      studentId: user.studentId,
      gradeLevel: user.gradeLevel,
      department: user.department,
      systemRole: user.systemRole,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      createdAt,
      schools: user.schoolMemberships.map((membership) => ({
        schoolId: membership.schoolId,
        schoolName: membership.school.name,
        schoolCode: membership.school.code,
        role: membership.role,
        joinedAt: membership.joinedAt,
      })),
    };

    return {
      success: true,
      data: profile,
    };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch profile';
    
    // Handle specific auth errors
    if (['Unauthenticated', 'Inactive or deleted user'].includes(errorMessage)) {
      return { success: false, error: errorMessage };
    }
    
    return {
      success: false,
      error: 'Failed to fetch profile',
    };
  }
}

/**
 * Update user profile information (non-sensitive fields only)
 * Users can update: firstName, lastName, email, studentId, gradeLevel, department
 * Users cannot update: username (only school admins can do this)
 */
export async function updateUserProfile(formData: FormData): Promise<ActionResponse<UserProfile>> {
  try {
    const { userId } = await requireAuth();

    // Validate form data
    const validatedFields = UpdateProfileSchema.safeParse({
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      email: formData.get('email') || null,
      studentId: formData.get('studentId') || null,
      gradeLevel: formData.get('gradeLevel') || null,
      department: formData.get('department') || null,
    });

    if (!validatedFields.success) {
      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const { firstName, lastName, email, studentId, gradeLevel, department } = validatedFields.data;

    // Check if email is being changed and if it already exists
    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          id: { not: userId },
        },
        select: { id: true },
      });

      if (existingUser) {
        return {
          success: false,
          errors: { email: ['Email is already taken by another user'] },
        };
      }
    }

    // Compute the display name (HK style: lastName + firstName)
    const computedName = `${lastName} ${firstName}`.trim();

    // Update user profile
    await prisma.user.update({
      where: { id: userId },
      data: {
        firstName,
        lastName,
        name: computedName,
        email,
        studentId,
        gradeLevel,
        department,
      },
    });

    // Revalidate profile page
    revalidatePath('/profile');

    // Fetch updated profile to return
    const profileResponse = await getUserProfile();
    
    return profileResponse;
  } catch (error) {
    console.error('Error updating user profile:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
    
    // Handle specific auth errors
    if (['Unauthenticated', 'Inactive or deleted user'].includes(errorMessage)) {
      return { success: false, error: errorMessage };
    }
    
    return {
      success: false,
      error: 'Failed to update profile',
    };
  }
}

/**
 * Update user password
 * Requires current password verification
 */
export async function updateUserPassword(formData: FormData): Promise<ActionResponse> {
  try {
    const { userId } = await requireAuth();

    // Validate form data
    const validatedFields = UpdatePasswordSchema.safeParse({
      currentPassword: formData.get('currentPassword'),
      newPassword: formData.get('newPassword'),
      confirmPassword: formData.get('confirmPassword'),
    });

    if (!validatedFields.success) {
      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const { currentPassword, newPassword } = validatedFields.data;

    // Get current user with password
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        password: true,
      },
    });

    if (!user) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    // Verify current password
    const isCurrentPasswordValid = await verifyPassword(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return {
        success: false,
        errors: { currentPassword: ['Current password is incorrect'] },
      };
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedNewPassword,
      },
    });

    // Revalidate profile page
    revalidatePath('/profile');

    return {
      success: true,
    };
  } catch (error) {
    console.error('Error updating user password:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update password';
    
    // Handle specific auth errors
    if (['Unauthenticated', 'Inactive or deleted user'].includes(errorMessage)) {
      return { success: false, error: errorMessage };
    }
    
    return {
      success: false,
      error: 'Failed to update password',
    };
  }
} 