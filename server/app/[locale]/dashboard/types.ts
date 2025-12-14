export interface SchoolMembership {
  role: string;
  joinedAt: Date;
  school: {
    id: string;
    name: string;
    code: string | null;
    address: string | null;
    phone: string | null;
    email: string | null;
    website: string | null;
  };
}

export interface ClassInfo {
  assignedAt?: Date;
  enrolledAt?: Date;
  class: {
    id: string;
    name: string;
    code: string | null;
    subject: string | null;
    gradeLevel: string | null;
    description: string | null;
    school: {
      name: string;
    };
    _count: {
      students: number;
    };
  };
}

// Assignment interface removed - assignments feature not available in this template

export interface UserInfo {
  id: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  studentId: string | null;
  gradeLevel: string | null;
  department: string | null;
  systemRole: string | null;
  isActive: boolean;
  schoolMemberships: SchoolMembership[];
  teacherClasses: ClassInfo[];
  studentClasses: ClassInfo[];
}

export interface Stats {
  totalSchools: number;
  totalClasses: number;
  teachingClasses: number;
  enrolledClasses: number;
  totalStudents: number;
}

export interface DashboardClientProps {
  user: UserInfo;
  stats: Stats;
  assignmentsDue: never[]; // Empty array - assignments feature not available
  isTeacher: boolean;
  isStudent: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
} 