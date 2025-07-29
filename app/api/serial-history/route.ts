import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// GET - ดึงข้อมูลประวัติซีเรียลทั้งหมด
export async function GET() {
  try {
    const serialHistory = await prisma.serialHistoryEntry.findMany({
      where: {
        serial_number: {
          not: ""
        }
      },
      orderBy: {
        action_date: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Serial history retrieved successfully',
      data: serialHistory
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
      error: errorMessage
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
      performed_by, 
      performed_by_id, 
      golf_course_id, 
      golf_course_name, 
      is_active, 
      related_job_id, 
      job_type, 
      status, 
      change_type
    } = body;

    // Validation
    if (!serial_number || !vehicle_id || !vehicle_number || !action_type || !action_date || !details || !performed_by || !performed_by_id || !golf_course_id || !golf_course_name || is_active === undefined) {
      return NextResponse.json({
        success: false,
        message: 'Required fields: serial_number, vehicle_id, vehicle_number, action_type, action_date, details, performed_by, performed_by_id, golf_course_id, golf_course_name, is_active'
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