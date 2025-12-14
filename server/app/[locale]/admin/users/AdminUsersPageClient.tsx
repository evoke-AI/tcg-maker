'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Shield, User, Settings, Briefcase, GraduationCap } from 'lucide-react';
import { SYSTEM_ROLES, SCHOOL_ROLES } from '@/lib/constants';
import CreateUserForm from './CreateUserForm';
import UserActions from './UserActions';
import { getUsers } from '@/app/actions/admin/read';
import { User as UserType } from '@/app/actions/admin/types';

// Helper function to get status badge class
const getStatusBadgeClass = (status: 'active' | 'inactive' | 'pending') => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'inactive':
      return 'bg-red-100 text-red-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

interface UsersData {
  users: UserType[];
  total: number;
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Utility functions for system role badges
const getSystemRoleColor = (role: string) => {
  switch (role) {
    case SYSTEM_ROLES.SUPER_ADMIN:
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
};

const getSystemRoleIcon = (role: string) => {
  switch (role) {
    case SYSTEM_ROLES.SUPER_ADMIN:
      return <Shield className="h-4 w-4" />;
    default:
      return <User className="h-4 w-4" />;
  }
};

const getSystemRoleDisplayName = (role: string) => {
  switch (role) {
    case SYSTEM_ROLES.SUPER_ADMIN:
      return 'Super Admin';
    default:
      return 'Regular User';
  }
};

// Utility functions for school role badges
const getSchoolRoleColor = (role: string) => {
  switch (role) {
    case SCHOOL_ROLES.ADMIN:
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    case SCHOOL_ROLES.TEACHER:
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case SCHOOL_ROLES.STUDENT:
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
};

const getSchoolRoleIcon = (role: string) => {
  switch (role) {
    case SCHOOL_ROLES.ADMIN:
      return <Settings className="h-3 w-3" />;
    case SCHOOL_ROLES.TEACHER:
      return <Briefcase className="h-3 w-3" />;
    case SCHOOL_ROLES.STUDENT:
      return <GraduationCap className="h-3 w-3" />;
    default:
      return <Settings className="h-3 w-3" />;
  }
};

export default function AdminUsersPageClient() {
  const t = useTranslations('admin');
  const common = useTranslations('common');

  // State management
  const [usersData, setUsersData] = useState<UsersData>({
    users: [],
    total: 0,
    pagination: { page: 1, limit: 20, totalPages: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter and search state
  const [searchTerm, setSearchTerm] = useState('');
  const [systemRole, setSystemRole] = useState('SUPER_ADMIN'); // Default to SUPER_ADMIN filter
  const [status, setStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch users function
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getUsers({
        page: currentPage,
        limit: 20,
        searchTerm: searchTerm.trim(),
        systemRole,
        status,
        sortBy: 'email',
        sortOrder: 'asc'
      });

      if (result.success && result.data) {
        setUsersData(result.data);
      } else {
        setError('Failed to fetch users');
      }
    } catch (err) {
      console.error('Fetch users error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, systemRole, status]);

  // Effect to fetch users when filters change
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Reset to page 1 when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [searchTerm, systemRole, status, currentPage]);

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setSystemRole('SUPER_ADMIN'); // Reset to default SUPER_ADMIN filter
    setStatus('');
    setCurrentPage(1);
  };

  // Pagination handlers
  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < usersData.pagination.totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const totalPages = usersData.pagination.totalPages;
    const current = currentPage;
    const pages: (number | string)[] = [];

    if (totalPages <= 7) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (current <= 4) {
        // Show first 5 pages + ellipsis + last page
        for (let i = 2; i <= 5; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (current >= totalPages - 3) {
        // Show first page + ellipsis + last 5 pages
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Show first page + ellipsis + current-1, current, current+1 + ellipsis + last page
        pages.push('...');
        for (let i = current - 1; i <= current + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('users.title')}</h1>
        <p className="text-gray-600">
          {t('users.description')} Focus on managing Super Admin users who can create and manage schools.
        </p>
      </div>

      {/* Users List */}
      <div className="bg-white shadow rounded-lg">
        {/* Header with search and filters */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-lg font-medium text-gray-900">
              {t('users.list')} ({usersData.total} {usersData.total === 1 ? 'user' : 'users'})
            </h2>
            
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              {/* Search Input */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* Role Filter */}
              <select
                value={systemRole}
                onChange={(e) => setSystemRole(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                aria-label="Filter by role"
              >
                <option value="">All Roles</option>
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="USER">Regular User</option>
              </select>

              {/* Status Filter */}
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                aria-label="Filter by status"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="inactive">Inactive</option>
              </select>

              {/* Clear Filters */}
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Clear
              </button>

              {/* Add User Button */}
              <CreateUserForm onUserCreated={fetchUsers} />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6 text-center">
              <div className="inline-flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {common('loading')}...
              </div>
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <p className="text-red-500">{common('errors.fetch')}: {error}</p>
              <button
                onClick={fetchUsers}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('users.table.name')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Username
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('users.table.email')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {common('roles.systemRoleLabel')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('users.table.status')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('users.table.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {usersData.users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      {searchTerm || systemRole || status ? (
                        <div>
                          <p>No users found matching your filters.</p>
                          <button
                            onClick={clearFilters}
                            className="mt-2 text-blue-600 hover:text-blue-800"
                          >
                            Clear filters to see all users
                          </button>
                        </div>
                      ) : (
                        common('no_data')
                      )}
                    </td>
                  </tr>
                ) : (
                  usersData.users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <div>
                          <div className="font-medium text-gray-900">{user.name}</div>
                          {user.schools && user.schools.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {user.schools.map((school, index) => (
                                <div key={index} className="flex items-center gap-2">
                                  <span className="text-xs text-gray-500">{school.name}</span>
                                  <Badge variant="secondary" className={getSchoolRoleColor(school.role)}>
                                    <div className="flex items-center gap-1">
                                      {getSchoolRoleIcon(school.role)}
                                      {school.role}
                                    </div>
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="font-mono text-sm">{user.username || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>
                          <div className="text-gray-900">{user.email}</div>
                          {user.schools && user.schools.length > 0 && (
                            <div className="text-xs text-gray-500 mt-1">
                              {user.schools.map((school, index) => (
                                <div key={index}>
                                  School: {school.email}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <Badge variant="secondary" className={getSystemRoleColor(user.systemRoleName || '')}>
                          <div className="flex items-center gap-1">
                            {getSystemRoleIcon(user.systemRoleName || '')}
                            {getSystemRoleDisplayName(user.systemRoleName || '')}
                          </div>
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(user.status)}`}>
                          {common(`status.${user.status}`)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <UserActions user={user} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {usersData.pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((currentPage - 1) * usersData.pagination.limit) + 1} to{' '}
                {Math.min(currentPage * usersData.pagination.limit, usersData.total)} of{' '}
                {usersData.total} results
              </div>
              
              <div className="flex items-center space-x-2">
                {/* Previous button */}
                <button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>

                {/* Page numbers */}
                <div className="flex space-x-1">
                  {getPageNumbers().map((page, index) => (
                    <button
                      key={index}
                      onClick={() => typeof page === 'number' ? goToPage(page) : undefined}
                      disabled={typeof page !== 'number'}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        page === currentPage
                          ? 'bg-blue-600 text-white'
                          : typeof page === 'number'
                          ? 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                          : 'text-gray-400 cursor-default'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                {/* Next button */}
                <button
                  onClick={goToNextPage}
                  disabled={currentPage === usersData.pagination.totalPages}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 