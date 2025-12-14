import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/authUtils';
import { PERMISSION_DESCRIPTIONS, getAllPermissions } from '@/lib/constants';

/**
 * GET /api/permissions
 * Lists all available permissions (authenticated users only)
 */
export async function GET(request: NextRequest) {
  try {
    await requireAuth();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || '';

    // Get all permissions from constants
    const allPermissions = getAllPermissions();
    
    // Convert to the expected format with descriptions
    const permissions = allPermissions.map(permission => ({
      id: permission,
      name: permission,
      description: PERMISSION_DESCRIPTIONS[permission] || 'No description available',
    }));

    // Filter by category if specified
    const filteredPermissions = category 
      ? permissions.filter(permission => 
          permission.name.toUpperCase().startsWith(category.toUpperCase())
        )
      : permissions;

    // Group permissions by category for better organization
    const groupedPermissions = filteredPermissions.reduce((acc, permission) => {
      const category = getPermissionCategory(permission.name);
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(permission);
      return acc;
    }, {} as Record<string, typeof permissions>);

    return NextResponse.json({
      success: true,
      data: {
        permissions: filteredPermissions,
        grouped: groupedPermissions,
      },
    });

  } catch (error) {
    console.error('Error fetching permissions:', error);
    
    if (error instanceof Error) {
      if (['Unauthenticated', 'Inactive or deleted user'].includes(error.message)) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 401 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch permissions' },
      { status: 500 }
    );
  }
}

/**
 * Helper function to categorize permissions
 */
function getPermissionCategory(permissionName: string): string {
  if (permissionName.startsWith('CREATE_') || permissionName.startsWith('MANAGE_SYSTEM')) {
    return 'System Administration';
  }
  if (permissionName.includes('SCHOOL')) {
    return 'School Management';
  }
  if (permissionName.includes('CLASS') || permissionName.includes('TEACHER') || permissionName.includes('STUDENT')) {
    return 'Academic Management';
  }
  if (permissionName.includes('USER') || permissionName.includes('ROLE')) {
    return 'User Management';
  }
  if (permissionName.includes('VIEW') || permissionName.includes('ACCESS')) {
    return 'Access Control';
  }
  return 'General';
} 