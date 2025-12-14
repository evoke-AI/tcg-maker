# Profile Page Architecture

## Overview

This directory contains the profile management functionality, split from a monolithic 613-line `ProfilePageClient.tsx` into maintainable, focused modules following the large file split rule and state management principles.

## Architecture

The profile page is organized by **domain concerns** rather than technical layers:

### Foundation Layer
- **`types.ts`** - Shared TypeScript interfaces and type definitions
- **`utils.tsx`** - Pure utility functions and display helpers

### Business Logic Layer (Custom Hooks)
- **`hooks/useProfileManagement.ts`** - Complete profile editing state and operations
- **`hooks/usePasswordManagement.ts`** - Complete password change state and operations

### UI Component Layer
- **`components/PersonalInfoSection.tsx`** - Standalone personal information management
- **`components/SecuritySection.tsx`** - Standalone password/security management  
- **`components/SchoolMembershipsSection.tsx`** - Standalone school memberships display

### Composition Layer
- **`ProfilePageClient.tsx`** - Main component (composition and coordination only)

## Key Design Principles

### Complete Domain Separation
Each hook encapsulates ALL related logic for its domain:
- **Profile Management**: All profile editing state, form handling, validation, API calls
- **Password Management**: All password change state, form handling, validation, visibility toggles
- **Display Utilities**: All formatting and status badge logic

### Standalone Components
Each UI component is completely self-contained:
- **PersonalInfoSection**: Uses `useProfileManagement` hook, handles all profile editing UI
- **SecuritySection**: Uses `usePasswordManagement` hook, handles all password change UI
- **SchoolMembershipsSection**: Pure display component with no internal state

### Clean Main Component
The main `ProfilePageClient` component is now **~30 lines** (was 613 lines):
- Only imports and composes extracted components
- No duplicate state or business logic
- Follows the standard page layout pattern with `space-y-6` and white cards

## File Structure

```
profile/
├── README.md                           # This documentation
├── ProfilePageClient.tsx               # Main component (~30 lines)
├── types.ts                           # Shared interfaces
├── utils.tsx                          # Display utilities
├── hooks/
│   ├── useProfileManagement.ts        # Profile editing logic
│   └── usePasswordManagement.ts       # Password change logic
└── components/
    ├── PersonalInfoSection.tsx        # Profile editing UI
    ├── SecuritySection.tsx            # Password change UI
    └── SchoolMembershipsSection.tsx   # School display UI
```

## Migration Benefits

### Maintainability
- **Single Responsibility**: Each file has one clear purpose
- **Easy Testing**: Hooks and components can be tested independently
- **Clear Dependencies**: Import structure shows relationships

### Performance  
- **Better Tree Shaking**: Unused utilities can be eliminated
- **Component Memoization**: Individual sections can be memoized
- **Reduced Re-renders**: State changes only affect relevant components

### Developer Experience
- **Easier Navigation**: Find profile logic in `hooks/useProfileManagement.ts`
- **Clearer Debugging**: Issues isolated to specific domains
- **Faster Development**: Modify password logic without touching profile logic 