'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Search, Users, Mail, Settings, Trash2, ArrowLeft,
  BookOpen, GraduationCap, Loader2, AlertCircle, CheckSquare, Square, UserCheck, Briefcase, UserPlus, AlertTriangle
} from 'lucide-react';
import Link from 'next/link';

import { getClassUsers, getAvailableUsersForClass, assignUsersToClass, removeUsersFromClass } from '@/app/actions/school-classes';
import { SCHOOL_ROLES, type SchoolRole } from '@/lib/constants';

interface School {
  id: string;
  name: string;
  code: string | null;
}

interface ClassData {
  id: string;
  name: string;
  code?: string | null;
  subject?: string | null;
  gradeLevel?: string | null;
  description?: string | null;
  teacherCount: number;
  studentCount: number;
}

interface ClassUser {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email: string;
  studentId?: string;
  role: string;
  assignedAt?: string;
  enrolledAt?: string;
}

interface AvailableUser {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email: string;
  studentId?: string;
  role: string;
}

interface ClassUsersManagementProps {
  school: School;
  classData: ClassData;
}

export default function ClassUsersManagement({ school, classData }: ClassUsersManagementProps) {
  // State for current users in class
  const [teachers, setTeachers] = useState<ClassUser[]>([]);
  const [students, setStudents] = useState<ClassUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | SchoolRole>('ALL');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  
  // Add users dialog state
  const [isAddUsersDialogOpen, setIsAddUsersDialogOpen] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [addUsersLoading, setAddUsersLoading] = useState(false);
  const [availableUsersLoading, setAvailableUsersLoading] = useState(false);
  const [availableSearchTerm, setAvailableSearchTerm] = useState('');
  const [availableRoleFilter, setAvailableRoleFilter] = useState<'ALL' | SchoolRole>('ALL');
  
  // Bulk operations state
  const [selectedCurrentUsers, setSelectedCurrentUsers] = useState<Set<string>>(new Set());
  const [bulkOperationLoading, setBulkOperationLoading] = useState(false);
  
  // Remove confirmation dialog state
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);

  // Fetch current users in class
  const fetchClassUsers = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getClassUsers(school.id, classData.id);
      if (result.success && result.data) {
        const data = result.data as { teachers: ClassUser[]; students: ClassUser[]; totalUsers: number };
        setTeachers(data.teachers || []);
        setStudents(data.students || []);
        setError(null);
      } else {
        setError(result.error || 'Failed to fetch class users');
      }
    } catch (err) {
      setError('Error fetching class users');
      console.error('Error fetching class users:', err);
    } finally {
      setLoading(false);
    }
  }, [school.id, classData.id]);

  // Fetch available users for adding
  const fetchAvailableUsers = useCallback(async () => {
    setAvailableUsersLoading(true);
    try {
      const result = await getAvailableUsersForClass(school.id, classData.id);
      if (result.success && result.data) {
        const data = result.data as { teachers: AvailableUser[]; students: AvailableUser[]; totalAvailable: number };
        // Combine teachers and students into a single array
        const allAvailableUsers = [
          ...(data.teachers || []),
          ...(data.students || [])
        ];
        setAvailableUsers(allAvailableUsers);
      } else {
        setError(result.error || 'Failed to fetch available users');
      }
    } catch (error) {
      console.error('Error fetching available users:', error);
      setError('Error fetching available users');
    } finally {
      setAvailableUsersLoading(false);
    }
  }, [school.id, classData.id]);

  // Handle add users
  const handleAddUsers = useCallback(async () => {
    setAddUsersLoading(true);
    try {
      const teacherIds = Array.from(selectedUsers).filter(id => 
        availableUsers.some(user => user.id === id && user.role === SCHOOL_ROLES.TEACHER)
      );
      const studentIds = Array.from(selectedUsers).filter(id => 
        availableUsers.some(user => user.id === id && user.role === SCHOOL_ROLES.STUDENT)
      );

      const result = await assignUsersToClass(school.id, {
        classId: classData.id,
        teacherIds,
        studentIds,
      });

      if (result.success) {
        setSelectedUsers(new Set());
        setIsAddUsersDialogOpen(false);
        await fetchClassUsers();
        await fetchAvailableUsers();
      } else {
        setError(result.error || 'Failed to add users');
      }
    } catch (error) {
      console.error('Error adding users:', error);
      setError('Error adding users');
    } finally {
      setAddUsersLoading(false);
    }
  }, [selectedUsers, availableUsers, school.id, classData.id, fetchClassUsers, fetchAvailableUsers]);

  // Handle remove users - just open the confirmation dialog
  const handleRemoveUsers = useCallback(() => {
    if (selectedCurrentUsers.size === 0) return;
    setIsRemoveDialogOpen(true);
  }, [selectedCurrentUsers.size]);

  // Confirm remove users - actual removal logic
  const confirmRemoveUsers = useCallback(async () => {
    setBulkOperationLoading(true);
    try {
      const result = await removeUsersFromClass(school.id, classData.id, Array.from(selectedCurrentUsers));
      
      if (result.success) {
        setSelectedCurrentUsers(new Set());
        setIsRemoveDialogOpen(false);
        await fetchClassUsers();
      } else {
        setError(result.error || 'Failed to remove users');
      }
    } catch (error) {
      console.error('Error removing users:', error);
      setError('Error removing users');
    } finally {
      setBulkOperationLoading(false);
    }
  }, [selectedCurrentUsers, school.id, classData.id, fetchClassUsers]);

  // Load data on mount
  useEffect(() => {
    fetchClassUsers();
  }, [fetchClassUsers]);

  // Filter and paginate users
  const allUsers = [...teachers, ...students];
  const filteredUsers = allUsers.filter(user => {
    const matchesSearch = !searchTerm || 
      user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.studentId?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  // Filter available users for search and role
  const filteredAvailableUsers = availableUsers.filter(user => {
    const matchesSearch = !availableSearchTerm || 
      user.firstName?.toLowerCase().includes(availableSearchTerm.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(availableSearchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(availableSearchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(availableSearchTerm.toLowerCase());
    
    const matchesRole = availableRoleFilter === 'ALL' || user.role === availableRoleFilter;
    
    return matchesSearch && matchesRole;
  });

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalFilteredPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const getRoleColor = (role: string) => {
    switch (role) {
      case SCHOOL_ROLES.TEACHER:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case SCHOOL_ROLES.STUDENT:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case SCHOOL_ROLES.TEACHER:
        return <Briefcase className="h-4 w-4" />;
      case SCHOOL_ROLES.STUDENT:
        return <GraduationCap className="h-4 w-4" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Link 
              href={`/admin/schools/${school.id}/users`}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to School Management
            </Link>
          </div>
        </div>
        
        <div className="flex items-center gap-3 mb-2">
          <BookOpen className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {classData.name}
          </h1>
          {classData.code && (
            <Badge variant="secondary">{classData.code}</Badge>
          )}
        </div>
        
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
          {classData.subject && (
            <div className="flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              {classData.subject}
            </div>
          )}
          {classData.gradeLevel && (
            <div className="flex items-center gap-1">
              <GraduationCap className="h-3 w-3" />
              {classData.gradeLevel}
            </div>
          )}
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {classData.teacherCount} teachers, {classData.studentCount} students
          </div>
        </div>
        
        {classData.description && (
          <p className="text-gray-600 dark:text-gray-400">{classData.description}</p>
        )}
      </div>

      {/* Controls */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Role Filter */}
            <Select value={roleFilter} onValueChange={(value: 'ALL' | SchoolRole) => setRoleFilter(value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Roles</SelectItem>
                <SelectItem value={SCHOOL_ROLES.TEACHER}>Teachers</SelectItem>
                <SelectItem value={SCHOOL_ROLES.STUDENT}>Students</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-2">
            {selectedCurrentUsers.size > 0 && (
              <Button
                variant="outline"
                onClick={handleRemoveUsers}
                disabled={bulkOperationLoading}
                className="text-red-600 hover:text-red-700"
              >
                {bulkOperationLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Trash2 className="h-4 w-4 mr-2" />
                Remove Selected ({selectedCurrentUsers.size})
              </Button>
            )}
            
            <Button
              onClick={() => {
                setIsAddUsersDialogOpen(true);
                fetchAvailableUsers();
              }}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Users
            </Button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-center gap-2 mb-6">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {/* Users List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : paginatedUsers.length > 0 ? (
          <div className="space-y-4">
            {/* Select All */}
            <div className="flex items-center gap-3 pb-2 border-b">
              <button
                onClick={() => {
                  if (selectedCurrentUsers.size === paginatedUsers.length) {
                    setSelectedCurrentUsers(new Set());
                  } else {
                    setSelectedCurrentUsers(new Set(paginatedUsers.map(u => u.id)));
                  }
                }}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
              >
                {selectedCurrentUsers.size === paginatedUsers.length ? (
                  <CheckSquare className="h-4 w-4" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
                Select All ({paginatedUsers.length})
              </button>
            </div>

            {/* Users Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedUsers.map((user) => (
                <div key={user.id} className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedCurrentUsers.has(user.id)}
                      onChange={(e) => {
                        const newSelected = new Set(selectedCurrentUsers);
                        if (e.target.checked) {
                          newSelected.add(user.id);
                        } else {
                          newSelected.delete(user.id);
                        }
                        setSelectedCurrentUsers(newSelected);
                      }}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      aria-label={`Select ${user.firstName} ${user.lastName}`}
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className={getRoleColor(user.role)}>
                          <div className="flex items-center gap-1">
                            {getRoleIcon(user.role)}
                            {user.role}
                          </div>
                        </Badge>
                      </div>
                      
                      <h3 className="font-medium text-gray-900 dark:text-white truncate">
                        {user.firstName} {user.lastName}
                      </h3>
                      
                      <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <UserCheck className="h-3 w-3" />
                          {user.username}
                        </div>
                        
                        {user.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {user.email}
                          </div>
                        )}
                        
                        {user.studentId && (
                          <div className="flex items-center gap-1">
                            <Badge variant="outline" className="text-xs">
                              ID: {user.studentId}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No users found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {searchTerm || roleFilter !== 'ALL' 
                ? 'Try adjusting your search or filters' 
                : 'This class has no users assigned yet'}
            </p>
            {!searchTerm && roleFilter === 'ALL' && (
              <Button onClick={() => {
                setIsAddUsersDialogOpen(true);
                fetchAvailableUsers();
              }}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add First Users
              </Button>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalFilteredPages > 1 && (
          <div className="flex items-center justify-center space-x-2 mt-6 pt-6 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Page {currentPage} of {totalFilteredPages} ({filteredUsers.length} users)
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalFilteredPages, prev + 1))}
              disabled={currentPage === totalFilteredPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>

      {/* Add Users Dialog */}
      <Dialog open={isAddUsersDialogOpen} onOpenChange={(open) => {
        setIsAddUsersDialogOpen(open);
        if (!open) {
          setSelectedUsers(new Set());
          setAvailableSearchTerm('');
          setAvailableRoleFilter('ALL');
          setAvailableUsers([]);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Users to {classData.name}</DialogTitle>
          </DialogHeader>
          
          {availableUsersLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Search and Filter Controls */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search available users..."
                    value={availableSearchTerm}
                    onChange={(e) => setAvailableSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={availableRoleFilter} onValueChange={(value: 'ALL' | SchoolRole) => setAvailableRoleFilter(value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Roles</SelectItem>
                    <SelectItem value={SCHOOL_ROLES.TEACHER}>Teachers</SelectItem>
                    <SelectItem value={SCHOOL_ROLES.STUDENT}>Students</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Users List */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Available Users ({filteredAvailableUsers.length})
                </h3>
                {filteredAvailableUsers.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto border rounded-lg p-4">
                    {filteredAvailableUsers.map((user) => (
                      <div key={user.id} className="flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded border">
                        <input
                          type="checkbox"
                          id={`user-${user.id}`}
                          checked={selectedUsers.has(user.id)}
                          onChange={(e) => {
                            const newSelected = new Set(selectedUsers);
                            if (e.target.checked) {
                              newSelected.add(user.id);
                            } else {
                              newSelected.delete(user.id);
                            }
                            setSelectedUsers(newSelected);
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          aria-label={`Select ${user.role.toLowerCase()} ${user.firstName} ${user.lastName}`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary" className={getRoleColor(user.role)}>
                              <div className="flex items-center gap-1">
                                {getRoleIcon(user.role)}
                                {user.role}
                              </div>
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {user.firstName} {user.lastName}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {user.username}
                            </Badge>
                          </div>
                          
                          <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                            <p>{user.email}</p>
                            {user.studentId && (
                              <div className="flex items-center gap-1">
                                <Badge variant="outline" className="text-xs">
                                  ID: {user.studentId}
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                    {availableSearchTerm || availableRoleFilter !== 'ALL' 
                      ? 'No users match your search criteria' 
                      : 'No available users to assign'}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  onClick={handleAddUsers}
                  disabled={addUsersLoading || selectedUsers.size === 0}
                  className="flex-1"
                >
                  {addUsersLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Add Selected Users ({selectedUsers.size})
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsAddUsersDialogOpen(false)}
                  disabled={addUsersLoading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Remove Users Confirmation Dialog */}
      <Dialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Remove Users
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Are you sure you want to remove <strong>{selectedCurrentUsers.size}</strong> user{selectedCurrentUsers.size !== 1 ? 's' : ''} from this class?
            </p>
            
            <p className="text-sm text-gray-500 dark:text-gray-400">
              This action will remove their access to this class but will not delete their accounts.
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsRemoveDialogOpen(false)}
              disabled={bulkOperationLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmRemoveUsers}
              disabled={bulkOperationLoading}
              className="flex-1"
            >
              {bulkOperationLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Remove Users
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 