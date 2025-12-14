import { type UserProfile } from '@/app/actions/profile';

export type { UserProfile };

export interface ProfileFormData {
  firstName: string;
  lastName: string;
  email: string;
  studentId: string;
  gradeLevel: string;
  department: string;
}

export interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface SchoolMembership {
  schoolId: string;
  schoolName: string;
  schoolCode: string | null;
  role: string;
  joinedAt: Date | string;
} 