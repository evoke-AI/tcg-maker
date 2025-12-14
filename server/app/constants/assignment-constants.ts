/**
 * Assignment and Submission Constants
 * 
 * Centralized constants for assignment and submission statuses, types, and other
 * string literals to ensure consistency across the entire system.
 */

// Submission Status Constants
export const SUBMISSION_STATUS = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED', 
  GRADED: 'GRADED',
  ANALYZING: 'ANALYZING'
} as const;

// Submission Type Constants
export const SUBMISSION_TYPE = {
  ORIGINAL: 'ORIGINAL',
  REVISION: 'REVISION'
} as const;

// Assignment Type Constants
export const ASSIGNMENT_TYPE = {
  GENERAL: 'GENERAL',
  ENGLISH_WRITING: 'ENGLISH_WRITING',
  ENGLISH_COMPREHENSION: 'ENGLISH_COMPREHENSION'
} as const;

// Type definitions for TypeScript
export type SubmissionStatus = typeof SUBMISSION_STATUS[keyof typeof SUBMISSION_STATUS];
export type SubmissionType = typeof SUBMISSION_TYPE[keyof typeof SUBMISSION_TYPE];
export type AssignmentType = typeof ASSIGNMENT_TYPE[keyof typeof ASSIGNMENT_TYPE];

// Helper functions for type checking
export const isValidSubmissionStatus = (status: string): status is SubmissionStatus => {
  return Object.values(SUBMISSION_STATUS).includes(status as SubmissionStatus);
};

export const isValidSubmissionType = (type: string): type is SubmissionType => {
  return Object.values(SUBMISSION_TYPE).includes(type as SubmissionType);
};

export const isValidAssignmentType = (type: string): type is AssignmentType => {
  return Object.values(ASSIGNMENT_TYPE).includes(type as AssignmentType);
};

// Arrays for iteration/validation
export const SUBMISSION_STATUS_VALUES = Object.values(SUBMISSION_STATUS);
export const SUBMISSION_TYPE_VALUES = Object.values(SUBMISSION_TYPE);
export const ASSIGNMENT_TYPE_VALUES = Object.values(ASSIGNMENT_TYPE); 