/**
 * Shared Constants for School Management System
 * 
 * Following core rule #4: Always use shared constants for API communications,
 * and never use string literals to create coupling between client and server.
 * 
 * This file serves as the single source of truth for all permissions, roles,
 * and system constants used across the application.
 */

// ============================================================================
// PERMISSIONS - Only 2 core permissions needed
// ============================================================================

export const PERMISSIONS = {
  // System-level permissions
  CREATE_SCHOOL: 'CREATE_SCHOOL',
  
  // School-level permissions
  MANAGE_SCHOOL: 'MANAGE_SCHOOL',
  MANAGE_ASSIGNMENTS: 'MANAGE_ASSIGNMENTS',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// ============================================================================
// ROLES - System-enforced roles only (no custom roles)
// ============================================================================

export const ROLE_TYPES = {
  SYSTEM: 'SYSTEM',
  SCHOOL: 'SCHOOL',
} as const;

export type RoleType = typeof ROLE_TYPES[keyof typeof ROLE_TYPES];

export const SYSTEM_ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
} as const;

export const SCHOOL_ROLES = {
  ADMIN: 'ADMIN',
  TEACHER: 'TEACHER', 
  STUDENT: 'STUDENT',
} as const;

export type SystemRole = typeof SYSTEM_ROLES[keyof typeof SYSTEM_ROLES];
export type SchoolRole = typeof SCHOOL_ROLES[keyof typeof SCHOOL_ROLES];

// ============================================================================
// ROLE DEFINITIONS - What each role can do
// ============================================================================

export const ROLE_PERMISSIONS = {
  // System roles
  [SYSTEM_ROLES.SUPER_ADMIN]: [PERMISSIONS.CREATE_SCHOOL],
  
  // School roles
  [SCHOOL_ROLES.ADMIN]: [PERMISSIONS.MANAGE_SCHOOL],
  [SCHOOL_ROLES.TEACHER]: [PERMISSIONS.MANAGE_ASSIGNMENTS],
  [SCHOOL_ROLES.STUDENT]: [], // Students don't need special permissions
} as const;

// ============================================================================
// ROLE DESCRIPTIONS
// ============================================================================

export const ROLE_DESCRIPTIONS = {
  [SYSTEM_ROLES.SUPER_ADMIN]: 'System Super Administrator - can create and manage schools',
  [SCHOOL_ROLES.ADMIN]: 'School Administrator - can manage school info, users, classes, and role assignments',
  [SCHOOL_ROLES.TEACHER]: 'Teacher - can manage assignments in assigned classes',
  [SCHOOL_ROLES.STUDENT]: 'Student - can view classes and assignments',
} as const;

// ============================================================================
// PERMISSION DESCRIPTIONS
// ============================================================================

export const PERMISSION_DESCRIPTIONS = {
  [PERMISSIONS.CREATE_SCHOOL]: 'Allows creating new schools (SUPER_ADMIN only)',
  [PERMISSIONS.MANAGE_SCHOOL]: 'Allows managing school info, users, classes, and role assignments',
  [PERMISSIONS.MANAGE_ASSIGNMENTS]: 'Allows managing assignments and class content',
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get all permissions for a given role
 */
export function getRolePermissions(role: SystemRole | SchoolRole): readonly Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Check if a role has a specific permission
 */
export function roleHasPermission(role: SystemRole | SchoolRole, permission: Permission): boolean {
  return getRolePermissions(role).includes(permission);
}

/**
 * Get all available school roles
 */
export function getSchoolRoles(): SchoolRole[] {
  return Object.values(SCHOOL_ROLES);
}

/**
 * Get all available system roles
 */
export function getSystemRoles(): SystemRole[] {
  return Object.values(SYSTEM_ROLES);
}

/**
 * Get all available permissions
 */
export function getAllPermissions(): Permission[] {
  return Object.values(PERMISSIONS);
}

/**
 * Validate if a string is a valid permission
 */
export function isValidPermission(permission: string): permission is Permission {
  return Object.values(PERMISSIONS).includes(permission as Permission);
}

/**
 * Validate if a string is a valid school role
 */
export function isValidSchoolRole(role: string): role is SchoolRole {
  return Object.values(SCHOOL_ROLES).includes(role as SchoolRole);
}

/**
 * Validate if a string is a valid system role
 */
export function isValidSystemRole(role: string): role is SystemRole {
  return Object.values(SYSTEM_ROLES).includes(role as SystemRole);
}

/**
 * Generate a user-friendly password in "word-word-word" format
 */
export function generatePassword(): string {
  const words = [
    'learning', 'studying', 'reading', 'writing', 'thinking', 'growing', 'exploring', 'discovering',
    'bright', 'smart', 'clever', 'quick', 'wise', 'kind', 'happy', 'cheerful',
    'fun', 'cool', 'awesome', 'great', 'super', 'amazing', 'wonderful', 'fantastic'
  ];
  
  const word1 = words[Math.floor(Math.random() * words.length)];
  const word2 = words[Math.floor(Math.random() * words.length)];
  const word3 = words[Math.floor(Math.random() * words.length)];
  
  return `${word1}-${word2}-${word3}`;
} 