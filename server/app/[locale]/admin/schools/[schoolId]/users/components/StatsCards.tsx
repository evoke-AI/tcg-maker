'use client';

import React from 'react';
import { Users, GraduationCap } from 'lucide-react';
import { SCHOOL_ROLES } from '@/lib/constants';
import { getRoleIcon } from '../utils';
import type { SchoolUser } from '../types';

interface StatsCardsProps {
  totalMembers: number;
  users: SchoolUser[];
}

export default function StatsCards({ totalMembers, users }: StatsCardsProps) {
  const adminCount = users.filter(u => u.role === SCHOOL_ROLES.ADMIN).length;
  const teacherCount = users.filter(u => u.role === SCHOOL_ROLES.TEACHER).length;
  const studentCount = users.filter(u => u.role === SCHOOL_ROLES.STUDENT).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center">
          <Users className="h-8 w-8 text-blue-600 mr-3" />
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalMembers}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Members</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center">
          {getRoleIcon(SCHOOL_ROLES.ADMIN)}
          <div className="ml-3">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{adminCount}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Admins</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center">
          {getRoleIcon(SCHOOL_ROLES.TEACHER)}
          <div className="ml-3">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{teacherCount}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Teachers</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center">
          <GraduationCap className="h-8 w-8 text-green-600 mr-3" />
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{studentCount}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Students</p>
          </div>
        </div>
      </div>
    </div>
  );
} 