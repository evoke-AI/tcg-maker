'use server';

import { prisma } from '@/lib/prisma';
import { requireAuth, requireSchoolPermission, computeHKName, constructLoginIdentifier } from '@/lib/authUtils';
import { generatePassword } from '@/lib/passwordGenerator';
import { isUsernameUniqueInSchool } from '@/lib/permissions';
import { PERMISSIONS, isValidSchoolRole } from '@/lib/constants';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

// Types
interface CreateSchoolUserData {
  username: string;
  email?: string;
  firstName: string;
  lastName: string;
  password?: string;
  generatePassword?: boolean;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT';
  studentId?: string;
  gradeLevel?: string;
  department?: string;
}

interface SchoolUser {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  name?: string | null;
  loginIdentifier?: string;
  email?: string | null;
  role: string;
  studentId?: string | null;
  gradeLevel?: string | null;
  department?: string | null;
  isActive: boolean;
  joinedAt: Date;
}

interface CreateUserResponse extends ActionResponse<SchoolUser> {
  generatedPassword?: string;
}

// Bulk import types
interface BulkUserData {
  username: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT';
  studentId?: string;
  className?: string; // Class name for auto-creation and assignment
  classCode?: string; // Optional class code
  gradeLevel?: string; // Grade level (will be applied to class)
  subject?: string; // Subject for the class (mainly for teachers)
}

interface BulkImportResult {
  success: boolean;
  data?: {
    created: Array<SchoolUser & { loginIdentifier: string; generatedPassword: string; assignedClass?: string }>;
    createdClasses: Array<{ name: string; code?: string; gradeLevel?: string; subject?: string }>;
    errors: Array<{ row: number; username: string; error: string }>;
    summary: {
      total: number;
      successful: number;
      failed: number;
      classesCreated: number;
    };
  };
  error?: string;
}

// Validation schemas
const createUserSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(50, 'Username too long'),
  email: z.string().email('Invalid email format').optional(),
  firstName: z.string().min(1, 'First name is required').max(50, 'First name too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
  password: z.string().min(12, 'Password must be at least 12 characters').optional(),
  generatePassword: z.boolean().default(false),
  role: z.enum(['ADMIN', 'TEACHER', 'STUDENT'], { required_error: 'Role is required' }),
  studentId: z.string().max(20, 'Student ID too long').optional(),
  gradeLevel: z.string().max(10, 'Grade level too long').optional(),
  department: z.string().max(50, 'Department too long').optional(),
});

const updateUserSchema = z.object({
  id: z.string(),
  username: z.string().min(3, 'Username must be at least 3 characters').max(50, 'Username too long').optional(),
  email: z.string().email('Invalid email format').optional(),
  firstName: z.string().min(1, 'First name is required').max(50, 'First name too long').optional(),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long').optional(),
  role: z.enum(['ADMIN', 'TEACHER', 'STUDENT']).optional(),
  studentId: z.string().max(20, 'Student ID too long').optional(),
  gradeLevel: z.string().max(10, 'Grade level too long').optional(),
  department: z.string().max(50, 'Department too long').optional(),
  isActive: z.boolean().optional(),
});

const bulkOperationSchema = z.object({
  type: z.enum(['role', 'status', 'class-assign', 'class-remove', 'password-reset']),
  value: z.string().min(1, 'Value is required').optional(),
  userIds: z.array(z.string()).min(1, 'At least one user ID is required'),
});

const resetPasswordSchema = z.object({
  userId: z.string(),
  generatePassword: z.boolean().default(true),
  customPassword: z.string().min(12, 'Password must be at least 12 characters').optional(),
});

const getUsersSchema = z.object({
  schoolId: z.string(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  search: z.string().optional(),
  role: z.string().optional(),
  status: z.string().optional(),
  gradeLevel: z.string().optional(),
  department: z.string().optional(),
  includeClasses: z.boolean().default(false),
});

const bulkUserSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(50, 'Username too long'),
  firstName: z.string().min(1, 'First name is required').max(50, 'First name too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
  role: z.enum(['ADMIN', 'TEACHER', 'STUDENT'], { required_error: 'Role is required' }),
  studentId: z.string().max(20, 'Student ID too long').optional(),
  className: z.string().max(100, 'Class name too long').optional(),
  classCode: z.string().max(20, 'Class code too long').optional(),
  gradeLevel: z.string().max(10, 'Grade level too long').optional(),
  subject: z.string().max(50, 'Subject too long').optional(),
});

// Response types
interface ActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Get users in a school with filtering and pagination
 */
export async function getSchoolUsers(params: z.infer<typeof getUsersSchema>): Promise<ActionResponse> {
  try {
    console.log('getSchoolUsers: Starting with params:', params);
    await requireAuth();
    const { schoolId, page, limit, search, role, status, gradeLevel, department, includeClasses } = getUsersSchema.parse(params);

    // Clean up search parameter - treat empty strings as undefined
    const cleanSearch = search && search.trim() !== '' ? search.trim() : undefined;
    console.log('getSchoolUsers: Parsed params - schoolId:', schoolId, 'search:', cleanSearch);
    
    // Check if user has permission to manage school
    await requireSchoolPermission(schoolId, PERMISSIONS.MANAGE_SCHOOL);
    console.log('getSchoolUsers: Permission check passed');

    const skip = (page - 1) * limit;

    // Build where clause for memberships
    const membershipWhere = {
      schoolId,
      isActive: true,
      ...(role && { role }),
    };

    // Build user filter conditions
    const userConditions = {
      ...(status && { isActive: status === 'active' }),
      ...(gradeLevel && { gradeLevel }),
      ...(department && { department }),
      ...(cleanSearch && {
        OR: [
          { username: { contains: cleanSearch } },
          { email: { contains: cleanSearch } },
          { firstName: { contains: cleanSearch } },
          { lastName: { contains: cleanSearch } },
          { studentId: { contains: cleanSearch } },
        ],
      }),
    };

    // Build comprehensive where clause
    const whereClause = {
      ...membershipWhere,
      user: userConditions,
    };

    console.log('getSchoolUsers: Final where clause:', JSON.stringify(whereClause, null, 2));

    // Get school memberships with user data and optional class data
    const memberships = await prisma.schoolMembership.findMany({
      where: whereClause,
      include: {
        user: includeClasses ? {
          include: {
            teacherClasses: {
              where: { isActive: true },
              include: {
                class: {
                  select: { id: true, name: true, code: true },
                },
              },
            },
            studentClasses: {
              where: { isActive: true },
              include: {
                class: {
                  select: { id: true, name: true, code: true },
                },
              },
            },
          },
        } : true,
      },
      skip,
      take: limit,
      orderBy: { joinedAt: 'desc' },
    });

    const total = await prisma.schoolMembership.count({
      where: whereClause,
    });

    // Transform the data
    const users = memberships.map(membership => {
      const user = membership.user;
      let classes = undefined;
      
      if (includeClasses && typeof user === 'object' && user !== null && 'teacherClasses' in user && 'studentClasses' in user) {
        const teacherClasses = Array.isArray(user.teacherClasses) ? user.teacherClasses : [];
        const studentClasses = Array.isArray(user.studentClasses) ? user.studentClasses : [];
        
        classes = [
          ...teacherClasses.map((tc) => ({
            id: tc.class.id,
            name: tc.class.name,
            code: tc.class.code,
            isTeacher: true,
          })),
          ...studentClasses.map((sc) => ({
            id: sc.class.id,
            name: sc.class.name,
            code: sc.class.code,
            isTeacher: false,
          })),
        ];
      }

      return {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        studentId: user.studentId,
        gradeLevel: user.gradeLevel,
        department: user.department,
        isActive: user.isActive,
        role: membership.role,
        joinedAt: membership.joinedAt,
        ...(classes && { classes }),
      };
    });

    console.log('getSchoolUsers: Returning', users.length, 'users');
    
    return {
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    };

  } catch (error) {
    console.error('getSchoolUsers: Error fetching school users:', error);
    
    if (error instanceof z.ZodError) {
      console.error('getSchoolUsers: Validation error:', error.errors);
      return { success: false, error: 'Invalid request parameters' };
    }

    if (error instanceof Error) {
      console.error('getSchoolUsers: Error message:', error.message);
      console.error('getSchoolUsers: Error stack:', error.stack);
      
      if (['Unauthenticated', 'Inactive or deleted user', 'Insufficient permissions'].includes(error.message)) {
        return { success: false, error: error.message };
      }
      
      // For development, include more specific error info
      if (process.env.NODE_ENV === 'development') {
        return { success: false, error: `Database error: ${error.message}` };
      }
    }

    return { success: false, error: 'Failed to fetch users' };
  }
}

/**
 * Create a new user in a school
 */
export async function createSchoolUser(
  schoolId: string,
  data: CreateSchoolUserData
): Promise<CreateUserResponse> {
  try {
    await requireSchoolPermission(schoolId, PERMISSIONS.MANAGE_SCHOOL);

    // Validate input data
    const validatedData = createUserSchema.parse(data);

    // Check if username is unique within the school
    const isUnique = await isUsernameUniqueInSchool(validatedData.username, schoolId);
    if (!isUnique) {
      return {
        success: false,
        error: 'Username already exists in this school',
      };
    }

    // Get school information for login identifier
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: { email: true, name: true },
    });

    if (!school?.email) {
      return {
        success: false,
        error: 'School email not configured. Please contact administrator.',
      };
    }

    // Generate password if requested
    const password = validatedData.generatePassword 
      ? generatePassword()
      : validatedData.password;

    if (!password) {
      return {
        success: false,
        error: 'Password is required',
      };
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Compute HK-style name
    const computedName = computeHKName(validatedData.firstName, validatedData.lastName);

    // Create user with transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the user
      const newUser = await tx.user.create({
        data: {
          username: validatedData.username,
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          name: computedName,
          email: validatedData.email, // Optional for backward compatibility
          password: hashedPassword,
          studentId: validatedData.studentId,
          gradeLevel: validatedData.gradeLevel,
          department: validatedData.department,
          isActive: true,
        },
      });

      // Create school membership
      await tx.schoolMembership.create({
        data: {
          userId: newUser.id,
          schoolId: schoolId,
          role: validatedData.role,
          isActive: true,
        },
      });

      return newUser;
    });

    // Construct full login identifier for response
    const loginIdentifier = constructLoginIdentifier(validatedData.username, school.email);

    return {
      success: true,
      data: {
        id: result.id,
        username: result.username!,
        firstName: result.firstName!,
        lastName: result.lastName!,
        name: result.name,
        loginIdentifier, // New field showing full login format
        email: result.email,
        role: validatedData.role,
        studentId: result.studentId,
        gradeLevel: result.gradeLevel,
        department: result.department,
        isActive: result.isActive,
        joinedAt: new Date(),
      },
      generatedPassword: validatedData.generatePassword ? password : undefined,
    };

  } catch (error) {
    console.error('Error creating school user:', error);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation failed: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
      };
    }

    return {
      success: false,
      error: 'Failed to create user',
    };
  }
}

/**
 * Reset password for a school user
 */
export async function resetSchoolUserPassword(
  schoolId: string, 
  resetData: z.infer<typeof resetPasswordSchema>
): Promise<ActionResponse<{ newPassword?: string }>> {
  try {
    await requireAuth();
    await requireSchoolPermission(schoolId, PERMISSIONS.MANAGE_SCHOOL);

    const { userId, generatePassword: shouldGeneratePassword, customPassword } = resetPasswordSchema.parse(resetData);

    // Verify user exists and belongs to school
    const membership = await prisma.schoolMembership.findFirst({
      where: {
        schoolId,
        userId,
        isActive: true,
      },
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
    });

    if (!membership) {
      return { success: false, error: 'User not found or does not belong to this school' };
    }

    // Generate or use custom password
    const newPassword = shouldGeneratePassword ? generatePassword() : customPassword;
    
    if (!newPassword) {
      return { success: false, error: 'Password is required' };
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update user password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return {
      success: true,
      data: { newPassword: shouldGeneratePassword ? newPassword : undefined },
      message: 'Password reset successfully',
    };

  } catch (error) {
    console.error('Error resetting password:', error);

    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid input data' };
    }

    if (error instanceof Error) {
      if (['Unauthenticated', 'Inactive or deleted user', 'Insufficient permissions'].includes(error.message)) {
        return { success: false, error: error.message };
      }
    }

    return { success: false, error: 'Failed to reset password' };
  }
}

/**
 * Update an existing user in a school
 */
export async function updateSchoolUser(schoolId: string, updateData: z.infer<typeof updateUserSchema>): Promise<ActionResponse> {
  try {
    await requireAuth();

    // Check if user has permission to manage school
    await requireSchoolPermission(schoolId, PERMISSIONS.MANAGE_SCHOOL);

    const validatedData = updateUserSchema.parse(updateData);
    const { id, role, ...userFields } = validatedData;

    // Verify user exists and belongs to school
    const membership = await prisma.schoolMembership.findFirst({
      where: {
        schoolId,
        userId: id,
        isActive: true,
      },
      include: {
        user: true,
      },
    });

    if (!membership) {
      return { success: false, error: 'User not found or does not belong to this school' };
    }

    // Check if username is unique within the school (if being updated)
    if (userFields.username && userFields.username !== membership.user.username) {
      const isUnique = await isUsernameUniqueInSchool(userFields.username, schoolId);
      if (!isUnique) {
        return { success: false, error: 'Username already exists in this school' };
      }
    }

    // Validate role if being updated
    if (role && !isValidSchoolRole(role)) {
      return { success: false, error: 'Invalid role' };
    }

    // Update user data and role in parallel
    const updatePromises = [];

    // Update user fields if any are provided
    if (Object.keys(userFields).length > 0) {
      updatePromises.push(
        prisma.user.update({
          where: { id },
          data: userFields,
        })
      );
    }

    // Update role if provided
    if (role) {
      updatePromises.push(
        prisma.schoolMembership.update({
          where: {
            userId_schoolId: {
              userId: id,
              schoolId,
            },
          },
          data: { role },
        })
      );
    }

    await Promise.all(updatePromises);

    // Fetch updated user data
    const updatedMembership = await prisma.schoolMembership.findFirst({
      where: {
        schoolId,
        userId: id,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            firstName: true,
            lastName: true,
            studentId: true,
            gradeLevel: true,
            department: true,
            isActive: true,
          },
        },
      },
    });

    return {
      success: true,
      data: {
        ...updatedMembership!.user,
        role: updatedMembership!.role,
      },
      message: 'User updated successfully',
    };

  } catch (error) {
    console.error('Error updating user:', error);

    if (error instanceof z.ZodError) {
      return { success: false, error: 'Validation failed' };
    }

    if (error instanceof Error) {
      if (['Unauthenticated', 'Inactive or deleted user', 'Insufficient permissions'].includes(error.message)) {
        return { success: false, error: error.message };
      }
    }

    return { success: false, error: 'Failed to update user' };
  }
}

/**
 * Perform bulk operations on school users
 */
export async function bulkUpdateSchoolUsers(schoolId: string, operation: z.infer<typeof bulkOperationSchema>): Promise<ActionResponse> {
  try {
    await requireAuth();

    // Check if user has permission to manage school
    await requireSchoolPermission(schoolId, PERMISSIONS.MANAGE_SCHOOL);

    const { type, value, userIds } = bulkOperationSchema.parse(operation);

    // Verify all users belong to this school
    const memberships = await prisma.schoolMembership.findMany({
      where: {
        schoolId,
        userId: { in: userIds },
        isActive: true,
      },
      select: { userId: true },
    });

    const validUserIds = memberships.map(m => m.userId);
    const invalidUserIds = userIds.filter(id => !validUserIds.includes(id));

    if (invalidUserIds.length > 0) {
      return { 
        success: false, 
        error: `Some users are not members of this school: ${invalidUserIds.join(', ')}` 
      };
    }

    let result;
    let message = '';

    switch (type) {
      case 'role':
        // Validate role
        if (!value || !isValidSchoolRole(value)) {
          return { success: false, error: 'Invalid role' };
        }

        // Update roles
        result = await prisma.schoolMembership.updateMany({
          where: {
            schoolId,
            userId: { in: validUserIds },
          },
          data: { role: value },
        });

        message = `Updated role to ${value} for ${result.count} users`;
        break;

      case 'password-reset':
        // Reset passwords for all selected users
        const passwordResetResults = [];
        
        for (const userId of validUserIds) {
          const newPassword = generatePassword();
          const hashedPassword = await bcrypt.hash(newPassword, 12);
          
          await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
          });
          
          passwordResetResults.push({ userId, newPassword });
        }

        message = `Reset passwords for ${validUserIds.length} users`;
        result = { count: validUserIds.length };
        
        return {
          success: true,
          message,
          data: {
            type,
            processedUserIds: validUserIds,
            affectedCount: validUserIds.length,
            passwordResets: passwordResetResults,
          },
        };
        break;

      case 'status':
        // Update user status
        if (!value) {
          return { success: false, error: 'Status value is required' };
        }
        
        const isActive = value === 'active';
        result = await prisma.user.updateMany({
          where: { id: { in: validUserIds } },
          data: { isActive },
        });

        message = `Updated status to ${value} for ${result.count} users`;
        break;

      case 'class-assign':
        // Verify class exists and belongs to school
        if (!value) {
          return { success: false, error: 'Class ID is required' };
        }
        
        const classToAssign = await prisma.class.findFirst({
          where: { id: value, schoolId },
        });

        if (!classToAssign) {
          return { success: false, error: 'Class not found or does not belong to this school' };
        }

        // Get users with their roles for proper assignment
        const usersWithRoles = await prisma.schoolMembership.findMany({
          where: {
            schoolId,
            userId: { in: validUserIds },
          },
          select: { userId: true, role: true },
        });

        // Separate teachers and students
        const teacherIds = usersWithRoles.filter(u => u.role === 'TEACHER').map(u => u.userId);
        const studentIds = usersWithRoles.filter(u => u.role === 'STUDENT').map(u => u.userId);

        let assignedCount = 0;

        // Assign teachers to class
        if (teacherIds.length > 0) {
          const teacherAssignments = teacherIds.map(userId => ({
            userId,
            classId: value,
          }));

          const teacherResult = await prisma.teacherClass.createMany({
            data: teacherAssignments,
          });
          assignedCount += teacherResult.count;
        }

        // Assign students to class
        if (studentIds.length > 0) {
          const studentAssignments = studentIds.map(userId => ({
            userId,
            classId: value,
          }));

          const studentResult = await prisma.studentClass.createMany({
            data: studentAssignments,
          });
          assignedCount += studentResult.count;
        }

        message = `Assigned ${assignedCount} users to class ${classToAssign.name}`;
        break;

      case 'class-remove':
        // Verify class exists and belongs to school
        if (!value) {
          return { success: false, error: 'Class ID is required' };
        }
        
        const classToRemove = await prisma.class.findFirst({
          where: { id: value, schoolId },
        });

        if (!classToRemove) {
          return { success: false, error: 'Class not found or does not belong to this school' };
        }

        // Remove from both teacher and student classes
        const [teacherRemoved, studentRemoved] = await Promise.all([
          prisma.teacherClass.deleteMany({
            where: {
              classId: value,
              userId: { in: validUserIds },
            },
          }),
          prisma.studentClass.deleteMany({
            where: {
              classId: value,
              userId: { in: validUserIds },
            },
          }),
        ]);

        const totalRemoved = teacherRemoved.count + studentRemoved.count;
        message = `Removed ${totalRemoved} users from class ${classToRemove.name}`;
        break;

      default:
        return { success: false, error: 'Invalid operation type' };
    }

    return {
      success: true,
      message,
      data: {
        type,
        value,
        processedUserIds: validUserIds,
        affectedCount: result?.count || validUserIds.length,
      },
    };

  } catch (error) {
    console.error('Error performing bulk operation:', error);
    
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid request data' };
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
 * Bulk create users from CSV data with class creation and assignment
 */
export async function bulkCreateSchoolUsers(
  schoolId: string,
  users: BulkUserData[]
): Promise<BulkImportResult> {
  try {
    await requireSchoolPermission(schoolId, PERMISSIONS.MANAGE_SCHOOL);

    if (!users || users.length === 0) {
      return {
        success: false,
        error: 'No user data provided',
      };
    }

    // Get school information
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: { email: true, name: true },
    });

    if (!school?.email) {
      return {
        success: false,
        error: 'School email not configured. Please contact administrator.',
      };
    }

    const created: Array<SchoolUser & { loginIdentifier: string; generatedPassword: string; assignedClass?: string }> = [];
    const createdClasses: Array<{ name: string; code?: string; gradeLevel?: string; subject?: string }> = [];
    const errors: Array<{ row: number; username: string; error: string }> = [];
    const classCache = new Map<string, string>(); // className -> classId

    // Process each user
    for (let i = 0; i < users.length; i++) {
      const userData = users[i];
      const rowNumber = i + 1;

      try {
        // Validate user data
        const validatedData = bulkUserSchema.parse(userData);

        // Check if username is unique within the school
        const isUnique = await isUsernameUniqueInSchool(validatedData.username, schoolId);
        if (!isUnique) {
          errors.push({
            row: rowNumber,
            username: validatedData.username,
            error: 'Username already exists in this school',
          });
          continue;
        }

        // Generate password
        const password = generatePassword();
        const hashedPassword = await bcrypt.hash(password, 12);

        // Compute HK-style name
        const computedName = computeHKName(validatedData.firstName, validatedData.lastName);

        // Handle class creation/assignment
        let classId: string | undefined;
        let assignedClassName: string | undefined;

        if (validatedData.className && (validatedData.role === 'STUDENT' || validatedData.role === 'TEACHER')) {
          const classKey = validatedData.className.toLowerCase();
          
          // Check if class already exists in cache
          if (classCache.has(classKey)) {
            classId = classCache.get(classKey);
            assignedClassName = validatedData.className;
          } else {
            // Check if class exists in database
            const existingClass = await prisma.class.findFirst({
              where: {
                schoolId: schoolId,
                OR: [
                  { name: { equals: validatedData.className } },
                  ...(validatedData.classCode ? [{ code: validatedData.classCode }] : [])
                ],
                isActive: true,
              },
            });

            if (existingClass) {
              classId = existingClass.id;
              classCache.set(classKey, classId);
              assignedClassName = existingClass.name;
            } else {
              // Create new class
              try {
                const newClass = await prisma.class.create({
                  data: {
                    name: validatedData.className,
                    code: validatedData.classCode || undefined,
                    gradeLevel: validatedData.gradeLevel || undefined,
                    subject: validatedData.subject || undefined,
                    schoolYear: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
                    schoolId: schoolId,
                  },
                });

                classId = newClass.id;
                classCache.set(classKey, classId);
                assignedClassName = newClass.name;

                // Track created class
                const existingCreatedClass = createdClasses.find(c => c.name === validatedData.className);
                if (!existingCreatedClass) {
                  createdClasses.push({
                    name: validatedData.className,
                    code: validatedData.classCode,
                    gradeLevel: validatedData.gradeLevel,
                    subject: validatedData.subject,
                  });
                }
              } catch (classError) {
                console.error(`Error creating class for row ${rowNumber}:`, classError);
                errors.push({
                  row: rowNumber,
                  username: validatedData.username,
                  error: `Failed to create class: ${validatedData.className}`,
                });
                continue;
              }
            }
          }
        }

        // Create user with transaction
        const result = await prisma.$transaction(async (tx) => {
          // Create the user
          const newUser = await tx.user.create({
            data: {
              username: validatedData.username,
              firstName: validatedData.firstName,
              lastName: validatedData.lastName,
              name: computedName,
              password: hashedPassword,
              studentId: validatedData.studentId,
              gradeLevel: validatedData.gradeLevel, // Keep for individual tracking
              isActive: true,
            },
          });

          // Create school membership
          await tx.schoolMembership.create({
            data: {
              userId: newUser.id,
              schoolId: schoolId,
              role: validatedData.role,
              isActive: true,
            },
          });

          // Assign to class if specified
          if (classId && validatedData.role === 'STUDENT') {
            await tx.studentClass.create({
              data: {
                userId: newUser.id,
                classId: classId,
                isActive: true,
              },
            });
          } else if (classId && validatedData.role === 'TEACHER') {
            await tx.teacherClass.create({
              data: {
                userId: newUser.id,
                classId: classId,
                isActive: true,
              },
            });
          }

          return newUser;
        });

        // Construct full login identifier
        const loginIdentifier = constructLoginIdentifier(validatedData.username, school.email);

        created.push({
          id: result.id,
          username: result.username!,
          firstName: result.firstName!,
          lastName: result.lastName!,
          name: result.name,
          loginIdentifier,
          email: result.email,
          role: validatedData.role,
          studentId: result.studentId,
          gradeLevel: result.gradeLevel,
          department: result.department,
          isActive: result.isActive,
          joinedAt: new Date(),
          generatedPassword: password,
          assignedClass: assignedClassName,
        });

      } catch (error) {
        console.error(`Error creating user at row ${rowNumber}:`, error);
        
        let errorMessage = 'Failed to create user';
        if (error instanceof z.ZodError) {
          errorMessage = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }

        errors.push({
          row: rowNumber,
          username: userData.username || 'Unknown',
          error: errorMessage,
        });
      }
    }

    return {
      success: true,
      data: {
        created,
        createdClasses,
        errors,
        summary: {
          total: users.length,
          successful: created.length,
          failed: errors.length,
          classesCreated: createdClasses.length,
        },
      },
    };

  } catch (error) {
    console.error('Error in bulk user creation:', error);
    return {
      success: false,
      error: 'Failed to process bulk user creation',
    };
  }
}

/**
 * Generate CSV template for bulk user import with class support
 */
export async function generateBulkUserTemplate(schoolId: string): Promise<ActionResponse<string>> {
  try {
    await requireSchoolPermission(schoolId, PERMISSIONS.MANAGE_SCHOOL);

    const headers = ['username', 'firstName', 'lastName', 'role', 'studentId', 'className', 'classCode', 'gradeLevel'];
    const sampleData = [
      ['john.doe', 'John', 'Doe', 'STUDENT', 'S001', '1A', '1A', 'S1'],
      ['jane.smith', 'Jane', 'Smith', 'STUDENT', 'S002', '1A', '1A', 'S1'],
      ['mary.wong', 'Mary', 'Wong', 'TEACHER', '', '1A', '1A', 'S1'],
      ['peter.chan', 'Peter', 'Chan', 'STUDENT', 'P001', '6B', '6B', 'P6'],
      ['admin.user', 'Admin', 'User', 'ADMIN', '', '', '', ''],
    ];

    const csvContent = [headers, ...sampleData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    return {
      success: true,
      data: csvContent,
    };

  } catch (error) {
    console.error('Error generating template:', error);
    return {
      success: false,
      error: 'Failed to generate template',
    };
  }
} 