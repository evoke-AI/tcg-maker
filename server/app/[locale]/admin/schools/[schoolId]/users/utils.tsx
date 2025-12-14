import React from 'react';
import { SCHOOL_ROLES } from '@/lib/constants';
import { Settings, Briefcase, GraduationCap } from 'lucide-react';

// Utility functions
export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString();
};

/**
 * Extracts the domain from a school contact email
 * @param contactEmail Full contact email (e.g., "contact@demo-sku.edu")
 * @returns Domain part (e.g., "demo-sku.edu") or the original if no @ found
 */
export const extractSchoolDomain = (contactEmail: string): string => {
  if (!contactEmail || typeof contactEmail !== 'string') return contactEmail;
  
  const atIndex = contactEmail.indexOf('@');
  if (atIndex > 0 && atIndex < contactEmail.length - 1) {
    return contactEmail.substring(atIndex + 1);
  }
  
  return contactEmail; // Return original if not in email format
};

export const getRoleColor = (role: string) => {
  switch (role) {
    case SCHOOL_ROLES.ADMIN:
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    case SCHOOL_ROLES.TEACHER:
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case SCHOOL_ROLES.STUDENT:
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
};

export const getRoleIcon = (role: string) => {
  switch (role) {
    case SCHOOL_ROLES.ADMIN:
      return <Settings className="h-4 w-4" />;
    case SCHOOL_ROLES.TEACHER:
      return <Briefcase className="h-4 w-4" />;
    case SCHOOL_ROLES.STUDENT:
      return <GraduationCap className="h-4 w-4" />;
    default:
      return <Settings className="h-4 w-4" />;
  }
};

export const getRoleName = (role: string, t: (key: string) => string) => {
  switch (role) {
    case SCHOOL_ROLES.ADMIN:
      return t('roles.admin');
    case SCHOOL_ROLES.TEACHER:
      return t('roles.teacher');
    case SCHOOL_ROLES.STUDENT:
      return t('roles.student');
    default:
      return role;
  }
};

// Get translated subjects
export const getSubjects = (t: (key: string) => string) => [
  { value: 'Mathematics', label: t('subjects.mathematics') },
  { value: 'English', label: t('subjects.english') },
  { value: 'Science', label: t('subjects.science') },
  { value: 'History', label: t('subjects.history') },
  { value: 'Geography', label: t('subjects.geography') },
  { value: 'Physics', label: t('subjects.physics') },
  { value: 'Chemistry', label: t('subjects.chemistry') },
  { value: 'Biology', label: t('subjects.biology') },
  { value: 'Literature', label: t('subjects.literature') },
  { value: 'Art', label: t('subjects.art') },
  { value: 'Music', label: t('subjects.music') },
  { value: 'Physical Education', label: t('subjects.physicalEducation') },
  { value: 'Computer Science', label: t('subjects.computerScience') },
  { value: 'Other', label: t('subjects.other') }
];

// Get translated grade levels
export const getGradeLevels = (t: (key: string) => string) => ({
  [t('grades.categories.prePrimary')]: [
    { value: 'K1', label: t('grades.levels.k1') },
    { value: 'K2', label: t('grades.levels.k2') },
    { value: 'K3', label: t('grades.levels.k3') }
  ],
  [t('grades.categories.primary')]: [
    { value: 'P1', label: t('grades.levels.p1') },
    { value: 'P2', label: t('grades.levels.p2') },
    { value: 'P3', label: t('grades.levels.p3') },
    { value: 'P4', label: t('grades.levels.p4') },
    { value: 'P5', label: t('grades.levels.p5') },
    { value: 'P6', label: t('grades.levels.p6') }
  ],
  [t('grades.categories.juniorSecondary')]: [
    { value: 'S1', label: t('grades.levels.s1') },
    { value: 'S2', label: t('grades.levels.s2') },
    { value: 'S3', label: t('grades.levels.s3') }
  ],
  [t('grades.categories.seniorSecondary')]: [
    { value: 'S4', label: t('grades.levels.s4') },
    { value: 'S5', label: t('grades.levels.s5') },
    { value: 'S6', label: t('grades.levels.s6') }
  ],
  [t('grades.categories.other')]: [
    { value: 'OTHER', label: t('grades.levels.other') }
  ]
}); 