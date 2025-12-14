'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { BookOpen, GraduationCap, ChevronRight } from 'lucide-react';
import { UserInfo } from '../types';

interface StudentClassesProps {
  user: UserInfo;
  isStudent: boolean;
}

export default function StudentClasses({ user, isStudent }: StudentClassesProps) {
  const t = useTranslations('dashboardPage');

  if (!isStudent || user.studentClasses.length === 0) {
    return null;
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-medium text-gray-900 flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          {t('sections.studentClasses')} ({user.studentClasses.length})
        </h2>
        <Link 
          href="/assignments" 
          className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
        >
          {t('actions.viewAssignments')} <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {user.studentClasses.map((studentClass) => (
          <div key={studentClass.class.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-medium text-gray-900">{studentClass.class.name}</h3>
              {studentClass.class.code && (
                <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                  {studentClass.class.code}
                </span>
              )}
            </div>
            
            <div className="space-y-1 text-sm text-gray-600">
              {studentClass.class.subject && (
                <div className="flex items-center gap-2">
                  <BookOpen className="h-3 w-3" />
                  <span>{studentClass.class.subject}</span>
                </div>
              )}
              {studentClass.class.gradeLevel && (
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-3 w-3" />
                  <span>{t('details.grade')} {studentClass.class.gradeLevel}</span>
                </div>
              )}

            </div>
            
            {studentClass.class.description && (
              <p className="text-sm text-gray-500 mt-2">{studentClass.class.description}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 