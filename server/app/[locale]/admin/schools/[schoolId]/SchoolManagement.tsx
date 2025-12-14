'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Building, Users, BookOpen, Settings, Save, Edit, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface School {
  id: string;
  name: string;
  code: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    members: number;
    classes: number;
  };
}

interface SchoolManagementProps {
  school: School;
}

export default function SchoolManagement({ school }: SchoolManagementProps) {
  // Get translations
  const admin = useTranslations('admin');
  const common = useTranslations('common');
  
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [usageLoading, setUsageLoading] = useState(false);
  const [usageError, setUsageError] = useState<string | null>(null);
  const [usageSummary, setUsageSummary] = useState<Array<{ feature: string; totalCost: number; count: number }>>([]);
  const [usageRecent, setUsageRecent] = useState<Array<{ id: string; feature: string; cost: number; metadata?: string; createdAt: string; user: { id: string; name: string } }>>([]);
  const [dateStart, setDateStart] = useState<string>(() => new Date(Date.now() - 30*24*60*60*1000).toISOString().slice(0,10));
  const [dateEnd, setDateEnd] = useState<string>(() => new Date().toISOString().slice(0,10));
  const [formData, setFormData] = useState({
    name: school.name,
    code: school.code || '',
    address: school.address || '',
    phone: school.phone || '',
    email: school.email || '',
    website: school.website || '',
    isActive: school.isActive,
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/schools/${school.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update school');
      }

      setIsEditing(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update school');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: school.name,
      code: school.code || '',
      address: school.address || '',
      phone: school.phone || '',
      email: school.email || '',
      website: school.website || '',
      isActive: school.isActive,
    });
    setIsEditing(false);
    setError(null);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Building className="h-8 w-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              {admin('school.management.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {admin('school.management.description')}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            school.isActive 
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          }`}>
            {school.isActive ? common('status.active') : common('status.inactive')}
          </span>
          
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              {admin('school.management.editSchool')}
            </Button>
          ) : (
            <div className="flex space-x-2">
              <Button onClick={handleSave} disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? common('saving') : common('save')}
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                {common('cancel')}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: common('overview') },
            { id: 'details', label: common('details') },
            { id: 'settings', label: common('settings') },
            { id: 'usage', label: 'Usage' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{admin('school.management.totalMembers')}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{school._count.members}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{common('classes')}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{school._count.classes}</p>
                  </div>
                  <BookOpen className="h-8 w-8 text-blue-600" />
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{common('status.label')}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {school.isActive ? common('status.active') : common('status.inactive')}
                    </p>
                  </div>
                  <Settings className="h-8 w-8 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">{common('quickActions')}</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{admin('school.management.commonTasks')}</p>
              <div className="flex flex-wrap gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => router.push(`/admin/schools/${school.id}/users`)}
                >
                  <Users className="h-4 w-4 mr-2" />
                  {admin('school.management.manageUsers')}
                </Button>

              </div>
            </div>
          </div>
        )}

        {activeTab === 'details' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">{admin('school.management.schoolInfo')}</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{admin('school.management.basicInfo')}</p>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{admin('schools.form.name')}</Label>
                  {isEditing ? (
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder={admin('schools.form.namePlaceholder')}
                    />
                  ) : (
                    <p className="text-sm text-gray-900 dark:text-white">{school.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="code">{admin('schools.form.code')}</Label>
                  {isEditing ? (
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => handleInputChange('code', e.target.value)}
                      placeholder={admin('schools.form.codePlaceholder')}
                    />
                  ) : (
                    <p className="text-sm text-gray-900 dark:text-white">{school.code}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">{admin('schools.form.email')}</Label>
                  {isEditing ? (
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder={admin('schools.form.emailPlaceholder')}
                    />
                  ) : (
                    <p className="text-sm text-gray-900 dark:text-white">{school.email || common('notProvided')}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">{admin('schools.form.phone')}</Label>
                  {isEditing ? (
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder={admin('schools.form.phonePlaceholder')}
                    />
                  ) : (
                    <p className="text-sm text-gray-900 dark:text-white">{school.phone || common('notProvided')}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">{admin('schools.form.website')}</Label>
                  {isEditing ? (
                    <Input
                      id="website"
                      value={formData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      placeholder={admin('schools.form.websitePlaceholder')}
                    />
                  ) : (
                    <p className="text-sm text-gray-900 dark:text-white">{school.website || common('notProvided')}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">{admin('schools.form.address')}</Label>
                {isEditing ? (
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder={admin('schools.form.addressPlaceholder')}
                    rows={3}
                  />
                ) : (
                  <p className="text-sm text-gray-900 dark:text-white">{school.address || common('notProvided')}</p>
                )}
              </div>

              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  {admin('school.management.schoolInfo')}
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">{common('created')}:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">
                      {formatDate(school.createdAt)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">{common('lastUpdated')}:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">
                      {formatDate(school.updatedAt)}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-600 dark:text-gray-400">{admin('school.management.schoolId')}:</span>
                    <span className="ml-2 text-gray-900 dark:text-white font-mono text-xs">
                      {school.id}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">School Settings</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Configure school status and other settings</p>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="isActive">School Status</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Control whether this school is active or inactive
                  </p>
                </div>
                {isEditing ? (
                  <Button
                    variant={formData.isActive ? 'default' : 'outline'}
                    onClick={() => handleInputChange('isActive', !formData.isActive)}
                  >
                    {formData.isActive ? 'Active' : 'Inactive'}
                  </Button>
                ) : (
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    school.isActive 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {school.isActive ? 'Active' : 'Inactive'}
                  </span>
                )}
              </div>

              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  School Information
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Created:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">
                      {formatDate(school.createdAt)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Last Updated:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">
                      {formatDate(school.updatedAt)}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-600 dark:text-gray-400">School ID:</span>
                    <span className="ml-2 text-gray-900 dark:text-white font-mono text-xs">
                      {school.id}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'usage' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-6">
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <Label htmlFor="start-date">Start date</Label>
                <Input id="start-date" type="date" value={dateStart} onChange={(e) => setDateStart(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="end-date">End date</Label>
                <Input id="end-date" type="date" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} />
              </div>
              <div className="pt-6">
                <Button onClick={async () => {
                  try {
                    setUsageLoading(true);
                    setUsageError(null);
                    const params = new URLSearchParams({ start: `${dateStart}T00:00:00.000Z`, end: `${dateEnd}T23:59:59.999Z` });
                    const res = await fetch(`/api/schools/${school.id}/usage?` + params.toString());
                    const json = await res.json();
                    if (!json.success) throw new Error(json.error || 'Failed to fetch usage');
                    setUsageSummary(json.data.summary);
                    setUsageRecent(json.data.recent);
                  } catch (err) {
                    setUsageError(err instanceof Error ? err.message : 'Failed to fetch usage');
                  } finally {
                    setUsageLoading(false);
                  }
                }}>Load</Button>
              </div>
            </div>

            {usageError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{usageError}</div>
            )}

            {/* Summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {usageSummary.map((s) => (
                <div key={s.feature} className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400">{s.feature}</div>
                  <div className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{s.totalCost}</div>
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">entries: {s.count}</div>
                </div>
              ))}
            </div>

            {/* Recent usage table */}
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-gray-200 dark:border-gray-700">
                    <th className="py-2 pr-4">Date</th>
                    <th className="py-2 pr-4">Feature</th>
                    <th className="py-2 pr-4">Cost</th>
                    <th className="py-2 pr-4">User</th>
                  </tr>
                </thead>
                <tbody>
                  {usageLoading ? (
                    <tr><td colSpan={4} className="py-6 text-center text-gray-500">Loading...</td></tr>
                  ) : usageRecent.length === 0 ? (
                    <tr><td colSpan={4} className="py-6 text-center text-gray-500">No usage in range</td></tr>
                  ) : (
                    usageRecent.map((r) => (
                      <tr key={r.id} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="py-2 pr-4">{new Date(r.createdAt).toLocaleString()}</td>
                        <td className="py-2 pr-4">{r.feature}</td>
                        <td className="py-2 pr-4">{r.cost}</td>
                        <td className="py-2 pr-4">{r.user.name}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 