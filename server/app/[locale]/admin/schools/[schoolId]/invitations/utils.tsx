import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

// Pure utility functions
export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const isExpired = (expiresAt: Date | string): boolean => {
  const expiry = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
  return expiry < new Date();
};

export const getDaysUntilExpiry = (expiresAt: Date | string): number => {
  const expiry = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
  const now = new Date();
  const diffTime = expiry.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Custom hook for invitation utilities
export const useInvitationUtils = () => {
  const t = useTranslations('admin.invitations');
  
  const getStatusBadge = (status: string, expiresAt?: Date | string) => {
    const isInviteExpired = expiresAt && isExpired(expiresAt);
    
    switch (status) {
      case 'PENDING':
        if (isInviteExpired) {
          return (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {t('status.expired')}
            </Badge>
          );
        }
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {t('status.pending')}
          </Badge>
        );
      case 'ACCEPTED':
        return (
          <Badge variant="default" className="flex items-center gap-1 bg-green-100 text-green-800 hover:bg-green-200">
            <CheckCircle className="h-3 w-3" />
            {t('status.accepted')}
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            {t('status.rejected')}
          </Badge>
        );
      case 'EXPIRED':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            {t('status.expired')}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {status}
          </Badge>
        );
    }
  };

  const getRoleBadge = (role: string) => {
    const roleColors = {
      ADMIN: 'bg-purple-100 text-purple-800 hover:bg-purple-200',
      TEACHER: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
      STUDENT: 'bg-green-100 text-green-800 hover:bg-green-200',
    };

    return (
      <Badge 
        variant="secondary" 
        className={roleColors[role as keyof typeof roleColors] || 'bg-gray-100 text-gray-800'}
      >
        {t(`form.roles.${role.toLowerCase()}`)}
      </Badge>
    );
  };

  const getExpiryText = (expiresAt: Date | string, status: string) => {
    if (status !== 'PENDING') return null;
    
    const days = getDaysUntilExpiry(expiresAt);
    
    if (days < 0) {
      return t('expiry.expired');
    } else if (days === 0) {
      return t('expiry.today');
    } else if (days === 1) {
      return t('expiry.tomorrow');
    } else {
      return t('expiry.daysLeft', { days });
    }
  };

  const getStatusFilterOptions = () => [
    { value: 'ALL', label: t('filters.all') },
    { value: 'PENDING', label: t('status.pending') },
    { value: 'ACCEPTED', label: t('status.accepted') },
    { value: 'REJECTED', label: t('status.rejected') },
    { value: 'EXPIRED', label: t('status.expired') },
  ];

  return {
    getStatusBadge,
    getRoleBadge,
    getExpiryText,
    getStatusFilterOptions,
    formatDate,
    isExpired,
    getDaysUntilExpiry,
  };
}; 