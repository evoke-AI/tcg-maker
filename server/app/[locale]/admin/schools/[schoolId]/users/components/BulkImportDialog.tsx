'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, Download } from 'lucide-react';
import type { BulkImportState, BulkImportResult } from '../types';

interface BulkImportDialogProps {
  bulkImport: BulkImportState;
  setBulkImport: React.Dispatch<React.SetStateAction<BulkImportState>>;
  showCloseWarning: boolean;
  setShowCloseWarning: React.Dispatch<React.SetStateAction<boolean>>;
  isDragOver: boolean;
  onDownloadTemplate: () => Promise<void>;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragEnter: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: (event: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (event: React.DragEvent<HTMLDivElement>) => void;
  onBulkImport: () => Promise<BulkImportResult>;
  onDownloadResults: () => void;
  onResetBulkImport: () => void;
  onForceCloseBulkImport: () => void;
}

export default function BulkImportDialog({
  bulkImport,
  setBulkImport,
  showCloseWarning,
  setShowCloseWarning,
  isDragOver,
  onDownloadTemplate,
  onFileUpload,
  onDragOver,
  onDragEnter,
  onDragLeave,
  onDrop,
  onBulkImport,
  onDownloadResults,
  onResetBulkImport,
  onForceCloseBulkImport,
}: BulkImportDialogProps) {
  const t = useTranslations('admin.bulkUserManagement');

  return (
    <>
      <Dialog 
        open={bulkImport.isOpen} 
        onOpenChange={(open) => {
          if (!open) {
            // Trying to close the dialog - use our safe close function
            onResetBulkImport();
          } else {
            setBulkImport(prev => ({ ...prev, isOpen: open }));
          }
        }}
      >
        <DialogContent 
          className="max-w-4xl max-h-[80vh] overflow-y-auto"
          onPointerDownOutside={(e) => {
            // Prevent closing on backdrop click if credentials need to be downloaded
            const hasCreatedUsers = bulkImport.results?.data?.created && bulkImport.results.data.created.length > 0;
            const needsDownload = hasCreatedUsers && !bulkImport.credentialsDownloaded;
            if (needsDownload) {
              e.preventDefault();
              setShowCloseWarning(true);
            }
          }}
          onEscapeKeyDown={(e) => {
            // Prevent closing on Escape key if credentials need to be downloaded
            const hasCreatedUsers = bulkImport.results?.data?.created && bulkImport.results.data.created.length > 0;
            const needsDownload = hasCreatedUsers && !bulkImport.credentialsDownloaded;
            if (needsDownload) {
              e.preventDefault();
              setShowCloseWarning(true);
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>{t('bulkImport.title')}</DialogTitle>
          </DialogHeader>
          
          {/* Upload Step */}
          {bulkImport.step === 'upload' && (
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                <p className="mb-2">{t('bulkImport.steps.upload.description')}</p>
                <p className="mb-2"><strong>{t('bulkImport.steps.upload.requirements.required')}</strong></p>
                <p className="mb-2"><strong>{t('bulkImport.steps.upload.requirements.optional')}</strong></p>
                <p className="mb-2"><strong>{t('bulkImport.steps.upload.requirements.grades')}</strong></p>
                <p className="mb-4 text-blue-600">{t('bulkImport.steps.upload.requirements.autoCreate')}</p>
              </div>
              
              <div 
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  isDragOver 
                    ? 'border-blue-400 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragOver={onDragOver}
                onDragEnter={onDragEnter}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
              >
                <input
                  type="file"
                  accept=".csv"
                  onChange={onFileUpload}
                  className="hidden"
                  id="csv-upload"
                />
                <label htmlFor="csv-upload" className="cursor-pointer block">
                  <Upload className={`h-12 w-12 mx-auto mb-4 transition-colors ${
                    isDragOver ? 'text-blue-500' : 'text-gray-400'
                  }`} />
                  <p className={`text-lg font-medium mb-2 transition-colors ${
                    isDragOver ? 'text-blue-700' : 'text-gray-900'
                  }`}>
                    {isDragOver ? t('bulkImport.steps.upload.dropzone.dragTitle') : t('bulkImport.steps.upload.dropzone.title')}
                  </p>
                  <p className={`text-sm transition-colors ${
                    isDragOver ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {isDragOver ? t('bulkImport.steps.upload.dropzone.dragSubtitle') : t('bulkImport.steps.upload.dropzone.subtitle')}
                  </p>
                </label>
              </div>
              
              {bulkImport.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <h4 className="text-sm font-medium text-red-800 mb-2">{t('bulkImport.steps.upload.validationErrors')}</h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    {bulkImport.errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="flex justify-between">
                <Button variant="outline" onClick={onDownloadTemplate}>
                  <Download className="h-4 w-4 mr-2" />
                  {t('bulkImport.steps.upload.downloadTemplate')}
                </Button>
                <Button variant="outline" onClick={onResetBulkImport}>
                  {t('bulkImport.steps.upload.cancel')}
                </Button>
              </div>
            </div>
          )}
          
          {/* Preview Step */}
          {bulkImport.step === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">{t('bulkImport.steps.preview.title')}</h3>
                <span className="text-sm text-gray-500">
                  {t('bulkImport.steps.preview.usersToCreate', { count: bulkImport.data.length })}
                </span>
              </div>
              
              <div className="max-h-96 overflow-y-auto border rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('bulkImport.steps.preview.table.username')}</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('bulkImport.steps.preview.table.name')}</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('bulkImport.steps.preview.table.role')}</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('bulkImport.steps.preview.table.class')}</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('bulkImport.steps.preview.table.grade')}</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('bulkImport.steps.preview.table.subject')}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {bulkImport.data.map((user, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 text-sm text-gray-900">{user.username}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{user.lastName}{user.firstName}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{user.role}</td>
                        <td className="px-4 py-2 text-sm text-gray-500">{user.className || '-'}</td>
                        <td className="px-4 py-2 text-sm text-gray-500">{user.gradeLevel || '-'}</td>
                        <td className="px-4 py-2 text-sm text-gray-500">{user.subject || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setBulkImport(prev => ({ ...prev, step: 'upload' }))}>
                  {t('bulkImport.steps.preview.back')}
                </Button>
                <Button onClick={onBulkImport}>
                  {t('bulkImport.steps.preview.createUsers', { count: bulkImport.data.length })}
                </Button>
              </div>
            </div>
          )}
          
          {/* Processing Step */}
          {bulkImport.step === 'processing' && (
            <div className="space-y-4 text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <h3 className="text-lg font-medium">{t('bulkImport.steps.processing.title')}</h3>
              <p className="text-gray-500">{t('bulkImport.steps.processing.description', { count: bulkImport.data.length })}</p>
            </div>
          )}
          
          {/* Results Step */}
          {bulkImport.step === 'results' && bulkImport.results && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">{t('bulkImport.steps.results.title')}</h3>
              </div>
              
              {bulkImport.results.success && bulkImport.results.data ? (
                <div className="space-y-4">
                  {/* CRITICAL WARNING - Download Credentials */}
                  {bulkImport.results.data.created.length > 0 && (
                    <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-red-800 mb-2">
                            {t('bulkImport.steps.results.warning.title')}
                          </h3>
                          <div className="text-red-700 space-y-2">
                            <p className="font-semibold">
                              {t('bulkImport.steps.results.warning.description1', { count: bulkImport.results.data.created.length })}
                            </p>
                            <p>
                              <strong>{t('bulkImport.steps.results.warning.description2')}</strong>
                            </p>
                            <p>
                              {t('bulkImport.steps.results.warning.description3')}
                            </p>
                          </div>
                          <div className="mt-4">
                            <Button 
                              onClick={onDownloadResults} 
                              className="bg-red-600 hover:bg-red-700 text-white font-bold text-lg px-8 py-3"
                              size="lg"
                            >
                              <Download className="h-5 w-5 mr-2" />
                              {t('bulkImport.steps.results.warning.downloadButton')}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Summary */}
                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {bulkImport.results.data.summary.successful}
                      </div>
                      <div className="text-sm text-green-700">{t('bulkImport.steps.results.summary.usersCreated')}</div>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {bulkImport.results.data.summary.classesCreated}
                      </div>
                      <div className="text-sm text-blue-700">{t('bulkImport.steps.results.summary.classesCreated')}</div>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {bulkImport.results.data.summary.failed}
                      </div>
                      <div className="text-sm text-red-700">{t('bulkImport.steps.results.summary.failed')}</div>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-gray-600">
                        {bulkImport.results.data.summary.total}
                      </div>
                      <div className="text-sm text-gray-700">{t('bulkImport.steps.results.summary.total')}</div>
                    </div>
                  </div>
                  
                  {/* Errors */}
                  {bulkImport.results.data.errors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-4">
                      <h4 className="text-sm font-medium text-red-800 mb-2">{t('bulkImport.steps.results.errors')}</h4>
                      <div className="max-h-32 overflow-y-auto">
                        <ul className="text-sm text-red-700 space-y-1">
                          {bulkImport.results.data.errors.map((error, index) => (
                            <li key={index}>
                              {t('bulkImport.steps.results.errorRow', { row: error.row, username: error.username, error: error.error })}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                  
                  {/* Created Classes */}
                  {bulkImport.results.data.createdClasses.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                      <h4 className="text-sm font-medium text-blue-800 mb-2">{t('bulkImport.steps.results.createdClasses')}</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {bulkImport.results.data.createdClasses.map((cls, index) => (
                          <div key={index} className="text-sm text-blue-700 bg-blue-100 rounded px-2 py-1">
                            <span className="font-medium">{cls.name}</span>
                            {cls.gradeLevel && <span className="text-blue-600"> • {cls.gradeLevel}</span>}
                            {cls.subject && <span className="text-blue-600"> • {cls.subject}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Success message */}
                  {bulkImport.results.data.created.length > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-md p-4">
                      <p className="text-sm text-green-700">
                        {t('bulkImport.steps.results.success', { 
                          userCount: bulkImport.results.data.created.length,
                          classText: bulkImport.results.data.createdClasses.length > 0 
                            ? t('bulkImport.steps.results.successWithClasses', { classCount: bulkImport.results.data.createdClasses.length })
                            : ''
                        })}
                      </p>
                      <p className="text-sm text-green-700 font-semibold mt-1">
                        {t('bulkImport.steps.results.downloadReminder')}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <p className="text-sm text-red-700">
                    {bulkImport.results.error || 'Import failed'}
                  </p>
                </div>
              )}
              
              <div className="flex justify-end space-x-3">
                {bulkImport.results.data && bulkImport.results.data.created.length > 0 && !bulkImport.credentialsDownloaded && (
                  <div className="flex items-center text-red-600 text-sm font-medium">
                    <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    {t('bulkImport.steps.results.downloadFirst')}
                  </div>
                )}
                <Button 
                  onClick={onResetBulkImport}
                  variant={bulkImport.results.data && bulkImport.results.data.created.length > 0 && !bulkImport.credentialsDownloaded ? "destructive" : "default"}
                >
                  {bulkImport.results.data && bulkImport.results.data.created.length > 0 && !bulkImport.credentialsDownloaded 
                    ? t('bulkImport.steps.results.closeWithoutDownload')
                    : t('bulkImport.steps.results.close')
                  }
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Warning Dialog for Closing Without Download */}
      <Dialog open={showCloseWarning} onOpenChange={setShowCloseWarning}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">{t('bulkImport.closeWarning.title')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-gray-700">
              <p className="font-semibold mb-2">
                {t('bulkImport.closeWarning.description1')}
              </p>
              <p className="mb-2">
                {t('bulkImport.closeWarning.description2')}
              </p>
              <p className="text-red-600 font-medium">
                {t('bulkImport.closeWarning.description3')}
              </p>
            </div>
            <div className="flex justify-between space-x-3">
              <Button 
                onClick={() => setShowCloseWarning(false)} 
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {t('bulkImport.closeWarning.goBack')}
              </Button>
              <Button 
                onClick={onForceCloseBulkImport} 
                variant="destructive"
              >
                {t('bulkImport.closeWarning.closeAnyway')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 