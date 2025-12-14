import { prisma } from '@/lib/prisma';

export const CREDIT_FEATURES = {
  REPORT: 'REPORT',
  AI_DETECT: 'AI_DETECT',
} as const;

export type CreditFeature = typeof CREDIT_FEATURES[keyof typeof CREDIT_FEATURES] | (string & {});

export interface RecordCreditUsageParams {
  userId: string;
  schoolId: string;
  feature: CreditFeature;
  cost?: number; // defaults to 1
  metadata?: string; // JSON string if provided
}

/**
 * Records a single usage entry for billing. Safe to call in a fire-and-forget style.
 * Never throws; logs error and returns false on failure.
 */
export async function recordCreditUsage(params: RecordCreditUsageParams): Promise<boolean> {
  const {
    userId,
    schoolId,
    feature,
    cost = 1,
    metadata,
  } = params;

  if (!userId || !schoolId || !feature) {
    console.error('recordCreditUsage: Missing required fields', { userId, schoolId, feature });
    return false;
  }

  try {
    await prisma.schoolCreditUsage.create({
      data: {
        userId,
        schoolId,
        feature,
        cost,
        metadata,
      },
    });
    return true;
  } catch (error) {
    console.error('recordCreditUsage: Failed to create usage record', error);
    return false;
  }
}

export interface UsageSummaryItem {
  feature: string;
  totalCost: number;
  count: number;
}

/**
 * Returns aggregated usage summary per feature for a school in a date range (inclusive).
 */
export async function getSchoolUsageSummary(
  schoolId: string,
  options?: { start?: Date; end?: Date }
): Promise<UsageSummaryItem[]> {
  const where: Parameters<typeof prisma.schoolCreditUsage.groupBy>[0]['where'] = {
    schoolId,
  };

  if (options?.start || options?.end) {
    where.createdAt = {};
    if (options.start) where.createdAt.gte = options.start;
    if (options.end) where.createdAt.lte = options.end;
  }

  const rows = await prisma.schoolCreditUsage.groupBy({
    by: ['feature'],
    where,
    _sum: { cost: true },
    _count: { _all: true },
  });

  return rows.map((r) => ({
    feature: r.feature,
    totalCost: r._sum.cost ?? 0,
    count: r._count._all ?? 0,
  }));
}


