export interface School {
  id: string;
  name: string;
  code: string | null;
  email: string | null;
  _count: {
    members: number;
  };
}

export interface SchoolUser {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  studentId?: string;
  gradeLevel?: string;
  department?: string;
  isActive: boolean;
  role: string;
  joinedAt: string;
}

export interface SchoolClass {
  id: string;
  name: string;
  code?: string | null;
  description?: string | null;
  gradeLevel?: string | null;
  subject?: string | null;
  schoolYear?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  teacherCount: number;
  studentCount: number;
  assignmentCount: number;
}

export interface SchoolUsersManagementProps {
  school: School;
}

export interface BulkImportState {
  isOpen: boolean;
  step: 'upload' | 'preview' | 'processing' | 'results';
  file: File | null;
  data: BulkUserData[];
  errors: string[];
  results: BulkImportResult | null;
  processing: boolean;
  credentialsDownloaded: boolean;
}

export interface BulkUserData {
  username: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT';
  studentId?: string;
  className?: string;
  classCode?: string;
  gradeLevel?: string;
  subject?: string;
}

export interface BulkImportResult {
  success: boolean;
  data?: {
    created: Array<{
      id: string;
      username: string;
      firstName: string;
      lastName: string;
      loginIdentifier: string;
      generatedPassword: string;
      role: string;
      assignedClass?: string;
    }>;
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

export interface UserFormData {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  studentId: string;
  gradeLevel: string;
  generatePassword: boolean;
}

export interface ClassFormData {
  name: string;
  code: string;
  subject: string;
  gradeLevel: string;
  description: string;
} 