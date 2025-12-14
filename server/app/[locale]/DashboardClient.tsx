'use client';

import { DashboardClientProps } from './dashboard/types';
import WelcomeHeader from './dashboard/components/WelcomeHeader';
import QuickStats from './dashboard/components/QuickStats';
import SchoolInformation from './dashboard/components/SchoolInformation';
import TeacherClasses from './dashboard/components/TeacherClasses';
import StudentClasses from './dashboard/components/StudentClasses';
import AssignmentsDue from './dashboard/components/AssignmentsDue';
import QuickActions from './dashboard/components/QuickActions';
import PageContainer from '../components/PageContainer';

export default function DashboardClient({
  user,
  stats,
  assignmentsDue,
  isTeacher,
  isStudent,
  isAdmin,
  isSuperAdmin
}: DashboardClientProps) {
  return (
    <PageContainer>
      <div className="space-y-6">
        <WelcomeHeader
          user={user}
          isTeacher={isTeacher}
          isStudent={isStudent}
          isAdmin={isAdmin}
          isSuperAdmin={isSuperAdmin}
        />

        <QuickStats
          stats={stats}
          assignmentsDue={assignmentsDue}
          isTeacher={isTeacher}
          isStudent={isStudent}
        />


        <QuickActions isAdmin={isAdmin} isSuperAdmin={isSuperAdmin} />

        <TeacherClasses user={user} isTeacher={isTeacher} />

        <StudentClasses user={user} isStudent={isStudent} />

        <SchoolInformation user={user} />

        <AssignmentsDue
          assignmentsDue={assignmentsDue}
          isTeacher={isTeacher}
          isStudent={isStudent}
        />
      </div>
    </PageContainer>
  );
} 