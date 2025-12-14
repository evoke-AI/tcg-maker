import { useState, useCallback } from 'react';
import { bulkCreateSchoolUsers, generateBulkUserTemplate } from '@/app/actions/school-users';
import type { BulkImportState, BulkUserData, BulkImportResult } from '../types';

export function useBulkImport(schoolId: string, schoolCode?: string | null) {
  const [bulkImport, setBulkImport] = useState<BulkImportState>({
    isOpen: false,
    step: 'upload',
    file: null,
    data: [],
    errors: [],
    results: null,
    processing: false,
    credentialsDownloaded: false,
  });
  const [showCloseWarning, setShowCloseWarning] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDownloadTemplate = useCallback(async () => {
    try {
      const result = await generateBulkUserTemplate(schoolId);
      if (result.success && result.data) {
        const blob = new Blob([result.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bulk-users-template-${schoolCode || 'school'}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        throw new Error(result.error || 'Failed to generate template');
      }
    } catch (error) {
      console.error('Error downloading template:', error);
      throw error;
    }
  }, [schoolId, schoolCode]);

  const parseCSV = useCallback((csvText: string): { data: BulkUserData[]; errors: string[] } => {
    const lines = csvText.trim().split('\n');
    const errors: string[] = [];
    const data: BulkUserData[] = [];

    if (lines.length < 2) {
      errors.push('CSV file must contain at least a header row and one data row');
      return { data, errors };
    }

    // Parse header
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase());
    const requiredHeaders = ['username', 'firstname', 'lastname', 'role'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    
    if (missingHeaders.length > 0) {
      errors.push(`Missing required columns: ${missingHeaders.join(', ')}`);
      return { data, errors };
    }

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        const values = line.split(',').map(v => v.replace(/"/g, '').trim());
        const row: Record<string, string> = {};
        
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });

        // Validate required fields
        if (!row.username || !row.firstname || !row.lastname || !row.role) {
          errors.push(`Row ${i + 1}: Missing required fields (username, firstName, lastName, role)`);
          continue;
        }

        // Validate role
        if (!['ADMIN', 'TEACHER', 'STUDENT'].includes(row.role.toUpperCase())) {
          errors.push(`Row ${i + 1}: Invalid role '${row.role}'. Must be ADMIN, TEACHER, or STUDENT`);
          continue;
        }

        data.push({
          username: row.username,
          firstName: row.firstname,
          lastName: row.lastname,
          role: row.role.toUpperCase() as 'ADMIN' | 'TEACHER' | 'STUDENT',
          studentId: row.studentid || undefined,
          className: row.classname || undefined,
          classCode: row.classcode || undefined,
          gradeLevel: row.gradelevel || undefined,
          subject: row.subject || undefined,
        });

      } catch {
        errors.push(`Row ${i + 1}: Failed to parse CSV data`);
      }
    }

    return { data, errors };
  }, []);

  const processFile = useCallback((file: File) => {
    if (!file.name.endsWith('.csv')) {
      setBulkImport(prev => ({ ...prev, errors: ['Please select a CSV file'] }));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const csvText = e.target?.result as string;
      const { data, errors } = parseCSV(csvText);
      
      setBulkImport(prev => ({
        ...prev,
        file,
        data,
        errors,
        step: errors.length > 0 ? 'upload' : 'preview'
      }));
    };
    reader.readAsText(file);
  }, [parseCSV]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    processFile(file);
  }, [processFile]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    // Only set to false if we're leaving the dropzone entirely
    if (!event.currentTarget.contains(event.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);

    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      processFile(file);
    }
  }, [processFile]);

  const handleBulkImport = useCallback(async () => {
    setBulkImport(prev => ({ ...prev, processing: true, step: 'processing' }));

    try {
      const result = await bulkCreateSchoolUsers(schoolId, bulkImport.data);
      setBulkImport(prev => ({
        ...prev,
        processing: false,
        results: result,
        step: 'results'
      }));
      return result;
    } catch (error) {
      console.error('Bulk import error:', error);
      const errorResult: BulkImportResult = {
        success: false,
        error: 'Failed to process bulk import'
      };
      setBulkImport(prev => ({
        ...prev,
        processing: false,
        results: errorResult,
        step: 'results'
      }));
      return errorResult;
    }
  }, [schoolId, bulkImport.data]);

  const handleDownloadResults = useCallback(() => {
    if (!bulkImport.results?.success || !bulkImport.results.data) return;

    const { created } = bulkImport.results.data;
    const csvContent = [
      ['Username', 'Login Identifier', 'Password', 'Name', 'Role', 'Assigned Class'],
      ...created.map(user => [
        user.username,
        user.loginIdentifier,
        user.generatedPassword,
        `${user.lastName}${user.firstName}`,
        user.role,
        user.assignedClass || ''
      ])
    ].map(row => row.map(field => `"${field}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `created-users-${schoolCode || 'school'}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    // Mark credentials as downloaded
    setBulkImport(prev => ({ ...prev, credentialsDownloaded: true }));
  }, [bulkImport.results, schoolCode]);

  const resetBulkImport = useCallback(() => {
    // Check if there are created users and credentials haven't been downloaded
    const hasCreatedUsers = bulkImport.results?.data?.created && bulkImport.results.data.created.length > 0;
    const needsDownload = hasCreatedUsers && !bulkImport.credentialsDownloaded;
    
    if (needsDownload) {
      setShowCloseWarning(true);
      return;
    }
    
    // Safe to close
    setBulkImport({
      isOpen: false,
      step: 'upload',
      file: null,
      data: [],
      errors: [],
      results: null,
      processing: false,
      credentialsDownloaded: false,
    });
    setShowCloseWarning(false);
  }, [bulkImport.results, bulkImport.credentialsDownloaded]);

  const forceCloseBulkImport = useCallback(() => {
    setBulkImport({
      isOpen: false,
      step: 'upload',
      file: null,
      data: [],
      errors: [],
      results: null,
      processing: false,
      credentialsDownloaded: false,
    });
    setShowCloseWarning(false);
  }, []);

  const openBulkImport = useCallback(() => {
    setBulkImport(prev => ({ ...prev, isOpen: true }));
  }, []);

  return {
    bulkImport,
    setBulkImport,
    showCloseWarning,
    setShowCloseWarning,
    isDragOver,
    handleDownloadTemplate,
    handleFileUpload,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
    handleBulkImport,
    handleDownloadResults,
    resetBulkImport,
    forceCloseBulkImport,
    openBulkImport,
  };
} 