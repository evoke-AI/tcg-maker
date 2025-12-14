import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { SCHOOL_ROLES } from '@/lib/constants';
import type { CreateInvitationData } from '../types';

interface FormErrors {
  email?: string;
  role?: string;
}

export const useInvitationForm = () => {
  const t = useTranslations('admin.invitations.form');
  
  // Form state
  const [formData, setFormData] = useState<CreateInvitationData>({
    email: '',
    role: 'STUDENT',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isOpen, setIsOpen] = useState(false);

  // Validation
  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = t('validation.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('validation.emailInvalid');
    }

    // Role validation
    if (!formData.role) {
      newErrors.role = t('validation.roleRequired');
    } else if (!Object.values(SCHOOL_ROLES).includes(formData.role)) {
      newErrors.role = t('validation.roleInvalid');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, t]);

  // Form handlers
  const handleInputChange = useCallback((field: keyof CreateInvitationData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear specific field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  const handleSubmit = useCallback(async (
    onSubmit: (data: CreateInvitationData) => Promise<boolean>
  ): Promise<void> => {
    if (!validateForm()) {
      return;
    }

    const success = await onSubmit(formData);
    
    if (success) {
      // Reset form on success
      setFormData({
        email: '',
        role: 'STUDENT',
      });
      setErrors({});
      setIsOpen(false);
    }
  }, [formData, validateForm]);

  const openForm = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeForm = useCallback(() => {
    setIsOpen(false);
    // Reset form when closing
    setFormData({
      email: '',
      role: 'STUDENT',
    });
    setErrors({});
  }, []);

  const resetForm = useCallback(() => {
    setFormData({
      email: '',
      role: 'STUDENT',
    });
    setErrors({});
  }, []);

  // Get role options for select
  const getRoleOptions = useCallback(() => [
    { value: SCHOOL_ROLES.STUDENT, label: t('roles.student') },
    { value: SCHOOL_ROLES.TEACHER, label: t('roles.teacher') },
    { value: SCHOOL_ROLES.ADMIN, label: t('roles.admin') },
  ], [t]);

  return {
    // Form state
    formData,
    errors,
    isOpen,
    
    // Form validation
    validateForm,
    
    // Form handlers
    handleInputChange,
    handleSubmit,
    openForm,
    closeForm,
    resetForm,
    
    // Utilities
    getRoleOptions,
  };
}; 