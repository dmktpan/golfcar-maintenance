
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { PartsUsageLog } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
    try {
        // Fetch data from PartsUsageLog table directly
        const usageLogs = await prisma.partsUsageLog.findMany({
            orderBy: {
                usedDate: 'desc'
            }
        });

        return NextResponse.json({
            success: true,
            data: usageLogs
        });

    } catch (error) {
        console.error('Error fetching usage reports:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch usage reports' },
            { status: 500 }
        );
    }
}
