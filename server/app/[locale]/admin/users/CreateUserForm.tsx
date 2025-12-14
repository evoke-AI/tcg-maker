'use client';

import { useState, FormEvent, ChangeEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { createSystemUser } from '@/app/actions/admin/create';
import { getSystemRoles } from '@/app/actions/admin/read';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface FormDataState {
  name?: string;
  username: string;
  email: string;
  password: string;
  systemRoleId: string | null;
}

interface SystemRole {
  id: string;
  name: string;
}

interface ValidationError {
  field: string;
  message: string;
}

interface CreateUserFormProps {
  onUserCreated?: () => void | Promise<void>;
}

export default function CreateUserForm({ onUserCreated }: CreateUserFormProps = {}) {
  // Get translations
  const admin = useTranslations('admin');
  const common = useTranslations('common');

  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormDataState>({
    username: '',
    email: '',
    password: '',
    systemRoleId: 'SUPER_ADMIN', // Default to SUPER_ADMIN for admin panel
  });
  const [systemRoles, setSystemRoles] = useState<SystemRole[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);

  // Fetch system roles when dialog opens
  useEffect(() => {
    if (open) {
    async function fetchRoles() {
      setRolesLoading(true);
      try {
        const result = await getSystemRoles();
        if (result.success && result.data) {
          setSystemRoles(result.data);
        } else if (!result.success) {
          console.error("Failed to fetch system roles:", result.error);
          setErrors(prev => [...prev, { field: 'systemRoleId', message: result.error || 'Could not load roles.' }]);
        } else {
          console.error("Fetched system roles successfully but no data received.");
          setErrors(prev => [...prev, { field: 'systemRoleId', message: 'Could not load roles data.' }]);
        }
      } catch (err) {
        console.error("Error calling getSystemRoles:", err);
        setErrors(prev => [...prev, { field: 'systemRoleId', message: 'Error loading roles.' }]);
      } finally {
        setRolesLoading(false);
      }
    }
    fetchRoles();
    }
  }, [open]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors([]);
    setLoading(true);

    try {
      const formDataObj = new FormData();
      if (formData.name) formDataObj.append('name', formData.name);
      formDataObj.append('username', formData.username);
      formDataObj.append('email', formData.email);
      formDataObj.append('password', formData.password);
      formDataObj.append('systemRoleId', formData.systemRoleId ?? '');
      
      const result = await createSystemUser(formDataObj);

      if (!result.success) {
        if (result.errors) {
          // Convert errors object to array format
          const errorArray = Object.entries(result.errors).map(([field, messages]) => ({
            field,
            message: Array.isArray(messages) ? messages[0] : messages
          }));
          setErrors(errorArray);
        } else {
          setErrors([{ field: 'general', message: result.error ?? common('error') }]);
        }
        return;
      }

      // Reset form and close dialog
      setFormData({
        username: '',
        email: '',
        password: '',
        systemRoleId: 'SUPER_ADMIN', // Reset to SUPER_ADMIN default
      });
      setErrors([]);
      setOpen(false);
      
      // Call the callback to refresh the user list
      if (onUserCreated) {
        await onUserCreated();
      }
      
      router.refresh();
    } catch (err) {
      setErrors([{ field: 'general', message: err instanceof Error ? err.message : common('error') }]);
    } finally {
      setLoading(false);
    }
  };

  const getFieldError = (fieldName: string) => {
    return errors.find(error => error.field === fieldName)?.message;
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'systemRoleId' && value === '' ? null : value,
    }));
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset form when closing
      setFormData({
        username: '',
        email: '',
        password: '',
        systemRoleId: 'SUPER_ADMIN',
      });
      setErrors([]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-[#174F7F] hover:bg-[#1a5c94]">
          {admin('users.add')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{admin('users.add')}</DialogTitle>
          <DialogDescription>
            Create a new system user. Super Admin users can create and manage schools.
          </DialogDescription>
        </DialogHeader>
        
    <form onSubmit={handleSubmit} className="space-y-4">
      {getFieldError('general') && (
        <div className="bg-red-50 text-red-500 p-4 rounded-md">
          {getFieldError('general')}
        </div>
      )}
      
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          {admin('users.table.name')} ({common('optional')})
        </label>
        <input
          type="text"
          id="name"
          name="name"
          minLength={2}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          value={formData.name ?? ''}
          onChange={handleInputChange}
        />
        {getFieldError('name') && (
          <p className="mt-1 text-sm text-red-500">{getFieldError('name')}</p>
        )}
      </div>

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Username <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="username"
              name="username"
              required
              minLength={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={formData.username}
              onChange={handleInputChange}
              placeholder="Enter username for login"
            />
            <p className="mt-1 text-sm text-gray-500">
              This username will be used for login. Must be at least 3 characters.
            </p>
            {getFieldError('username') && (
              <p className="mt-1 text-sm text-red-500">{getFieldError('username')}</p>
            )}
          </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          {admin('users.table.email')}
        </label>
        <input
          type="email"
          id="email"
          name="email"
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          value={formData.email}
          onChange={handleInputChange}
        />
        {getFieldError('email') && (
          <p className="mt-1 text-sm text-red-500">{getFieldError('email')}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          {admin('users.table.password')}
        </label>
        <input
          type="password"
          id="password"
          name="password"
          required
          minLength={8}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          value={formData.password}
          onChange={handleInputChange}
        />
        {getFieldError('password') && (
          <p className="mt-1 text-sm text-red-500">{getFieldError('password')}</p>
        )}
      </div>

      <div>
        <label htmlFor="systemRoleId" className="block text-sm font-medium text-gray-700">
              {common('roles.systemRoleLabel')}
        </label>
        <select
          id="systemRoleId"
          name="systemRoleId"
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${rolesLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          value={formData.systemRoleId ?? ''}
          onChange={handleInputChange}
          disabled={rolesLoading}
        >
              <option value="">Regular User</option>
          {systemRoles.map(role => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </select>
            <p className="mt-1 text-sm text-gray-500">
              Super Admin users can create and manage schools. Regular users can only access assigned schools.
            </p>
        {getFieldError('systemRoleId') && (
          <p className="mt-1 text-sm text-red-500">{getFieldError('systemRoleId')}</p>
        )}
        {rolesLoading && <p className="mt-1 text-sm text-gray-500">Loading roles...</p>}
      </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
        type="submit"
        disabled={loading}
              className="bg-[#174F7F] hover:bg-[#1a5c94]"
      >
        {loading ? `${common('loading')}...` : admin('users.add')}
            </Button>
          </div>
    </form>
      </DialogContent>
    </Dialog>
  );
} 