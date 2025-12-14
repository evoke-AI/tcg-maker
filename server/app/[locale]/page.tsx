import { redirect } from 'next/navigation'
import { requireAuthWithSignout } from '@/lib/authUtils'
import { prisma } from '@/lib/prisma'
import { getTranslations } from 'next-intl/server'
import { Metadata } from 'next'
import DashboardClient from './DashboardClient'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: 'en', namespace: 'dashboardPage' })
  return {
    title: t('title') || 'Dashboard'
  }
}

export default async function RootPage() {
  // This will handle authentication and redirect to signout if user doesn't exist
  const { userId } = await requireAuthWithSignout()

  try {
    // Get user information with school memberships and classes
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        email: true,
        studentId: true,
        gradeLevel: true,
        department: true,
        systemRole: true,
        isActive: true,
        schoolMemberships: {
          where: { isActive: true },
          select: {
            role: true,
            joinedAt: true,
            school: {
              select: {
                id: true,
                name: true,
                code: true,
                address: true,
                phone: true,
                email: true,
                website: true,
              }
            }
          }
        },
        teacherClasses: {
          where: { isActive: true },
          select: {
            assignedAt: true,
            class: {
              select: {
                id: true,
                name: true,
                code: true,
                subject: true,
                gradeLevel: true,
                description: true,
                school: {
                  select: {
                    name: true
                  }
                },
                _count: {
                  select: {
                    students: {
                      where: { isActive: true }
                    },

                  }
                }
              }
            }
          }
        },
        studentClasses: {
          where: { isActive: true },
          select: {
            enrolledAt: true,
            class: {
              select: {
                id: true,
                name: true,
                code: true,
                subject: true,
                gradeLevel: true,
                description: true,
                school: {
                  select: {
                    name: true
                  }
                },
                _count: {
                  select: {
                    students: {
                      where: { isActive: true }
                    },

                  }
                }
              }
            }
          }
        }
      }
    })

    if (!user) {
      console.log(`User ${userId} not found in database, signing out`);
      redirect('/api/auth/signout?callbackUrl=/login')
    }

    // Calculate user stats
    const isTeacher = user.teacherClasses.length > 0
    const isStudent = user.studentClasses.length > 0
    const isAdmin = user.schoolMemberships.some(m => m.role === 'ADMIN')
    const isSuperAdmin = user.systemRole === 'SUPER_ADMIN'

    // Get class IDs for the user
    // No assignments in this template - assignments feature removed
    const assignmentsDue: never[] = []

    const stats = {
      totalSchools: user.schoolMemberships.length,
      totalClasses: user.teacherClasses.length + user.studentClasses.length,
      teachingClasses: user.teacherClasses.length,
      enrolledClasses: user.studentClasses.length,
      totalStudents: user.teacherClasses.reduce((sum, tc) => sum + tc.class._count.students, 0)
    }

    return (
      <DashboardClient 
        user={user}
        stats={stats}
        assignmentsDue={assignmentsDue}
        isTeacher={isTeacher}
        isStudent={isStudent}
        isAdmin={isAdmin}
        isSuperAdmin={isSuperAdmin}
      />
    )

  } catch (error) {
    console.error('Error loading dashboard:', error)
    redirect('/api/auth/signout?callbackUrl=/login')
  }
}
