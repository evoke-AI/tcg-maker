'use client';

import { useTranslations } from 'next-intl';
import { Building } from 'lucide-react';
import { formatDate } from '../utils';
import type { SchoolMembership } from '../types';

interface SchoolMembershipsSectionProps {
  schools: SchoolMembership[];
}

export default function SchoolMembershipsSection({ schools }: SchoolMembershipsSectionProps) {
  const t = useTranslations('profile');

  if (schools.length === 0) {
    return null;
  }

  return (
    <div>
      <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2 mb-6">
        <Building className="h-5 w-5" />
        {t('schoolMemberships.title')}
      </h2>
      
      <div className="space-y-4">
        {schools.map((school) => (
          <div key={school.schoolId} className="border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-gray-900">{school.schoolName}</h3>
                {school.schoolCode && (
                  <p className="text-sm text-gray-500">Code: {school.schoolCode}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{t('schoolMemberships.role')}: {school.role}</p>
                <p className="text-sm text-gray-500">{t('schoolMemberships.joinedDate')}: {formatDate(school.joinedAt)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 