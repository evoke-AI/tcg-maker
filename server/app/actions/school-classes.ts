'use server';

import { prisma } from '@/lib/prisma';
import { requireAuth, requireSchoolPermission } from '@/lib/authUtils';
import { PERMISSIONS } from '@/lib/constants';
import { z } from 'zod';

// Validation schemas
const getClassesSchema = z.object({
  schoolId: z.string(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(50),
  search: z.string().optional(),
  subject: z.string().optional(),
  gradeLevel: z.string().optional(),
  schoolYear: z.string().optional(),
  includeUsers: z.boolean().default(false),
});

const createClassSchema = z.object({
  name: z.string().min(1, 'Class name is required'),
  code: z.string().optional(),
  description: z.string().optional(),
  gradeLevel: z.string().optional(),
  subject: z.string().optional(),
  schoolYear: z.string().optional(),
});

const updateClassSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Class name is required').optional(),
  code: z.string().optional(),
  description: z.string().optional(),
  gradeLevel: z.string().optional(),
  subject: z.string().optional(),
  schoolYear: z.string().optional(),
  isActive: z.boolean().optional(),
});

const assignUsersSchema = z.object({
  classId: z.string(),
  teacherIds: z.array(z.string()).default([]),
  studentIds: z.array(z.string()).default([]),
});

const bulkClassOperationSchema = z.object({
  type: z.enum(['delete', 'activate', 'deactivate', 'assign-teacher', 'assign-student']),
  classIds: z.array(z.string()).min(1, 'At least one class must be selected'),
  value: z.string().optional(), // For assign operations (userId)
});

interface ActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Get classes in a school with filtering and pagination
 */
export async function getSchoolClasses(params: z.infer<typeof getClassesSchema>): Promise<ActionResponse> {
  try {
    await requireAuth();
    const { schoolId, page, limit, search, subject, gradeLevel, schoolYear, includeUsers } = getClassesSchema.parse(params);

    // Check if user has permission to manage school
    await requireSchoolPermission(schoolId, PERMISSIONS.MANAGE_SCHOOL);

    const skip = (page - 1) * limit;

    // Build where clause
    const where: {
      schoolId: string;
      isActive: boolean;
      OR?: Array<{ [key: string]: { contains: string } }>;
      subject?: { contains: string };
      gradeLevel?: { contains: string };
      schoolYear?: { contains: string };
    } = {
      schoolId,
      isActive: true,
    };

    // Add search filters
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
        { subject: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (subject) {
      where.subject = { contains: subject };
    }

    if (gradeLevel) {
      where.gradeLevel = { contains: gradeLevel };
    }

    if (schoolYear) {
      where.schoolYear = { contains: schoolYear };
    }

    // Get classes with counts and optional user details
    const classes = await prisma.class.findMany({
      where,
      include: {
        _count: {
          select: {
            teachers: { where: { isActive: true } },
            students: { where: { isActive: true } },

          },
        },
        ...(includeUsers && {
          teachers: {
            where: { isActive: true },
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
          students: {
            where: { isActive: true },
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  studentId: true,
                },
              },
            },
          },
        }),
      },
      skip,
      take: limit,
      orderBy: [
        { name: 'asc' },
        { code: 'asc' },
      ],
    });

    const total = await prisma.class.count({ where });

    // Transform data for response
    const transformedClasses = classes.map(cls => {
      const baseClass = {
        id: cls.id,
        name: cls.name,
        code: cls.code,
        description: cls.description,
        gradeLevel: cls.gradeLevel,
        subject: cls.subject,
        schoolYear: cls.schoolYear,
        isActive: cls.isActive,
        createdAt: cls.createdAt,
        updatedAt: cls.updatedAt,
        teacherCount: cls._count.teachers,
        studentCount: cls._count.students,
      };

      if (includeUsers && cls.teachers && cls.students) {
        return {
          ...baseClass,
          teachers: cls.teachers?.map(tc => {
            const teacher = tc as { user?: { id?: string; username?: string; firstName?: string; lastName?: string; email?: string; }; assignedAt: Date; };
            return {
              id: teacher.user?.id,
              username: teacher.user?.username,
              firstName: teacher.user?.firstName,
              lastName: teacher.user?.lastName,
              email: teacher.user?.email,
              assignedAt: tc.assignedAt,
            };
          }),
          students: cls.students?.map(sc => {
            const student = sc as { user?: { id?: string; username?: string; firstName?: string; lastName?: string; email?: string; studentId?: string; }; enrolledAt: Date; };
            return {
              id: student.user?.id,
              username: student.user?.username,
              firstName: student.user?.firstName,
              lastName: student.user?.lastName,
              email: student.user?.email,
              studentId: student.user?.studentId,
              enrolledAt: sc.enrolledAt,
            };
          }),
        };
      }

      return baseClass;
    });

    return {
      success: true,
      data: {
        classes: transformedClasses,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    };

  } catch (error) {
    console.error('Error fetching school classes:', error);
    
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid request parameters' };
    }

    if (error instanceof Error) {
      if (['Unauthenticated', 'Inactive or deleted user', 'Insufficient permissions'].includes(error.message)) {
        return { success: false, error: error.message };
      }
    }

    return { success: false, error: 'Failed to fetch classes' };
  }
}

/**
 * Create a new class in a school
 */
export async function createSchoolClass(schoolId: string, classData: z.infer<typeof createClassSchema>): Promise<ActionResponse> {
  try {
    await requireAuth();

    // Check if user has permission to manage school
    await requireSchoolPermission(schoolId, PERMISSIONS.MANAGE_SCHOOL);

    const validatedData = createClassSchema.parse(classData);

    // Check if class code is unique within the school (if provided)
    if (validatedData.code) {
      const existingClass = await prisma.class.findFirst({
        where: {
          schoolId,
          code: validatedData.code,
          isActive: true,
        },
      });

      if (existingClass) {
        return { success: false, error: 'Class code already exists in this school' };
      }
    }

    // Create the class
    const newClass = await prisma.class.create({
      data: {
        ...validatedData,
        schoolId,
      },
      include: {
        _count: {
          select: {
            teachers: true,
            students: true,

          },
        },
      },
    });

    return {
      success: true,
      data: {
        ...newClass,
        teacherCount: newClass._count.teachers,
        studentCount: newClass._count.students,

      },
      message: `Class "${newClass.name}" created successfully`,
    };

  } catch (error) {
    console.error('Error creating class:', error);
    
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid class data provided' };
    }

    if (error instanceof Error) {
      if (['Unauthenticated', 'Inactive or deleted user', 'Insufficient permissions'].includes(error.message)) {
        return { success: false, error: error.message };
      }
    }

    return { success: false, error: 'Failed to create class' };
  }
}

/**
 * Update an existing class
 */
export async function updateSchoolClass(schoolId: string, updateData: z.infer<typeof updateClassSchema>): Promise<ActionResponse> {
  try {
    await requireAuth();

    // Check if user has permission to manage school
    await requireSchoolPermission(schoolId, PERMISSIONS.MANAGE_SCHOOL);

    const validatedData = updateClassSchema.parse(updateData);
    const { id, ...updateFields } = validatedData;

    // Verify class exists and belongs to school
    const existingClass = await prisma.class.findFirst({
      where: { id, schoolId },
    });

    if (!existingClass) {
      return { success: false, error: 'Class not found or does not belong to this school' };
    }

    // Check if class code is unique within the school (if being updated)
    if (updateFields.code && updateFields.code !== existingClass.code) {
      const codeExists = await prisma.class.findFirst({
        where: {
          schoolId,
          code: updateFields.code,
          isActive: true,
          id: { not: id },
        },
      });

      if (codeExists) {
        return { success: false, error: 'Class code already exists in this school' };
      }
    }

    // Update the class
    const updatedClass = await prisma.class.update({
      where: { id },
      data: updateFields,
      include: {
        _count: {
          select: {
            teachers: true,
            students: true,

          },
        },
      },
    });

    return {
      success: true,
      data: {
        ...updatedClass,
        teacherCount: updatedClass._count.teachers,
        studentCount: updatedClass._count.students,

      },
      message: `Class "${updatedClass.name}" updated successfully`,
    };

  } catch (error) {
    console.error('Error updating class:', error);
    
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid update data provided' };
    }

    if (error instanceof Error) {
      if (['Unauthenticated', 'Inactive or deleted user', 'Insufficient permissions'].includes(error.message)) {
        return { success: false, error: error.message };
      }
    }

    return { success: false, error: 'Failed to update class' };
  }
}

/**
 * Delete a class (soft delete by setting isActive to false)
 */
export async function deleteSchoolClass(schoolId: string, classId: string): Promise<ActionResponse> {
  try {
    await requireAuth();

    // Check if user has permission to manage school
    await requireSchoolPermission(schoolId, PERMISSIONS.MANAGE_SCHOOL);

    // Verify class exists and belongs to school
    const existingClass = await prisma.class.findFirst({
      where: { id: classId, schoolId },
    });

    if (!existingClass) {
      return { success: false, error: 'Class not found or does not belong to this school' };
    }

    // Soft delete the class
    await prisma.class.update({
      where: { id: classId },
      data: { isActive: false },
    });

    return {
      success: true,
      message: `Class "${existingClass.name}" deleted successfully`,
    };

  } catch (error) {
    console.error('Error deleting class:', error);
    
    if (error instanceof Error) {
      if (['Unauthenticated', 'Inactive or deleted user', 'Insufficient permissions'].includes(error.message)) {
        return { success: false, error: error.message };
      }
    }

    return { success: false, error: 'Failed to delete class' };
  }
}

/**
 * Assign users to a class
 */
export async function assignUsersToClass(schoolId: string, assignmentData: z.infer<typeof assignUsersSchema>): Promise<ActionResponse> {
  try {
    await requireAuth();

    // Check if user has permission to manage school
    await requireSchoolPermission(schoolId, PERMISSIONS.MANAGE_SCHOOL);

    const { classId, teacherIds, studentIds } = assignUsersSchema.parse(assignmentData);

    // Verify class exists and belongs to school
    const classExists = await prisma.class.findFirst({
      where: { id: classId, schoolId, isActive: true },
    });

    if (!classExists) {
      return { success: false, error: 'Class not found or does not belong to this school' };
    }

    let assignedCount = 0;
    const results = [];

    // Assign teachers
    if (teacherIds.length > 0) {
      // Verify all users are teachers in this school
      const teacherMemberships = await prisma.schoolMembership.findMany({
        where: {
          schoolId,
          userId: { in: teacherIds },
          role: 'TEACHER',
          isActive: true,
        },
      });

      if (teacherMemberships.length !== teacherIds.length) {
        return { success: false, error: 'Some users are not active teachers in this school' };
      }

      // Create teacher assignments (ignore duplicates)
      const teacherAssignments = teacherIds.map(userId => ({
        userId,
        classId,
      }));

      try {
        const teacherResult = await prisma.teacherClass.createMany({
          data: teacherAssignments,
        });
        assignedCount += teacherResult.count;
        results.push(`${teacherResult.count} teachers assigned`);
      } catch (error) {
        console.error('Error assigning teachers:', error);
      }
    }

    // Assign students
    if (studentIds.length > 0) {
      // Verify all users are students in this school
      const studentMemberships = await prisma.schoolMembership.findMany({
        where: {
          schoolId,
          userId: { in: studentIds },
          role: 'STUDENT',
          isActive: true,
        },
      });

      if (studentMemberships.length !== studentIds.length) {
        return { success: false, error: 'Some users are not active students in this school' };
      }

      // Create student assignments (ignore duplicates)
      const studentAssignments = studentIds.map(userId => ({
        userId,
        classId,
      }));

      try {
        const studentResult = await prisma.studentClass.createMany({
          data: studentAssignments,
        });
        assignedCount += studentResult.count;
        results.push(`${studentResult.count} students assigned`);
      } catch (error) {
        console.error('Error assigning students:', error);
      }
    }

    return {
      success: true,
      data: { assignedCount },
    };

  } catch (error) {
    console.error('Error assigning users to class:', error);
    
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid assignment data provided' };
    }

    if (error instanceof Error) {
      if (['Unauthenticated', 'Inactive or deleted user', 'Insufficient permissions'].includes(error.message)) {
        return { success: false, error: error.message };
      }
    }

    return { success: false, error: 'Failed to assign users to class' };
  }
}

/**
 * Remove users from a class
 */
export async function removeUsersFromClass(schoolId: string, classId: string, userIds: string[]): Promise<ActionResponse> {
  try {
    await requireAuth();

    // Check if user has permission to manage school
    await requireSchoolPermission(schoolId, PERMISSIONS.MANAGE_SCHOOL);

    // Verify class exists and belongs to school
    const classExists = await prisma.class.findFirst({
      where: { id: classId, schoolId, isActive: true },
    });

    if (!classExists) {
      return { success: false, error: 'Class not found or does not belong to this school' };
    }

    // Remove teacher assignments
    const teacherRemoved = await prisma.teacherClass.deleteMany({
      where: {
        classId,
        userId: { in: userIds },
      },
    });

    // Remove student assignments
    const studentRemoved = await prisma.studentClass.deleteMany({
      where: {
        classId,
        userId: { in: userIds },
      },
    });

    const totalRemoved = teacherRemoved.count + studentRemoved.count;

    return {
      success: true,
      data: { removedCount: totalRemoved },
    };

  } catch (error) {
    console.error('Error removing users from class:', error);
    
    if (error instanceof Error) {
      if (['Unauthenticated', 'Inactive or deleted user', 'Insufficient permissions'].includes(error.message)) {
        return { success: false, error: error.message };
      }
    }

    return { success: false, error: 'Failed to remove users from class' };
  }
}

/**
 * Bulk operations on classes
 */
export async function bulkUpdateSchoolClasses(schoolId: string, operation: z.infer<typeof bulkClassOperationSchema>): Promise<ActionResponse> {
  try {
    await requireAuth();

    // Check if user has permission to manage school
    await requireSchoolPermission(schoolId, PERMISSIONS.MANAGE_SCHOOL);

    const { type, classIds, value } = bulkClassOperationSchema.parse(operation);

    // Verify all classes exist and belong to school
    const classes = await prisma.class.findMany({
      where: {
        id: { in: classIds },
        schoolId,
      },
    });

    if (classes.length !== classIds.length) {
      return { success: false, error: 'Some classes not found or do not belong to this school' };
    }

    let result;
    let message = '';

    switch (type) {
      case 'delete':
        result = await prisma.class.updateMany({
          where: { id: { in: classIds } },
          data: { isActive: false },
        });
        message = `Deleted ${result.count} classes`;
        break;

      case 'activate':
        result = await prisma.class.updateMany({
          where: { id: { in: classIds } },
          data: { isActive: true },
        });
        message = `Activated ${result.count} classes`;
        break;

      case 'deactivate':
        result = await prisma.class.updateMany({
          where: { id: { in: classIds } },
          data: { isActive: false },
        });
        message = `Deactivated ${result.count} classes`;
        break;

      case 'assign-teacher':
      case 'assign-student':
        if (!value) {
          return { success: false, error: 'User ID is required for assignment operations' };
        }

        // Verify user exists and has correct role in school
        const expectedRole = type === 'assign-teacher' ? 'TEACHER' : 'STUDENT';
        const userMembership = await prisma.schoolMembership.findFirst({
          where: {
            schoolId,
            userId: value,
            role: expectedRole,
            isActive: true,
          },
        });

        if (!userMembership) {
          return { success: false, error: `User is not an active ${expectedRole.toLowerCase()} in this school` };
        }

        // Create assignments
        const assignments = classIds.map(classId => ({
          userId: value,
          classId,
        }));

        if (type === 'assign-teacher') {
          result = await prisma.teacherClass.createMany({
            data: assignments,
          });
        } else {
          result = await prisma.studentClass.createMany({
            data: assignments,
          });
        }

        message = `Assigned ${expectedRole.toLowerCase()} to ${result.count} classes`;
        break;

      default:
        return { success: false, error: 'Invalid operation type' };
    }

    return {
      success: true,
      data: result,
      message,
    };

  } catch (error) {
    console.error('Error performing bulk class operation:', error);
    
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid operation data provided' };
    }

    if (error instanceof Error) {
      if (['Unauthenticated', 'Inactive or deleted user', 'Insufficient permissions'].includes(error.message)) {
        return { success: false, error: error.message };
      }
    }

    return { success: false, error: 'Failed to perform bulk operation' };
  }
}

/**
 * Get current users assigned to a class
 */
export async function getClassUsers(schoolId: string, classId: string): Promise<ActionResponse> {
  try {
    await requireAuth();

    // Check if user has permission to manage school
    await requireSchoolPermission(schoolId, PERMISSIONS.MANAGE_SCHOOL);

    // Verify class exists and belongs to school
    const classExists = await prisma.class.findFirst({
      where: { id: classId, schoolId, isActive: true },
    });

    if (!classExists) {
      return { success: false, error: 'Class not found or does not belong to this school' };
    }

    // Get current teachers and students in the class
    const [teacherAssignments, studentAssignments] = await Promise.all([
      prisma.teacherClass.findMany({
        where: { classId, isActive: true },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              email: true,
              studentId: true,
            },
          },
        },
        orderBy: [
          { user: { firstName: 'asc' } },
          { user: { lastName: 'asc' } },
        ],
      }),
      prisma.studentClass.findMany({
        where: { classId, isActive: true },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              email: true,
              studentId: true,
            },
          },
        },
        orderBy: [
          { user: { firstName: 'asc' } },
          { user: { lastName: 'asc' } },
        ],
      }),
    ]);

    const teachers = teacherAssignments.map(assignment => ({
      id: assignment.user.id,
      username: assignment.user.username,
      firstName: assignment.user.firstName,
      lastName: assignment.user.lastName,
      email: assignment.user.email,
      studentId: assignment.user.studentId,
      role: 'TEACHER',
      assignedAt: assignment.assignedAt.toISOString(),
    }));

    const students = studentAssignments.map(assignment => ({
      id: assignment.user.id,
      username: assignment.user.username,
      firstName: assignment.user.firstName,
      lastName: assignment.user.lastName,
      email: assignment.user.email,
      studentId: assignment.user.studentId,
      role: 'STUDENT',
      enrolledAt: assignment.enrolledAt.toISOString(),
    }));

    return {
      success: true,
      data: {
        teachers,
        students,
        totalUsers: teachers.length + students.length,
      },
    };

  } catch (error) {
    console.error('Error fetching class users:', error);
    
    if (error instanceof Error) {
      if (['Unauthenticated', 'Inactive or deleted user', 'Insufficient permissions'].includes(error.message)) {
        return { success: false, error: error.message };
      }
    }

    return { success: false, error: 'Failed to fetch class users' };
  }
}

/**
 * Get available users for class assignment (teachers and students not already in the class)
 */
export async function getAvailableUsersForClass(schoolId: string, classId: string): Promise<ActionResponse> {
  try {
    await requireAuth();

    // Check if user has permission to manage school
    await requireSchoolPermission(schoolId, PERMISSIONS.MANAGE_SCHOOL);

    // Verify class exists and belongs to school
    const classExists = await prisma.class.findFirst({
      where: { id: classId, schoolId, isActive: true },
    });

    if (!classExists) {
      return { success: false, error: 'Class not found or does not belong to this school' };
    }

    // Get all active school members
    const schoolMembers = await prisma.schoolMembership.findMany({
      where: {
        schoolId,
        isActive: true,
        role: { in: ['TEACHER', 'STUDENT'] },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            email: true,
            studentId: true,
          },
        },
      },
    });

    // Get users already assigned to this class
    const [assignedTeachers, assignedStudents] = await Promise.all([
      prisma.teacherClass.findMany({
        where: { classId, isActive: true },
        select: { userId: true },
      }),
      prisma.studentClass.findMany({
        where: { classId, isActive: true },
        select: { userId: true },
      }),
    ]);

    const assignedUserIds = new Set([
      ...assignedTeachers.map(t => t.userId),
      ...assignedStudents.map(s => s.userId),
    ]);

    // Filter out already assigned users
    const availableUsers = schoolMembers
      .filter(member => !assignedUserIds.has(member.userId))
      .map(member => ({
        id: member.user.id,
        username: member.user.username,
        firstName: member.user.firstName,
        lastName: member.user.lastName,
        email: member.user.email,
        studentId: member.user.studentId,
        role: member.role,
      }));

    const teachers = availableUsers.filter(user => user.role === 'TEACHER');
    const students = availableUsers.filter(user => user.role === 'STUDENT');

    return {
      success: true,
      data: {
        teachers,
        students,
        totalAvailable: availableUsers.length,
      },
    };

  } catch (error) {
    console.error('Error fetching available users for class:', error);
    
    if (error instanceof Error) {
      if (['Unauthenticated', 'Inactive or deleted user', 'Insufficient permissions'].includes(error.message)) {
        return { success: false, error: error.message };
      }
    }

    return { success: false, error: 'Failed to fetch available users' };
  }
} 