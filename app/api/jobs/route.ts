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
      remarks, 
      bmCause, 
      battery_serial, 
      assigned_to,
      parts,
      partsNotes,
      images
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

    // สร้างข้อมูลสำหรับ Prisma
    const jobData: any = {
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
      assigned_to: assigned_to || null,
      partsNotes: partsNotes?.trim(),
      images: images || []
    };

    // เพิ่ม parts relation ถ้ามีข้อมูล
    if (parts && Array.isArray(parts) && parts.length > 0) {
      jobData.parts = {
        create: parts.map((part: any) => ({
          part_id: part.part_id,
          part_name: part.part_name || '',
          quantity_used: part.quantity_used || 1
        }))
      };
    }

    // ใช้ transaction เพื่อสร้างงานและบันทึก Serial History
    const job = await prisma.$transaction(async (tx) => {
      // สร้างงานใหม่
      const newJob = await tx.job.create({
        data: jobData,
        include: {
          parts: true
        }
      });

      // ดึงข้อมูลรถเพื่อใช้ใน Serial History
      const vehicle = await tx.vehicle.findUnique({
        where: { id: vehicle_id }
      });

      if (vehicle) {
        // บันทึก Serial History สำหรับการสร้างงานใหม่
        await tx.serialHistoryEntry.create({
          data: {
            serial_number: vehicle.serial_number,
            vehicle_number: vehicle_number,
            action_type: 'maintenance',
            action_date: new Date(),
            details: `สร้างงาน ${type} ใหม่ - สถานะ: ${status}${system ? `, ระบบ: ${system}` : ''}${assigned_to ? `, ผู้รับผิดชอบ: ${assigned_to}` : ''}`,
            is_active: true,
            status: status,
            job_type: type,
            golf_course_name: vehicle.golf_course_name,
            vehicle_id: vehicle.id,
            performed_by_id: user_id,
            related_job_id: newJob.id
          }
        });
      }

      return newJob;
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