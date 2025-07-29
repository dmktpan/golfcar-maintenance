import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { isValidObjectId } from '@/lib/utils/validation';

// GET - ดึงข้อมูลงานตาม ID
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    
    // ตรวจสอบ ObjectID
    if (!isValidObjectId(id)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid job ID format'
      }, { status: 400 });
    }
    
    const job = await prisma.job.findUnique({
      where: { id }
    });

    if (!job) {
      return NextResponse.json({
        success: false,
        message: 'Job not found'
      }, { status: 404 });
    }

    console.log('Found job data:', {
      id: job.id,
      type: job.type,
      status: job.status,
      vehicle_id: job.vehicle_id,
      vehicle_number: job.vehicle_number,
      golf_course_id: job.golf_course_id,
      user_id: job.user_id,
      userName: job.userName
    });

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
    
    // ตรวจสอบ ObjectID
    if (!isValidObjectId(id)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid job ID format'
      }, { status: 400 });
    }
    
    const body = await request.json();
    console.log('Received job update data:', body);

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

    console.log('Extracted required fields:', {
      type,
      status,
      vehicle_id,
      vehicle_number,
      golf_course_id,
      user_id,
      userName
    });

    // Basic validation for job type and status
    if (type && !['PM', 'BM', 'Recondition'].includes(type)) {
      console.log('Validation failed: Invalid job type:', type);
      return NextResponse.json({
        success: false,
        message: 'Type must be PM, BM, or Recondition'
      }, { status: 400 });
    }

    if (status && !['pending', 'in_progress', 'completed', 'assigned', 'approved', 'rejected'].includes(status)) {
      console.log('Validation failed: Invalid status:', status);
      return NextResponse.json({
        success: false,
        message: 'Status must be pending, in_progress, completed, assigned, approved, or rejected'
      }, { status: 400 });
    }

    if (bmCause && !['breakdown', 'accident'].includes(bmCause)) {
      console.log('Validation failed: Invalid bmCause:', bmCause);
      return NextResponse.json({
        success: false,
        message: 'BM cause must be breakdown or accident'
      }, { status: 400 });
    }

    // สร้างข้อมูลสำหรับ Prisma
    const updateData: any = {
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

    // ใช้ transaction เพื่อจัดการ parts และ serial history
    const job = await prisma.$transaction(async (tx) => {
      // ดึงข้อมูลงานเก่าก่อนอัปเดต
      const oldJob = await tx.job.findUnique({
        where: { id },
        include: { parts: true }
      });

      if (!oldJob) {
        throw new Error('Job not found');
      }

      console.log('Old job data:', {
        id: oldJob.id,
        type: oldJob.type,
        status: oldJob.status,
        vehicle_id: oldJob.vehicle_id,
        vehicle_number: oldJob.vehicle_number,
        golf_course_id: oldJob.golf_course_id,
        user_id: oldJob.user_id,
        userName: oldJob.userName
      });

      // ใช้ข้อมูลเดิมหากไม่มีข้อมูลใหม่
      const finalData = {
        type: type || oldJob.type,
        status: status || oldJob.status,
        vehicle_id: vehicle_id || oldJob.vehicle_id,
        vehicle_number: vehicle_number?.trim() || oldJob.vehicle_number,
        golf_course_id: golf_course_id || oldJob.golf_course_id,
        user_id: user_id || oldJob.user_id,
        userName: userName?.trim() || oldJob.userName,
        system: system?.trim() || oldJob.system,
        subTasks: subTasks || oldJob.subTasks || [],
        remarks: remarks?.trim() || oldJob.remarks,
        bmCause: bmCause || oldJob.bmCause,
        battery_serial: battery_serial?.trim() || oldJob.battery_serial,
        assigned_to: assigned_to || oldJob.assigned_to,
        partsNotes: partsNotes?.trim() || oldJob.partsNotes,
        images: images || oldJob.images || []
      };

      console.log('Final update data:', finalData);

      // Validation หลังจากรวมข้อมูลเดิม
      if (!finalData.type || !finalData.status || !finalData.vehicle_id || 
          !finalData.golf_course_id || !finalData.user_id) {
        console.log('Validation failed after merging with old data');
        throw new Error('Missing required fields even after merging with existing data');
      }

      // อัปเดตงานก่อน
      const updatedJob = await tx.job.update({
        where: { id },
        data: finalData
      });

      // จัดการ parts ถ้ามีการส่งมา
      if (parts && Array.isArray(parts)) {
        // ลบ parts เก่าทั้งหมด
        await tx.jobPart.deleteMany({
          where: { jobId: id }
        });

        // เพิ่ม parts ใหม่
        if (parts.length > 0) {
          await tx.jobPart.createMany({
            data: parts.map((part: any) => ({
              jobId: id,
              part_id: part.part_id,
              part_name: part.part_name || '',
              quantity_used: part.quantity_used || 1
            }))
          });
        }
      }

      // บันทึก Serial History สำหรับการเปลี่ยนแปลงงาน
      const changes: string[] = [];
      
      if (oldJob.status !== updatedJob.status) {
        changes.push(`สถานะ: ${oldJob.status} → ${updatedJob.status}`);
      }
      if (oldJob.type !== updatedJob.type) {
        changes.push(`ประเภทงาน: ${oldJob.type} → ${updatedJob.type}`);
      }
      if (oldJob.system !== updatedJob.system) {
        changes.push(`ระบบ: ${oldJob.system || 'ไม่ระบุ'} → ${updatedJob.system || 'ไม่ระบุ'}`);
      }
      if (oldJob.assigned_to !== updatedJob.assigned_to) {
        changes.push(`ผู้รับผิดชอบ: ${oldJob.assigned_to || 'ไม่ระบุ'} → ${updatedJob.assigned_to || 'ไม่ระบุ'}`);
      }
      
      if (changes.length > 0) {
        // ดึงข้อมูลรถเพื่อใช้ใน Serial History
        const vehicle = await tx.vehicle.findUnique({
          where: { id: updatedJob.vehicle_id }
        });

        if (vehicle) {
          await tx.serialHistoryEntry.create({
            data: {
              serial_number: vehicle.serial_number,
              vehicle_number: updatedJob.vehicle_number || vehicle.vehicle_number,
              action_type: 'maintenance',
              action_date: new Date(),
              details: `อัปเดตงาน ${updatedJob.type} - ${changes.join(', ')}`,
              is_active: true,
              status: updatedJob.status,
              job_type: updatedJob.type,
              golf_course_name: vehicle.golf_course_name,
              vehicle_id: vehicle.id,
              performed_by_id: '68885b9f2853f6353e4b2145', // admin000 ObjectID
              related_job_id: updatedJob.id
            }
          });
        }
      }

      // ดึงข้อมูลงานพร้อม parts
      return await tx.job.findUnique({
        where: { id },
        include: {
          parts: true
        }
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Job updated successfully',
      data: job
    }, { status: 200 });

  } catch (error: unknown) {
    console.error('Error updating job:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
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

    // ตรวจสอบ ObjectID
    if (!isValidObjectId(id)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid job ID format'
      }, { status: 400 });
    }

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