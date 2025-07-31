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
            vehicle_number: vehicle_number || vehicle.vehicle_number || '',
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

// PUT - อัพเดทงาน
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { 
      id,
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
    if (!id) {
      return NextResponse.json({
        success: false,
        message: 'Job ID is required'
      }, { status: 400 });
    }

    if (status && !['pending', 'in_progress', 'completed', 'assigned', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json({
        success: false,
        message: 'Status must be pending, in_progress, completed, assigned, approved, or rejected'
      }, { status: 400 });
    }

    // สร้างข้อมูลสำหรับอัพเดท
    const updateData: any = {};
    
    if (type !== undefined) updateData.type = type;
    if (status !== undefined) updateData.status = status;
    if (vehicle_id !== undefined) updateData.vehicle_id = vehicle_id;
    if (vehicle_number !== undefined) updateData.vehicle_number = vehicle_number?.trim();
    if (golf_course_id !== undefined) updateData.golf_course_id = golf_course_id;
    if (user_id !== undefined) updateData.user_id = user_id;
    if (userName !== undefined) updateData.userName = userName?.trim();
    if (system !== undefined) updateData.system = system?.trim();
    if (subTasks !== undefined) updateData.subTasks = subTasks;
    if (remarks !== undefined) updateData.remarks = remarks?.trim();
    if (bmCause !== undefined) updateData.bmCause = bmCause;
     if (battery_serial !== undefined) updateData.battery_serial = battery_serial?.trim();
     if (assigned_to !== undefined) updateData.assigned_to = assigned_to || null;
     if (partsNotes !== undefined) updateData.partsNotes = partsNotes?.trim();
     if (images !== undefined) updateData.images = images;

    updateData.updatedAt = new Date();

    // ใช้ transaction เพื่ออัพเดทงานและบันทึก Serial History
    const job = await prisma.$transaction(async (tx) => {
      // ดึงข้อมูลงานเดิมก่อนอัพเดท
      const existingJob = await tx.job.findUnique({
        where: { id: id },
        include: { parts: true }
      });

      if (!existingJob) {
        throw new Error('Job not found');
      }

      // อัพเดทงาน
      const updatedJob = await tx.job.update({
        where: { id: id },
        data: updateData,
        include: { parts: true }
      });

      // บันทึก Serial History หากมีการเปลี่ยนแปลงสถานะ
      if (status && status !== existingJob.status) {
        const vehicle = await tx.vehicle.findUnique({
          where: { id: updatedJob.vehicle_id }
        });

        if (vehicle) {
          await tx.serialHistoryEntry.create({
            data: {
              serial_number: vehicle.serial_number,
              vehicle_number: updatedJob.vehicle_number || vehicle.vehicle_number || '',
              action_type: 'status_change',
              action_date: new Date(),
              details: `เปลี่ยนสถานะงาน ${updatedJob.type} จาก ${existingJob.status} เป็น ${status}${assigned_to ? `, ผู้รับผิดชอบ: ${assigned_to}` : ''}`,
              is_active: true,
              status: status,
              job_type: updatedJob.type,
              golf_course_name: vehicle.golf_course_name,
              vehicle_id: vehicle.id,
              performed_by_id: user_id || updatedJob.user_id,
              related_job_id: updatedJob.id
            }
          });
        }
      }

      return updatedJob;
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