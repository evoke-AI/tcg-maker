import { useTranslations } from 'next-intl';
import { SCHOOL_ROLES } from '@/lib/constants';
import type { UserProfile } from './types';

export const formatDate = (date: Date | string) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString();
};

/**
 * Check if a user is a student in any of their school memberships
 */
export const isUserStudent = (profile: UserProfile): boolean => {
  return profile.schools.some(school => school.role === SCHOOL_ROLES.STUDENT);
};

export const useProfileUtils = () => {
  const common = useTranslations('common');

  const getStatusBadge = (isActive: boolean, emailVerified: Date | null) => {
    if (!isActive) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">{common('status.inactive')}</span>;
    }
    if (!emailVerified) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">{common('status.pending')}</span>;
    }
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">{common('status.active')}</span>;
  };

  const getRoleDisplay = (systemRole: string | null) => {
    if (systemRole === 'SUPER_ADMIN') return 'System Administrator';
    return 'User';
  };

  return {
    getStatusBadge,
    getRoleDisplay,
  };
}; 