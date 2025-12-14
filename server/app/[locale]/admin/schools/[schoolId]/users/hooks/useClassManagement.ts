import { useState, useCallback, useEffect } from 'react';
import { getSchoolClasses, createSchoolClass, deleteSchoolClass, updateSchoolClass } from '@/app/actions/school-classes';
import type { SchoolClass, ClassFormData } from '../types';

export function useClassManagement(schoolId: string) {
  // Class state
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [classLoading, setClassLoading] = useState(true);
  const [classError, setClassError] = useState<string | null>(null);
  const [classSearchTerm, setClassSearchTerm] = useState('');
  const [classCurrentPage, setClassCurrentPage] = useState(1);
  const [classTotalPages, setClassTotalPages] = useState(1);
  const [isAddClassDialogOpen, setIsAddClassDialogOpen] = useState(false);
  const [isEditClassDialogOpen, setIsEditClassDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<SchoolClass | null>(null);
  
  // Class form state
  const [classFormData, setClassFormData] = useState<ClassFormData>({
    name: '',
    code: '',
    subject: '',
    gradeLevel: '',
    description: '',
  });
  const [createClassLoading, setCreateClassLoading] = useState(false);
  const [updateClassLoading, setUpdateClassLoading] = useState(false);

  // Fetch classes
  const fetchClasses = useCallback(async (page = 1, search = '') => {
    try {
      setClassLoading(true);
      const result = await getSchoolClasses({
        schoolId,
        page,
        limit: 10,
        search: search || undefined,
        includeUsers: false,
      });

      if (result.success && result.data) {
        const data = result.data as { classes: SchoolClass[]; pagination: { pages: number; page: number } };
        setClasses(data.classes);
        setClassTotalPages(data.pagination.pages);
        setClassCurrentPage(data.pagination.page);
        setClassError(null);
      } else {
        setClassError(result.error || 'Failed to fetch classes');
      }
    } catch (err) {
      setClassError('Error fetching classes');
      console.error('Error fetching classes:', err);
    } finally {
      setClassLoading(false);
    }
  }, [schoolId]);

  const handleClassSearch = useCallback(() => {
    setClassCurrentPage(1);
    fetchClasses(1, classSearchTerm);
  }, [classSearchTerm, fetchClasses]);

  // Create class handler
  const handleCreateClass = useCallback(async () => {
    if (!classFormData.name.trim()) return;
    
    try {
      setCreateClassLoading(true);
      const result = await createSchoolClass(schoolId, {
        name: classFormData.name.trim(),
        code: classFormData.code.trim() || undefined,
        subject: classFormData.subject || undefined,
        gradeLevel: classFormData.gradeLevel || undefined,
        description: classFormData.description.trim() || undefined,
      });

      if (result.success) {
        setIsAddClassDialogOpen(false);
        setClassFormData({
          name: '',
          code: '',
          subject: '',
          gradeLevel: '',
          description: '',
        });
        fetchClasses(classCurrentPage, classSearchTerm);
      } else {
        setClassError(result.error || 'Failed to create class');
      }
    } catch (err) {
      setClassError('Error creating class');
      console.error('Error creating class:', err);
    } finally {
      setCreateClassLoading(false);
    }
  }, [classFormData, schoolId, classCurrentPage, classSearchTerm, fetchClasses]);

  // Delete class handler
  const handleDeleteClass = useCallback(async (classToDelete: SchoolClass) => {
    if (!confirm(`Are you sure you want to delete "${classToDelete.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const result = await deleteSchoolClass(schoolId, classToDelete.id);
      if (result.success) {
        fetchClasses(classCurrentPage, classSearchTerm);
      } else {
        setClassError(result.error || 'Failed to delete class');
      }
    } catch (err) {
      setClassError('Error deleting class');
      console.error('Error deleting class:', err);
    }
  }, [schoolId, classCurrentPage, classSearchTerm, fetchClasses]);

  // Edit class handlers
  const handleEditClass = useCallback((cls: SchoolClass) => {
    setEditingClass(cls);
    setClassFormData({
      name: cls.name,
      code: cls.code || '',
      subject: cls.subject || '',
      gradeLevel: cls.gradeLevel || '',
      description: cls.description || '',
    });
    setIsEditClassDialogOpen(true);
  }, []);

  const handleUpdateClass = useCallback(async () => {
    if (!editingClass) return;
    
    try {
      setUpdateClassLoading(true);
      const result = await updateSchoolClass(schoolId, {
        id: editingClass.id,
        name: classFormData.name.trim() || undefined,
        code: classFormData.code.trim() || undefined,
        subject: classFormData.subject || undefined,
        gradeLevel: classFormData.gradeLevel || undefined,
        description: classFormData.description.trim() || undefined,
      });

      if (result.success) {
        setIsEditClassDialogOpen(false);
        setEditingClass(null);
        setClassFormData({
          name: '',
          code: '',
          subject: '',
          gradeLevel: '',
          description: '',
        });
        fetchClasses(classCurrentPage, classSearchTerm);
      } else {
        setClassError(result.error || 'Failed to update class');
      }
    } catch (err) {
      setClassError('Error updating class');
      console.error('Error updating class:', err);
    } finally {
      setUpdateClassLoading(false);
    }
  }, [editingClass, classFormData, schoolId, classCurrentPage, classSearchTerm, fetchClasses]);

  const resetClassForm = useCallback(() => {
    setClassFormData({
      name: '',
      code: '',
      subject: '',
      gradeLevel: '',
      description: '',
    });
  }, []);

  // Initialize data loading
  useEffect(() => {
    fetchClasses(1, '');
  }, [fetchClasses]);

  return {
    // State
    classes,
    classLoading,
    classError,
    setClassError,
    classSearchTerm,
    setClassSearchTerm,
    classCurrentPage,
    setClassCurrentPage,
    classTotalPages,
    isAddClassDialogOpen,
    setIsAddClassDialogOpen,
    isEditClassDialogOpen,
    setIsEditClassDialogOpen,
    editingClass,
    setEditingClass,
    classFormData,
    setClassFormData,
    createClassLoading,
    updateClassLoading,
    
    // Actions
    fetchClasses,
    handleClassSearch,
    handleCreateClass,
    handleDeleteClass,
    handleEditClass,
    handleUpdateClass,
    resetClassForm,
  };
}