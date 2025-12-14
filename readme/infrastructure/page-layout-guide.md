# Page Layout Guide

This guide explains how to create consistent, responsive pages that work seamlessly with the sidebar and navigation system.

## Overview

All pages should use the unified layout system consisting of:
1. **MainLayout** - Handles navbar, sidebar, and responsive behavior (already applied in `app/[locale]/layout.tsx`)
2. **PageContainer** - Provides consistent page headers, spacing, and content areas

## Basic Page Structure

```tsx
import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import PageContainer from '@/app/components/PageContainer';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('yourNamespace');
  
  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function YourPage() {
  const t = await getTranslations('yourNamespace');

  return (
    <PageContainer
      title={t('title')}
      description={t('description')}
    >
      {/* Your page content here */}
      <div className="space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          {/* Content blocks */}
        </div>
      </div>
    </PageContainer>
  );
}
```

## PageContainer Props

| Prop | Type | Description |
|------|------|-------------|
| `children` | `ReactNode` | Page content |
| `title?` | `string` | Page title (optional) |
| `description?` | `string` | Page description (optional) |
| `className?` | `string` | Additional CSS classes for container |
| `headerClassName?` | `string` | Additional CSS classes for header section |
| `contentClassName?` | `string` | Additional CSS classes for content section |

## Responsive Behavior

The layout system automatically handles:

### Desktop (≥768px)
- Sidebar: 256px width when expanded, 64px when collapsed
- Content: Adjusts margin-left automatically
- Padding: `p-6` (24px)

### Mobile (<768px)
- Sidebar: Overlay mode, slides in from left
- Content: Full width with `p-4` (16px) padding
- Touch gestures: Swipe to open/close sidebar

### Tablet (768px-1024px)
- Responsive breakpoints ensure optimal spacing
- Sidebar behavior adapts to available space

## Layout Features

### Automatic Overflow Prevention
- `max-w-full` and `overflow-hidden` prevent content from extending beyond viewport
- Works seamlessly with sidebar expansion/collapse
- No horizontal scrollbars on any screen size

### Consistent Typography
- Page titles: `text-2xl sm:text-3xl font-bold`
- Descriptions: `text-gray-600 dark:text-gray-300`
- Responsive font sizes

### Dark Mode Support
- All components support dark mode automatically
- Consistent color schemes across pages

## Examples

### Simple Page with Header
```tsx
<PageContainer title="Dashboard" description="Welcome to your dashboard">
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    {/* Dashboard widgets */}
  </div>
</PageContainer>
```

### Page without Header
```tsx
<PageContainer>
  <div className="space-y-6">
    <h1 className="text-3xl font-bold">Custom Header</h1>
    {/* Custom content */}
  </div>
</PageContainer>
```

### Full-height Application (like Voice Agent)
```tsx
<PageContainer 
  title="Voice Agent"
  description="Real-time voice conversations"
  contentClassName="h-[calc(100vh-200px)]"
>
  <div className="flex flex-col h-full">
    {/* Full-height app content */}
  </div>
</PageContainer>
```

## Migration from Old Layout

### Before (Manual Layout)
```tsx
export default function OldPage() {
  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-full">
      <div className="mb-4 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">Title</h1>
        <p className="text-gray-600">Description</p>
      </div>
      {/* Content */}
    </div>
  );
}
```

### After (Unified Layout)
```tsx
import PageContainer from '@/app/components/PageContainer';

export default function NewPage() {
  return (
    <PageContainer title="Title" description="Description">
      {/* Content */}
    </PageContainer>
  );
}
```

## Benefits

1. **Consistency**: All pages look and behave the same
2. **Responsiveness**: Automatic adaptation to screen sizes and sidebar states
3. **Maintainability**: Single source of truth for page layout
4. **Accessibility**: Consistent heading hierarchy and semantic structure
5. **Performance**: Optimized CSS classes and responsive behavior

## Best Practices

1. **Always use PageContainer** for new pages
2. **Use semantic HTML** within page content
3. **Follow spacing patterns** with `space-y-6` for vertical rhythm
4. **Use card layouts** with `bg-white shadow rounded-lg p-6` for content blocks
5. **Test responsiveness** at different screen sizes and sidebar states

## Troubleshooting

### Content Overflows Horizontally
- Ensure you're using `PageContainer` instead of custom containers
- Check for fixed widths that don't respect responsive breakpoints
- Use `min-w-0` on flex children that contain text

### Inconsistent Spacing
- Use the standard spacing classes: `space-y-6`, `mb-4 sm:mb-6 lg:mb-8`
- Avoid custom margins that conflict with the layout system

### Sidebar Issues
- The layout system handles sidebar behavior automatically
- Don't add custom margin/padding that conflicts with `MainLayout`
- Test with both expanded and collapsed sidebar states