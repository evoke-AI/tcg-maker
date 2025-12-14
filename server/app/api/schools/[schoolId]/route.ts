import { NextRequest, NextResponse } from 'next/server';
import { requireSchoolPermission } from '@/lib/authUtils';
import { prisma } from '@/lib/prisma';
import { PERMISSIONS } from '@/lib/constants';

/**
 * GET /api/schools/[schoolId]
 * Get school details (school admin permission required)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ schoolId: string }> }
) {
  try {
    const { schoolId } = await params;

    // Check if user has permission to view this school
    await requireSchoolPermission(schoolId, PERMISSIONS.MANAGE_SCHOOL);

    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      include: {
        _count: {
          select: {
            members: true,
            classes: true,
          },
        },
      },
    });

    if (!school) {
      return NextResponse.json(
        { success: false, error: 'School not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: school,
    });
  } catch (error) {
    console.error('Error fetching school:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch school' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/schools/[schoolId]
 * Update school information (school admin permission required)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ schoolId: string }> }
) {
  try {
    const { schoolId } = await params;

    // Check if user has permission to manage this school
    await requireSchoolPermission(schoolId, PERMISSIONS.MANAGE_SCHOOL);

    const body = await request.json();
    const {
      name,
      code,
      address,
      phone,
      email,
      website,
      isActive,
    } = body;

    // Validate required fields
    if (!name || !code) {
      return NextResponse.json(
        { success: false, error: 'Name and code are required' },
        { status: 400 }
      );
    }

    // Check if school code is unique (excluding current school)
    const existingSchool = await prisma.school.findFirst({
      where: {
        code,
        id: { not: schoolId },
      },
    });

    if (existingSchool) {
      return NextResponse.json(
        { success: false, error: 'School code already exists' },
        { status: 400 }
      );
    }

    // Update school
    const updatedSchool = await prisma.school.update({
      where: { id: schoolId },
      data: {
        name,
        code,
        address: address || null,
        phone: phone || null,
        email: email || null,
        website: website || null,
        isActive: Boolean(isActive),
      },
      include: {
        _count: {
          select: {
            members: true,
            classes: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedSchool,
    });
  } catch (error) {
    console.error('Error updating school:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update school' },
      { status: 500 }
    );
  }
} 