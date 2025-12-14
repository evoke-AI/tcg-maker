import { NextRequest, NextResponse } from 'next/server';
import { requireSystemPermission } from '@/lib/authUtils';
import { PERMISSIONS } from '@/lib/constants';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    await requireSystemPermission(PERMISSIONS.CREATE_SCHOOL);

    const { searchParams } = new URL(request.url);
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    const where: Parameters<typeof prisma.schoolCreditUsage.groupBy>[0]['where'] = {};
    if (start || end) {
      where.createdAt = {};
      if (start) where.createdAt.gte = new Date(start);
      if (end) where.createdAt.lte = new Date(end);
    }

    const grouped = await prisma.schoolCreditUsage.groupBy({
      by: ['schoolId'],
      where,
      _sum: { cost: true },
    });

    return NextResponse.json({
      success: true,
      data: grouped.map((g) => ({ schoolId: g.schoolId, used: g._sum.cost ?? 0 })),
    });
  } catch (error) {
    console.error('Error fetching usage summary for all schools:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch usage summary' }, { status: 500 });
  }
}






