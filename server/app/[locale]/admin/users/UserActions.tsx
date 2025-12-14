'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { updateUser } from '@/app/actions/admin/update'
import { deleteUser } from '@/app/actions/admin/delete'
import { useRouter } from 'next/navigation'
import { getSystemRoles, getUserSystemRole } from '@/app/actions/admin/read'
import { type User as ImportedUserType } from '@/app/actions/admin/types'

interface UserActionsProps {
  user: ImportedUserType
}

interface SystemRole { id: string; name: string; }

interface ValidationError {
  field: string
  message: string
}

export default function UserActions({ user }: UserActionsProps) {
  // Get translations
  const admin = useTranslations('admin')
  const common = useTranslations('common')
  const router = useRouter()

  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: user.name ?? '',
    email: user.email,
    password: '',
    systemRoleId: null as string | null,
    status: user.status
  })
  const [errors, setErrors] = useState<ValidationError[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [systemRoles, setSystemRoles] = useState<SystemRole[]>([])
  const [rolesLoading, setRolesLoading] = useState(true)

    useEffect(() => {
    async function loadEditData() {
      if (!isEditOpen) return;

      setRolesLoading(true);
      setErrors([]);
      let currentSystemRoleId: string | null = null;
      let fetchedRoles: SystemRole[] = [];
      let fetchError = null;

      try {
        // Fetch user's current system role using the server action
        const userRoleResult = await getUserSystemRole(user.id);
        if (userRoleResult.success && userRoleResult.data) {
          currentSystemRoleId = userRoleResult.data.systemRole;
        } else if (!userRoleResult.success) {
          fetchError = userRoleResult.error || common('errors.fetch');
          // Optionally return early if fetching user role fails critically
          // throw new Error(fetchError);
        } else {
          fetchError = common('errors.fetch');
        }

        // Fetch available system roles (only proceed if user role fetch didn't critically fail)
        if (!fetchError || fetchError === common('errors.fetch')) { // Allow continuing if user role fetch failed but isn't critical
             const rolesResult = await getSystemRoles();
             if (rolesResult.success && rolesResult.data) {
                fetchedRoles = rolesResult.data;
             } else if (!rolesResult.success) {
                // Prioritize showing the user role fetch error if it exists
                fetchError = fetchError ?? (rolesResult.error || common('errors.fetch'));
             } else {
                fetchError = fetchError ?? common('errors.fetch');
             }
        }

      } catch (err) {
        console.error("Error loading edit data:", err);
        fetchError = common('error');
      } finally {
        setFormData(prev => ({ 
            ...prev, 
            systemRoleId: currentSystemRoleId ?? null // Update state based on fetched role
        }));
        setSystemRoles(fetchedRoles);
        if(fetchError) {
            setErrors(prev => [...prev, { field: 'systemRoleId', message: fetchError! }]);
        }
        setRolesLoading(false);
      }
    }
    loadEditData();
  }, [isEditOpen, user.id, common]);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrors([])

    try {
      const formDataObj = new FormData()
      formDataObj.append('name', formData.name || '')
      formDataObj.append('email', formData.email || '')
      formDataObj.append('status', formData.status)
      formDataObj.append('systemRoleId', formData.systemRoleId ?? '')
      
      if (formData.password) {
        formDataObj.append('password', formData.password)
      }

      const result = await updateUser(user.id, formDataObj)

      if (!result.success) {
        if (result.errors) {
          // Convert errors object to array format
          const errorArray = Object.entries(result.errors).map(([field, messages]) => ({
            field,
            message: Array.isArray(messages) ? messages[0] : messages as string
          }))
          setErrors(errorArray)
          return
        }
        throw new Error(result.error || common('error'))
      }

      toast.success(common('success'))
      setIsEditOpen(false)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : common('error'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    setIsLoading(true)
    setErrors([])

    try {
      const result = await deleteUser(user.id)

      if (!result.success) {
        if (result.error) {
          setErrors([{ field: 'general', message: result.error }])
          return
        }
        throw new Error(common('error'))
      }

      toast.success(common('success'))
      setIsDeleteOpen(false)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : common('error'))
    } finally {
      setIsLoading(false)
    }
  }

  // NEW: Handler to re-enable a user
  const handleEnable = async () => {
    setIsLoading(true);
    setErrors([]);

    try {
      // Create FormData including required fields for validation
      const formDataObj = new FormData();
      formDataObj.append('status', 'active'); 
      // Add existing name and email to satisfy UserSchema validation
      formDataObj.append('name', user.name ?? ''); // Send empty string if name is null
      formDataObj.append('email', user.email || '');
      // systemRoleId and password are not needed/sent, schema handles optionality

      const result = await updateUser(user.id, formDataObj);

      if (!result.success) {
        if (result.error) {
          setErrors([{ field: 'general', message: result.error }]);
          return; // Stop execution on error
        } else if (result.errors) {
           // Handle potential validation errors if schema changes later
           const errorArray = Object.entries(result.errors).map(([field, messages]) => ({
             field,
             message: Array.isArray(messages) ? messages[0] : messages as string
           }));
           setErrors(errorArray);
           return; // Stop execution on error
        }
        throw new Error(common('error'));
      }

      toast.success(common('success'));
      // No need to close a dialog
      router.refresh(); // Refresh list to show updated status
    } catch (error) {
      // Display error in a toast or specific error field
      const errorMsg = error instanceof Error ? error.message : common('error');
      toast.error(errorMsg); 
      setErrors([{ field: 'general', message: errorMsg }]);
    } finally {
      setIsLoading(false);
    }
  };

  const getFieldError = (fieldName: string) => {
    return errors.find(error => error.field === fieldName)?.message
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement /*| HTMLSelectElement */>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Specific handler for Select components (like Role and Status)
  const handleSelectChange = (name: string, value: string) => {
     setFormData(prev => ({
      ...prev,
      [name]: value === '--NONE--' ? null : value, // Set null if placeholder value selected
    }));
  };

  return (
    <div className="flex space-x-2">
      {/* Edit Button (Always shown?) */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsEditOpen(true)}
        className="text-blue-600 hover:text-blue-700"
        disabled={isLoading} // Disable while loading
      >
        {admin('users.edit')}
      </Button>

      {/* Conditionally show Enable or Delete Button */}
      {user.status === 'inactive' ? (
        <Button
          variant="outline"
          size="sm"
          onClick={handleEnable} // Call handleEnable
          className="text-green-600 hover:text-green-700"
          disabled={isLoading}
        >
          {common('enable')} 
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsDeleteOpen(true)} // Opens delete confirmation
          className="text-red-600 hover:text-red-700"
          disabled={isLoading}
        >
          {admin('users.delete')}
        </Button>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{admin('users.edit')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            {getFieldError('general') && (
              <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-500">
                {getFieldError('general')}
              </div>
            )}
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{admin('users.table.name')}</label>
                <Input
                  value={formData.name}
                  onChange={handleInputChange}
                  name="name"
                  minLength={2}
                />
                {getFieldError('name') && (
                  <p className="text-sm text-red-500">{getFieldError('name')}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{admin('users.table.email')}</label>
                <Input
                  type="email"
                  value={formData.email || ''}
                  onChange={handleInputChange}
                  name="email"
                  required
                />
                {getFieldError('email') && (
                  <p className="text-sm text-red-500">{getFieldError('email')}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {admin('users.table.password')} ({common('optional')})
                </label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  name="password"
                  placeholder={common('passwordPlaceholder')}
                  minLength={8}
                />
                {getFieldError('password') && (
                  <p className="text-sm text-red-500">{getFieldError('password')}</p>
                )}
              </div>
              <div className="space-y-2">
                <label htmlFor="status" className="text-sm font-medium">{common('status.label')}</label>
                <Select
                  name="status"
                  value={formData.status}
                  onValueChange={(value: string) => handleSelectChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={common('status.label')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{common('status.active')}</SelectItem>
                    <SelectItem value="inactive">{common('status.inactive')}</SelectItem>
                    <SelectItem value="pending">{common('status.pending')}</SelectItem>
                  </SelectContent>
                </Select>
                {getFieldError('status') && (
                  <p className="text-sm text-red-500">{getFieldError('status')}</p>
                )}
              </div>
              <div className="space-y-2">
                <label htmlFor="systemRoleId" className="text-sm font-medium">{common('roles.systemRoleLabel')}</label>
                <Select
                  name="systemRoleId"
                  value={formData.systemRoleId ?? '--NONE--'}
                  onValueChange={(value) => handleSelectChange('systemRoleId', value)}
                  disabled={rolesLoading}
                >
                  <SelectTrigger className={rolesLoading ? 'opacity-50 cursor-not-allowed' : ''}>
                    <SelectValue placeholder={common('roles.selectSystemRole')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="--NONE--">{common('roles.user')}</SelectItem>
                    {systemRoles.map(role => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name} 
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {getFieldError('systemRoleId') && (
                  <p className="text-sm text-red-500">{getFieldError('systemRoleId')}</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
                disabled={isLoading}
              >
                {common('cancel')}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? `${common('saving')}...` : common('save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{admin('users.delete')}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>{admin('users.confirmDelete')}</p>
            {getFieldError('general') && (
              <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-500">
                {getFieldError('general')}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteOpen(false)}
              disabled={isLoading}
            >
              {common('cancel')}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
            >
              {isLoading ? `${common('deleting')}...` : common('delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 