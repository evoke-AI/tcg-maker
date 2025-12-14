'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { AlertCircle, Key, Download, Loader2, Copy, Check } from 'lucide-react';
import { resetSchoolUserPassword, bulkUpdateSchoolUsers } from '@/app/actions/school-users';
import type { SchoolUser } from '../types';

interface PasswordResetDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  schoolId: string;
  user?: SchoolUser; // Single user for individual reset
  selectedUsers?: SchoolUser[]; // Multiple users for bulk reset
  onSuccess?: () => void;
}

interface PasswordResetResult {
  userId: string;
  username: string;
  name: string;
  newPassword: string;
}

interface BulkPasswordResetData {
  passwordResets: Array<{ userId: string; newPassword: string }>;
}

export default function PasswordResetDialog({
  isOpen,
  onOpenChange,
  schoolId,
  user,
  selectedUsers,
  onSuccess
}: PasswordResetDialogProps) {
  const t = useTranslations('admin.bulkUserManagement.passwordReset');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatePassword, setGeneratePassword] = useState(true);
  const [customPassword, setCustomPassword] = useState('');
  const [results, setResults] = useState<PasswordResetResult[]>([]);
  const [copiedPasswords, setCopiedPasswords] = useState<Set<string>>(new Set());

  const isBulkReset = !user && selectedUsers && selectedUsers.length > 0;
  const userCount = isBulkReset ? selectedUsers!.length : 1;
  const displayName = user ? `${user.lastName} ${user.firstName}` : `${userCount} users`;

  const handleReset = async () => {
    setLoading(true);
    setError(null);
    setResults([]);

    try {
      if (isBulkReset) {
        // Bulk password reset
        const result = await bulkUpdateSchoolUsers(schoolId, {
          type: 'password-reset',
          userIds: selectedUsers!.map(u => u.id),
        });

        if (!result.success) {
          setError(result.error || 'Failed to reset passwords');
          return;
        }

        // Format results for display
        const bulkData = result.data as BulkPasswordResetData;
        const passwordResets = bulkData?.passwordResets || [];
        const formattedResults = passwordResets.map((reset: { userId: string; newPassword: string }) => {
          const user = selectedUsers!.find(u => u.id === reset.userId);
          return {
            userId: reset.userId,
            username: user?.username || 'Unknown',
            name: user ? `${user.lastName} ${user.firstName}` : 'Unknown',
            newPassword: reset.newPassword,
          };
        });

        setResults(formattedResults);
      } else if (user) {
        // Single user password reset
        const result = await resetSchoolUserPassword(schoolId, {
          userId: user.id,
          generatePassword,
          customPassword: generatePassword ? undefined : customPassword,
        });

        if (!result.success) {
          setError(result.error || 'Failed to reset password');
          return;
        }

        // Format single result
        const newPassword = result.data?.newPassword || customPassword;
        setResults([{
          userId: user.id,
          username: user.username,
          name: `${user.lastName} ${user.firstName}`,
          newPassword,
        }]);
      }

      // Don't call onSuccess here - only call it when dialog is manually closed
      // This allows users to see the results before the dialog closes
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPassword = async (password: string, userId: string) => {
    try {
      await navigator.clipboard.writeText(password);
      setCopiedPasswords(prev => new Set([...prev, userId]));
      setTimeout(() => {
        setCopiedPasswords(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
      }, 2000);
    } catch (err) {
      console.error('Failed to copy password:', err);
    }
  };

  const handleDownloadResults = () => {
    const csvContent = [
      ['Username', 'Name', 'New Password'],
      ...results.map(result => [result.username, result.name, result.newPassword])
    ]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `password-reset-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleClose = () => {
    // Call onSuccess to refresh the user list if passwords were reset
    if (results.length > 0 && onSuccess) {
      onSuccess();
    }
    
    setError(null);
    setResults([]);
    setCustomPassword('');
    setGeneratePassword(true);
    setCopiedPasswords(new Set());
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            {t('title')} - {displayName}
          </DialogTitle>
          <DialogDescription>
            {isBulkReset 
              ? t('bulkDescription', { count: userCount })
              : t('singleDescription', { name: displayName })
            }
          </DialogDescription>
        </DialogHeader>

        {results.length === 0 ? (
          <div className="space-y-4">
            {/* Password Generation Options */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  id="generate-password"
                  type="checkbox"
                  checked={generatePassword}
                  onChange={(e) => setGeneratePassword(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  aria-label="Generate secure password automatically"
                />
                <Label htmlFor="generate-password">
                  {t('generatePassword')}
                </Label>
              </div>

              {!generatePassword && (
                <div className="space-y-2">
                  <Label htmlFor="custom-password">
                    {t('customPassword')}
                  </Label>
                  <Input
                    id="custom-password"
                    type="password"
                    value={customPassword}
                    onChange={(e) => setCustomPassword(e.target.value)}
                    placeholder={t('customPasswordPlaceholder')}
                    minLength={12}
                    disabled={loading}
                  />
                  <p className="text-sm text-gray-500">
                    {t('passwordRequirements')}
                  </p>
                </div>
              )}
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            {/* Warning for bulk reset */}
            {isBulkReset && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
                <p className="font-medium">{t('bulkWarning')}</p>
                <p className="text-sm mt-1">{t('bulkWarningDetails')}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Success Message */}
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              <p className="font-medium">
                {t('successMessage', { count: results.length })}
              </p>
            </div>

            {/* Results Display */}
            <div className="max-h-60 overflow-y-auto border rounded-lg">
              <div className="divide-y divide-gray-200">
                {results.map((result) => (
                  <div key={result.userId} className="p-3 flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{result.name}</p>
                      <p className="text-xs text-gray-500">@{result.username}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                        {result.newPassword}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyPassword(result.newPassword, result.userId)}
                        className="h-8 w-8 p-0"
                      >
                        {copiedPasswords.has(result.userId) ? (
                          <Check className="h-3 w-3 text-green-600" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Download Option */}
            <div className="bg-blue-50 border border-blue-200 p-3 rounded">
              <p className="text-sm text-blue-700 mb-2">
                {t('downloadPrompt')}
              </p>
              <Button
                variant="outline"
                onClick={handleDownloadResults}
                className="text-blue-700 border-blue-300 hover:bg-blue-100"
              >
                <Download className="h-4 w-4 mr-2" />
                {t('downloadCsv')}
              </Button>
            </div>
          </div>
        )}

        <DialogFooter>
          {results.length === 0 ? (
            <>
              <Button variant="outline" onClick={handleClose} disabled={loading}>
                {t('cancel')}
              </Button>
              <Button 
                onClick={handleReset} 
                disabled={loading || (!generatePassword && customPassword.length < 12)}
                className="bg-red-600 hover:bg-red-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('resetting')}
                  </>
                ) : (
                  <>
                    <Key className="h-4 w-4 mr-2" />
                    {t('resetPassword')}
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button onClick={handleClose}>
              {t('close')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 