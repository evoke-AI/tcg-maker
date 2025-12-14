import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/authUtils';
import { prisma } from '@/lib/prisma';
import { SCHOOL_ROLES } from '@/lib/constants';

/**
 * GET /api/user/managed-schools
 * Returns schools that the current user can manage (has ADMIN role in)
 */
export async function GET() {
  try {
    const { userId } = await requireAuth();

    // Get schools where user has ADMIN role
    const memberships = await prisma.schoolMembership.findMany({
      where: {
        userId,
        role: SCHOOL_ROLES.ADMIN,
        isActive: true,
      },
      include: {
        school: {
          select: {
            id: true,
            name: true,
            code: true,
            isActive: true,
          },
        },
      },
      orderBy: {
        school: {
          name: 'asc',
        },
      },
    });

    // Transform the data
    const schools = memberships
      .filter(membership => membership.school.isActive)
      .map(membership => ({
        id: membership.school.id,
        name: membership.school.name,
        code: membership.school.code || '',
      }));

    return NextResponse.json({
      success: true,
      schools,
    });

  } catch (error) {
    console.error('Error fetching managed schools:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch managed schools',
      },
      { status: 500 }
    );
  }
} 