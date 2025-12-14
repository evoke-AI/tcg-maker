'use client';

import { useTranslations } from 'next-intl';
import { User, Mail, Award, GraduationCap } from 'lucide-react';
import { UserInfo } from '../types';

interface WelcomeHeaderProps {
  user: UserInfo;
  isTeacher: boolean;
  isStudent: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

export default function WelcomeHeader({
  user,
  isTeacher,
  isStudent,
  isAdmin,
  isSuperAdmin
}: WelcomeHeaderProps) {
  const t = useTranslations('dashboardPage');
  const tCommon = useTranslations('common');
  
  const displayName = user.firstName && user.lastName 
    ? `${user.firstName} ${user.lastName}` 
    : user.username;

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center gap-4 mb-4">
        <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
          <User className="h-8 w-8 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t('userInfo.welcomeBack')}, {displayName}!
          </h1>
          <p className="text-gray-600">
            {isSuperAdmin && t('userInfo.systemAdmin')}
            {isAdmin && !isSuperAdmin && t('userInfo.schoolAdmin')}
            {isTeacher && !isAdmin && !isSuperAdmin && t('userInfo.teacher')}
            {isStudent && !isTeacher && !isAdmin && !isSuperAdmin && t('userInfo.student')}
          </p>
        </div>
      </div>
      
      {/* User Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-gray-400" />
          <span className="text-gray-600">{tCommon('email')}:</span>
          <span className="font-medium">{user.email || tCommon('notProvided')}</span>
        </div>
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-gray-400" />
          <span className="text-gray-600">{tCommon('username')}:</span>
          <span className="font-medium">{user.username}</span>
        </div>
        {user.studentId && (
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">{tCommon('studentId')}:</span>
            <span className="font-medium">{user.studentId}</span>
          </div>
        )}
        {user.gradeLevel && (
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">{tCommon('gradeLevel')}:</span>
            <span className="font-medium">{user.gradeLevel}</span>
          </div>
        )}
      </div>
    </div>
  );
} 