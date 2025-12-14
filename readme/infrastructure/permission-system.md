# Simplified Permission System Documentation

This document outlines the simplified roles and permissions system implemented in the school management application.

## Goal

Provide simple, maintainable access control with system-enforced roles and minimal permissions. The system differentiates between system-level administration (SUPER_ADMIN) and school-specific roles (ADMIN, TEACHER, STUDENT).

## Design Philosophy

**Simplicity Over Complexity**: Instead of a complex database-driven permission system, we use:
- **3 Core Permissions**: Only the essential permissions needed
- **4 System-Enforced Roles**: Predefined roles that cannot be customized
- **String-Based Roles**: Simple string fields instead of database relations
- **Shared Constants**: Single source of truth for all permissions and roles

## Database Schema

The simplified system uses minimal database models:

### User Model
```prisma
model User {
  id            String    @id @default(cuid())
  email         String?   @unique  // Optional - supports username-only login
  username      String?              // School-specific login
  firstName     String?
  lastName      String?
  password      String
  isActive      Boolean   @default(true)
  
  // Simple string field for system role
  systemRole    String?   // "SUPER_ADMIN" or null
  
  // Student-specific fields
  studentId     String?
  gradeLevel    String?
  department    String?   // For teachers
  
  // Relations
  accounts              Account[]
  sessions              Session[]
  schoolMemberships     SchoolMembership[]
  teacherClasses        TeacherClass[]
  studentClasses        StudentClass[]
}
```

### School Membership Model
```prisma
model SchoolMembership {
  id        String  @id @default(cuid())
  userId    String
  schoolId  String
  role      String  // "ADMIN", "TEACHER", or "STUDENT"
  isActive  Boolean @default(true)
  
  user      User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  school    School  @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  
  @@unique([userId, schoolId])
}
```

## Core Constants (lib/constants.ts)

### Permissions (3 Total)
```typescript
export const PERMISSIONS = {
  // System-level permissions
  CREATE_SCHOOL: 'CREATE_SCHOOL',
  
  // School-level permissions
  MANAGE_SCHOOL: 'MANAGE_SCHOOL',
  MANAGE_ASSIGNMENTS: 'MANAGE_ASSIGNMENTS',
} as const;
```

### Roles (4 System-Enforced)
```typescript
export const SYSTEM_ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
} as const;

export const SCHOOL_ROLES = {
  ADMIN: 'ADMIN',
  TEACHER: 'TEACHER', 
  STUDENT: 'STUDENT',
} as const;
```

### Role Permissions Mapping
```typescript
export const ROLE_PERMISSIONS = {
  // System roles
  [SYSTEM_ROLES.SUPER_ADMIN]: [PERMISSIONS.CREATE_SCHOOL],
  
  // School roles
  [SCHOOL_ROLES.ADMIN]: [PERMISSIONS.MANAGE_SCHOOL],
  [SCHOOL_ROLES.TEACHER]: [PERMISSIONS.MANAGE_ASSIGNMENTS],
  [SCHOOL_ROLES.STUDENT]: [], // Students don't need special permissions
} as const;
```

## Permission Functions (lib/permissions.ts)

### System Permission Checking
```typescript
export async function checkSystemPermission(userId: string, permissionName: Permission): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { systemRole: true },
  });

  if (!user?.systemRole) {
    return false;
  }

  return roleHasPermission(user.systemRole as SystemRole, permissionName);
}
```

### School Permission Checking
```typescript
export async function checkSchoolPermission(userId: string, schoolId: string, permissionName: Permission): Promise<boolean> {
  const membership = await prisma.schoolMembership.findUnique({
    where: { userId_schoolId: { userId, schoolId } },
    select: { isActive: true, role: true },
  });

  if (!membership?.isActive || !membership?.role) {
    return false;
  }

  return roleHasPermission(membership.role as SchoolRole, permissionName);
}
```

### Convenience Functions
```typescript
export async function canManageSchool(userId: string, schoolId: string): Promise<boolean> {
  return checkSchoolPermission(userId, schoolId, PERMISSIONS.MANAGE_SCHOOL);
}

export async function canManageAssignments(userId: string, schoolId: string): Promise<boolean> {
  return checkSchoolPermission(userId, schoolId, PERMISSIONS.MANAGE_ASSIGNMENTS);
}
```

## Authorization Flow

### 1. Server-Side Enforcement
Access control is enforced on the server within API routes and server actions:

```typescript
// System-level operations (SUPER_ADMIN only)
await requireSystemPermission(PERMISSIONS.CREATE_SCHOOL);

// School-level operations
await requireSchoolPermission(schoolId, PERMISSIONS.MANAGE_SCHOOL);
```

### 2. Authentication Utilities (lib/authUtils.ts)

#### SUPER_ADMIN Bypass Logic
```typescript
export async function requireSchoolPermission(schoolId: string, permissionName: Permission): Promise<{ userId: string }> {
  const { userId } = await requireAuth();

  // SUPER_ADMIN can access any school
  const isSuperAdmin = await checkSystemPermission(userId, PERMISSIONS.CREATE_SCHOOL);
  if (isSuperAdmin) {
    return { userId };
  }

  // Otherwise check school-specific permissions
  const hasPermission = await checkSchoolPermission(userId, schoolId, permissionName);
  if (!hasPermission) {
    throw new Error('Insufficient permissions');
  }

  return { userId };
}
```

#### System Permission Requirement
```typescript
export async function requireSystemPermission(permissionName: Permission): Promise<{ userId: string }> {
  const { userId } = await requireAuth();
  
  const hasPermission = await checkSystemPermission(userId, permissionName);
  if (!hasPermission) {
    throw new Error('Insufficient permissions');
  }
  
  return { userId };
}
```

### 3. NextAuth Integration
```typescript
// In NextAuth options
async jwt({ token, user }) {
  if (user) {
    const userWithRole = await prisma.user.findUnique({
      where: { id: user.id },
      select: { systemRole: true }
    });
    token.isSuperAdmin = userWithRole?.systemRole === SYSTEM_ROLES.SUPER_ADMIN;
  }
  return token;
}
```

## Server Actions Usage Examples

### System-Level Operations
```typescript
// server/app/actions/schools.ts
export async function createSchool(data: CreateSchoolData) {
  await requireSystemPermission(PERMISSIONS.CREATE_SCHOOL);
  
  // Create school logic...
}
```

### School-Level Operations
```typescript
// server/app/actions/school-users.ts
export async function getSchoolUsers(params: GetUsersParams) {
  await requireSchoolPermission(params.schoolId, PERMISSIONS.MANAGE_SCHOOL);
  
  // Get school users logic...
}

// server/app/actions/assignments/create.ts
export async function createAssignment(data: CreateAssignmentData) {
  await requireSchoolPermission(data.schoolId, PERMISSIONS.MANAGE_ASSIGNMENTS);
  
  // Create assignment logic...
}
```

## Permission Hierarchy

### SUPER_ADMIN Powers
- ✅ Can create schools (`CREATE_SCHOOL`)
- ✅ Can access ANY school (bypasses school permission checks)
- ✅ Can manage users in ANY school
- ✅ Can manage assignments in ANY school

### School ADMIN Powers
- ✅ Can manage school info, users, classes (`MANAGE_SCHOOL`)
- ✅ Can assign/remove users to/from classes
- ✅ Can change user roles within the school
- ❌ Cannot create new schools
- ❌ Cannot access other schools

### TEACHER Powers
- ✅ Can manage assignments in assigned classes (`MANAGE_ASSIGNMENTS`)
- ✅ Can view students in assigned classes
- ❌ Cannot manage school settings
- ❌ Cannot manage other users

### STUDENT Powers
- ✅ Can view assigned classes and assignments
- ❌ No special permissions (read-only access)

## Benefits of Simplified System

### 1. **Maintainability**
- No complex database joins for permission checking
- Simple string comparisons instead of relation queries
- Easy to understand and debug

### 2. **Performance**
- Faster permission checks (no joins required)
- Reduced database complexity
- Simpler caching strategies

### 3. **Type Safety**
- Compile-time checking of permissions and roles
- Shared constants prevent typos
- Clear TypeScript types for all roles and permissions

### 4. **Consistency**
- Single source of truth in `lib/constants.ts`
- No hardcoded strings throughout codebase
- Follows Core Rule #4 about shared constants

## Migration from Complex System

The system was simplified from a complex database-driven permission system to this streamlined approach:

### What Was Removed
- ❌ `Permission` database table
- ❌ `Role` database table  
- ❌ `RolePermission` join table
- ❌ Custom role creation functionality
- ❌ Complex permission inheritance
- ❌ Database relations for roles

### What Was Added
- ✅ Shared constants in `lib/constants.ts`
- ✅ Simple string-based roles
- ✅ Type-safe permission checking
- ✅ Performance-optimized queries
- ✅ Easier testing and debugging

## Seed Data (prisma/seed.ts)

The seed script creates demo users with the simplified roles:

```typescript
// SUPER_ADMIN user
const superAdmin = await prisma.user.create({
  email: 'superadmin@system.local',
  username: 'superadmin',
  systemRole: SYSTEM_ROLES.SUPER_ADMIN,
  // ...
});

// School admin user
const schoolAdmin = await prisma.user.create({
  email: 'admin@demo-school.edu',
  username: 'schooladmin',
  // No systemRole - will be assigned school role via membership
});

await prisma.schoolMembership.create({
  userId: schoolAdmin.id,
  schoolId: demoSchool.id,
  role: SCHOOL_ROLES.ADMIN,
});
```

## Testing the System

### Permission Checking Tests
```typescript
// Test system permission
const canCreateSchool = await checkSystemPermission(superAdminId, PERMISSIONS.CREATE_SCHOOL);
expect(canCreateSchool).toBe(true);

// Test school permission
const canManageSchool = await checkSchoolPermission(adminId, schoolId, PERMISSIONS.MANAGE_SCHOOL);
expect(canManageSchool).toBe(true);
```

### Role Validation Tests
```typescript
// Test role validation
expect(isValidSystemRole('SUPER_ADMIN')).toBe(true);
expect(isValidSchoolRole('ADMIN')).toBe(true);
expect(isValidSchoolRole('INVALID_ROLE')).toBe(false);
```

## Debugging Permission Issues

When debugging permission issues, check these logs:

1. **Authentication**: `requireAuth` logs user authentication status
2. **System Permissions**: `checkSystemPermission` logs SUPER_ADMIN checks
3. **School Permissions**: `checkSchoolPermission` logs membership and role checks
4. **Authorization**: `requireSchoolPermission` logs the full authorization flow

Example log flow for a school operation:
```
requireSchoolPermission: Starting check for permission 'MANAGE_SCHOOL' in school 'school123'
requireAuth: User user456 authenticated successfully
requireSchoolPermission: User user456 isSuperAdmin: false
checkSchoolPermission: Checking permission 'MANAGE_SCHOOL' for user user456 in school school123
checkSchoolPermission: Found membership for user user456 in school school123: {isActive: true, role: 'ADMIN'}
checkSchoolPermission: Role 'ADMIN' has permission 'MANAGE_SCHOOL': true
requireSchoolPermission: User user456 authorized for permission 'MANAGE_SCHOOL' in school 'school123'
```

This simplified system provides all the necessary access control while being much easier to maintain, debug, and extend. 