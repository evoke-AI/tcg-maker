import { z } from 'zod';

// User type definition used in admin actions/responses
export type User = {
  id: string;
  name: string | null;
  username: string | null;
  email: string | null;
  // role: 'admin' | 'user'; // Removed role
  status: 'active' | 'inactive' | 'pending';
  lastLogin: Date | null;
  systemRoleName: string | null; // Added system role name
  // School information for school users
  schools?: Array<{
    name: string;
    email: string;
    role: string;
  }>;
};

// User validation schema (for create/update)
export const UserSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, { message: "Name must be at least 2 characters" }).nullable(),
  email: z.string().email({ message: "Invalid email address" }),
  status: z.enum(['active', 'inactive', 'pending']).default('active'), // Keep status for now, maps to isActive/emailVerified
  password: z.string().min(8, { message: "Password must be at least 8 characters" }).optional(),
  // Need to add systemRoleId or org memberships/roles here for creation/update forms
  systemRoleId: z.string().optional().nullable(), // Example: Add system role ID (optional)
});

// Simplified response type for actions
export type ActionResponse<T = unknown> = 
  | { success: true; data?: T }
  | { success: false; error?: string; errors?: Record<string, string | string[]> };


// Translation type
export type Translations = {
  admin: (key: string) => string;
  common: (key: string) => string;
};
