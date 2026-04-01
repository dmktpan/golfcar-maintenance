import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// POST - เปลี่ยนสัญญาแบบกลุ่ม
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      vehicle_ids, // array ของ vehicle IDs ที่ต้องการเปลี่ยนสัญญา
      agreement_id, // ID สัญญาใหม่ (ถ้าเป็น null คือการถอดสัญญา)
      user_id
    } = body;

    // Validation
    if (!vehicle_ids || !Array.isArray(vehicle_ids) || vehicle_ids.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Vehicle IDs array is required and must not be empty'
      }, { status: 400 });
    }

    if (!user_id) {
      return NextResponse.json({
        success: false,
        message: 'User ID is required'
      }, { status: 400 });
    }

    // ตรวจสอบว่ารถทั้งหมดมีอยู่จริงและดึงข้อมูลปัจจุบันเพื่อเปรียบเทียบ
    const vehicles = await prisma.vehicle.findMany({
      where: {
        id: { in: vehicle_ids }
      },
      include: {
        agreement: true,
        golfCourse: true
      }
    });

    if (vehicles.length !== vehicle_ids.length) {
      return NextResponse.json({
        success: false,
        message: 'Some vehicles not found'
      }, { status: 404 });
    }

    let targetCourseId: string | null = null;
    let targetCourseName: string | null = null;
    let targetAgreementNumber: string | null = null;

    // ตรวจสอบว่าสัญญาปลายทางมีอยู่จริง (ถ้ามีการระบุ agreement_id)
    if (agreement_id) {
      const newAgreement = await prisma.agreement.findUnique({
        where: { id: agreement_id },
        include: {
          golfCourse: true
        }
      });

      if (!newAgreement) {
        return NextResponse.json({
          success: false,
          message: 'Target agreement not found'
        }, { status: 404 });
      }

      targetCourseId = newAgreement.golf_course_id;
      targetCourseName = newAgreement.golfCourse?.name || '';
      targetAgreementNumber = newAgreement.agreement_number;
    }

    // ใช้ transaction เพื่อโอนย้ายรถและบันทึก Serial History
    const transferResult = await prisma.$transaction(async (tx) => {
      const updatedVehiclesList = [];

      for (const vehicle of vehicles) {
        // อัปเดตข้อมูลรถ
        const updateData: any = {
          agreement_id: agreement_id || null, // ถ้า null คือถอดสัญญา
        };

        // ถ้ามีการระบุสัญญา ให้ย้ายสนามให้ตรงกับสัญญาด้วย
        if (agreement_id && targetCourseId && targetCourseName) {
          updateData.golf_course_id = targetCourseId;
          updateData.golf_course_name = targetCourseName;
        }

        const updatedVehicle = await tx.vehicle.update({
          where: { id: vehicle.id },
          data: updateData
        });

        // กำหนดข้อความประวัติ
        const oldAgreementName = vehicle.agreement?.agreement_number || 'ไม่มีสัญญา';
        const newAgreementName = targetAgreementNumber || 'ไม่มีสัญญา';
        
        // ถ้ารถถูกย้ายสนามให้ระบุด้วย
        let courseChangeMsg = '';
        if (agreement_id && vehicle.golf_course_id !== targetCourseId) {
           courseChangeMsg = ` (ย้ายสนามจาก ${vehicle.golf_course_name} ไป ${targetCourseName})`;
        }

        const detailMsg = `เปลี่ยนสัญญาแบบกลุ่มจาก: ${oldAgreementName} เป็น: ${newAgreementName}${courseChangeMsg}`;

        // บันทึก Serial History สำหรับการเปลี่ยนสัญญา
        await tx.serialHistoryEntry.create({
          data: {
            serial_number: vehicle.serial_number,
            vehicle_number: vehicle.vehicle_number,
            action_type: 'agreement_change',
            action_date: new Date(),
            details: detailMsg,
            is_active: true,
            status: vehicle.status,
            golf_course_name: targetCourseName || vehicle.golf_course_name,
            vehicle_id: vehicle.id,
            performed_by_id: user_id
          }
        });

        updatedVehiclesList.push(updatedVehicle);
      }

      return updatedVehiclesList;
    });

    return NextResponse.json({
      success: true,
      message: `Successfully updated agreements for ${transferResult.length} vehicle(s)`,
      data: transferResult
    }, { status: 200 });

  } catch (error: unknown) {
    console.error('Error in bulk agreement change:', error);
    let errorMessage = 'An unknown error occurred.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({
      success: false,
      message: 'Failed to update agreements',
      error: errorMessage
    }, { status: 500 });
  }
}
