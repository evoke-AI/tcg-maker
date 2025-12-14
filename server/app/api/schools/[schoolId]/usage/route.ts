import { NextRequest, NextResponse } from 'next/server';
import { PERMISSIONS } from '@/lib/constants';
import { requireSchoolPermission } from '@/lib/authUtils';
import { prisma } from '@/lib/prisma';
import { getSchoolUsageSummary } from '@/lib/credit-usage';

function parseDate(value?: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ schoolId: string }> }
) {
  try {
    const { schoolId } = await params;

    // Permission check
    await requireSchoolPermission(schoolId, PERMISSIONS.MANAGE_SCHOOL);

    const { searchParams } = new URL(request.url);
    const startParam = searchParams.get('start');
    const endParam = searchParams.get('end');

    const now = new Date();
    const defaultStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const start = parseDate(startParam) ?? defaultStart;
    const end = parseDate(endParam) ?? now;

    const summary = await getSchoolUsageSummary(schoolId, { start, end });

    const recent = await prisma.schoolCreditUsage.findMany({
      where: {
        schoolId,
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, username: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({
      success: true,
      data: {
        range: { start: start.toISOString(), end: end.toISOString() },
        summary,
        recent: recent.map((r) => ({
          id: r.id,
          feature: r.feature,
          cost: r.cost,
          metadata: r.metadata,
          createdAt: r.createdAt.toISOString(),
          user: {
            id: r.user.id,
            name: `${r.user.lastName ?? ''} ${r.user.firstName ?? ''}`.trim() || r.user.username || r.user.email || r.user.id,
          },
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching school usage:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch usage' },
      { status: 500 }
    );
  }
}


