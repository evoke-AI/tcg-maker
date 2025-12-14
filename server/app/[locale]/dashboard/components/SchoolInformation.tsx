'use client';

import { useTranslations } from 'next-intl';
import { School, MapPin, Phone, Mail, Globe, Clock } from 'lucide-react';
import { UserInfo } from '../types';
import { formatDate, getRoleColor } from '../utils';

interface SchoolInformationProps {
  user: UserInfo;
}

export default function SchoolInformation({ user }: SchoolInformationProps) {
  const t = useTranslations('dashboardPage');
  const tCommon = useTranslations('common');
  
  const primarySchool = user.schoolMemberships[0]?.school;
  const primaryRole = user.schoolMemberships[0]?.role;

  if (!primarySchool) {
    return null;
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-medium text-gray-900 flex items-center gap-2">
          <School className="h-5 w-5" />
          {t('sections.schoolInfo')}
        </h2>
        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getRoleColor(primaryRole)}`}>
          {primaryRole}
        </span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-medium text-gray-900 mb-2">{primarySchool.name}</h3>
          {primarySchool.code && (
            <p className="text-sm text-gray-600 mb-2">{t('details.code')}: {primarySchool.code}</p>
          )}
          
          <div className="space-y-2 text-sm">
            {primarySchool.address && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                <span className="text-gray-600">{primarySchool.address}</span>
              </div>
            )}
            {primarySchool.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">{primarySchool.phone}</span>
              </div>
            )}
            {primarySchool.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">{primarySchool.email}</span>
              </div>
            )}
            {primarySchool.website && (
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-gray-400" />
                <a 
                  href={primarySchool.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                >
                  {primarySchool.website}
                </a>
              </div>
            )}
          </div>
        </div>
        
        <div>
          <h4 className="font-medium text-gray-900 mb-2">{tCommon('details')}</h4>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="h-4 w-4 text-gray-400" />
            <span>{t('details.joined')}: {formatDate(user.schoolMemberships[0].joinedAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
} 