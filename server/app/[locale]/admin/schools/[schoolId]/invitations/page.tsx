import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { prisma } from '@/lib/prisma';
import { requireSchoolPermission } from '@/lib/authUtils';
import { PERMISSIONS } from '@/lib/constants';
import InvitationsManagement from './InvitationsManagement';
import type { School } from './types';

interface InvitationsPageProps {
  params: Promise<{ schoolId: string }>;
}

export async function generateMetadata({ params }: InvitationsPageProps) {
  const { schoolId } = await params;
  
  try {
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: { name: true },
    });
    
    return {
      title: school ? `Invitations - ${school.name}` : 'School Invitations',
      description: 'Manage school invitations and invite users to join the school',
    };
  } catch {
    return {
      title: 'School Invitations',
      description: 'Manage school invitations',
    };
  }
}

export default async function InvitationsPage({ params }: InvitationsPageProps) {
  const { schoolId } = await params;
  
  // Check authentication
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/login');
  }

  try {
    // Check permissions
    await requireSchoolPermission(schoolId, PERMISSIONS.MANAGE_SCHOOL);

    // Get school information
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: {
        id: true,
        name: true,
        code: true,
        email: true,
      },
    });

    if (!school) {
      redirect('/admin/schools');
    }

    const schoolData: School = {
      id: school.id,
      name: school.name,
      code: school.code,
      email: school.email,
    };

    return <InvitationsManagement school={schoolData} />;
  } catch (error) {
    console.error('Error loading invitations page:', error);
    redirect('/admin/schools');
  }
} 