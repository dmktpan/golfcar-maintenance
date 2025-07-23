import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// GET - ดึงข้อมูลงานทั้งหมด
export async function GET() {
  try {
    const jobs = await prisma.job.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Jobs retrieved successfully',
      data: jobs
    }, { status: 200 });

  } catch (error: unknown) {
    console.error('Error fetching jobs:', error);
    let errorMessage = 'An unknown error occurred.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch jobs',
      error: errorMessage
    }, { status: 500 });
  }
}

// POST - สร้างงานใหม่
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      type, 
      status, 
      vehicle_id, 
      vehicle_number, 
      golf_course_id, 
      user_id, 
      userName, 
      system, 
      subTasks, 
      parts, 
      partsNotes, 
      remarks, 
      bmCause, 
      battery_serial, 
      assigned_by, 
      assigned_by_name, 
      assigned_to, 
      created_at, 
      updated_at 
    } = body;

    // Validation
    if (!type || !status || !vehicle_id || !vehicle_number || !golf_course_id || !user_id || !userName) {
      return NextResponse.json({
        success: false,
        message: 'Type, status, vehicle_id, vehicle_number, golf_course_id, user_id, and userName are required'
      }, { status: 400 });
    }

    if (!['PM', 'BM', 'Recondition'].includes(type)) {
      return NextResponse.json({
        success: false,
        message: 'Type must be PM, BM, or Recondition'
      }, { status: 400 });
    }

    if (!['pending', 'in_progress', 'completed', 'assigned', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json({
        success: false,
        message: 'Status must be pending, in_progress, completed, assigned, approved, or rejected'
      }, { status: 400 });
    }

    if (bmCause && !['breakdown', 'accident'].includes(bmCause)) {
      return NextResponse.json({
        success: false,
        message: 'BM cause must be breakdown or accident'
      }, { status: 400 });
    }

    const job = await prisma.job.create({
      data: {
        type,
        status,
        vehicle_id: parseInt(vehicle_id),
        vehicle_number: vehicle_number.trim(),
        golf_course_id: parseInt(golf_course_id),
        user_id: parseInt(user_id),
        userName: userName.trim(),
        system: system?.trim(),
        subTasks: subTasks || [],
        parts: parts || [],
        partsNotes: partsNotes?.trim(),
        remarks: remarks?.trim(),
        bmCause: bmCause,
        battery_serial: battery_serial?.trim(),
        assigned_by: assigned_by ? parseInt(assigned_by) : null,
        assigned_by_name: assigned_by_name?.trim(),
        assigned_to: assigned_to ? parseInt(assigned_to) : null,
        created_at: created_at?.trim(),
        updated_at: updated_at?.trim()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Job created successfully',
      data: job
    }, { status: 201 });

  } catch (error: unknown) {
    console.error('Error creating job:', error);
    let errorMessage = 'An unknown error occurred.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({
      success: false,
      message: 'Failed to create job',
      error: errorMessage
    }, { status: 500 });
  }
}