# Class Management System

## Purpose
Provides a comprehensive interface for school administrators to manage classes and their users within schools. This system includes class creation, editing, filtering, user assignment, bulk operations, and dedicated user management pages. The system integrates seamlessly with the existing user management system and follows modern Next.js best practices with server actions.

## Features

### Core Class Management
- **Create Classes**: Add new classes with detailed information (name, code, subject, grade level, school year, description)
- **Edit Classes**: Update existing class information with validation
- **Delete Classes**: Soft delete classes with confirmation prompts
- **Search & Filter**: Advanced filtering by subject, grade level, school year with real-time search
- **Bulk Operations**: Select multiple classes for bulk deletion or user assignment

### Class User Management
- **Dedicated User Management Page**: Full-page interface for managing users within specific classes
- **Current Users Display**: Grid layout showing all users with role badges, search, and filtering
- **Add Users Functionality**: Dialog with search and role filtering to add available users
- **Remove Users Functionality**: Bulk selection and removal with professional confirmation dialogs
- **Role Management**: Clickable role dropdowns for direct role changes from the user list
- **Responsive Design**: Works on all screen sizes with proper accessibility

### User Assignment
- **Teacher Assignment**: Assign teachers to classes with role validation
- **Student Assignment**: Enroll students in classes with proper verification
- **Available Users**: View and select from users not already assigned to the class
- **Bulk User Operations**: Remove multiple users from classes efficiently

### Advanced Features
- **Pagination**: Server-side pagination for large class and user lists (20 per page)
- **Real-time Counts**: Display teacher, student, and assignment counts for each class
- **Professional UI**: Modern interface with consistent design patterns
- **Permission Enforcement**: Proper authorization checks with SUPER_ADMIN bypass
- **Shared Constants**: Uses centralized constants from `@/lib/constants.ts` for consistency

## Usage

### Server Actions
```ts
// Get classes with filtering and pagination
const result = await getSchoolClasses({
  schoolId: 'school123',
  page: 1,
  limit: 20,
  search: 'math',
  subject: 'Mathematics',
  gradeLevel: 'Grade 9',
  schoolYear: '2024-2025',
  includeUsers: true
});

// Create a new class
const newClass = await createSchoolClass('school123', {
  name: 'Advanced Mathematics',
  code: 'MATH201',
  subject: 'Mathematics',
  gradeLevel: 'Grade 10',
  schoolYear: '2024-2025',
  description: 'Advanced mathematics course for grade 10 students'
});

// Get users in a specific class
const classUsers = await getClassUsers('school123', 'class123', {
  page: 1,
  limit: 20,
  search: 'john',
  role: 'TEACHER'
});

// Assign users to a class
const assignment = await assignUsersToClass('school123', {
  classId: 'class123',
  teacherIds: ['teacher1', 'teacher2'],
  studentIds: ['student1', 'student2', 'student3']
});

// Remove users from a class
const removal = await removeUsersFromClass('school123', 'class123', ['user1', 'user2']);

// Update user role in school
const roleUpdate = await updateSchoolUser('school123', 'user123', {
  role: 'TEACHER'
});

// Bulk operations
const bulkResult = await bulkUpdateSchoolClasses('school123', {
  type: 'delete',
  classIds: ['class1', 'class2', 'class3']
});
```

### UI Components
```tsx
// Main class management (tabbed interface)
import SchoolUsersManagement from '@/app/[locale]/admin/schools/[schoolId]/users/SchoolUsersManagement';
<SchoolUsersManagement school={schoolData} />

// Dedicated class user management page
// Available at: /admin/schools/[schoolId]/classes/[classId]/users
```

## Architecture

### Database Schema
The system uses the existing Prisma schema with these key models:
- **Class**: Core class information with school relationship
- **TeacherClass**: Many-to-many relationship between teachers and classes
- **StudentClass**: Many-to-many relationship between students and classes
- **SchoolMembership**: User roles within schools for permission validation

### Server Actions Structure
```
server/app/actions/school-classes.ts
├── getSchoolClasses()          # Fetch with filtering/pagination
├── createSchoolClass()         # Create new class
├── updateSchoolClass()         # Update existing class
├── deleteSchoolClass()         # Soft delete class
├── getClassUsers()             # Get users in a specific class
├── assignUsersToClass()        # Assign teachers/students
├── removeUsersFromClass()      # Remove user assignments
├── bulkUpdateSchoolClasses()   # Bulk operations
└── getAvailableUsersForClass() # Get unassigned users

server/app/actions/school-users.ts
└── updateSchoolUser()          # Update user role and information
```

### UI Components Structure
```
server/app/[locale]/admin/schools/[schoolId]/
├── users/
│   ├── page.tsx                    # Main users page with tabbed interface
│   └── SchoolUsersManagement.tsx   # Main management interface (Users + Classes tabs)
└── classes/
    └── [classId]/
        └── users/
            ├── page.tsx                    # Dedicated class user management page
            └── ClassUsersManagement.tsx    # Class-specific user management component
```

## Key Features Breakdown

### 1. Integrated Tabbed Interface
- **Users Tab**: Comprehensive user management with role dropdowns and bulk operations
- **Classes Tab**: Full class management with creation, editing, and user assignment
- **Unified Navigation**: Seamless switching between user and class management
- **Consistent Design**: Shared UI patterns and styling across both tabs

### 2. Dedicated Class User Management
- **Full-Page Interface**: Dedicated route `/admin/schools/[schoolId]/classes/[classId]/users`
- **Current Users Grid**: Professional layout with user cards, role badges, and pagination
- **Advanced Search**: Real-time search across user names and usernames
- **Role Filtering**: Filter users by role (All/Teachers/Students) with dropdown
- **Bulk Selection**: Multi-select interface for efficient user removal

### 3. Professional Add Users Dialog
- **Unified User List**: Single list with role badges instead of separate sections
- **Clean Filters**: Role filter dropdown and search in a single row
- **Consistent Design**: Matches the main user list styling and layout
- **Efficient Selection**: Easy multi-select with clear visual feedback

### 4. Role Management System
- **Clickable Role Badges**: Direct role changes from user lists
- **Dropdown Interface**: Professional dropdown positioned next to Edit button
- **Shared Constants**: Uses `SCHOOL_ROLES` and `SchoolRole` type from `@/lib/constants.ts`
- **Automatic Refresh**: Lists update automatically after role changes
- **Error Handling**: Proper error feedback for failed role changes

### 5. Enhanced User Experience
- **Professional Confirmation Dialogs**: Replaced browser confirm() with styled dialogs
- **No Intrusive Alerts**: Removed success popup messages for smoother workflow
- **Loading States**: Proper loading indicators during operations
- **Responsive Design**: Works perfectly on all screen sizes

### 6. Constants Integration
- **Shared Constants**: All role-related code uses `SCHOOL_ROLES` from `@/lib/constants.ts`
- **Type Safety**: Uses `SchoolRole` type for consistent typing
- **Utility Functions**: `getRoleColor`, `getRoleIcon`, `getRoleName` use constants
- **Consistency**: Same constants used across both user and class management components

### 7. Advanced Search & Filtering
- **Real-time Search**: Searches across class name, code, subject, and description
- **Multi-field Filters**: Filter by subject, grade level, and school year
- **Filter Persistence**: Maintains filter state during navigation
- **Clear Filters**: Easy reset of all applied filters

### 8. Class Creation & Editing
- **Comprehensive Form**: All class fields with validation
- **Code Uniqueness**: Ensures class codes are unique within schools
- **Dropdown Selections**: Predefined options for subjects, grades, and years
- **Rich Text Support**: Description field with proper formatting

### 9. Bulk Operations
- **Multi-select Interface**: Checkbox-based selection system
- **Bulk Delete**: Delete multiple classes with confirmation
- **Bulk Assignment**: Assign single user to multiple classes
- **Selection Persistence**: Maintains selections across page interactions

### 10. Permission System Integration
- **School-level Permissions**: Uses `MANAGE_SCHOOL` permission
- **SUPER_ADMIN Bypass**: Super admins can manage any school
- **Role Validation**: Ensures only appropriate users can be assigned
- **Audit Trail**: Comprehensive logging of all operations

## Data Flow

### Class User Management Flow
1. User clicks "Manage Users" button on a class
2. Navigation to dedicated page `/admin/schools/[schoolId]/classes/[classId]/users`
3. Server verifies authentication and permissions
4. `getClassUsers` fetches current users with pagination and filtering
5. UI renders users in grid layout with role badges and controls
6. Real-time updates on search/filter changes

### Add Users Flow
1. User clicks "Add Users" button
2. `getAvailableUsersForClass` fetches users not in the class
3. Dialog opens with unified user list and role filtering
4. User selects users and clicks "Add Selected Users"
5. `assignUsersToClass` processes the assignments
6. Dialog closes and user list refreshes automatically

### Remove Users Flow
1. User selects users via checkboxes
2. User clicks "Remove Selected" button
3. Professional confirmation dialog appears with user count
4. User confirms removal
5. `removeUsersFromClass` processes the removals
6. User list refreshes automatically

### Role Change Flow
1. User clicks role dropdown next to a user
2. Dropdown shows available roles using shared constants
3. User selects new role
4. `updateSchoolUser` processes the role change
5. User list refreshes with updated role badge

### Class Listing Flow
1. User navigates to class management page
2. Server verifies authentication and permissions
3. `getSchoolClasses` fetches filtered/paginated results
4. UI renders classes with counts and metadata
5. Real-time updates on filter/search changes

### Class Creation Flow
1. User opens create dialog
2. Form validation on client-side
3. `createSchoolClass` server action with validation
4. Database transaction with uniqueness checks
5. UI refresh with success/error feedback

## Error Handling

### Client-side Validation
- Required field validation with real-time feedback
- Format validation for codes and names
- Role validation using shared constants
- User selection validation before operations

### Server-side Validation
- Zod schema validation for all inputs
- Business logic validation (uniqueness, permissions)
- Database constraint enforcement
- Role validation against shared constants

### User Feedback
- Professional confirmation dialogs for destructive actions
- Loading states during async operations
- Error messages with proper context
- No intrusive success popups (removed for better UX)

## Performance Optimizations

### Database Queries
- Efficient Prisma queries with proper includes and counting
- Server-side pagination (20 users per page)
- Indexed fields for fast searching
- Optimized role update queries

### Client-side Performance
- Debounced search input to reduce API calls
- Memoized filter functions with useCallback
- Automatic list refresh after operations
- Efficient state management with proper dependencies

## Security Considerations

### Permission Enforcement
- Server-side permission checks on all actions (`MANAGE_SCHOOL`)
- Role-based access control for user assignments
- School boundary enforcement (users can only manage their schools)
- SUPER_ADMIN bypass with proper validation

### Data Validation
- Input sanitization on all user inputs
- SQL injection prevention through Prisma ORM
- XSS prevention in rendered content
- Role validation using shared constants

## Testing Strategy

### Unit Tests
- Server action validation logic
- Permission checking functions
- Data transformation utilities
- Error handling scenarios

### Integration Tests
- Complete class management workflows
- User assignment processes
- Bulk operation scenarios
- Permission boundary testing

### UI Tests
- Form validation and submission
- Filter and search functionality
- Bulk selection interactions
- Responsive design validation

## Future Enhancements

### Planned Features
- **Class Templates**: Reusable class configurations
- **Import/Export**: CSV import/export for bulk class management
- **Class Scheduling**: Integration with timetable management
- **Analytics Dashboard**: Class utilization and performance metrics

### Technical Improvements
- **Real-time Updates**: WebSocket integration for live updates
- **Advanced Filtering**: Date ranges, custom field filters
- **Audit Logging**: Comprehensive change tracking
- **API Integration**: REST API endpoints for external systems

## File Structure
```
server/
├── app/actions/
│   ├── school-classes.ts           # Class-related server actions
│   └── school-users.ts             # User-related server actions
├── app/[locale]/admin/schools/[schoolId]/
│   ├── users/
│   │   ├── page.tsx                # Main users page
│   │   └── SchoolUsersManagement.tsx # Tabbed interface (Users + Classes)
│   └── classes/
│       └── [classId]/
│           └── users/
│               ├── page.tsx        # Dedicated class user management page
│               └── ClassUsersManagement.tsx # Class user management component
├── lib/
│   ├── authUtils.ts               # Permission utilities
│   └── constants.ts               # Shared constants (SCHOOL_ROLES, etc.)
└── readme/
    └── class-management.md        # This documentation
```

## API Reference

### Class Operations

#### getSchoolClasses
- **Purpose**: Fetch classes with filtering and pagination
- **Parameters**: `{ schoolId, page?, limit?, search?, subject?, gradeLevel?, schoolYear?, includeUsers? }`
- **Returns**: `{ success, data: { classes, pagination }, error? }`
- **Permission**: `MANAGE_SCHOOL`

#### createSchoolClass
- **Purpose**: Create a new class in a school
- **Parameters**: `schoolId, classData`
- **Returns**: `{ success, data: class, error?, message? }`
- **Permission**: `MANAGE_SCHOOL`

#### updateSchoolClass
- **Purpose**: Update an existing class
- **Parameters**: `schoolId, classId, updateData`
- **Returns**: `{ success, data: class, error?, message? }`
- **Permission**: `MANAGE_SCHOOL`

#### deleteSchoolClass
- **Purpose**: Soft delete a class
- **Parameters**: `schoolId, classId`
- **Returns**: `{ success, message?, error? }`
- **Permission**: `MANAGE_SCHOOL`

### Class User Operations

#### getClassUsers
- **Purpose**: Get users assigned to a specific class with filtering and pagination
- **Parameters**: `schoolId, classId, { page?, limit?, search?, role? }`
- **Returns**: `{ success, data: { users, pagination }, error? }`
- **Permission**: `MANAGE_SCHOOL`

#### assignUsersToClass
- **Purpose**: Assign teachers and students to a class
- **Parameters**: `schoolId, { classId, teacherIds, studentIds }`
- **Returns**: `{ success, data: { assignedCount }, error? }`
- **Permission**: `MANAGE_SCHOOL`
- **Note**: No success message to avoid intrusive popups

#### removeUsersFromClass
- **Purpose**: Remove users from a class
- **Parameters**: `schoolId, classId, userIds`
- **Returns**: `{ success, data: { removedCount }, error? }`
- **Permission**: `MANAGE_SCHOOL`
- **Note**: No success message to avoid intrusive popups

#### getAvailableUsersForClass
- **Purpose**: Get users available for assignment to a class
- **Parameters**: `schoolId, classId`
- **Returns**: `{ success, data: { teachers, students, totalAvailable }, error? }`
- **Permission**: `MANAGE_SCHOOL`

### User Operations

#### updateSchoolUser
- **Purpose**: Update an existing school user (including role changes)
- **Parameters**: `schoolId, userId, updateData`
- **Returns**: `{ success, data: user, error?, message? }`
- **Permission**: `MANAGE_SCHOOL`
- **Validation**: Username uniqueness, email format, role validation using shared constants

### Bulk Operations

#### bulkUpdateSchoolClasses
- **Purpose**: Perform bulk operations on classes
- **Parameters**: `schoolId, { type, classIds, value? }`
- **Returns**: `{ success, data?, message?, error? }`
- **Permission**: `MANAGE_SCHOOL`

## Change Log

### 2024-12-19: Major User Management Enhancements
- **Added Dedicated Class User Management Page**: New route `/admin/schools/[schoolId]/classes/[classId]/users`
- **Implemented ClassUsersManagement Component**: Full-featured user management for individual classes
- **Added getClassUsers Server Action**: Fetch users in a class with filtering and pagination
- **Enhanced Add Users Dialog**: Unified design with role filtering and clean layout
- **Implemented Role Dropdown Functionality**: Direct role changes from user lists
- **Integrated Shared Constants**: Refactored to use `SCHOOL_ROLES` from `@/lib/constants.ts`
- **Improved User Experience**: Removed intrusive alerts, added professional confirmation dialogs
- **Fixed Data Structure Issues**: Resolved role object vs string mismatch
- **Added Comprehensive Error Handling**: Better error feedback and validation

### 2024-12-19: Initial Implementation
- Created comprehensive class management system within user management interface
- Implemented all CRUD operations with server actions
- Added tabbed interface for unified user and class management
- Fixed authentication issues by using server actions instead of API endpoints
- Added comprehensive search and filtering capabilities
- Implemented soft deletion for data preservation
- Added predefined subjects and grade levels for consistency

### Key Achievements
1. **Scalable User Management**: Dedicated pages that can handle hundreds of users efficiently
2. **Professional UI/UX**: Clean, consistent design with proper confirmation dialogs
3. **Role Management**: Direct role changes with shared constants for consistency
4. **Modern Architecture**: Server actions with proper validation and type safety
5. **Comprehensive Features**: Search, filtering, pagination, bulk operations
6. **Security**: Proper permission enforcement and input validation

## Integration Details

### Shared Constants Integration
Both `SchoolUsersManagement` and `ClassUsersManagement` components use:
- **SCHOOL_ROLES**: Centralized role constants (`ADMIN`, `TEACHER`, `STUDENT`)
- **SchoolRole Type**: TypeScript type for role validation
- **Utility Functions**: `getRoleColor`, `getRoleIcon`, `getRoleName` all use shared constants
- **Consistent Dropdowns**: All role dropdowns use the same constant values

### Navigation Integration
- **"Manage Users" Button**: Links to dedicated class user management page
- **Breadcrumb Navigation**: Clear navigation path showing school → class → users
- **Back Navigation**: Easy return to class list from user management page

### UI Consistency
- **Shared Design Patterns**: Both components use consistent card layouts and styling
- **Common Components**: Shared UI components for dialogs, buttons, and form elements
- **Responsive Behavior**: Consistent responsive design across all interfaces

## Integration with Existing Systems

### User Management Integration
- Seamless integration with bulk user management
- Shared permission system and validation
- Consistent UI patterns and components
- Cross-referencing between user and class views

### Assignment System Integration
- Classes serve as containers for assignments
- Teacher-class relationships enable assignment creation
- Student-class relationships enable assignment submission
- Proper data flow between class and assignment management

## Future Enhancements

### Planned Features
- **Class Templates**: Reusable class configurations
- **Import/Export**: CSV import/export for bulk class and user management
- **Class Scheduling**: Integration with timetable management
- **Analytics Dashboard**: Class utilization and performance metrics
- **Assignment Integration**: Direct assignment creation from class user lists

### Technical Improvements
- **Real-time Updates**: WebSocket integration for live updates
- **Advanced Filtering**: Date ranges, custom field filters
- **Audit Logging**: Comprehensive change tracking
- **API Integration**: REST API endpoints for external systems

## Related Documentation
- [User Management System](./bulk-user-management.md)
- [Permission System](./permission-system.md)
- [School Management System](./school-management-system.md)
- [Next.js Rules](../.cursor/rules/02.next-js-rule.mdc)

## Troubleshooting

### Common Issues
1. **Permission Denied**: Ensure user has `MANAGE_SCHOOL` permission for the specific school
2. **Class Creation Fails**: Check that class name is unique within the school
3. **User Assignment Fails**: Verify users exist and have proper roles
4. **Role Change Fails**: Ensure role values match shared constants
5. **Search Not Working**: Verify search terms are properly trimmed and non-empty
6. **Page Not Loading**: Check authentication and school access permissions

### Debug Steps
1. Check browser console for client-side errors
2. Verify server action responses in network tab
3. Confirm user permissions in database
4. Check Prisma query logs for database issues
5. Verify shared constants are properly imported
6. Check form validation and loading states

This comprehensive class management system provides a robust, scalable solution for educational institutions to manage their class structure and user assignments efficiently while maintaining security, consistency, and excellent user experience standards. 