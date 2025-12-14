import { useState, useTransition, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { 
  createSchoolInvitation, 
  getSchoolInvitations, 
  cancelSchoolInvitation, 
  resendSchoolInvitation 
} from '@/app/actions/school-invitations';
import type { SchoolInvitation, CreateInvitationData, InvitationFilters } from '../types';

export const useInvitationManagement = (schoolId: string) => {
  const t = useTranslations('admin.invitations');
  
  // State management
  const [invitations, setInvitations] = useState<SchoolInvitation[]>([]);
  const [totalInvitations, setTotalInvitations] = useState(0);
  const [filters, setFilters] = useState<InvitationFilters>({
    status: 'ALL',
    page: 1,
    limit: 20,
  });
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Loading states
  const [isLoading, startTransition] = useTransition();
  const [isCreating, startCreateTransition] = useTransition();
  const [loadingActions, setLoadingActions] = useState<Record<string, boolean>>({});

  // Clear messages after timeout
  const clearMessages = useCallback(() => {
    setTimeout(() => {
      setError(null);
      setSuccessMessage(null);
    }, 5000);
  }, []);

  // Load invitations
  const loadInvitations = useCallback(async () => {
    startTransition(async () => {
      try {
        const params = {
          ...(filters.status !== 'ALL' && { status: filters.status }),
          page: filters.page,
          limit: filters.limit,
        };

        const result = await getSchoolInvitations(schoolId, params);
        
        if (result.success && result.data) {
          setInvitations(result.data.invitations);
          setTotalInvitations(result.data.total);
          setError(null);
        } else {
          setError(result.error || t('errors.loadFailed'));
        }
      } catch (err) {
        setError(t('errors.loadFailed'));
        console.error('Error loading invitations:', err);
      }
    });
  }, [schoolId, filters, t]);

  // Create invitation
  const createInvitation = useCallback(async (data: CreateInvitationData) => {
    return new Promise<boolean>((resolve) => {
      startCreateTransition(async () => {
        try {
          const result = await createSchoolInvitation(schoolId, data);
          
          if (result.success) {
            setSuccessMessage(result.message || t('success.invitationSent'));
            await loadInvitations(); // Refresh the list
            setError(null);
            clearMessages();
            resolve(true);
          } else {
            setError(result.error || t('errors.createFailed'));
            clearMessages();
            resolve(false);
          }
        } catch (err) {
          setError(t('errors.createFailed'));
          console.error('Error creating invitation:', err);
          clearMessages();
          resolve(false);
        }
      });
    });
  }, [schoolId, t, loadInvitations, clearMessages]);

  // Cancel invitation
  const cancelInvitation = useCallback(async (invitationId: string) => {
    setLoadingActions(prev => ({ ...prev, [invitationId]: true }));
    
    try {
      const result = await cancelSchoolInvitation(schoolId, invitationId);
      
      if (result.success) {
        setSuccessMessage(result.message || t('success.invitationCancelled'));
        await loadInvitations(); // Refresh the list
        setError(null);
        clearMessages();
      } else {
        setError(result.error || t('errors.cancelFailed'));
        clearMessages();
      }
    } catch (err) {
      setError(t('errors.cancelFailed'));
      console.error('Error cancelling invitation:', err);
      clearMessages();
    } finally {
      setLoadingActions(prev => ({ ...prev, [invitationId]: false }));
    }
  }, [schoolId, t, loadInvitations, clearMessages]);

  // Resend invitation
  const resendInvitation = useCallback(async (invitationId: string) => {
    setLoadingActions(prev => ({ ...prev, [invitationId]: true }));
    
    try {
      const result = await resendSchoolInvitation(schoolId, invitationId);
      
      if (result.success) {
        setSuccessMessage(result.message || t('success.invitationResent'));
        await loadInvitations(); // Refresh the list
        setError(null);
        clearMessages();
      } else {
        setError(result.error || t('errors.resendFailed'));
        clearMessages();
      }
    } catch (err) {
      setError(t('errors.resendFailed'));
      console.error('Error resending invitation:', err);
      clearMessages();
    } finally {
      setLoadingActions(prev => ({ ...prev, [invitationId]: false }));
    }
  }, [schoolId, t, loadInvitations, clearMessages]);

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<InvitationFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Reset filters
  const resetFilters = useCallback(() => {
    setFilters({
      status: 'ALL',
      page: 1,
      limit: 20,
    });
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Clear success message
  const clearSuccess = useCallback(() => {
    setSuccessMessage(null);
  }, []);

  return {
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
    resetFilters,
    clearError,
    clearSuccess,
  };
}; 