
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const locationId = searchParams.get('locationId');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const limit = parseInt(searchParams.get('limit') || '50');

        // Build filter conditions
        const where: any = {};

        // Filter by Location
        if (locationId === 'central') {
            where.location_id = null;
        } else if (locationId) {
            where.location_id = locationId;
        }

        // Filter by Date Range
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) {
                where.createdAt.gte = new Date(startDate);
            }
            if (endDate) {
                // Set end date to end of day if looking at a specific date range
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                where.createdAt.lte = end;
            }
        }

        const transactions = await prisma.stockTransaction.findMany({
            where: where,
            include: {
                part: {
                    select: {
                        id: true,
                        name: true,
                        part_number: true,
                        unit: true
                    }
                },
                user: { // user_id relation
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: limit
        });

        return NextResponse.json({
            success: true,
            data: transactions
        });

    } catch (error) {
        console.error('Error fetching stock transactions:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch transactions' },
            { status: 500 }
        );
    }
}
