import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// GET - ดึงประวัติการเปลี่ยนสัญญา (filtering by action_type = agreement_change)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100;

    const historyLogs = await prisma.serialHistoryEntry.findMany({
      where: {
        action_type: 'agreement_change'
      },
      include: {
        vehicle: {
          select: {
            id: true,
            vehicle_number: true,
            serial_number: true,
            brand: true,
            model: true,
            year: true
          }
        },
        performed_by: {
          select: {
            id: true,
            name: true,
            username: true
          }
        }
      },
      orderBy: {
        action_date: 'desc'
      },
      take: limit
    });

    return NextResponse.json({
      success: true,
      message: 'Agreement history retrieved successfully',
      data: historyLogs,
      count: historyLogs.length
    }, { status: 200 });

  } catch (error: unknown) {
    console.error('Error fetching agreement history:', error);
    let errorMessage = 'An unknown error occurred.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch agreement history',
      error: errorMessage
    }, { status: 500 });
  }
}
