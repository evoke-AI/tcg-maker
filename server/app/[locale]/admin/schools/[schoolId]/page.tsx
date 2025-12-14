import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { requireSchoolPermission } from '@/lib/authUtils';
import { getTranslations } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import { PERMISSIONS } from '@/lib/constants';
import SchoolManagement from './SchoolManagement';

interface SchoolPageProps {
  params: Promise<{ schoolId: string; locale: string }>;
}

export default async function SchoolPage({ params }: SchoolPageProps) {
  const { schoolId } = await params;
  
  try {
    // Check if user has permission to manage this school
    await requireSchoolPermission(schoolId, PERMISSIONS.MANAGE_SCHOOL);
  } catch {
    notFound();
  }

  // Fetch school data
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    include: {
      _count: {
        select: {
          members: true,
          classes: true,
        },
      },
    },
  });

  if (!school) {
    notFound();
  }

  const t = await getTranslations('admin.school');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {school.name}
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          {t('description', { default: 'Manage school settings, information, and configuration.' })}
        </p>
      </div>

      <Suspense fallback={
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      }>
        <SchoolManagement school={school} />
      </Suspense>
    </div>
  );
} 