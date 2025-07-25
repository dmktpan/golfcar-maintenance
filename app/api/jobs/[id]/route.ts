import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// GET - ดึงข้อมูลงานตาม ID
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    
    const job = await prisma.job.findUnique({
      where: { id }
    });

    if (!job) {
      return NextResponse.json({
        success: false,
        message: 'Job not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Job retrieved successfully',
      data: job
    }, { status: 200 });

  } catch (error: unknown) {
    console.error('Error fetching job:', error);
    let errorMessage = 'An unknown error occurred.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch job',
      error: errorMessage
    }, { status: 500 });
  }
}

// PUT - อัปเดตข้อมูลงาน
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
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
      remarks, 
      bmCause, 
      battery_serial, 
      assigned_to
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

    const job = await prisma.job.update({
      where: { id },
      data: {
        type,
        status,
        vehicle_id: vehicle_id,
        vehicle_number: vehicle_number?.trim(),
        golf_course_id: golf_course_id,
        user_id: user_id,
        userName: userName?.trim(),
        system: system?.trim(),
        subTasks: subTasks || [],
        remarks: remarks?.trim(),
        bmCause: bmCause,
        battery_serial: battery_serial?.trim(),
        assigned_to: assigned_to || null
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Job updated successfully',
      data: job
    }, { status: 200 });

  } catch (error: unknown) {
    console.error('Error updating job:', error);
    let errorMessage = 'An unknown error occurred.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({
      success: false,
      message: 'Failed to update job',
      error: errorMessage
    }, { status: 500 });
  }
}

// DELETE - ลบงาน
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;

    await prisma.job.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Job deleted successfully'
    }, { status: 200 });

  } catch (error: unknown) {
    console.error('Error deleting job:', error);
    let errorMessage = 'An unknown error occurred.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({
      success: false,
      message: 'Failed to delete job',
      error: errorMessage
    }, { status: 500 });
  }
}