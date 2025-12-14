'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, Search, Users, 
  BookOpen, GraduationCap, AlertCircle, UserCheck, Trash2,
  Download, Upload, Key, Mail
} from 'lucide-react';

import { SCHOOL_ROLES } from '@/lib/constants';
import type { SchoolUsersManagementProps } from './types';
import { useUserManagement } from './hooks/useUserManagement';
import { useClassManagement } from './hooks/useClassManagement';
import { useBulkImport } from './hooks/useBulkImport';
import BulkImportDialog from './components/BulkImportDialog';
import UserFormDialog from './components/UserFormDialog';
import ClassFormDialog from './components/ClassFormDialog';
import UsersList from './components/UsersList';
import ClassesList from './components/ClassesList';
import StatsCards from './components/StatsCards';
import PasswordResetDialog from './components/PasswordResetDialog';

export default function SchoolUsersManagement({ school }: SchoolUsersManagementProps) {
  // Translations
  const t = useTranslations('admin.bulkUserManagement');
  
  // Tab state
  const [activeTab, setActiveTab] = useState('users');

  // Use custom hooks for state management
  const userManagement = useUserManagement(school.id);
  const classManagement = useClassManagement(school.id);
  const bulkImport = useBulkImport(school.id, school.code);

  // Note: Initial data loading is handled by the hooks themselves
  // No useEffect needed here as hooks manage their own lifecycle

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {t('title')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {t('description', { schoolName: school.name })}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {t('tabs.users')} ({school._count.members})
          </TabsTrigger>
          <TabsTrigger value="classes" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            {t('tabs.classes')}
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          {/* User Search and Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder={t('users.searchPlaceholder')}
                  value={userManagement.userSearchTerm}
                  onChange={(e) => userManagement.setUserSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && userManagement.handleUserSearch()}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={userManagement.handleUserSearch} variant="outline">
                <Search className="h-4 w-4 mr-2" />
                {t('users.search')}
              </Button>
              
              <Button onClick={bulkImport.handleDownloadTemplate} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                {t('users.template')}
              </Button>
              
              <Button onClick={bulkImport.openBulkImport} variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                {t('users.bulkImport')}
              </Button>
              
              <BulkImportDialog
                bulkImport={bulkImport.bulkImport}
                setBulkImport={bulkImport.setBulkImport}
                showCloseWarning={bulkImport.showCloseWarning}
                setShowCloseWarning={bulkImport.setShowCloseWarning}
                isDragOver={bulkImport.isDragOver}
                onDownloadTemplate={bulkImport.handleDownloadTemplate}
                onFileUpload={bulkImport.handleFileUpload}
                onDragOver={bulkImport.handleDragOver}
                onDragEnter={bulkImport.handleDragEnter}
                onDragLeave={bulkImport.handleDragLeave}
                onDrop={bulkImport.handleDrop}
                onBulkImport={bulkImport.handleBulkImport}
                onDownloadResults={bulkImport.handleDownloadResults}
                onResetBulkImport={bulkImport.resetBulkImport}
                onForceCloseBulkImport={bulkImport.forceCloseBulkImport}
              />
              
              <UserFormDialog
                isOpen={userManagement.isAddUserDialogOpen}
                onOpenChange={userManagement.setIsAddUserDialogOpen}
                formData={userManagement.userFormData}
                setFormData={userManagement.setUserFormData}
                onSubmit={userManagement.handleCreateUser}
                onReset={userManagement.resetUserForm}
                loading={userManagement.createUserLoading}
                schoolName={school.name}
                triggerButton={
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('users.addUser')}
                  </Button>
                }
              />
              
              <Link href={`/admin/schools/${school.id}/invitations`}>
                <Button variant="outline" className="border-[#174F7F] text-[#174F7F] hover:bg-[#174F7F] hover:text-white">
                  <Mail className="h-4 w-4 mr-2" />
                  {t('users.inviteExternal')}
                </Button>
              </Link>
            </div>
          </div>

          {/* User Error */}
          {userManagement.userError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {userManagement.userError}
            </div>
          )}

          {/* Bulk Actions Bar */}
          {userManagement.selectedUsers.size > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    {userManagement.selectedUsers.size} user{userManagement.selectedUsers.size !== 1 ? 's' : ''} selected
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => userManagement.executeBulkRoleChange(SCHOOL_ROLES.TEACHER)}
                    disabled={userManagement.bulkOperationLoading}
                  >
                    <UserCheck className="h-4 w-4 mr-1" />
                    Make Teachers
                  </Button>

                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => userManagement.executeBulkRoleChange(SCHOOL_ROLES.STUDENT)}
                    disabled={userManagement.bulkOperationLoading}
                  >
                    <GraduationCap className="h-4 w-4 mr-1" />
                    Make Students
                  </Button>

                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={userManagement.handleBulkPasswordReset}
                    disabled={userManagement.bulkOperationLoading}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Key className="h-4 w-4 mr-1" />
                    Reset Passwords
                  </Button>

                  <Button variant="outline" size="sm" onClick={userManagement.selectAllUsers}>
                    <Trash2 className="h-4 w-4 mr-1" />
                    Clear Selection
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Stats */}
          <StatsCards 
            totalMembers={school._count.members}
            users={userManagement.users}
          />

          {/* Users List */}
          <UsersList
            users={userManagement.users}
            loading={userManagement.userLoading}
            selectedUsers={userManagement.selectedUsers}
            searchTerm={userManagement.userSearchTerm}
            onToggleSelection={userManagement.toggleUserSelection}
            onSelectAll={userManagement.selectAllUsers}
            onEditUser={userManagement.handleEditUser}
            onRoleChange={userManagement.handleRoleChange}
            onResetPassword={userManagement.handleResetPassword}
            onAddUser={() => userManagement.setIsAddUserDialogOpen(true)}
            schoolEmail={school.email || undefined}
          />

          {/* User Pagination */}
          {userManagement.userTotalPages > 1 && (
            <div className="flex items-center justify-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => userManagement.setUserCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={userManagement.userCurrentPage === 1}
              >
                Previous
              </Button>
              
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Page {userManagement.userCurrentPage} of {userManagement.userTotalPages}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => userManagement.setUserCurrentPage(prev => Math.min(userManagement.userTotalPages, prev + 1))}
                disabled={userManagement.userCurrentPage === userManagement.userTotalPages}
              >
                Next
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Classes Tab */}
        <TabsContent value="classes" className="space-y-6">
          {/* Class Search and Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search classes..."
                  value={classManagement.classSearchTerm}
                  onChange={(e) => classManagement.setClassSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && classManagement.handleClassSearch()}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={classManagement.handleClassSearch} variant="outline">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
              
              <ClassFormDialog
                isOpen={classManagement.isAddClassDialogOpen}
                onOpenChange={classManagement.setIsAddClassDialogOpen}
                formData={classManagement.classFormData}
                setFormData={classManagement.setClassFormData}
                onSubmit={classManagement.handleCreateClass}
                onReset={classManagement.resetClassForm}
                loading={classManagement.createClassLoading}
                triggerButton={
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Class
                  </Button>
                }
              />
            </div>
          </div>

          {/* Class Error */}
          {classManagement.classError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {classManagement.classError}
            </div>
          )}

          {/* Classes List */}
          <ClassesList
            classes={classManagement.classes}
            loading={classManagement.classLoading}
            searchTerm={classManagement.classSearchTerm}
            onEditClass={classManagement.handleEditClass}
            onDeleteClass={classManagement.handleDeleteClass}
            onAddClass={() => classManagement.setIsAddClassDialogOpen(true)}
            schoolId={school.id}
          />

          {/* Class Pagination */}
          {classManagement.classTotalPages > 1 && (
            <div className="flex items-center justify-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => classManagement.setClassCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={classManagement.classCurrentPage === 1}
              >
                Previous
              </Button>
              
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Page {classManagement.classCurrentPage} of {classManagement.classTotalPages}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => classManagement.setClassCurrentPage(prev => Math.min(classManagement.classTotalPages, prev + 1))}
                disabled={classManagement.classCurrentPage === classManagement.classTotalPages}
              >
                Next
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit User Dialog */}
      <UserFormDialog
        isOpen={userManagement.isEditUserDialogOpen}
        onOpenChange={userManagement.setIsEditUserDialogOpen}
        isEdit={true}
        editingUser={userManagement.editingUser || undefined}
        formData={userManagement.userFormData}
        setFormData={userManagement.setUserFormData}
        onSubmit={userManagement.handleUpdateUser}
        onReset={() => {
          userManagement.setEditingUser(null);
          userManagement.resetUserForm();
        }}
        loading={userManagement.createUserLoading}
        schoolName={school.name}
      />

      {/* Edit Class Dialog */}
      <ClassFormDialog
        isOpen={classManagement.isEditClassDialogOpen}
        onOpenChange={(open) => {
          classManagement.setIsEditClassDialogOpen(open);
          if (!open) {
            classManagement.setEditingClass(null);
            classManagement.resetClassForm();
          }
        }}
        isEdit={true}
                 editingClass={classManagement.editingClass || undefined}
        formData={classManagement.classFormData}
        setFormData={classManagement.setClassFormData}
        onSubmit={classManagement.handleUpdateClass}
        onReset={() => {
          classManagement.setEditingClass(null);
          classManagement.resetClassForm();
        }}
        loading={classManagement.updateClassLoading}
      />

      {/* Password Reset Dialogs */}
      <PasswordResetDialog
        isOpen={userManagement.isPasswordResetDialogOpen}
        onOpenChange={userManagement.setIsPasswordResetDialogOpen}
        schoolId={school.id}
        user={userManagement.resetPasswordUser || undefined}
        onSuccess={userManagement.handlePasswordResetSuccess}
      />

      <PasswordResetDialog
        isOpen={userManagement.isBulkPasswordResetDialogOpen}
        onOpenChange={userManagement.setIsBulkPasswordResetDialogOpen}
        schoolId={school.id}
        selectedUsers={userManagement.selectedUsers.size > 0 ? userManagement.users.filter(u => userManagement.selectedUsers.has(u.id)) : undefined}
        onSuccess={userManagement.handlePasswordResetSuccess}
      />
    </div>
  );
} 