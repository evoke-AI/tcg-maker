import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { prisma } from '@/lib/prisma';
import { requireSchoolPermission } from '@/lib/authUtils';
import { PERMISSIONS } from '@/lib/constants';
import ClassUsersManagement from './ClassUsersManagement';

interface PageProps {
  params: Promise<{
    locale: string;
    schoolId: string;
    classId: string;
  }>;
}

export default async function ClassUsersPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/login');
  }

  const { schoolId, classId } = await params;

  try {
    // Check if user has permission to manage school
    await requireSchoolPermission(schoolId, PERMISSIONS.MANAGE_SCHOOL);

    // Fetch school and class data
    const [school, classData] = await Promise.all([
      prisma.school.findUnique({
        where: { id: schoolId },
        select: {
          id: true,
          name: true,
          code: true,
        },
      }),
      prisma.class.findFirst({
        where: { 
          id: classId, 
          schoolId,
          isActive: true 
        },
        select: {
          id: true,
          name: true,
          code: true,
          subject: true,
          gradeLevel: true,
          description: true,
          _count: {
            select: {
              teachers: {
                where: { isActive: true }
              },
              students: {
                where: { isActive: true }
              }
            }
          }
        },
      }),
    ]);

    if (!school) {
      redirect('/admin/schools');
    }

    if (!classData) {
      redirect(`/admin/schools/${schoolId}/users`);
    }

    return (
      <ClassUsersManagement 
        school={school} 
        classData={{
          ...classData,
          teacherCount: classData._count.teachers,
          studentCount: classData._count.students,
        }} 
      />
    );
  } catch (error) {
    console.error('Error loading class users page:', error);
    redirect('/admin/schools');
  }
} 