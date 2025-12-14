'use client';

import React from 'react';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, Mail, Edit, CheckSquare, Square, Plus, Loader2, Key
} from 'lucide-react';
import { SCHOOL_ROLES } from '@/lib/constants';
import { formatDate, getRoleColor, getRoleIcon, getRoleName, extractSchoolDomain } from '../utils';
import type { SchoolUser } from '../types';

interface UsersListProps {
  users: SchoolUser[];
  loading: boolean;
  selectedUsers: Set<string>;
  searchTerm: string;
  onToggleSelection: (userId: string) => void;
  onSelectAll: () => void;
  onEditUser: (user: SchoolUser) => void;
  onRoleChange: (userId: string, newRole: string) => void;
  onResetPassword: (user: SchoolUser) => void;
  onAddUser: () => void;
  schoolEmail?: string;
}

export default function UsersList({
  users,
  loading,
  selectedUsers,
  searchTerm,
  onToggleSelection,
  onSelectAll,
  onEditUser,
  onRoleChange,
  onResetPassword,
  onAddUser,
  schoolEmail
}: UsersListProps) {
  const t = useTranslations('admin.bulkUserManagement');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No users found
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          {searchTerm ? 'Try adjusting your search' : 'Get started by adding users'}
        </p>
        {!searchTerm && (
          <Button onClick={onAddUser}>
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Users</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={onSelectAll}
          >
            {selectedUsers.size === users.length ? (
              <CheckSquare className="h-4 w-4 mr-1" />
            ) : (
              <Square className="h-4 w-4 mr-1" />
            )}
            Select All
          </Button>
        </div>
      </div>
      
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {users.map((user) => (
          <div key={user.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Selection Checkbox */}
                <button
                  onClick={() => onToggleSelection(user.id)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {selectedUsers.has(user.id) ? (
                    <CheckSquare className="h-5 w-5 text-blue-600" />
                  ) : (
                    <Square className="h-5 w-5" />
                  )}
                </button>

                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    {getRoleIcon(user.role)}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {user.firstName && user.lastName
                        ? `${user.lastName} ${user.firstName}`
                        : user.username}
                    </p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                      {getRoleName(user.role, t)}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.isActive
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-1" />
                      {user.username}@{schoolEmail ? extractSchoolDomain(schoolEmail) : 'school.edu'}
                    </div>
                    {user.studentId && (
                      <div>ID: {user.studentId}</div>
                    )}
                    {user.gradeLevel && (
                      <div>Grade: {user.gradeLevel}</div>
                    )}
                  </div>
                  
                  <div className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                    Joined: {formatDate(user.joinedAt)}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={() => onEditUser(user)}>
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => onResetPassword(user)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Key className="h-4 w-4 mr-1" />
                  Reset
                </Button>
                
                <Select 
                  value={user.role} 
                  onValueChange={(newRole) => onRoleChange(user.id, newRole)}
                >
                  <SelectTrigger className="w-32 h-8">
                    <SelectValue placeholder="Change role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SCHOOL_ROLES.STUDENT}>Student</SelectItem>
                    <SelectItem value={SCHOOL_ROLES.TEACHER}>Teacher</SelectItem>
                    <SelectItem value={SCHOOL_ROLES.ADMIN}>Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 