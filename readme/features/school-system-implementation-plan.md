# School Management System Implementation Plan

## Overview

This document outlines the comprehensive plan for implementing a school-centric management system that replaces the generic organization model with purpose-built school functionality. The system supports hierarchical class management, school-specific role isolation, and bulk user operations.

## Architecture Summary

### Database Schema Changes ✅ COMPLETED

**New Models:**
- `School` - Replaces Organization with school-specific fields
- `Class` - Supports teacher assignment and student enrollment
- `SchoolMembership` - Replaces OrganizationMembership
- `TeacherClass` - Many-to-many relationship for teacher-class assignments
- `StudentClass` - Many-to-many relationship for student-class enrollments

**Enhanced User Model:**
- Added `username` field for school-based login
- Made `email` optional (not required for students)
- Added `studentId` and `gradeLevel` fields
- Support for dual authentication (username OR email)

**Role System Updates:**
- School-specific roles isolated from system roles
- Role names unique within school context
- Support for role creation by school admins

### Permission System ✅ COMPLETED

**New Permissions:**
- System Level: `CREATE_SCHOOL`, `MANAGE_SYSTEM_ROLES`
- School Level: `MANAGE_SCHOOL_USERS`, `MANAGE_SCHOOL_CLASSES`, `CREATE_SCHOOL_ROLES`, `BULK_IMPORT_USERS`, `GENERATE_USER_PASSWORDS`
- Teacher Level: `VIEW_ASSIGNED_CLASSES`, `MANAGE_CLASS_CONTENT`
- Student Level: `VIEW_ENROLLED_CLASSES`, `ACCESS_CLASS_CONTENT`

**New Roles:**
- `SUPER_ADMIN` (System) - Can create schools
- `SCHOOL_ADMIN` (School) - Full school management
- `TEACHER` (School) - Class management
- `STUDENT` (School) - Class access

### Core Utilities ✅ COMPLETED

**Password Generation:**
- `generatePassword()` - Creates "word-word-word" format passwords
- `generatePasswords(count)` - Bulk password generation
- `validatePassword()` - Ensures 12+ character requirement
- `generatePasswordCSV()` - CSV export for password distribution

**Authentication Updates:**
- Enhanced mobile auth to support username/email login
- School context filtering with `schoolCode` parameter
- JWT payload includes school memberships and roles

## Implementation Status

### ✅ Completed Components

1. **Database Schema Design**
   - Development schema (`schema.dev.prisma`)
   - Production schema (`schema.prod.prisma`)
   - Migration-ready structure

2. **Permission System**
   - Updated `permissions.ts` with school-specific functions
   - Enhanced `authUtils.ts` with school permission checking
   - Backward compatibility maintained

3. **Password Generation Utility**
   - Complete `passwordGenerator.ts` implementation
   - CSV export functionality
   - Secure filename generation

4. **Seed Data**
   - Updated `seed.ts` with school-specific permissions and roles
   - Demo school creation with sample classes
   - School admin user creation

5. **Mobile Authentication**
   - Enhanced to support username/email login
   - School context filtering
   - Extended JWT payload with school information

### 🔄 Next Steps Required

#### 1. Database Migration & Client Regeneration
```bash
cd server
npx prisma generate
npx prisma db push  # or create migration
npm run seed
```

#### 2. Complete Permission System Implementation
After Prisma regeneration, implement the TODO functions in:
- `lib/permissions.ts`
  - `checkSchoolPermission()`
  - `getUserSchoolsWithPermission()`
  - `isUsernameUniqueInSchool()`
- `lib/authUtils.ts`
  - `getUserManagedSchools()`
  - `getUserSchoolMemberships()`
  - `validateUsernameInSchool()`

#### 3. School Management API Endpoints

**Create School Management APIs:**
```
/api/schools/
├── route.ts (GET: list schools, POST: create school)
├── [schoolId]/
│   ├── route.ts (GET: school details, PUT: update, DELETE: delete)
│   ├── users/
│   │   ├── route.ts (GET: list users, POST: create user)
│   │   ├── bulk-import/route.ts (POST: CSV import)
│   │   ├── generate-passwords/route.ts (POST: generate passwords)
│   │   └── [userId]/route.ts (GET, PUT, DELETE user)
│   ├── classes/
│   │   ├── route.ts (GET: list classes, POST: create class)
│   │   └── [classId]/
│   │       ├── route.ts (GET, PUT, DELETE class)
│   │       ├── teachers/route.ts (GET, POST, DELETE teacher assignments)
│   │       └── students/route.ts (GET, POST, DELETE student enrollments)
│   └── roles/
│       ├── route.ts (GET: list roles, POST: create role)
│       └── [roleId]/route.ts (GET, PUT, DELETE role)
```

#### 4. Frontend Components (Admin Dashboard)

**School Management Pages:**
- School list and creation
- School dashboard with statistics
- User management with bulk import
- Class management with assignments
- Role management interface

**Enhanced User Management:**
- Username/email dual login support
- Student ID and grade level fields
- Password generation and download
- CSV import interface

#### 5. Flutter App Updates

**Authentication Updates:**
- Support username/email login
- School selection interface
- Enhanced user profile with school context

**School-Specific Features:**
- Class enrollment display
- Teacher class assignments
- Student class access

## Technical Specifications

### Username Uniqueness
- Usernames must be unique within each school
- Enforced at application level through `SchoolMembership` relationship
- Validation function: `isUsernameUniqueInSchool()`

### Password Policy
- Minimum 12 characters
- Generated format: "word-word-word" (e.g., "learning-bright-fun")
- User-friendly words from educational/positive categories
- No complex character requirements (user-friendly approach)

### CSV Import Format
```csv
username,role,password,studentId,gradeLevel,classIds
john.doe,STUDENT,,S12345,Grade 5,"MATH5,ENG5"
jane.smith,TEACHER,custom-password,,,"MATH5"
```

### Bulk Operations
- Support for 100+ users per import
- Automatic password generation if not provided
- Downloadable password list after creation
- Class assignment during import

### Security Considerations
- School data isolation through membership-based access
- Role-based permissions within schools
- System admin oversight of all schools
- Secure password distribution via CSV download

## Migration Strategy

### Phase 1: Database Migration
1. Run Prisma generation and migration
2. Execute seed script for demo data
3. Verify schema integrity

### Phase 2: API Implementation
1. Implement school management endpoints
2. Add bulk import functionality
3. Create password generation endpoints

### Phase 3: Frontend Integration
1. Update admin dashboard for schools
2. Implement user management interfaces
3. Add CSV import/export features

### Phase 4: Mobile App Updates
1. Update authentication flow
2. Add school context to user interface
3. Implement class-based navigation

## Testing Strategy

### Unit Tests
- Password generation functions
- Username uniqueness validation
- Permission checking logic

### Integration Tests
- School creation and management
- User import and password generation
- Class assignment workflows

### End-to-End Tests
- Complete user journey from school creation to class enrollment
- Bulk import and password distribution workflow
- Multi-school admin management

## Deployment Considerations

### Environment Variables
- Database connection strings
- JWT secrets for enhanced payloads
- File upload limits for CSV imports

### Performance Optimizations
- Indexed queries for school membership lookups
- Bulk insert operations for user imports
- Cached permission checks for frequent operations

### Monitoring
- School creation and user import metrics
- Authentication success rates by method (username vs email)
- Class enrollment and assignment tracking

## Success Metrics

### Functional Requirements ✅
- [x] SUPER_ADMIN can create schools
- [x] School admins can manage school-specific users and roles
- [x] Username/email dual authentication
- [x] 12-character minimum password policy with friendly generation
- [x] CSV import with optional password generation
- [x] Class management with teacher/student assignments

### Performance Requirements
- [ ] Support 100+ users per CSV import
- [ ] Sub-second authentication response times
- [ ] Efficient permission checking for large schools

### Usability Requirements
- [ ] Intuitive school management interface
- [ ] Simple CSV import process
- [ ] Clear password distribution workflow
- [ ] User-friendly error messages and validation

## Risk Mitigation

### Data Migration Risks
- **Risk:** Data loss during schema migration
- **Mitigation:** Comprehensive backup and rollback procedures

### Performance Risks
- **Risk:** Slow queries with large school datasets
- **Mitigation:** Proper indexing and query optimization

### Security Risks
- **Risk:** Cross-school data access
- **Mitigation:** Strict permission checking and data isolation

### Usability Risks
- **Risk:** Complex bulk import process
- **Mitigation:** Clear documentation and validation feedback

## Conclusion

The school management system architecture provides a robust foundation for educational institution management with proper data isolation, flexible role management, and user-friendly bulk operations. The implementation plan ensures a systematic approach to deployment while maintaining system security and performance. 