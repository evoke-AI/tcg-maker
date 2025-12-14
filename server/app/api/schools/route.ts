import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSystemPermission } from '@/lib/authUtils';
import { PERMISSIONS } from '@/lib/constants';
import { z } from 'zod';

// Validation schema for school creation
const createSchoolSchema = z.object({
  name: z.string().min(1, 'School name is required').max(100, 'School name too long'),
  code: z.string().min(2, 'School code must be at least 2 characters').max(20, 'School code too long').optional(),
  address: z.string().max(200, 'Address too long').optional(),
  phone: z.string().max(20, 'Phone number too long').optional(),
  email: z.string().email('Invalid email format'),
  website: z.string().url('Invalid website URL').optional(),
});

/**
 * GET /api/schools
 * Lists all schools (SUPER_ADMIN only)
 */
export async function GET(request: NextRequest) {
  try {
    await requireSystemPermission(PERMISSIONS.CREATE_SCHOOL);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    // Build where clause for search
    const whereClause = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { code: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [schools, total] = await Promise.all([
      prisma.school.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          code: true,
          address: true,
          phone: true,
          email: true,
          website: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              members: true,
              classes: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.school.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        schools,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });

  } catch (error) {
    console.error('Error fetching schools:', error);
    
    if (error instanceof Error) {
      if (['Unauthenticated', 'Inactive or deleted user', 'Insufficient permissions'].includes(error.message)) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 401 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch schools' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/schools
 * Creates a new school (SUPER_ADMIN only)
 * Note: No custom roles are created - the system uses predefined roles (ADMIN, TEACHER, STUDENT)
 */
export async function POST(request: NextRequest) {
  try {
    await requireSystemPermission(PERMISSIONS.CREATE_SCHOOL);

    const body = await request.json();
    const validatedData = createSchoolSchema.parse(body);

    // Check if school code is unique (if provided)
    if (validatedData.code) {
      const existingSchool = await prisma.school.findUnique({
        where: { code: validatedData.code },
      });

      if (existingSchool) {
        return NextResponse.json(
          { success: false, error: 'School code already exists' },
          { status: 400 }
        );
      }
    }

    // Check if school email is unique (required field)
    const existingSchoolByEmail = await prisma.school.findUnique({
      where: { email: validatedData.email },
    });

    if (existingSchoolByEmail) {
      return NextResponse.json(
        { success: false, error: 'School email already exists' },
        { status: 400 }
      );
    }

    // Create the school
    const school = await prisma.school.create({
      data: validatedData,
      select: {
        id: true,
        name: true,
        code: true,
        address: true,
        phone: true,
        email: true,
        website: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: school,
      message: 'School created successfully. Users can now be assigned ADMIN, TEACHER, or STUDENT roles.',
    });

  } catch (error) {
    console.error('Error creating school:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      if (['Unauthenticated', 'Inactive or deleted user', 'Insufficient permissions'].includes(error.message)) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 401 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create school' },
      { status: 500 }
    );
  }
} 