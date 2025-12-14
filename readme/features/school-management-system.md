# School Management System Implementation

## Purpose

This document outlines the complete implementation of the school management system, including critical lessons learned, best practices, and common pitfalls to avoid. This system allows SUPER_ADMIN users to create and manage schools, with school-specific role-based access control.

## System Overview

The school management system uses a simplified permission model with system-enforced roles:
- **SUPER_ADMIN**: Can create schools (system-level role)
- **ADMIN**: Can manage school users, classes, and settings (school-level role)
- **TEACHER**: Can manage assignments in assigned classes (school-level role)
- **STUDENT**: Can view classes and assignments (school-level role)

### Simplified Permission Model
- **3 Core Permissions**: CREATE_SCHOOL, MANAGE_SCHOOL, MANAGE_ASSIGNMENTS
- **4 System-Enforced Roles**: No custom role creation
- **String-Based Roles**: Simple string fields instead of database relations
- **Shared Constants**: Single source of truth in `lib/constants.ts`

## 1. Permission System & Authentication

### Critical Design Decisions

**Simplified Permission Architecture**
- **System Permission**: `CREATE_SCHOOL` (SUPER_ADMIN only)
- **School Permissions**: `MANAGE_SCHOOL` (ADMIN), `MANAGE_ASSIGNMENTS` (TEACHER)
- **No Custom Roles**: All roles are system-enforced constants
- **String-Based**: Roles stored as simple strings, not database relations

**Consistent Permission Checking Pattern**
```typescript
// UI Components - Check session properties
if (session?.user?.isSuperAdmin) {
  // Show system-level features
}

// API Routes - Use permission functions
await requireSystemPermission(PERMISSIONS.CREATE_SCHOOL); // For system-level
await requireSchoolPermission(schoolId, PERMISSIONS.MANAGE_SCHOOL); // For school-level
```

### Authentication Implementation

**NextAuth Configuration Updates**
- Added `isSuperAdmin` flag to session for UI checks
- JWT callbacks properly populate session data
- Mobile auth endpoints support username/email dual login
- School context filtering with schoolCode parameter

**Common Authentication Pitfalls**
- ❌ Using `canAccessAdmin` instead of `isSuperAdmin` consistently
- ❌ Checking wrong permission types (system vs school)
- ❌ Not updating NextAuth types when adding new session properties
- ❌ Forgetting to regenerate Prisma client after schema changes

## 2. Database Schema & Migrations

### Schema Design Principles

**Multi-Schema Management**
- Always update BOTH `schema.dev.prisma` and `schema.prod.prisma`
- Keep schemas in sync to avoid deployment issues
- Test migrations on both development and production schemas

**Key Schema Changes Made**
```prisma
model School {
  id          String   @id @default(cuid())
  name        String
  code        String   @unique
  address     String?
  phone       String?
  email       String?
  website     String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relationships
  memberships SchoolMembership[]
  classes     Class[]
}

model User {
  id         String    @id @default(cuid())
  email      String?   @unique  // Made optional
  username   String?              // Added for school-specific login
  firstName  String?
  lastName   String?
  password   String
  isActive   Boolean   @default(true)
  
  // Simple string field for system role
  systemRole String?   // "SUPER_ADMIN" or null
  
  // Student-specific fields
  studentId  String?   // Added for student identification
  gradeLevel String?   // Added for student grade tracking
  department String?   // For teachers
  
  // Relations
  schoolMemberships SchoolMembership[]
  // ... other relations
}

model SchoolMembership {
  id        String  @id @default(cuid())
  userId    String
  schoolId  String
  role      String  // "ADMIN", "TEACHER", or "STUDENT"
  isActive  Boolean @default(true)
  
  user      User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  school    School  @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  
  @@unique([userId, schoolId])
}
```

**Critical Schema Considerations**
- Made email optional to support username-only login within schools
- Added username field with school-specific uniqueness
- **Simplified Roles**: Removed `Role`, `Permission`, and `RolePermission` tables
- **String-Based Roles**: `systemRole` and `SchoolMembership.role` are simple strings
- **System-Enforced**: All roles are predefined constants, no custom role creation
- Proper cascade rules for data integrity
- Indexed frequently queried fields

### Schema Simplification Changes

**What Was Removed**:
- ❌ `Role` table with complex permissions
- ❌ `Permission` table with granular permissions  
- ❌ `RolePermission` join table
- ❌ Custom role creation functionality
- ❌ Complex permission inheritance

**What Was Added**:
- ✅ Simple string fields for roles (`systemRole`, `SchoolMembership.role`)
- ✅ Shared constants in `lib/constants.ts`
- ✅ Type-safe permission checking functions
- ✅ Performance-optimized queries (no joins needed)

### Migration Checklist
- [x] Schema changes applied to both dev and prod files
- [x] Complex permission tables removed (`Role`, `Permission`, `RolePermission`)
- [x] Simple string fields added for roles (`systemRole`, `SchoolMembership.role`)
- [x] Migration generated with `npx prisma migrate dev`
- [x] Seed data updated with simplified roles and demo users
- [x] Shared constants created in `lib/constants.ts`
- [x] Permission checking functions updated in `lib/permissions.ts`
- [x] Authentication utilities updated in `lib/authUtils.ts`
- [x] NextAuth options updated for simplified roles
- [x] Mobile auth endpoint updated for string-based roles
- [x] Prisma client regenerated with `npx prisma generate`
- [x] Obsolete role management pages removed

## 3. API Design & Implementation

### RESTful API Structure

**Endpoint Organization**
```
/api/schools                    # System-level school management
/api/schools/[schoolId]/users   # School-specific user management
/api/permissions               # List available permissions
```

**Note**: The `/api/schools/[schoolId]/roles` endpoint was removed as part of the simplification. Roles are now system-enforced constants and cannot be customized per school.

**Next.js 15 Route Parameter Handling**
```typescript
// ❌ Old way (Next.js 14)
export async function GET(request: Request, { params }: { params: { schoolId: string } }) {

// ✅ New way (Next.js 15)
export async function GET(request: Request, { params }: { params: Promise<{ schoolId: string }> }) {
  const { schoolId } = await params;
}
```

### API Implementation Best Practices

**Permission-First Design**
```typescript
export async function POST(request: Request) {
  // Always check permissions first using constants
  await requireSystemPermission(PERMISSIONS.CREATE_SCHOOL);
  
  // Then handle business logic
  const body = await request.json();
  // ... validation and processing
}
```

**Consistent Error Handling**
```typescript
// Standardized response format
return NextResponse.json({
  success: false,
  error: "School code already exists"
}, { status: 400 });
```

**Input Validation Patterns**
```typescript
// Validate required fields
if (!name?.trim()) {
  return NextResponse.json({
    success: false,
    error: "School name is required"
  }, { status: 400 });
}

// Validate format constraints
if (code && !/^[A-Za-z0-9]{3,20}$/.test(code)) {
  return NextResponse.json({
    success: false,
    error: "School code must be alphanumeric and 3-20 characters"
  }, { status: 400 });
}
```

## 4. Frontend Component Development

### Component Architecture

**Separation of Concerns**
- Data fetching components (e.g., `SchoolsManagement`)
- Form components (e.g., `CreateSchoolForm`)
- UI components (e.g., `Button`, `Input`, `Label`)

**Form Handling Best Practices**
```typescript
const [formData, setFormData] = useState<SchoolFormData>({
  name: '',
  code: '',
  // ... other fields
});

const handleInputChange = (field: keyof SchoolFormData, value: string) => {
  setFormData(prev => ({ ...prev, [field]: value }));
  if (error) setError(null); // Clear errors on input
};
```

**Loading and Error States**
```typescript
// Always handle all states
{loading && <LoadingSpinner />}
{error && <ErrorMessage message={error} />}
{!loading && !error && schools.length === 0 && <EmptyState />}
{!loading && !error && schools.map(school => <SchoolCard key={school.id} school={school} />)}
```

### Missing UI Components Created

During implementation, we discovered missing UI components and created them:

**Label Component** (`/components/ui/label.tsx`)
```typescript
import * as React from "react"
import { cn } from "@/lib/utils"

const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
      className
    )}
    {...props}
  />
))
Label.displayName = "Label"

export { Label }
```

**Textarea Component** (`/components/ui/textarea.tsx`)
```typescript
import * as React from "react"
import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
```

## 5. Translation & Internationalization

### Translation File Structure

**Namespace Organization**
```json
// server/messages/en/admin.json
{
  "schools": {
    "title": "School Management",
    "description": "Manage schools, create new institutions...",
    "form": {
      "name": "School Name",
      "namePlaceholder": "Enter school name",
      "nameRequired": "School name is required",
      "create": "Create School",
      "creating": "Creating..."
    }
  }
}
```

**Component Translation Usage**
```typescript
const t = useTranslations('admin.schools');

// ✅ Correct key reference
<Button>{loading ? t('form.creating') : t('form.create')}</Button>

// ❌ Wrong key reference
<Button>{loading ? t('form.creating') : t('create')}</Button>
```

### Common Translation Mistakes

1. **Missing Translation Keys**: Adding keys to English but forgetting Chinese
2. **Incorrect Key References**: Using `t('create')` when key is `t('form.create')`
3. **Hardcoded Text**: Using English text directly instead of translation keys
4. **Inconsistent Structure**: Different nesting between language files

### Translation Development Checklist
- [ ] Translation keys added to `server/messages/en/[namespace].json`
- [ ] Same keys added to `server/messages/zh-TW/[namespace].json`
- [ ] Component uses `useTranslations('[namespace]')` correctly
- [ ] All `t('key')` calls match actual key structure
- [ ] Tested in both `/en/...` and `/zh-TW/...` routes
- [ ] No hardcoded English text remains

## 6. Password Generation System

### Implementation

Created a secure password generation system for bulk user creation:

```typescript
// lib/passwordGenerator.ts
const WORD_LISTS = {
  educational: ['learning', 'knowledge', 'wisdom', 'study', 'growth'],
  positive: ['bright', 'amazing', 'wonderful', 'excellent', 'fantastic'],
  nature: ['mountain', 'river', 'forest', 'ocean', 'garden']
};

export function generatePassword(): string {
  const lists = Object.values(WORD_LISTS);
  const words = lists.map(list => 
    list[Math.floor(Math.random() * list.length)]
  );
  return words.join('-');
}
```

**Features**
- Generates "word-word-word" format passwords
- Uses educational and positive word lists
- Meets 12-character minimum requirement
- Supports bulk generation for CSV export

## 7. System Integration Points

### Navigation Updates

**Sidebar Integration**
```typescript
// Updated Sidebar component to show Schools link for SUPER_ADMIN
{session?.user?.isSuperAdmin && (
  <SidebarMenuButton asChild>
    <Link href="/admin/schools">
      <Building2 />
      <span>{t('schools')}</span>
    </Link>
  </SidebarMenuButton>
)}
```

### Mobile Authentication

**Enhanced Mobile Auth Endpoint**
- Supports username OR email login
- School context filtering with schoolCode parameter
- Maintains backward compatibility
- Enhanced JWT payload with school memberships

## 8. Common Pitfalls & Solutions

### TypeScript Compilation Issues

**Next.js 15 Route Parameters**
```typescript
// ❌ This causes compilation errors
export async function GET(req: Request, { params }: { params: { id: string } }) {

// ✅ Correct Next.js 15 syntax
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
}
```

**Nullable Fields Handling**
```typescript
// ❌ Assuming email is always present
const user = { email: formData.get('email') as string };

// ✅ Handle nullable email field
const email = formData.get('email');
const user = { email: email ? String(email) : null };
```

### Permission System Confusion

**Problem**: Mixed usage of `canAccessAdmin` vs `isSuperAdmin`
**Solution**: Consolidated to use `isSuperAdmin` consistently across UI and `CREATE_SCHOOL` permission for APIs

**Problem**: Using wrong permission types
**Solution**: Clear separation between system permissions (SUPER_ADMIN) and school permissions (school roles)

### Database Schema Mismatches

**Problem**: Schema files out of sync between dev and prod
**Solution**: Always update both schema files simultaneously

**Problem**: Prisma client not regenerated after schema changes
**Solution**: Run `npx prisma generate` after every schema change

## 9. Testing & Validation

### Manual Testing Checklist

**Authentication Flow**
- [ ] SUPER_ADMIN can access school management
- [ ] Non-SUPER_ADMIN users cannot access school management
- [ ] School creation works with all field combinations
- [ ] Form validation works for all required fields

**Multi-language Support**
- [ ] All text displays correctly in English
- [ ] All text displays correctly in Chinese
- [ ] Form validation messages are translated
- [ ] No raw translation keys visible

**API Functionality**
- [ ] School creation API validates input properly
- [ ] Permission checks prevent unauthorized access
- [ ] Error messages are user-friendly
- [ ] Success responses include proper data

## 10. Future Considerations

### Scalability Improvements
- Implement pagination for large school lists
- Add search and filtering capabilities
- Consider caching for frequently accessed data
- Optimize database queries with proper indexing

### Feature Enhancements
- Bulk school import via CSV
- School analytics and reporting
- Advanced role management within schools
- Integration with external school management systems

## Change Log

- **2024-12-XX**: Initial school management system implementation
- **2024-12-XX**: Permission system consolidation and authentication fixes
- **2024-12-XX**: Translation system completion and UI component creation
- **2024-12-XX**: TypeScript compilation issues resolution and API stabilization

## Dependencies

- `@prisma/client` - Database ORM
- `next-intl` - Internationalization
- `next-auth` - Authentication
- `@radix-ui/react-*` - UI components
- `tailwindcss` - Styling

## Related Documentation

- [Authentication System](./authentication-system.md)
- [Translation System](./translation-system.md)
- [School System Implementation Plan](./school-system-implementation-plan.md) 