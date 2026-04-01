import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// GET - ดึงข้อมูลประวัติซีเรียล (Cursor-based Pagination)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Pagination params
    const cursor = searchParams.get('cursor') || undefined;
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500);
    
    // Filter params
    const search = searchParams.get('search') || undefined;
    const vehicleNumber = searchParams.get('vehicleNumber') || undefined;
    const actionType = searchParams.get('actionType') || undefined;
    const golfCourseId = searchParams.get('golfCourseId') || undefined;
    const dateFrom = searchParams.get('dateFrom') || undefined;
    const dateTo = searchParams.get('dateTo') || undefined;
    const showInactive = searchParams.get('showInactive') !== 'false'; // default true

    // Build where clause
    const where: any = {
      serial_number: { not: "" }
    };

    // Search by serial number
    if (search) {
      where.serial_number = {
        ...where.serial_number,
        contains: search,
        mode: 'insensitive'
      };
    }

    // Search by vehicle number
    if (vehicleNumber) {
      where.vehicle_number = {
        contains: vehicleNumber,
        mode: 'insensitive'
      };
    }

    // Filter by action type
    if (actionType) {
      where.action_type = actionType;
    }

    // Filter by golf course (via vehicle relation)
    if (golfCourseId) {
      where.vehicle = {
        golf_course_id: golfCourseId
      };
    }

    // Filter by date range
    if (dateFrom || dateTo) {
      where.action_date = {};
      if (dateFrom) {
        where.action_date.gte = new Date(dateFrom);
      }
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        where.action_date.lte = toDate;
      }
    }

    // Filter by active status
    if (!showInactive) {
      where.is_active = true;
    }

    // Build cursor-based query
    const findArgs: any = {
      where,
      take: limit + 1, // +1 เพื่อตรวจ hasMore
      select: {
        id: true,
        serial_number: true,
        vehicle_number: true,
        action_type: true,
        action_date: true,
        actual_transfer_date: true,
        details: true,
        is_active: true,
        status: true,
        job_type: true,
        golf_course_name: true,
        parts_used: true,
        system: true,
        vehicle_id: true,
        performed_by_id: true,
        related_job_id: true,
        createdAt: true,
        vehicle: {
          select: {
            id: true,
            golf_course_id: true,
            battery_serial: true,
            golfCourse: {
              select: {
                id: true,
                name: true
              }
            }
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
        action_date: 'desc' as const
      }
    };

    // Cursor-based pagination
    if (cursor) {
      findArgs.cursor = { id: cursor };
      findArgs.skip = 1; // Skip cursor item itself
    }

    const serialHistory = await prisma.serialHistoryEntry.findMany(findArgs);

    // Check if there are more results
    const hasMore = serialHistory.length > limit;
    const data = hasMore ? serialHistory.slice(0, limit) : serialHistory;
    const nextCursor = hasMore ? data[data.length - 1].id : null;

    // Transform data
    const transformedHistory = data.map((entry: any) => ({
      ...entry,
      golf_course_id: entry.vehicle?.golf_course_id,
      golf_course_name: entry.golf_course_name || entry.vehicle?.golfCourse?.name,
      battery_serial: entry.vehicle?.battery_serial,
      performed_by: entry.performed_by?.name || entry.performed_by?.username || null
    }));

    // Get total count (cached, only first page)
    let totalCount = undefined;
    if (!cursor) {
      totalCount = await prisma.serialHistoryEntry.count({ where });
    }

    return NextResponse.json({
      success: true,
      message: 'Serial history retrieved successfully',
      data: transformedHistory,
      pagination: {
        nextCursor,
        hasMore,
        limit,
        ...(totalCount !== undefined && { totalCount })
      }
    }, { status: 200 });

  } catch (error: unknown) {
    console.error('Error fetching serial history:', error);
    let errorMessage = 'An unknown error occurred.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch serial history',
      error: errorMessage,
      data: [],
      pagination: { nextCursor: null, hasMore: false, limit: 100 }
    }, { status: 500 });
  }
}

// POST - สร้างบันทึกประวัติซีเรียลใหม่
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      serial_number, 
      vehicle_id, 
      vehicle_number, 
      action_type, 
      action_date, 
      actual_transfer_date, 
      details, 
      performed_by_id, 
      golf_course_id, 
      golf_course_name, 
      is_active, 
      related_job_id, 
      job_type, 
      status, 
      change_type,
      parts_used,
      system
    } = body;

    // Validation
    if (!serial_number || !vehicle_id || !vehicle_number || !action_type || !action_date || !details || !performed_by_id || !golf_course_id || !golf_course_name || is_active === undefined) {
      return NextResponse.json({
        success: false,
        message: 'Required fields: serial_number, vehicle_id, vehicle_number, action_type, action_date, details, performed_by_id, golf_course_id, golf_course_name, is_active'
      }, { status: 400 });
    }

    const validActionTypes = ['registration', 'transfer', 'maintenance', 'decommission', 'inspection', 'status_change', 'data_edit', 'data_delete', 'bulk_transfer', 'bulk_upload'];
    if (!validActionTypes.includes(action_type)) {
      return NextResponse.json({
        success: false,
        message: `Action type must be one of: ${validActionTypes.join(', ')}`
      }, { status: 400 });
    }

    if (job_type && !['PM', 'BM', 'Recondition'].includes(job_type)) {
      return NextResponse.json({
        success: false,
        message: 'Job type must be PM, BM, or Recondition'
      }, { status: 400 });
    }

    if (status && !['completed', 'pending', 'in_progress', 'approved', 'assigned'].includes(status)) {
      return NextResponse.json({
        success: false,
        message: 'Status must be completed, pending, in_progress, approved, or assigned'
      }, { status: 400 });
    }

    if (change_type && !['create', 'update', 'delete', 'transfer', 'status_change'].includes(change_type)) {
      return NextResponse.json({
        success: false,
        message: 'Change type must be create, update, delete, transfer, or status_change'
      }, { status: 400 });
    }

    const serialHistoryEntry = await prisma.serialHistoryEntry.create({
      data: {
        serial_number: serial_number.trim(),
        vehicle_number: vehicle_number.trim(),
        action_type,
        action_date: action_date ? new Date(action_date) : new Date(),
        actual_transfer_date: actual_transfer_date ? new Date(actual_transfer_date) : null,
        details: details.trim(),
        is_active: Boolean(is_active),
        status: status || null,
        job_type: job_type || null,
        golf_course_name: golf_course_name.trim(),
        parts_used: parts_used || [],
        system: system || null,
        vehicle_id: vehicle_id.toString(),
        performed_by_id: performed_by_id.toString(),
        related_job_id: related_job_id ? related_job_id.toString() : null,
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Serial history entry created successfully',
      data: serialHistoryEntry
    }, { status: 201 });

  } catch (error: unknown) {
    console.error('Error creating serial history entry:', error);
    let errorMessage = 'An unknown error occurred.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({
      success: false,
      message: 'Failed to create serial history entry',
      error: errorMessage
    }, { status: 500 });
  }
}