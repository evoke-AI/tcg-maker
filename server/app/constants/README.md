# Assignment Constants Refactoring

## Overview
This directory contains centralized constants for the assignment system to ensure consistency across the entire codebase and prevent hard-coded string literals.

## Files
- `assignment-constants.ts` - Main constants file containing all assignment and submission related constants

## Constants Defined

### Submission Status
- `SUBMISSION_STATUS.DRAFT` - Initial state when submission is created
- `SUBMISSION_STATUS.SUBMITTED` - When student submits their work
- `SUBMISSION_STATUS.GRADED` - When teacher has graded the submission
- `SUBMISSION_STATUS.ANALYZING` - When AI analysis is in progress

### Submission Type
- `SUBMISSION_TYPE.ORIGINAL` - First submission by student
- `SUBMISSION_TYPE.REVISION` - Subsequent revisions/versions

### Assignment Type
- `ASSIGNMENT_TYPE.GENERAL` - General assignments
- `ASSIGNMENT_TYPE.ENGLISH_WRITING` - English writing assignments
- `ASSIGNMENT_TYPE.ENGLISH_COMPREHENSION` - English comprehension assignments

## Progress

### ✅ Completed
- Created centralized constants file
- Updated type definitions in `actions/assignments/types.ts`
- Updated `actions/assignments/create.ts` (partial)
- Updated `actions/assignments/read.ts` (partial)

### 🔄 In Progress
- Updating all remaining files that use hard-coded strings
- Need to update approximately 20+ files across the codebase

### 📋 Files Still Needing Updates
- `actions/assignments/update.ts`
- `app/[locale]/assignments/page.tsx`
- `app/[locale]/assignments/AssignmentsList.tsx`
- `app/[locale]/assignments/[id]/AssignmentDetail.tsx`
- `app/[locale]/submissions/[id]/TeacherSubmissionReview.tsx`
- `app/api/assignments/[id]/submissions/[submissionId]/grade/route.ts`
- `app/api/assignments/[id]/analyze/route.ts`
- And many more...

## Benefits
1. **Type Safety** - TypeScript will catch typos and invalid status values
2. **Consistency** - All status strings are guaranteed to be identical
3. **Maintainability** - Changes to status values only need to be made in one place
4. **Refactoring Safety** - IDE can find all usages when renaming constants
5. **Documentation** - Constants serve as documentation of valid values

## Usage Example

```typescript
import { SUBMISSION_STATUS, ASSIGNMENT_TYPE } from '@/constants/assignment-constants';

// Instead of:
if (submission.status === 'GRADED') { ... }

// Use:
if (submission.status === SUBMISSION_STATUS.GRADED) { ... }
```

## Next Steps
1. Continue updating remaining files to use constants
2. Add validation functions where appropriate
3. Consider adding constants for other string literals (permissions, roles, etc.)
4. Update database migration files to reference constants if possible 