'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User, Edit, Check, X } from 'lucide-react';
import { useProfileManagement } from '../hooks/useProfileManagement';
import { useProfileUtils, formatDate, isUserStudent } from '../utils';
import type { UserProfile } from '../types';

interface PersonalInfoSectionProps {
  profile: UserProfile;
}

export default function PersonalInfoSection({ profile }: PersonalInfoSectionProps) {
  const t = useTranslations('profile');
  const common = useTranslations('common');
  const { getStatusBadge, getRoleDisplay } = useProfileUtils();
  
  const profileManagement = useProfileManagement(profile);
  const isStudent = isUserStudent(profile);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2">
          <User className="h-5 w-5" />
          {t('personalInfo.title')}
        </h2>
        {!profileManagement.isEditingProfile && (
          <Button
            onClick={profileManagement.startEditing}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            {common('edit')}
          </Button>
        )}
      </div>

      {profileManagement.profileSuccess && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-600">{profileManagement.profileSuccess}</p>
        </div>
      )}

      {profileManagement.profileErrors.general && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{profileManagement.profileErrors.general[0]}</p>
        </div>
      )}

      {profileManagement.isEditingProfile ? (
        <form onSubmit={profileManagement.handleProfileSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('personalInfo.firstName')}
              </label>
              <Input
                type="text"
                name="firstName"
                value={profileManagement.profileForm.firstName}
                onChange={profileManagement.handleProfileInputChange}
                required
              />
              {profileManagement.profileErrors.firstName && (
                <p className="mt-1 text-sm text-red-600">{profileManagement.profileErrors.firstName[0]}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('personalInfo.lastName')}
              </label>
              <Input
                type="text"
                name="lastName"
                value={profileManagement.profileForm.lastName}
                onChange={profileManagement.handleProfileInputChange}
                required
              />
              {profileManagement.profileErrors.lastName && (
                <p className="mt-1 text-sm text-red-600">{profileManagement.profileErrors.lastName[0]}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('personalInfo.email')} ({common('optional')})
            </label>
            <Input
              type="email"
              name="email"
              value={profileManagement.profileForm.email}
              onChange={profileManagement.handleProfileInputChange}
            />
            {profileManagement.profileErrors.email && (
              <p className="mt-1 text-sm text-red-600">{profileManagement.profileErrors.email[0]}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('personalInfo.studentId')} ({common('optional')})
              </label>
              <Input
                type="text"
                name="studentId"
                value={profileManagement.profileForm.studentId}
                onChange={profileManagement.handleProfileInputChange}
                disabled={isStudent}
              />
              {isStudent && (
                <p className="mt-1 text-xs text-gray-500">{t('personalInfo.studentIdNote')}</p>
              )}
              {profileManagement.profileErrors.studentId && (
                <p className="mt-1 text-sm text-red-600">{profileManagement.profileErrors.studentId[0]}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('personalInfo.gradeLevel')} ({common('optional')})
              </label>
              <Input
                type="text"
                name="gradeLevel"
                value={profileManagement.profileForm.gradeLevel}
                onChange={profileManagement.handleProfileInputChange}
                disabled={isStudent}
              />
              {isStudent && (
                <p className="mt-1 text-xs text-gray-500">{t('personalInfo.gradeLevelNote')}</p>
              )}
              {profileManagement.profileErrors.gradeLevel && (
                <p className="mt-1 text-sm text-red-600">{profileManagement.profileErrors.gradeLevel[0]}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('personalInfo.department')} ({common('optional')})
              </label>
              <Input
                type="text"
                name="department"
                value={profileManagement.profileForm.department}
                onChange={profileManagement.handleProfileInputChange}
              />
              {profileManagement.profileErrors.department && (
                <p className="mt-1 text-sm text-red-600">{profileManagement.profileErrors.department[0]}</p>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={profileManagement.isUpdatingProfile}
              className="flex items-center gap-2"
            >
              {profileManagement.isUpdatingProfile ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {t('personalInfo.updating')}
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  {t('personalInfo.updateProfile')}
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={profileManagement.handleCancelProfileEdit}
              disabled={profileManagement.isUpdatingProfile}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              {common('cancel')}
            </Button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500">{t('personalInfo.firstName')}</label>
              <p className="mt-1 text-sm text-gray-900">{profile.firstName}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500">{t('personalInfo.lastName')}</label>
              <p className="mt-1 text-sm text-gray-900">{profile.lastName}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500">{t('personalInfo.email')}</label>
              <p className="mt-1 text-sm text-gray-900">{profile.email || common('notProvided')}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500">{t('personalInfo.username')}</label>
              <p className="mt-1 text-sm text-gray-900">{profile.username}</p>
              <p className="mt-1 text-xs text-gray-500">{t('personalInfo.usernameNote')}</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500">{t('personalInfo.studentId')}</label>
              <p className="mt-1 text-sm text-gray-900">{profile.studentId || common('notProvided')}</p>
              {isStudent && (
                <p className="mt-1 text-xs text-gray-500">{t('personalInfo.studentIdNote')}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500">{t('personalInfo.gradeLevel')}</label>
              <p className="mt-1 text-sm text-gray-900">{profile.gradeLevel || common('notProvided')}</p>
              {isStudent && (
                <p className="mt-1 text-xs text-gray-500">{t('personalInfo.gradeLevelNote')}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500">{t('personalInfo.department')}</label>
              <p className="mt-1 text-sm text-gray-900">{profile.department || common('notProvided')}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-500">{t('personalInfo.systemRole')}</label>
              <p className="mt-1 text-sm text-gray-900">{getRoleDisplay(profile.systemRole)}</p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-500">{t('personalInfo.accountStatus')}</label>
            <div className="mt-1">{getStatusBadge(profile.isActive, profile.emailVerified)}</div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-500">{t('personalInfo.memberSince')}</label>
            <p className="mt-1 text-sm text-gray-900">{formatDate(profile.createdAt)}</p>
          </div>
        </div>
      </div>
    </div>
  );
} 