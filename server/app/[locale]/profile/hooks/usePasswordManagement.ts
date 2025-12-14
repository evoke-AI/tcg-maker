import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { updateUserPassword } from '@/app/actions/profile';
import type { PasswordFormData } from '../types';

export const usePasswordManagement = () => {
  const t = useTranslations('profile');
  
  // Password change state
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState<PasswordFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string[]>>({});
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isUpdatingPassword, startPasswordTransition] = useTransition();
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Password form handlers
  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (passwordErrors[name]) {
      setPasswordErrors(prev => ({ ...prev, [name]: [] }));
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordErrors({});
    setPasswordSuccess('');

    const formData = new FormData();
    Object.entries(passwordForm).forEach(([key, value]) => {
      formData.append(key, value);
    });

    startPasswordTransition(async () => {
      const result = await updateUserPassword(formData);
      
      if (result.success) {
        setPasswordSuccess(t('security.passwordUpdateSuccess'));
        setIsChangingPassword(false);
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        setPasswordErrors(result.errors || {});
        if (result.error) {
          setPasswordErrors({ general: [result.error] });
        }
      }
    });
  };

  const handleCancelPasswordChange = () => {
    setIsChangingPassword(false);
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setPasswordErrors({});
    setPasswordSuccess('');
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const startChangingPassword = () => {
    setIsChangingPassword(true);
  };

  return {
    // State
    isChangingPassword,
    passwordForm,
    passwordErrors,
    passwordSuccess,
    isUpdatingPassword,
    showPasswords,
    
    // Actions
    handlePasswordInputChange,
    handlePasswordSubmit,
    handleCancelPasswordChange,
    togglePasswordVisibility,
    startChangingPassword,
  };
}; 