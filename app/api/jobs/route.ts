import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';
import { generateMWRCode } from '@/lib/utils/mwr-generator';
import { consumeStockForJob, StockError } from '@/lib/stock';

export const dynamic = 'force-dynamic';

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
      // ไม่ throw error เพื่อไม่ให้กระทบต่อการสร้าง job หลัก
    }
  } catch (error) {
    console.error('❌ Error sending Serial History to External API:', error);
    // ไม่ throw error เพื่อไม่ให้กระทบต่อการสร้าง job หลัก
  }
}


// GET - ดึงข้อมูลงานทั้งหมด
export async function GET() {
  try {
    const jobs = await prisma.job.findMany({
      include: {
        parts: true,
        mwrVehicleItems: true
      } as any,
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
      images,
      mwrVehicleItems
    } = body;

    // Validation
    // สำหรับ Part Request (MWR) ไม่จำเป็นต้องมี vehicle_id, vehicle_number
    const isPartRequest = type === 'PART_REQUEST';

    if (!type || !status ||
      (!isPartRequest && !vehicle_id) ||
      (!isPartRequest && !vehicle_number) ||
      !golf_course_id || !user_id || !userName) {
      return NextResponse.json({
        success: false,
        message: 'Type, status, vehicle_id, vehicle_number, golf_course_id, user_id, and userName are required'
      }, { status: 400 });
    }

    if (!['PM', 'BM', 'Recondition', 'PART_REQUEST'].includes(type)) {
      return NextResponse.json({
        success: false,
        message: 'Type must be PM, BM, Recondition, or PART_REQUEST'
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

    // Generate MWR Code if type is PART_REQUEST
    if (type === 'PART_REQUEST') {
      jobData.mwr_code = await generateMWRCode();
    }

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

    // เพิ่ม mwrVehicleItems relation สำหรับ PART_REQUEST
    if (type === 'PART_REQUEST' && mwrVehicleItems && Array.isArray(mwrVehicleItems) && mwrVehicleItems.length > 0) {
      jobData.mwrVehicleItems = {
        create: mwrVehicleItems.map((item: any) => ({
          vehicle_id: item.vehicle_id,
          vehicle_number: item.vehicle_number || '',
          serial_number: item.serial_number || '',
          vehicle_type: item.vehicle_type || null,
          part_id: item.part_id,
          part_name: item.part_name || '',
          part_number: item.part_number || null,
          quantity: item.quantity || 1
        }))
      };
    }

    // ใช้ transaction เพื่อสร้างงานและบันทึก Serial History
    const job = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // สร้างงานใหม่
      const newJob = await tx.job.create({
        data: jobData,
        include: {
          parts: true,
          mwrVehicleItems: true
        } as any
      });

      // ดึงข้อมูลรถเพื่อใช้ใน Serial History (ถ้ามี vehicle_id)
      let vehicle = null;
      if (vehicle_id) {
        vehicle = await tx.vehicle.findUnique({
          where: { id: vehicle_id }
        });
      }

      if (vehicle) {
        // เตรียมข้อมูลอะไหล่สำหรับ Serial History
        const partsUsed = parts && Array.isArray(parts) && parts.length > 0
          ? parts.map((part: any) => `${part.part_name} (จำนวน: ${part.quantity_used || 1})`)
          : [];

        // บันทึก Serial History เฉพาะการเปิดจ๊อบใหม่เท่านั้น
        await tx.serialHistoryEntry.create({
          data: {
            serial_number: vehicle.serial_number,
            vehicle_number: vehicle_number || vehicle.vehicle_number || '',
            action_type: 'maintenance',
            action_date: new Date(),
            details: `เปิดงาน ${type} ใหม่${system ? ` - ระบบ: ${system}` : ''}`,
            is_active: true,
            status: status,
            job_type: type,
            golf_course_name: vehicle.golf_course_name,
            parts_used: partsUsed,
            system: system,
            vehicle_id: vehicle.id,
            performed_by_id: user_id,
            related_job_id: newJob.id
          }
        });

        // ส่งข้อมูล Serial History ไปยัง External API (ไม่รอผลลัพธ์)
        setImmediate(() => {
          sendSerialHistoryToExternalAPI({
            serial_number: vehicle.serial_number,
            vehicle_number: vehicle_number || vehicle.vehicle_number || '',
            action_type: 'maintenance',
            action_date: new Date().toISOString(),
            details: `เปิดงาน ${type} ใหม่${system ? ` - ระบบ: ${system}` : ''}`,
            is_active: true,
            status: status,
            job_type: type,
            golf_course_name: vehicle.golf_course_name,
            parts_used: partsUsed,
            system: system,
            vehicle_id: vehicle.id,
            performed_by_id: user_id,
            related_job_id: newJob.id
          });
        });
      }

      return newJob;
    }, {
      maxWait: 5000,
      timeout: 20000,
    });

    // --- Notification Logic ---
    // Find supervisors for this golf course
    try {
      const supervisors = await prisma.user.findMany({
        where: {
          role: 'supervisor',
          managed_golf_courses: {
            has: golf_course_id
          }
        }
      });

      // Also notify Admins/Central if needed, or specific roles.
      // For now, focusing on Supervisors as requested.

      if (supervisors.length > 0) {
        const notificationPromises = supervisors.map(supervisor =>
          prisma.notification.create({
            data: {
              userId: supervisor.id,
              title: 'งานใหม่ถูกสร้าง',
              message: `มีการสร้างงาน ${type} ที่สนาม ${jobData.golf_course_name || 'ไม่ระบุ'} โดย ${userName} (${vehicle_number})`,
              type: 'info',
              link: '', // Could link to specific job view if available
              isRead: false
            }
          })
        );
        await Promise.all(notificationPromises);
      }
    } catch (notifyError) {
      console.error('Failed to send notifications:', notifyError);
      // Don't fail the request if notification fails
    }
    // --------------------------

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
      images,
      // ข้อมูลผู้อนุมัติ
      approved_by_id,
      approved_by_name,
      rejection_reason
    } = body;

    // Validation
    if (!id) {
      return NextResponse.json({
        success: false,
        message: 'Job ID is required'
      }, { status: 400 });
    }

    if (status && !['pending', 'in_progress', 'completed', 'assigned', 'approved', 'rejected', 'stock_pending'].includes(status)) {
      return NextResponse.json({
        success: false,
        message: 'Status must be pending, in_progress, completed, assigned, approved, rejected, or stock_pending'
      }, { status: 400 });
    }

    // สำหรับ PART_REQUEST (MWR) ถ้าส่งมาเป็น approved ให้เปลี่ยนสถานะเป็น stock_pending แทน
    let finalStatus = status;
    if (type === 'PART_REQUEST' && status === 'approved') {
      finalStatus = 'stock_pending';
    }

    // สร้างข้อมูลสำหรับอัพเดท
    const updateData: any = {};

    if (type !== undefined) updateData.type = type;
    if (finalStatus !== undefined) updateData.status = finalStatus;
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

    // เพิ่มข้อมูลผู้อนุมัติเมื่อสถานะเปลี่ยนเป็นการอนุมัติขั้นต้น หรือถูกปฏิเสธ
    if (finalStatus === 'approved' || finalStatus === 'stock_pending' || finalStatus === 'rejected') {
      updateData.approved_by_id = approved_by_id || null;
      updateData.approved_by_name = approved_by_name?.trim() || null;
      updateData.approved_at = new Date();
      if (finalStatus === 'rejected') {
        updateData.rejection_reason = rejection_reason?.trim() || null;
      }
    }

    updateData.updatedAt = new Date();

    // ใช้ transaction เพื่ออัพเดทงานและบันทึก Serial History
    const job = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // ดึงข้อมูลงานเดิมก่อนอัพเดท
      const existingJob = await tx.job.findUnique({
        where: { id: id },
        include: { parts: true }
      });

      if (!existingJob) {
        throw new Error('Job not found');
      }

      // Check for Approval & execute Stock Logic (เฉพาะงานประเภทอื่นที่ไม่ใช่ PART_REQUEST)
      if (finalStatus === 'approved' && existingJob.status !== 'approved') {
        if ((existingJob.type as string) === 'PART_REQUEST') {
          // [UPDATED FLOW]: ไม่ทำการตัดสต๊อกตรงนี้แล้ว ปล่อยให้สถานะเป็น stock_pending เพื่อให้ฝ่ายสต๊อกทำงานต่อ
          // แจ้งเตือนหรือดำเนินการอะไรเพิ่มเติมได้ (แต่อย่าตัดสต๊อกทันที)
        } else {
          // 2. Regular Job Approval -> Consume Stock (Site -> Used)
          // Use updated parts if provided, otherwise existing parts
          // BUT, waiting: updateData hasn't been applied yet.
          // If we use existingJob.parts, we miss any parts updates in this PUT.
          // If parts is in body, use it.

          let partsToConsume: any[] = existingJob.parts;

          if (parts && Array.isArray(parts)) {
            // If parts update is provided, we must use the NEW list.
            // But the job hasn't been updated yet in DB!
            // So we pass the request body parts.
            partsToConsume = parts.map((p: any) => ({
              partId: p.part_id,
              quantity: p.quantity_used || 1,
              // mock keys for logic check
              partName: p.part_name || ''
            }));
          } else {
            // Adapt existing parts to required format
            partsToConsume = existingJob.parts.map(p => ({
              partId: p.part_id,
              quantity: p.quantity_used,
              partName: p.part_name
            }));
          }

          await consumeStockForJob(id, partsToConsume, golf_course_id || existingJob.golf_course_id, user_id || existingJob.user_id, tx);
        }
      }

      // อัพเดทอะไหล่ (parts) — ลบของเก่าแล้วสร้างใหม่ทั้งหมดถ้ามีส่งมา
      if (parts !== undefined && Array.isArray(parts)) {
        // ลบอะไหล่เก่า
        await tx.jobPart.deleteMany({
          where: { jobId: id }
        });

        // สร้างอะไหล่ใหม่ (ถ้ามี)
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

      // อัพเดทงาน
      const updatedJob = await tx.job.update({
        where: { id: id },
        data: updateData,
        include: { parts: true }
      });

      // บันทึก Serial History เฉพาะสถานะสำคัญ: assigned (ส่งงาน), approved (อนุมัติ), และ stock_pending โดยเปลี่ยนเป็น log status เดิมไปแทนก่อน
      if (finalStatus && finalStatus !== existingJob.status && (finalStatus === 'assigned' || finalStatus === 'approved' || finalStatus === 'stock_pending')) {
        let vehicle = null;
        if (updatedJob.vehicle_id) {
          vehicle = await tx.vehicle.findUnique({
            where: { id: updatedJob.vehicle_id }
          });
        }

        if (vehicle) {
          // เตรียมข้อมูลอะไหล่สำหรับ Serial History (เฉพาะเมื่อ approved หรือ stock_pending)
          const isApprovedPhase = finalStatus === 'approved' || finalStatus === 'stock_pending';
          const partsUsed = isApprovedPhase && parts && Array.isArray(parts) && parts.length > 0
            ? parts.map((part: any) => `${part.part_name} (จำนวน: ${part.quantity_used || 1})`)
            : isApprovedPhase && updatedJob.parts && updatedJob.parts.length > 0
              ? updatedJob.parts.map((part: any) => `${part.part_name} (จำนวน: ${part.quantity_used})`)
              : [];

          let actionDescription = 'อัพเดทสถานะงาน';
          if (finalStatus === 'assigned') actionDescription = 'ส่งงาน';
          else if (finalStatus === 'approved') actionDescription = 'อนุมัติงาน';
          else if (finalStatus === 'stock_pending') actionDescription = 'อนุมัติและรอโอนคลัง (Stock Pending)';

          await tx.serialHistoryEntry.create({
            data: {
              serial_number: vehicle.serial_number,
              vehicle_number: updatedJob.vehicle_number || vehicle.vehicle_number || '',
              action_type: 'status_change',
              action_date: new Date(),
              details: `${actionDescription} ${updatedJob.type}${assigned_to ? ` - ผู้รับผิดชอบ: ${assigned_to}` : ''}`,
              is_active: true,
              status: finalStatus,
              job_type: updatedJob.type,
              golf_course_name: vehicle.golf_course_name,
              parts_used: partsUsed,
              system: system || updatedJob.system,
              vehicle_id: vehicle.id,
              performed_by_id: user_id || updatedJob.user_id,
              related_job_id: updatedJob.id
            }
          });

          // ส่งข้อมูล Serial History ไปยัง External API (ไม่รอผลลัพธ์)
          setImmediate(() => {
            sendSerialHistoryToExternalAPI({
              serial_number: vehicle.serial_number,
              vehicle_number: updatedJob.vehicle_number || vehicle.vehicle_number || '',
              action_type: 'status_change',
              action_date: new Date().toISOString(),
              details: `${actionDescription} ${updatedJob.type}${assigned_to ? ` - ผู้รับผิดชอบ: ${assigned_to}` : ''}`,
              is_active: true,
              status: finalStatus,
              job_type: updatedJob.type,
              golf_course_name: vehicle.golf_course_name,
              parts_used: partsUsed,
              system: system || updatedJob.system,
              vehicle_id: vehicle.id,
              performed_by_id: user_id || updatedJob.user_id,
              related_job_id: updatedJob.id
            });
          });
        }
      }

      return updatedJob;
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

    // Handle Stock Error specifically
    if (error instanceof StockError) {
      return NextResponse.json({
        success: false,
        message: error.message
      }, { status: 400 });
    }

    let errorMessage = 'An unknown error occurred.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    // Handle Stock Errors gracefully
    if (errorMessage.includes('Insufficient stock') || errorMessage.includes('StockError')) {
      return NextResponse.json({
        success: false,
        message: errorMessage, // Send specific stock error to UI
        error: errorMessage
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      message: 'Failed to update job',
      error: errorMessage
    }, { status: 500 });
  }
}