import { redirect } from 'next/navigation'
import { requireAuth, getUserManagedSchools } from '@/lib/authUtils';
import { checkSystemPermission } from '@/lib/permissions';
import { PERMISSIONS } from '@/lib/constants';

// Force dynamic rendering because we check permissions based on request headers/cookies
export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children 
}: { 
  children: React.ReactNode 
}) {
  try {
    // First, ensure user is authenticated
    const { userId } = await requireAuth();
    
    // Check if user is SUPER_ADMIN (has CREATE_SCHOOL permission)
    const isSuperAdmin = await checkSystemPermission(userId, PERMISSIONS.CREATE_SCHOOL);
    
    if (isSuperAdmin) {
      // SUPER_ADMIN has access to all admin routes
      console.log(`Admin layout: SUPER_ADMIN ${userId} granted access`);
    } else {
      // Check if user has any school admin permissions
      const managedSchools = await getUserManagedSchools(PERMISSIONS.MANAGE_SCHOOL);
      
      if (managedSchools.length === 0) {
        // User has no admin permissions at all
        console.error(`Admin layout access denied: User ${userId} has no admin permissions`);
        redirect('/');
      } else {
        // User is a school admin for at least one school
        console.log(`Admin layout: School admin ${userId} granted access (manages ${managedSchools.length} schools)`);
      }
    }
  } catch (error) {
    // Redirect to home if unauthenticated or lacking permission
    console.error('Admin layout access denied:', error instanceof Error ? error.message : error);
    redirect('/');
  }

  return children;
} 