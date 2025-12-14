# Authentication System

## Purpose
The authentication system provides comprehensive authentication support for both web applications (using NextAuth.js sessions) and mobile applications (using JWT tokens). This unified system enables users to securely access all services including AI-powered translation, assignment management, and school administration features across all platforms.

## Architecture Overview

### Unified Authentication System
The system supports two authentication methods seamlessly:
1. **NextAuth.js Sessions** (for web applications)
2. **JWT Tokens** (for mobile applications)

### Client-Side Components

#### Web (Next.js)
- **NextAuth.js**: Session-based authentication for web interface
- **Session Management**: Automatic session validation and refresh
- **Protected Routes**: Server-side authentication checks

#### Mobile (Flutter)
- **AuthService**: Handles login, logout, token management, and API authentication
- **LoginPage**: User interface for credential input with demo account display
- **AuthWrapper**: Automatic authentication state management and routing
- **Token Persistence**: Secure storage using SharedPreferences

### Server-Side Components
- **Unified Auth Library**: `server/lib/unifiedAuth.ts` - Handles both authentication methods
- **Mobile Auth Endpoint**: `/api/auth/mobile` - JWT authentication for Flutter app
- **NextAuth Configuration**: `/api/auth/[...nextauth]` - Session authentication for web
- **Database Integration**: Prisma ORM with PostgreSQL for user management
- **Security**: bcrypt password hashing, JWT tokens, and session management

## Authentication Flow

### Unified Authentication Priority
1. **NextAuth Session** (for web requests) - checked first
2. **JWT Token** (for mobile requests) - checked if no session and request provided
3. **Fail** - if neither authentication method succeeds

### 1. Web Authentication Flow (NextAuth.js)
```
User Login (Web Interface)
    ↓
NextAuth.js Credentials Provider
    ↓
Server validates credentials (bcrypt)
    ↓
Session created and stored
    ↓
User redirected to dashboard
```

### 2. Mobile Authentication Flow (JWT)
```
User Input (LoginPage) 
    ↓
AuthService.login(email, password)
    ↓
POST /api/auth/mobile
    ↓
Server validates credentials (bcrypt)
    ↓
JWT token generated (30-day expiration)
    ↓
Token stored in SharedPreferences
    ↓
User redirected to HomePage
```

### 3. Unified API Request Flow
```
API Request (Web or Mobile)
    ↓
Unified Authentication Check
    ↓
Try NextAuth Session First
    ↓ (if no session)
Try JWT Token (if request provided)
    ↓
Process authenticated request
```

### 4. Server Action Authentication
```
Server Action Called
    ↓
requireUnifiedAuth(authContext?.request)
    ↓
validateUnifiedAuth() checks both methods
    ↓
Returns userId or throws error
```

## Implementation Details

### Unified Authentication Library
**Location**: `server/lib/unifiedAuth.ts`

**Core Functions**:
- `validateUnifiedAuth(request?)`: Validates both NextAuth sessions and JWT tokens
- `requireUnifiedAuth(request?)`: Throws error if authentication fails
- `createAuthContext(request)`: Helper to create auth context for server actions

**Authentication Logic**:
```typescript
export async function validateUnifiedAuth(request?: NextRequest): Promise<UnifiedAuthResult> {
  // Try NextAuth session first (for web requests)
  const session = await getServerSession(authOptions);
  if (session?.user?.id) {
    // Validate user and return success
  }

  // Try mobile JWT auth if request provided
  if (request) {
    const mobileAuthResult = await validateMobileAuth(request);
    if (mobileAuthResult.success) {
      // Return mobile auth success
    }
  }

  // No valid authentication found
  return { success: false, error: 'Authentication required' };
}
```

### Server Action Integration
Server actions now accept an optional `AuthContext` parameter:

```typescript
export async function createSubmission(
  data: CreateSubmissionData, 
  authContext?: AuthContext
): Promise<ActionResponse<Submission>> {
  const { userId } = await requireUnifiedAuth(authContext?.request);
  // ... rest of function uses userId
}
```

### API Endpoint Integration
API endpoints create auth context and pass it to server actions:

```typescript
export async function POST(request: NextRequest) {
  const authContext = createAuthContext(request);
  const result = await createSubmission(data, authContext);
  // ... handle result
}
```

### AuthService (Flutter)
**Location**: `app/lib/services/auth_service.dart`

**Key Methods**:
- `login(email, password)`: Authenticates user and stores JWT token
- `isLoggedIn()`: Checks if valid token exists in storage
- `getToken()`: Retrieves stored authentication token
- `getUser()`: Retrieves stored user data
- `logout()`: Clears authentication data (preserves language preferences)
- `getAuthHeaders()`: Provides headers for authenticated API requests
- `makeAuthenticatedRequest()`: Makes API calls with automatic token refresh

**Security Features**:
- JWT token persistence with SharedPreferences
- Automatic token inclusion in API requests
- Automatic token refresh on 401 errors
- Selective logout (preserves user preferences)
- Network error handling with user feedback

### NextAuth Configuration (Web)
**Location**: `server/app/api/auth/[...nextauth]/options.ts`

**Features**:
- Credentials provider for email/password authentication
- Session strategy with JWT tokens
- Automatic user status validation
- Role-based access control (super admin detection)
- Session refresh and validation

### Mobile Auth Endpoint (Server)
**Location**: `server/app/api/auth/mobile/route.ts`

**Authentication Process**:
1. **Input Validation**: Validates email and password presence
2. **User Lookup**: Queries database for user by email/username
3. **Password Verification**: Uses bcrypt to compare hashed passwords
4. **Account Status Check**: Validates user is active
5. **School Filtering**: Optional school code filtering
6. **JWT Generation**: Creates token with user payload and 30-day expiration
7. **Response**: Returns success status, token, and user data

**Security Measures**:
- bcrypt password hashing with salt
- Account status validation (active/inactive)
- JWT token with secure secret and expiration
- School-based access control
- Comprehensive error handling without information leakage

### Database Schema
**User Table Fields**:
- `id`: Unique user identifier
- `email`: User email (unique)
- `name`: User display name
- `password`: bcrypt hashed password
- `isActive`: Account status flag
- `createdAt`: Account creation timestamp
- `updatedAt`: Last modification timestamp

## Usage Examples

### 1. Web Application (NextAuth Session)
```typescript
// In a server component or server action
const result = await createSubmission(data);
// Uses NextAuth session automatically
```

### 2. Mobile Application (JWT Token)
```typescript
// In an API endpoint
export async function POST(request: NextRequest) {
  const authContext = createAuthContext(request);
  const result = await createSubmission(data, authContext);
  // Uses JWT token from Authorization header
}
```

### 3. Mobile Login Implementation
```dart
// In LoginPage
final result = await AuthService.login(email, password);
if (result['success']) {
  Navigator.pushReplacementNamed(context, '/home');
} else {
  // Show error message
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(content: Text(result['error'])),
  );
}
```

### 4. Mobile API Calls with Auto-Refresh
```dart
// Using AssignmentService
final result = await AssignmentService.submitAssignment(
  assignmentId: 'assignment-id',
  content: 'Student submission content',
);

// Using makeAuthenticatedRequest directly
final response = await AuthService.makeAuthenticatedRequest(
  method: 'POST',
  endpoint: '/api/translate',
  body: {
    'text': text,
    'targetLanguage': targetLanguage,
  },
);
```

### 5. Authentication State Management
```dart
// In AuthWrapper
final isLoggedIn = await AuthService.isLoggedIn();
return isLoggedIn ? const HomePage() : const LoginPage();
```

### 6. Migration Example for Server Actions
**Before:**
```typescript
export async function myAction(data: MyData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: 'Authentication required' };
  }
  const userId = session.user.id;
  // ... rest of function
}
```

**After:**
```typescript
export async function myAction(data: MyData, authContext?: AuthContext) {
  const { userId } = await requireUnifiedAuth(authContext?.request);
  // ... rest of function (same logic)
}
```

## Security Considerations

### Unified Authentication Security
- **NextAuth Sessions**: Validated using `getServerSession()` with automatic user status checks
- **JWT Tokens**: Validated using existing `validateMobileAuth()` with signature verification
- **User Status**: Both methods verify user exists and is active in database
- **Token Expiration**: Both methods respect token/session expiration
- **Consistent Errors**: Both auth methods return standardized error messages
- **No Information Leakage**: Generic error messages prevent user enumeration

### Client-Side Security
- **Token Storage**: Uses SharedPreferences for secure local storage
- **Automatic Logout**: Clears sensitive data while preserving user preferences
- **Network Security**: HTTPS communication with proper error handling
- **Token Validation**: Server-side validation for all protected endpoints
- **Auto-Refresh**: Automatic token refresh on authentication failures

### Server-Side Security
- **Password Hashing**: bcrypt with salt for secure password storage
- **JWT Security**: Signed tokens with secure secret and reasonable expiration
- **Session Security**: NextAuth.js session management with secure cookies
- **Input Validation**: Comprehensive validation of all input parameters
- **Error Handling**: Generic error messages to prevent information disclosure
- **Account Management**: Active/inactive status for account control
- **Role-Based Access**: System role validation and school-based permissions

### Backward Compatibility
- **Existing Web Code**: Continues to work without changes (NextAuth sessions)
- **Existing Mobile Code**: Continues to work without changes (JWT tokens)
- **Gradual Migration**: Server actions can be migrated individually

## Demo Account
For testing and demonstration purposes:
- **Email**: demo@example.com
- **Password**: password123
- **Status**: Active account with full access

## Error Handling

### Common Error Scenarios
1. **Invalid Credentials**: Wrong email/password combination
2. **Inactive Account**: User account is disabled
3. **Network Errors**: Connection issues or server unavailability
4. **Token Expiration**: JWT token has expired (requires re-login)
5. **Server Errors**: Internal server issues

### Error Response Format
```json
{
  "error": "Human-readable error message",
  "status": 400|401|500
}
```

## Dependencies

### Flutter Dependencies
- `http`: HTTP client for API communication
- `shared_preferences`: Secure local storage for tokens
- `dart:convert`: JSON encoding/decoding

### Server Dependencies
- `next-auth`: NextAuth.js for web session management
- `jsonwebtoken`: JWT token generation and validation
- `bcryptjs`: Password hashing and verification
- `@prisma/client`: Database ORM for user management

## Environment Variables
- `NEXTAUTH_SECRET`: Shared secret for both NextAuth and JWT signing
- `DATABASE_URL`: PostgreSQL connection string (required)

## Testing & Validation

### Unit Tests
- Test `validateUnifiedAuth()` with NextAuth sessions
- Test `validateUnifiedAuth()` with JWT tokens
- Test `validateUnifiedAuth()` with invalid/missing authentication
- Test server actions with both auth contexts
- AuthService methods with mock responses

### Integration Tests
- Complete web authentication flow
- Complete mobile authentication flow
- API endpoints with both authentication methods
- Assignment submission with mobile authentication
- Error scenarios and edge cases

### Security Tests
- Token validation and expiration handling
- Session validation and refresh
- Network failures and invalid credentials
- Cross-platform authentication consistency

## Benefits

### 1. Code Reuse
- Server actions work with both web and mobile applications
- Single authentication logic instead of duplicate implementations
- Consistent error handling across all endpoints

### 2. Maintainability
- Centralized authentication logic in `unifiedAuth.ts`
- Easy to update authentication requirements globally
- Clear separation of concerns

### 3. Flexibility
- Easy to add new authentication methods in the future
- Backward compatible with existing code
- Optional migration path for existing server actions

### 4. Security
- Consistent security validation across all authentication methods
- No authentication bypasses or edge cases
- Proper error handling without information leakage

## Change Log
- **2024-12-19**: Initial implementation with JWT authentication
- **2024-12-19**: Added demo account and comprehensive error handling
- **2024-12-19**: Implemented selective logout preserving language preferences
- **2024-12-19**: Added automatic authentication state management with AuthWrapper
- **2025-06-12**: Implemented unified authentication system supporting both NextAuth sessions and JWT tokens
- **2025-06-12**: Added assignment submission support with mobile authentication
- **2025-06-12**: Created comprehensive mobile assignment service 