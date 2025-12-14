'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Building2, School } from 'lucide-react';

interface QuickActionsProps {
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

export default function QuickActions({ isAdmin, isSuperAdmin }: QuickActionsProps) {
  const t = useTranslations('dashboardPage');

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-medium text-gray-900 mb-4">{t('sections.quickActions')}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">        
        {(isAdmin || isSuperAdmin) && (
          <Link 
            href="/admin/users" 
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Building2 className="h-6 w-6 text-purple-600" />
            <div>
              <h3 className="font-medium text-gray-900">{t('actions.adminPanel')}</h3>
              <p className="text-sm text-gray-600">{t('actions.adminPanelDesc')}</p>
            </div>
          </Link>
        )}
        
        {isSuperAdmin && (
          <Link 
            href="/admin/schools" 
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <School className="h-6 w-6 text-green-600" />
            <div>
              <h3 className="font-medium text-gray-900">{t('actions.schools')}</h3>
              <p className="text-sm text-gray-600">{t('actions.schoolsDesc')}</p>
            </div>
          </Link>
        )}
      </div>
    </div>
  );
} 