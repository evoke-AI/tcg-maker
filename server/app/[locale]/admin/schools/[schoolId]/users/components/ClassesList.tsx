'use client';

import React from 'react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, GraduationCap, Users, Edit, Trash2, Plus, Loader2
} from 'lucide-react';
import type { SchoolClass } from '../types';

interface ClassesListProps {
  classes: SchoolClass[];
  loading: boolean;
  searchTerm: string;
  onEditClass: (cls: SchoolClass) => void;
  onDeleteClass: (cls: SchoolClass) => void;
  onAddClass: () => void;
  schoolId: string;
}

export default function ClassesList({
  classes,
  loading,
  searchTerm,
  onEditClass,
  onDeleteClass,
  onAddClass,
  schoolId
}: ClassesListProps) {


  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No classes found
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          {searchTerm ? 'Try adjusting your search' : 'Get started by creating your first class'}
        </p>
        {!searchTerm && (
          <Button onClick={onAddClass}>
            <Plus className="h-4 w-4 mr-2" />
            Create First Class
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Classes</h3>
      </div>
      
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {classes.map((cls) => (
          <div key={cls.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-gray-900 dark:text-white truncate">{cls.name}</h3>
                  {cls.code && (
                    <Badge variant="secondary" className="text-xs">
                      {cls.code}
                    </Badge>
                  )}
                </div>
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  {cls.subject && (
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />
                      {cls.subject}
                    </div>
                  )}
                  {cls.gradeLevel && (
                    <div className="flex items-center gap-1">
                      <GraduationCap className="h-3 w-3" />
                      {cls.gradeLevel}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {cls.teacherCount} teachers, {cls.studentCount} students
                  </div>
                </div>
                
                {cls.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                    {cls.description}
                  </p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/admin/schools/${schoolId}/classes/${cls.id}/users`}>
                    <Users className="h-4 w-4 mr-1" />
                    Manage Users
                  </Link>
                </Button>
                <Button variant="outline" size="sm" onClick={() => onEditClass(cls)}>
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-red-600 hover:text-red-700"
                  onClick={() => onDeleteClass(cls)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 