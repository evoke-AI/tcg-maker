'use client';

import { useTranslations } from 'next-intl';
import { Building2, BookOpen, Users } from 'lucide-react';
import { Stats } from '../types';

interface QuickStatsProps {
  stats: Stats;
  assignmentsDue: never[]; // Empty array - assignments feature not available
  isTeacher: boolean;
  isStudent: boolean;
}

export default function QuickStats({
  stats,
  isTeacher
}: QuickStatsProps) {
  const t = useTranslations('dashboardPage');

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center gap-3">
          <Building2 className="h-8 w-8 text-blue-600" />
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalSchools}</p>
            <p className="text-sm text-gray-600">{t('quickStats.schools')}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center gap-3">
          <BookOpen className="h-8 w-8 text-green-600" />
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalClasses}</p>
            <p className="text-sm text-gray-600">{t('quickStats.classes')}</p>
          </div>
        </div>
      </div>
      
      {isTeacher && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-purple-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
              <p className="text-sm text-gray-600">{t('quickStats.students')}</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
} 