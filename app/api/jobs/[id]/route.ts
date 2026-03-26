import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';
import { isValidObjectId } from '@/lib/utils/validation';
import { approvePartRequest, consumeStockForJob } from '@/lib/stock';

const EXTERNAL_API_BASE = process.env.EXTERNAL_API_BASE_URL || 'http://golfcar.go2kt.com:8080/api';

// ฟังก์ชันสำหรับส่งข้อมูล Serial History ไปยัง External API
async function sendSerialHistoryToExternalAPI(serialHistoryData: any) {
  try {
    console.log('🔄 Sending Serial History to External API...');
    console.log('📝 Serial History data:', JSON.stringify(serialHistoryData, null, 2));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(`${EXTERNAL_API_BASE}/serial-history`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...serialHistoryData,
        system: serialHistoryData.system || 'job_activity'
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Serial History sent to External API successfully');
      return result;
    } else {
      console.log('❌ External API failed with status:', response.status);
      const errorText = await response.text();
      console.log('❌ Error response:', errorText);
      // ไม่ throw error เพื่อไม่ให้กระทบต่อการอัปเดต job หลัก
    }
  } catch (error) {
    console.error('❌ Error sending Serial History to External API:', error);
    // ไม่ throw error เพื่อไม่ให้กระทบต่อการอัปเดต job หลัก
  }
}

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
    console.log('🏠 PUT /api/jobs/[id] - Job ID:', id);

    // ตรวจสอบ ObjectID
    if (!isValidObjectId(id)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid job ID format'
      }, { status: 400 });
    }

    const body = await request.json();
    console.log('📝 Local API Request body:', JSON.stringify(body, null, 2));

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
      images,
      // ข้อมูลผู้อนุมัติ
      approved_by_id,
      approved_by_name,
      rejection_reason
    } = body;

    console.log('🔍 Extracted fields:', {
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



    // ใช้ transaction เพื่อจัดการ parts และ serial history
    const job = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
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
        images: images || oldJob.images || [],

        // Approval fields logic
        approved_by_id: (status === 'approved' || status === 'rejected') ? (approved_by_id || null) : oldJob.approved_by_id,
        approved_by_name: (status === 'approved' || status === 'rejected') ? (approved_by_name?.trim() || null) : oldJob.approved_by_name,
        approved_at: (status === 'approved' || status === 'rejected') ? new Date() : oldJob.approved_at,
        rejection_reason: (status === 'rejected') ? (rejection_reason?.trim() || null) : (status === 'approved' ? null : oldJob.rejection_reason)
      };

      console.log('Final update data:', finalData);

      // Validation หลังจากรวมข้อมูลเดิม - ตรวจสอบเฉพาะฟิลด์ที่สำคัญ
      // PART_REQUEST ไม่จำเป็นต้องมี vehicle_id (เบิกอะไหล่ไม่ผูกกับรถเฉพาะคัน)
      const isPartRequestJob = finalData.type === 'PART_REQUEST';
      if (!finalData.type || !finalData.status || (!isPartRequestJob && !finalData.vehicle_id)) {
        console.log('Validation failed - missing critical fields:', {
          type: finalData.type,
          status: finalData.status,
          vehicle_id: finalData.vehicle_id
        });
        throw new Error('Missing critical fields: type, status, or vehicle_id');
      }

      // --- STOCK MANAGEMENT LOGIC ---
      // ตรวจสอบการอนุมัติงาน และตัด/ย้ายสต็อก
      if (oldJob.status !== 'approved' && finalData.status === 'approved') {
        console.log('⚡ Job is being APPROVED. Executing Stock Logic...', {
          jobId: id,
          type: finalData.type,
          golfCourseId: finalData.golf_course_id
        });

        try {
          if (finalData.type === 'PART_REQUEST') {
            // MWR: ย้ายของจากส่วนกลาง -> สนาม
            // Approve Part Request Logic
            await approvePartRequest(id, user_id || 'system', tx);
          } else if (['PM', 'BM', 'Recondition'].includes(finalData.type)) {
            // งานซ่อม: ตัดของจากสนาม
            console.log('📉 Consuming stock for Maintenance Job... id:', id);

            // เตรียมรายการอะไหล่
            let partsToConsume: { partId: string; quantity: number }[] = [];

            // กรณี 1: มีการส่ง parts มาใน request (แก้ไขอะไหล่พร้อมอนุมัติ)
            if (parts && Array.isArray(parts) && parts.length > 0) {
              partsToConsume = parts.map((p: any) => ({
                partId: p.part_id,
                quantity: p.quantity_used || 1
              }));
            }
            // กรณี 2: ไม่ได้ส่ง parts มา (ใช้อะไหล่เดิมใน DB)
            else if (oldJob.parts && oldJob.parts.length > 0) {
              partsToConsume = oldJob.parts.map(p => ({
                partId: p.part_id,
                quantity: p.quantity_used
              }));
            }

            if (partsToConsume.length > 0) {
              // เรียกใช้ consumeStockForJob
              // user_id ที่อนุมัติ (approved_by_id) หรือ user_id ของ request (คนกดอนุมัติ)
              const actorId = approved_by_id || user_id || oldJob.user_id;

              // ใช้ location ที่ส่งมา หรือจาก oldJob
              // แต่ถ้าเป็น PM/BM ต้องมาจาก site stock
              // golf_course_id คือ site ที่งานนี้อยู่

              await consumeStockForJob(
                id,
                partsToConsume,
                finalData.golf_course_id || oldJob.golf_course_id!,
                actorId,
                tx
              );
            } else {
              console.log('ℹ️ No parts to consume for this job.');
            }
          }
        } catch (stockError: any) {
          console.error('❌ Stock Logic Error:', stockError);
          // แปลง error เป็น bad request message เพื่อให้ client แสดง alert
          throw new Error(stockError.message || 'Stock management error');
        }
      }

      // อัปเดตงาน
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

      // บันทึก Serial History เฉพาะการเปลี่ยนแปลงสถานะสำคัญ: assigned และ approved เท่านั้น
      const statusChanged = oldJob.status !== updatedJob.status;
      const isImportantStatusChange = statusChanged && (updatedJob.status === 'assigned' || updatedJob.status === 'approved');

      if (isImportantStatusChange) {
        // ดึงข้อมูลรถเพื่อใช้ใน Serial History
        if (updatedJob.vehicle_id) {
          const vehicle = await tx.vehicle.findUnique({
            where: { id: updatedJob.vehicle_id }
          });

          // ... rest of logic moved inside or checked


          if (vehicle) {
            const actionDescription = updatedJob.status === 'assigned' ? 'ส่งงาน' : 'อนุมัติงาน';

            await tx.serialHistoryEntry.create({
              data: {
                serial_number: vehicle.serial_number,
                vehicle_number: updatedJob.vehicle_number || vehicle.vehicle_number,
                action_type: 'status_change',
                action_date: new Date(),
                details: `${actionDescription} ${updatedJob.type}${updatedJob.assigned_to ? ` - ผู้รับผิดชอบ: ${updatedJob.assigned_to}` : ''}`,
                is_active: true,
                status: updatedJob.status,
                job_type: updatedJob.type,
                golf_course_name: vehicle.golf_course_name,
                vehicle_id: vehicle.id,
                performed_by_id: '68885b9f2853f6353e4b2145', // admin000 ObjectID
                related_job_id: updatedJob.id
              }
            });

            // ส่งข้อมูล Serial History ไปยัง External API (ไม่รอผลลัพธ์)
            setImmediate(() => {
              sendSerialHistoryToExternalAPI({
                serial_number: vehicle.serial_number,
                vehicle_number: updatedJob.vehicle_number || vehicle.vehicle_number,
                action_type: 'status_change',
                action_date: new Date().toISOString(),
                details: `${actionDescription} ${updatedJob.type}${updatedJob.assigned_to ? ` - ผู้รับผิดชอบ: ${updatedJob.assigned_to}` : ''}`,
                is_active: true,
                status: updatedJob.status,
                job_type: updatedJob.type,
                golf_course_name: vehicle.golf_course_name,
                vehicle_id: vehicle.id,
                performed_by_id: '68885b9f2853f6353e4b2145', // admin000 ObjectID
                related_job_id: updatedJob.id
              });
            });
          }
        }
      }

      // ดึงข้อมูลงานพร้อม parts
      return await tx.job.findUnique({
        where: { id },
        include: {
          parts: true
        }
      });
    }, {
      maxWait: 5000,
      timeout: 20000,
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

    // ตรวจสอบว่างานมีอยู่จริงก่อนลบ
    const existingJob = await prisma.job.findUnique({
      where: { id }
    });

    if (!existingJob) {
      return NextResponse.json({
        success: false,
        message: 'Job not found or already deleted'
      }, { status: 404 });
    }

    // ลบข้อมูลที่เกี่ยวข้องก่อน (ถ้ามี)
    await prisma.jobPart.deleteMany({
      where: { jobId: id }
    });

    // อัปเดต SerialHistoryEntry ที่เกี่ยวข้อง
    await prisma.serialHistoryEntry.updateMany({
      where: { related_job_id: id },
      data: { related_job_id: null }
    });

    // ลบงาน
    await prisma.job.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Job deleted successfully'
    }, { status: 200 });

  } catch (error: unknown) {
    console.error('Error deleting job:', error);

    // จัดการ Prisma errors เฉพาะ
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return NextResponse.json({
          success: false,
          message: 'Job not found or already deleted'
        }, { status: 404 });
      }
    }

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