import { Suspense } from 'react';
import { requireSystemPermission } from '@/lib/authUtils';
import { getTranslations } from 'next-intl/server';
import SchoolsManagement from './SchoolsManagement';

export default async function SchoolsPage() {
  // Ensure user is SUPER_ADMIN (can create schools)
  await requireSystemPermission('CREATE_SCHOOL');

  const t = await getTranslations('admin.schools');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {t('title', { default: 'School Management' })}
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          {t('description', { default: 'Manage schools, create new institutions, and oversee school administrators.' })}
        </p>
      </div>

      <Suspense fallback={
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      }>
        <SchoolsManagement />
      </Suspense>
    </div>
  );
}
