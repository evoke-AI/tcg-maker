import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { updateUserProfile } from '@/app/actions/profile';
import type { ProfileFormData, UserProfile } from '../types';

export const useProfileManagement = (initialProfile: UserProfile) => {
  const t = useTranslations('profile');
  
  // Profile editing state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState<ProfileFormData>({
    firstName: initialProfile.firstName,
    lastName: initialProfile.lastName,
    email: initialProfile.email || '',
    studentId: initialProfile.studentId || '',
    gradeLevel: initialProfile.gradeLevel || '',
    department: initialProfile.department || '',
  });
  const [profileErrors, setProfileErrors] = useState<Record<string, string[]>>({});
  const [profileSuccess, setProfileSuccess] = useState('');
  const [isUpdatingProfile, startProfileTransition] = useTransition();

  // Profile form handlers
  const handleProfileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (profileErrors[name]) {
      setProfileErrors(prev => ({ ...prev, [name]: [] }));
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileErrors({});
    setProfileSuccess('');

    const formData = new FormData();
    Object.entries(profileForm).forEach(([key, value]) => {
      formData.append(key, value);
    });

    startProfileTransition(async () => {
      const result = await updateUserProfile(formData);
      
      if (result.success) {
        setProfileSuccess(t('personalInfo.updateSuccess'));
        setIsEditingProfile(false);
        // Update the form with the latest data
        if (result.data) {
          setProfileForm({
            firstName: result.data.firstName,
            lastName: result.data.lastName,
            email: result.data.email || '',
            studentId: result.data.studentId || '',
            gradeLevel: result.data.gradeLevel || '',
            department: result.data.department || '',
          });
        }
      } else {
        setProfileErrors(result.errors || {});
        if (result.error) {
          setProfileErrors({ general: [result.error] });
        }
      }
    });
  };

  const handleCancelProfileEdit = () => {
    setIsEditingProfile(false);
    setProfileForm({
      firstName: initialProfile.firstName,
      lastName: initialProfile.lastName,
      email: initialProfile.email || '',
      studentId: initialProfile.studentId || '',
      gradeLevel: initialProfile.gradeLevel || '',
      department: initialProfile.department || '',
    });
    setProfileErrors({});
    setProfileSuccess('');
  };

  const startEditing = () => {
    setIsEditingProfile(true);
  };

  return {
    // State
    isEditingProfile,
    profileForm,
    profileErrors,
    profileSuccess,
    isUpdatingProfile,
    
    // Actions
    handleProfileInputChange,
    handleProfileSubmit,
    handleCancelProfileEdit,
    startEditing,
  };
}; 