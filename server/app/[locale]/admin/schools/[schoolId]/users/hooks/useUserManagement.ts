import { useState, useCallback, useEffect } from 'react';
import { getSchoolUsers, bulkUpdateSchoolUsers, createSchoolUser, updateSchoolUser } from '@/app/actions/school-users';
import { SCHOOL_ROLES, type SchoolRole } from '@/lib/constants';
import type { SchoolUser, UserFormData } from '../types';

export function useUserManagement(schoolId: string) {
  // User state
  const [users, setUsers] = useState<SchoolUser[]>([]);
  const [userLoading, setUserLoading] = useState(true);
  const [userError, setUserError] = useState<string | null>(null);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userCurrentPage, setUserCurrentPage] = useState(1);
  const [userTotalPages, setUserTotalPages] = useState(1);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<SchoolUser | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [bulkOperationLoading, setBulkOperationLoading] = useState(false);
  
  // Password reset state
  const [isPasswordResetDialogOpen, setIsPasswordResetDialogOpen] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] = useState<SchoolUser | null>(null);
  const [isBulkPasswordResetDialogOpen, setIsBulkPasswordResetDialogOpen] = useState(false);
  
  // User form state
  const [userFormData, setUserFormData] = useState<UserFormData>({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    role: SCHOOL_ROLES.STUDENT,
    studentId: '',
    gradeLevel: '',
    generatePassword: true,
  });
  const [createUserLoading, setCreateUserLoading] = useState(false);

  // Fetch users
  const fetchUsers = useCallback(async (page = 1, search = '') => {
    try {
      setUserLoading(true);
      
      const result = await getSchoolUsers({
        schoolId,
        page,
        limit: 20,
        search: search && search.trim() !== '' ? search.trim() : undefined,
        includeClasses: true
      });

      if (result.success && result.data) {
        const data = result.data as {
          users: SchoolUser[];
          pagination: { pages: number; page: number };
        };
        setUsers(data.users || []);
        setUserTotalPages(data.pagination?.pages || 1);
        setUserCurrentPage(data.pagination?.page || 1);
        setUserError(null);
      } else {
        setUserError(result.error || 'Failed to fetch users');
      }
    } catch (err) {
      setUserError('Error fetching users');
      console.error('Error fetching users:', err);
    } finally {
      setUserLoading(false);
    }
  }, [schoolId]);

  // Search handlers
  const handleUserSearch = useCallback(() => {
    setUserCurrentPage(1);
    setSelectedUsers(new Set());
    fetchUsers(1, userSearchTerm);
  }, [userSearchTerm, fetchUsers]);

  // Selection handlers
  const toggleUserSelection = useCallback((userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  }, [selectedUsers]);

  const selectAllUsers = useCallback(() => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map(u => u.id)));
    }
  }, [selectedUsers.size, users]);

  // Bulk operations
  const executeBulkRoleChange = useCallback(async (newRole: string) => {
    if (!newRole || selectedUsers.size === 0) return;
    
    try {
      setBulkOperationLoading(true);
      
      const result = await bulkUpdateSchoolUsers(schoolId, {
        type: 'role',
        value: newRole,
        userIds: Array.from(selectedUsers)
      });
      
      if (result.success) {
        await fetchUsers(userCurrentPage, userSearchTerm);
        setSelectedUsers(new Set());
      } else {
        setUserError(result.error || 'Bulk operation failed');
      }
    } catch (err) {
      setUserError('Failed to execute bulk operation');
      console.error('Bulk operation error:', err);
    } finally {
      setBulkOperationLoading(false);
    }
  }, [schoolId, selectedUsers, userCurrentPage, userSearchTerm, fetchUsers]);

  // Edit user handlers
  const handleEditUser = useCallback((user: SchoolUser) => {
    setEditingUser(user);
    setUserFormData({
      username: user.username,
      email: user.email || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      role: user.role,
      studentId: user.studentId || '',
      gradeLevel: user.gradeLevel || '',
      generatePassword: false,
    });
    setIsEditUserDialogOpen(true);
  }, []);

  const handleUpdateUser = useCallback(async () => {
    if (!editingUser) return;
    
    try {
      setCreateUserLoading(true);
      const result = await updateSchoolUser(schoolId, {
        id: editingUser.id,
        username: userFormData.username.trim() || undefined,
        email: userFormData.email.trim() || undefined,
        firstName: userFormData.firstName.trim() || undefined,
        lastName: userFormData.lastName.trim() || undefined,
        role: userFormData.role as SchoolRole,
        studentId: userFormData.studentId.trim() || undefined,
        gradeLevel: userFormData.gradeLevel || undefined,
      });

      if (result.success) {
        setIsEditUserDialogOpen(false);
        setEditingUser(null);
        fetchUsers(userCurrentPage, userSearchTerm);
      } else {
        setUserError(result.error || 'Failed to update user');
      }
    } catch (err) {
      setUserError('Error updating user');
      console.error('Error updating user:', err);
    } finally {
      setCreateUserLoading(false);
    }
  }, [editingUser, userFormData, schoolId, userCurrentPage, userSearchTerm, fetchUsers]);

  const handleCreateUser = useCallback(async () => {
    try {
      setCreateUserLoading(true);
      const result = await createSchoolUser(schoolId, {
        username: userFormData.username.trim(),
        email: userFormData.email.trim() || undefined,
        firstName: userFormData.firstName.trim(),
        lastName: userFormData.lastName.trim(),
        role: userFormData.role as SchoolRole,
        studentId: userFormData.studentId.trim() || undefined,
        gradeLevel: userFormData.gradeLevel || undefined,
        generatePassword: userFormData.generatePassword,
      });

      if (result.success) {
        setIsAddUserDialogOpen(false);
        setUserFormData({
          username: '',
          email: '',
          firstName: '',
          lastName: '',
          role: 'STUDENT',
          studentId: '',
          gradeLevel: '',
          generatePassword: true,
        });
        fetchUsers(userCurrentPage, userSearchTerm);
      } else {
        setUserError(result.error || 'Failed to create user');
      }
    } catch (err) {
      setUserError('Error creating user');
      console.error('Error creating user:', err);
    } finally {
      setCreateUserLoading(false);
    }
  }, [userFormData, schoolId, userCurrentPage, userSearchTerm, fetchUsers]);

  // Handle role change
  const handleRoleChange = useCallback(async (userId: string, newRole: string) => {
    try {
      const result = await updateSchoolUser(schoolId, {
        id: userId,
        role: newRole as SchoolRole,
      });

      if (result.success) {
        // Refresh the users list to show the updated role
        await fetchUsers(userCurrentPage, userSearchTerm);
      } else {
        setUserError(result.error || 'Failed to update user role');
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      setUserError('Error updating user role');
    }
  }, [schoolId, fetchUsers, userCurrentPage, userSearchTerm]);

  // Password reset handlers
  const handleResetPassword = useCallback((user: SchoolUser) => {
    setResetPasswordUser(user);
    setIsPasswordResetDialogOpen(true);
  }, []);

  const handleBulkPasswordReset = useCallback(() => {
    if (selectedUsers.size > 0) {
      setIsBulkPasswordResetDialogOpen(true);
    }
  }, [selectedUsers.size]);

  const handlePasswordResetSuccess = useCallback(() => {
    setIsPasswordResetDialogOpen(false);
    setIsBulkPasswordResetDialogOpen(false);
    setResetPasswordUser(null);
    fetchUsers(userCurrentPage, userSearchTerm);
  }, [fetchUsers, userCurrentPage, userSearchTerm]);

  const resetUserForm = useCallback(() => {
    setUserFormData({
      username: '',
      email: '',
      firstName: '',
      lastName: '',
      role: SCHOOL_ROLES.STUDENT,
      studentId: '',
      gradeLevel: '',
      generatePassword: true,
    });
  }, []);

  // Initialize data loading
  useEffect(() => {
    fetchUsers(1, '');
  }, [fetchUsers]);

  return {
    // State
    users,
    userLoading,
    userError,
    setUserError,
    userSearchTerm,
    setUserSearchTerm,
    userCurrentPage,
    setUserCurrentPage,
    userTotalPages,
    isAddUserDialogOpen,
    setIsAddUserDialogOpen,
    isEditUserDialogOpen,
    setIsEditUserDialogOpen,
    editingUser,
    setEditingUser,
    selectedUsers,
    bulkOperationLoading,
    userFormData,
    setUserFormData,
    createUserLoading,
    
    // Password reset state
    isPasswordResetDialogOpen,
    setIsPasswordResetDialogOpen,
    resetPasswordUser,
    setResetPasswordUser,
    isBulkPasswordResetDialogOpen,
    setIsBulkPasswordResetDialogOpen,
    
    // Actions
    fetchUsers,
    handleUserSearch,
    toggleUserSelection,
    selectAllUsers,
    executeBulkRoleChange,
    handleEditUser,
    handleUpdateUser,
    handleCreateUser,
    handleRoleChange,
    handleResetPassword,
    handleBulkPasswordReset,
    handlePasswordResetSuccess,
    resetUserForm,
  };
} 