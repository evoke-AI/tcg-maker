'use client';

import React, { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle } from 'lucide-react';
import InvitationForm from './components/InvitationForm';
import InvitationsList from './components/InvitationsList';
import { useInvitationManagement } from './hooks/useInvitationManagement';
import type { School } from './types';

interface InvitationsManagementProps {
  school: School;
}

export default function InvitationsManagement({ school }: InvitationsManagementProps) {
  const t = useTranslations('admin.invitations');
  
  const {
    // State
    invitations,
    totalInvitations,
    filters,
    error,
    successMessage,
    
    // Loading states
    isLoading,
    isCreating,
    loadingActions,
    
    // Actions
    loadInvitations,
    createInvitation,
    cancelInvitation,
    resendInvitation,
    updateFilters,
    clearError,
    clearSuccess,
  } = useInvitationManagement(school.id);

  // Load invitations on mount and when filters change
  useEffect(() => {
    loadInvitations();
  }, [loadInvitations]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {t('title')}
            </h1>
            <p className="text-gray-600">
              {t('description', { schoolName: school.name })}
            </p>
          </div>
          
          {/* Invitation Form */}
          <InvitationForm
            onSubmit={createInvitation}
            isLoading={isCreating}
            schoolName={school.name}
          />
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">
            {successMessage}
            <button
              onClick={clearSuccess}
              className="ml-2 text-green-600 hover:text-green-800 underline"
            >
              {t('dismiss')}
            </button>
          </AlertDescription>
        </Alert>
      )}

      {/* Error Message */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            {error}
            <button
              onClick={clearError}
              className="ml-2 text-red-600 hover:text-red-800 underline"
            >
              {t('dismiss')}
            </button>
          </AlertDescription>
        </Alert>
      )}

      {/* Invitations List */}
      <div className="bg-white shadow rounded-lg p-6">
        <InvitationsList
          invitations={invitations}
          totalInvitations={totalInvitations}
          filters={filters}
          isLoading={isLoading}
          loadingActions={loadingActions}
          onFiltersChange={updateFilters}
          onCancelInvitation={cancelInvitation}
          onResendInvitation={resendInvitation}
          onRefresh={loadInvitations}
        />
      </div>
    </div>
  );
} 