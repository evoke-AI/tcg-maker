'use server';

import { prisma } from '@/lib/prisma';
import { requireAuth, requireSchoolPermission } from '@/lib/authUtils';
import { PERMISSIONS, isValidSchoolRole } from '@/lib/constants';
import { z } from 'zod';

// Types
interface SchoolInvitation {
  id: string;
  email: string;
  role: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  invitedAt: Date;
  acceptedAt?: Date | null;
  expiresAt: Date;
  invitedBy: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
  };
  acceptedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
  } | null;
}

interface CreateInvitationData {
  email: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT';
}

interface ActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Validation schemas
const createInvitationSchema = z.object({
  email: z.string().email('Invalid email format'),
  role: z.enum(['ADMIN', 'TEACHER', 'STUDENT'], { required_error: 'Role is required' }),
});

// Schema for future use
// const updateInvitationStatusSchema = z.object({
//   invitationId: z.string(),
//   status: z.enum(['ACCEPTED', 'REJECTED', 'EXPIRED']),
// });

/**
 * Create a new school invitation
 */
export async function createSchoolInvitation(
  schoolId: string,
  data: CreateInvitationData
): Promise<ActionResponse<SchoolInvitation>> {
  try {
    const { userId } = await requireAuth();
    await requireSchoolPermission(schoolId, PERMISSIONS.MANAGE_SCHOOL);
    
    const validatedData = createInvitationSchema.parse(data);
    const { email, role } = validatedData;

    // Check if role is valid
    if (!isValidSchoolRole(role)) {
      return {
        success: false,
        error: 'Invalid role specified',
      };
    }

    // Check if school exists
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: { id: true, name: true },
    });

    if (!school) {
      return {
        success: false,
        error: 'School not found',
      };
    }

    // Check if user is already a member of this school
    const existingMembership = await prisma.schoolMembership.findUnique({
      where: {
        userId_schoolId: {
          userId: await getUserIdByEmail(email),
          schoolId,
        },
      },
    });

    if (existingMembership) {
      return {
        success: false,
        error: 'User is already a member of this school',
      };
    }

    // Check if there's already a pending invitation for this email
    const existingInvitation = await prisma.schoolInvitation.findUnique({
      where: {
        email_schoolId: {
          email,
          schoolId,
        },
      },
    });

    if (existingInvitation && existingInvitation.status === 'PENDING') {
      return {
        success: false,
        error: 'An invitation has already been sent to this email address',
      };
    }

    // Set expiration date (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create or update invitation
    const invitation = await prisma.schoolInvitation.upsert({
      where: {
        email_schoolId: {
          email,
          schoolId,
        },
      },
      update: {
        role,
        status: 'PENDING',
        invitedAt: new Date(),
        invitedById: userId,
        acceptedAt: null,
        acceptedById: null,
        expiresAt,
      },
      create: {
        email,
        role,
        schoolId,
        invitedById: userId,
        expiresAt,
      },
      include: {
        invitedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
          },
        },
        acceptedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
          },
        },
      },
    });

    // Check if user exists in system - if yes, auto-accept the invitation
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username: email.split('@')[0] }, // Try username part
        ],
      },
    });

    if (existingUser) {
      // Auto-accept and create membership
      await prisma.$transaction(async (tx) => {
        // Update invitation status
        await tx.schoolInvitation.update({
          where: { id: invitation.id },
          data: {
            status: 'ACCEPTED',
            acceptedAt: new Date(),
            acceptedById: existingUser.id,
          },
        });

        // Create school membership
        await tx.schoolMembership.create({
          data: {
            userId: existingUser.id,
            schoolId,
            role,
          },
        });
      });

      return {
        success: true,
        data: {
          ...invitation,
          status: 'ACCEPTED' as const,
          acceptedAt: new Date(),
          acceptedBy: {
            id: existingUser.id,
            firstName: existingUser.firstName,
            lastName: existingUser.lastName,
            username: existingUser.username,
          },
        },
        message: 'User found in system and automatically added to school',
      };
    }

    return {
      success: true,
      data: invitation as SchoolInvitation,
      message: 'Invitation sent successfully',
    };
  } catch (error) {
    console.error('Error creating school invitation:', error);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message || 'Invalid input data',
      };
    }

    return {
      success: false,
      error: 'Failed to create invitation',
    };
  }
}

/**
 * Get all invitations for a school
 */
export async function getSchoolInvitations(
  schoolId: string,
  params?: {
    status?: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
    page?: number;
    limit?: number;
  }
): Promise<ActionResponse<{ invitations: SchoolInvitation[]; total: number }>> {
  try {
    await requireAuth();
    await requireSchoolPermission(schoolId, PERMISSIONS.MANAGE_SCHOOL);

    const { status, page = 1, limit = 20 } = params || {};
    const skip = (page - 1) * limit;

    const where = {
      schoolId,
      ...(status && { status }),
    };

    const [invitations, total] = await Promise.all([
      prisma.schoolInvitation.findMany({
        where,
        include: {
          invitedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
            },
          },
          acceptedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
            },
          },
        },
        orderBy: { invitedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.schoolInvitation.count({ where }),
    ]);

    return {
      success: true,
      data: {
        invitations: invitations as SchoolInvitation[],
        total,
      },
    };
  } catch (error) {
    console.error('Error fetching school invitations:', error);
    return {
      success: false,
      error: 'Failed to fetch invitations',
    };
  }
}

/**
 * Cancel/delete a pending invitation
 */
export async function cancelSchoolInvitation(
  schoolId: string,
  invitationId: string
): Promise<ActionResponse> {
  try {
    await requireAuth();
    await requireSchoolPermission(schoolId, PERMISSIONS.MANAGE_SCHOOL);

    const invitation = await prisma.schoolInvitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation) {
      return {
        success: false,
        error: 'Invitation not found',
      };
    }

    if (invitation.schoolId !== schoolId) {
      return {
        success: false,
        error: 'Invitation does not belong to this school',
      };
    }

    if (invitation.status !== 'PENDING') {
      return {
        success: false,
        error: 'Only pending invitations can be cancelled',
      };
    }

    await prisma.schoolInvitation.delete({
      where: { id: invitationId },
    });

    return {
      success: true,
      message: 'Invitation cancelled successfully',
    };
  } catch (error) {
    console.error('Error cancelling school invitation:', error);
    return {
      success: false,
      error: 'Failed to cancel invitation',
    };
  }
}

/**
 * Resend an invitation (updates expiration date)
 */
export async function resendSchoolInvitation(
  schoolId: string,
  invitationId: string
): Promise<ActionResponse<SchoolInvitation>> {
  try {
    const { userId } = await requireAuth();
    await requireSchoolPermission(schoolId, PERMISSIONS.MANAGE_SCHOOL);

    const invitation = await prisma.schoolInvitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation) {
      return {
        success: false,
        error: 'Invitation not found',
      };
    }

    if (invitation.schoolId !== schoolId) {
      return {
        success: false,
        error: 'Invitation does not belong to this school',
      };
    }

    if (invitation.status !== 'PENDING' && invitation.status !== 'EXPIRED') {
      return {
        success: false,
        error: 'Only pending or expired invitations can be resent',
      };
    }

    // Set new expiration date (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const updatedInvitation = await prisma.schoolInvitation.update({
      where: { id: invitationId },
      data: {
        status: 'PENDING',
        invitedAt: new Date(),
        invitedById: userId,
        expiresAt,
      },
      include: {
        invitedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
          },
        },
        acceptedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
          },
        },
      },
    });

    return {
      success: true,
      data: updatedInvitation as SchoolInvitation,
      message: 'Invitation resent successfully',
    };
  } catch (error) {
    console.error('Error resending school invitation:', error);
    return {
      success: false,
      error: 'Failed to resend invitation',
    };
  }
}

/**
 * Helper function to get user ID by email (returns empty string if not found)
 */
async function getUserIdByEmail(email: string): Promise<string> {
  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username: email.split('@')[0] },
        ],
      },
      select: { id: true },
    });
    
    return user?.id || '';
  } catch {
    return '';
  }
}

/**
 * Expire old invitations (utility function for cleanup)
 */
export async function expireOldInvitations(): Promise<ActionResponse> {
  try {
    const result = await prisma.schoolInvitation.updateMany({
      where: {
        status: 'PENDING',
        expiresAt: {
          lt: new Date(),
        },
      },
      data: {
        status: 'EXPIRED',
      },
    });

    return {
      success: true,
      data: { expiredCount: result.count },
      message: `Expired ${result.count} old invitations`,
    };
  } catch (error) {
    console.error('Error expiring old invitations:', error);
    return {
      success: false,
      error: 'Failed to expire old invitations',
    };
  }
} 