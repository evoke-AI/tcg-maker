'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Search, Building, Users, BookOpen } from 'lucide-react';
import CreateSchoolForm from './CreateSchoolForm';
import { useTranslations } from 'next-intl';

interface School {
  id: string;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    members: number;
    classes: number;
  };
}

interface SchoolsResponse {
  success: boolean;
  data: {
    schools: School[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export default function SchoolsManagement() {
  // Get translations
  const admin = useTranslations('admin');
  const common = useTranslations('common');
  
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [usageMap, setUsageMap] = useState<Record<string, number>>({});
  const [usageLoading, setUsageLoading] = useState(false);
  const [usageError, setUsageError] = useState<string | null>(null);

  // Memoize fetchSchools to prevent infinite loops
  const fetchSchools = useCallback(async (page = 1, search = '') => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '9',
        ...(search && { search }),
      });

      const response = await fetch(`/api/schools?${params}`);
      const data: SchoolsResponse = await response.json();

      if (data.success) {
        setSchools(data.data.schools);
        setTotalPages(data.data.pagination.pages);
        setCurrentPage(data.data.pagination.page);
        setError(null);
      } else {
        setError(common('errors.fetch'));
      }
    } catch (err) {
      setError(common('error'));
      console.error('Error fetching schools:', err);
    } finally {
      setLoading(false);
    }
  }, [common]);

  useEffect(() => {
    fetchSchools(currentPage, searchTerm);
  }, [currentPage, searchTerm, fetchSchools]);

  // Fetch usage summary across all schools (last 30 days by default)
  useEffect(() => {
    (async () => {
      try {
        setUsageLoading(true);
        setUsageError(null);
        const now = new Date();
        const start = new Date(now.getTime() - 30*24*60*60*1000);
        const params = new URLSearchParams({ start: start.toISOString(), end: now.toISOString() });
        const res = await fetch(`/api/schools/usage/summary?` + params.toString());
        const json = await res.json();
        if (!json.success) throw new Error(json.error || 'Failed to fetch usage');
        const map: Record<string, number> = {};
        for (const row of json.data as Array<{ schoolId: string; used: number }>) {
          map[row.schoolId] = row.used || 0;
        }
        setUsageMap(map);
      } catch (err) {
        setUsageError(err instanceof Error ? err.message : 'Failed to fetch usage');
      } finally {
        setUsageLoading(false);
      }
    })();
  }, []);

  const handleSearch = useCallback(() => {
    setCurrentPage(1);
    fetchSchools(1, searchTerm);
  }, [searchTerm, fetchSchools]);

  const handleSchoolCreated = useCallback(() => {
    setIsCreateDialogOpen(false);
    fetchSchools(currentPage, searchTerm);
  }, [currentPage, searchTerm, fetchSchools]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading && schools.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder={admin('schools.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex gap-2 items-center">
          {usageLoading && <span className="text-xs text-gray-500">Loading usage…</span>}
          {usageError && <span className="text-xs text-red-600">{usageError}</span>}
          <Button onClick={handleSearch} variant="outline">
            <Search className="h-4 w-4 mr-2" />
            {common('search')}
          </Button>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {admin('schools.createSchool')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{admin('schools.createSchool')}</DialogTitle>
              </DialogHeader>
              <CreateSchoolForm onSuccess={handleSchoolCreated} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Schools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {schools.map((school) => (
          <div
            key={school.id}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <Building className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                    {school.name}
                  </h3>
                  {school.code && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {admin('schools.form.code')}: {school.code}
                    </p>
                  )}
                </div>
              </div>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  school.isActive
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}
              >
                {school.isActive ? common('status.active') : common('status.inactive')}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              {school.address && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  📍 {school.address}
                </p>
              )}
              {school.email && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  ✉️ {school.email}
                </p>
              )}
              {school.phone && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  📞 {school.phone}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                {school._count.members} {common('members')}
              </div>
              <div className="flex items-center">
                <BookOpen className="h-4 w-4 mr-1" />
                {school._count.classes} {common('classes')}
              </div>
            </div>

            <div className="text-xs text-gray-400 dark:text-gray-500">
              {common('created')}: {formatDate(school.createdAt)}
            </div>

            {/* Usage bar */}
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                <span>Usage (last 30 days)</span>
                <span>
                  {Math.min(usageMap[school.id] || 0, 3000)} / 3000
                </span>
              </div>
              <div className="w-full h-2 rounded bg-gray-200 dark:bg-gray-700 overflow-hidden">
                <div
                  className={`${((usageMap[school.id] || 0) / 3000) > 0.85 ? 'bg-red-500' : ((usageMap[school.id] || 0) / 3000) > 0.6 ? 'bg-yellow-500' : 'bg-green-500'}`}
                  style={{ width: `${Math.min(((usageMap[school.id] || 0) / 3000) * 100, 100)}%`, height: '0.5rem' }}
                />
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => window.open(`/admin/schools/${school.id}`, '_blank')}
              >
                {common('manage')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => window.open(`/admin/schools/${school.id}/users`, '_blank')}
              >
                {common('users')}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {schools.length === 0 && !loading && (
        <div className="text-center py-12">
          <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {admin('schools.noSchools')}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {searchTerm ? admin('schoolUsers.tryAdjustingSearch') : admin('schools.createFirst')}
          </p>
          {!searchTerm && (
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {admin('schools.createSchool')}
            </Button>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            {common('previous')}
          </Button>
          
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {common('page')} {currentPage} {common('of')} {totalPages}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            {common('next')}
          </Button>
        </div>
      )}
    </div>
  );
}
