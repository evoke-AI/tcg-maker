# Bulk User Management

## Purpose
Provides a comprehensive interface for school administrators to manage users in bulk, including searching, filtering, role changes, and class assignments. This feature replaces API routes with Next.js server actions following modern best practices and includes proper permission enforcement with SUPER_ADMIN bypass functionality.

## Usage

### Server Actions
```ts
// Get users with search and pagination
const result = await getSchoolUsers({
  schoolId: 'school123',
  page: 1,
  limit: 20,
  search: 'john',
  role: 'STUDENT',
  includeClasses: true
});

// Create a new user
const newUser = await createSchoolUser('school123', {
  username: 'johndoe',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@school.edu',
  role: 'STUDENT',
  generatePassword: true
});

// Bulk role changes
const bulkResult = await bulkUpdateSchoolUsers('school123', {
  type: 'role',
  value: 'TEACHER',
  userIds: ['user1', 'user2', 'user3']
});
```

### UI Component
```tsx
import BulkUserManagement from '@/app/[locale]/admin/schools/[schoolId]/users/BulkUserManagement';

<BulkUserManagement school={schoolData} />
```

## Design & Implementation Notes

### Architecture Decisions
- **Server Actions over API Routes**: Migrated from traditional API routes to Next.js server actions for better type safety, performance, and developer experience
- **Permission System**: Implements simplified 3-permission, 4-role system with SUPER_ADMIN bypass logic
- **Database Query Optimization**: Uses efficient Prisma queries with proper includes and filtering to minimize database calls

### Key Features
1. **Advanced Search**: Case-sensitive search across username, email, firstName, lastName, and studentId
2. **Real-time Filtering**: Filter by role, status, grade level, and department
3. **Bulk Operations**: Select multiple users for role changes with visual feedback
4. **Pagination**: Server-side pagination with configurable page sizes
5. **Class Management**: Optional class data inclusion for comprehensive user views
6. **Permission Enforcement**: Proper authorization checks with detailed logging

### Database Compatibility
- **SQLite Compatible**: Removed `mode: 'insensitive'` parameter for broader database support
- **Efficient Queries**: Uses nested where clauses for optimal performance
- **Type Safety**: Full TypeScript support with Zod validation

### Error Handling Strategy
- **Graceful Degradation**: Comprehensive error catching with user-friendly messages
- **Development Debugging**: Enhanced error logging in development mode
- **Permission Errors**: Clear distinction between authentication and authorization failures

## Dependencies

### Server-Side
- `@prisma/client` - Database ORM
- `zod` - Runtime validation
- `bcryptjs` - Password hashing
- `next-auth` - Authentication
- Custom utilities:
  - `@/lib/authUtils` - Permission checking
  - `@/lib/permissions` - User validation
  - `@/lib/constants` - Shared constants
  - `@/lib/passwordGenerator` - Password generation

### Client-Side
- `react` - UI framework
- `lucide-react` - Icons
- `@/components/ui/*` - Shadcn UI components
- Custom hooks for state management

## Testing & Validation

### Permission Testing
- ✅ SUPER_ADMIN can access any school
- ✅ School ADMIN can only access their assigned school
- ✅ Proper error handling for insufficient permissions
- ✅ Authentication state validation

### Database Operations
- ✅ Search functionality across all user fields
- ✅ Pagination with accurate counts
- ✅ Bulk operations with transaction safety
- ✅ Username uniqueness validation within schools

### UI/UX Validation
- ✅ Real-time search with debouncing
- ✅ Bulk selection with visual feedback
- ✅ Loading states and error messages
- ✅ Responsive design for mobile/desktop

## File Structure
```
server/
├── app/actions/
│   ├── school-users.ts          # Main server actions
│   └── school-classes.ts        # Class management actions
├── app/[locale]/admin/schools/[schoolId]/users/
│   ├── page.tsx                 # Page component
│   └── BulkUserManagement.tsx   # Main UI component
├── lib/
│   ├── authUtils.ts            # Permission utilities
│   ├── permissions.ts          # User validation
│   └── constants.ts            # Shared constants
└── readme/
    └── permission-system.md    # Permission documentation
```

## API Reference

### getSchoolUsers
- **Purpose**: Fetch users with filtering and pagination
- **Parameters**: `{ schoolId, page?, limit?, search?, role?, status?, gradeLevel?, department?, includeClasses? }`
- **Returns**: `{ success, data: { users, pagination }, error? }`
- **Permission**: `MANAGE_SCHOOL`

### createSchoolUser
- **Purpose**: Create a new user in a school
- **Parameters**: `schoolId, userData`
- **Returns**: `{ success, data: user, error?, message? }`
- **Permission**: `MANAGE_SCHOOL`

### bulkUpdateSchoolUsers
- **Purpose**: Perform bulk operations on multiple users
- **Parameters**: `schoolId, { type, value, userIds }`
- **Returns**: `{ success, data?, error?, message? }`
- **Permission**: `MANAGE_SCHOOL`

## Change Log

### 2024-12-19: Initial Implementation
- Created server actions replacing API routes
- Implemented comprehensive search and filtering
- Added bulk user management UI
- Fixed Prisma query compatibility issues
- Added proper permission enforcement
- Enhanced error handling and logging

### Key Issues Resolved
1. **Prisma Query Structure**: Fixed malformed nested where clauses
2. **Database Compatibility**: Removed unsupported `mode: 'insensitive'` for SQLite
3. **TypeScript Safety**: Eliminated `any` types throughout codebase
4. **Permission System**: Implemented SUPER_ADMIN bypass logic
5. **Search Functionality**: Proper handling of empty/null search terms

## Known Limitations
- Search is case-sensitive (database dependent)
- Bulk operations limited to role changes (extensible for future features)
- Class assignment functionality planned for future iteration

## Future Enhancements
- Case-insensitive search for supported databases
- CSV import/export functionality
- Advanced bulk operations (class assignments, status changes)
- User profile editing interface
- Audit logging for user changes 