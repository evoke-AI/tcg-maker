'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, Key, Check, X, Eye, EyeOff } from 'lucide-react';
import { usePasswordManagement } from '../hooks/usePasswordManagement';

export default function SecuritySection() {
  const t = useTranslations('profile');
  const common = useTranslations('common');
  
  const passwordManagement = usePasswordManagement();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2">
          <Shield className="h-5 w-5" />
          {t('security.title')}
        </h2>
        {!passwordManagement.isChangingPassword && (
          <Button
            onClick={passwordManagement.startChangingPassword}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Key className="h-4 w-4" />
            {t('security.changePassword')}
          </Button>
        )}
      </div>

      {passwordManagement.passwordSuccess && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-600">{passwordManagement.passwordSuccess}</p>
        </div>
      )}

      {passwordManagement.passwordErrors.general && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{passwordManagement.passwordErrors.general[0]}</p>
        </div>
      )}

      {passwordManagement.isChangingPassword ? (
        <form onSubmit={passwordManagement.handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('security.currentPassword')}
            </label>
            <div className="relative">
              <Input
                type={passwordManagement.showPasswords.current ? "text" : "password"}
                name="currentPassword"
                value={passwordManagement.passwordForm.currentPassword}
                onChange={passwordManagement.handlePasswordInputChange}
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => passwordManagement.togglePasswordVisibility('current')}
              >
                {passwordManagement.showPasswords.current ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
            {passwordManagement.passwordErrors.currentPassword && (
              <p className="mt-1 text-sm text-red-600">{passwordManagement.passwordErrors.currentPassword[0]}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('security.newPassword')}
            </label>
            <div className="relative">
              <Input
                type={passwordManagement.showPasswords.new ? "text" : "password"}
                name="newPassword"
                value={passwordManagement.passwordForm.newPassword}
                onChange={passwordManagement.handlePasswordInputChange}
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => passwordManagement.togglePasswordVisibility('new')}
              >
                {passwordManagement.showPasswords.new ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
            {passwordManagement.passwordErrors.newPassword && (
              <p className="mt-1 text-sm text-red-600">{passwordManagement.passwordErrors.newPassword[0]}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('security.confirmPassword')}
            </label>
            <div className="relative">
              <Input
                type={passwordManagement.showPasswords.confirm ? "text" : "password"}
                name="confirmPassword"
                value={passwordManagement.passwordForm.confirmPassword}
                onChange={passwordManagement.handlePasswordInputChange}
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => passwordManagement.togglePasswordVisibility('confirm')}
              >
                {passwordManagement.showPasswords.confirm ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
            {passwordManagement.passwordErrors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{passwordManagement.passwordErrors.confirmPassword[0]}</p>
            )}
          </div>

          <div className="text-sm text-gray-600">
            <p>{t('security.passwordRequirements')}</p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={passwordManagement.isUpdatingPassword}
              className="flex items-center gap-2"
            >
              {passwordManagement.isUpdatingPassword ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {t('security.updatingPassword')}
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  {t('security.updatePassword')}
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={passwordManagement.handleCancelPasswordChange}
              disabled={passwordManagement.isUpdatingPassword}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              {common('cancel')}
            </Button>
          </div>
        </form>
      ) : (
        <div className="text-sm text-gray-600">
          <p>Click &quot;Change Password&quot; to update your password. You&apos;ll need to provide your current password for security.</p>
        </div>
      )}
    </div>
  );
} 