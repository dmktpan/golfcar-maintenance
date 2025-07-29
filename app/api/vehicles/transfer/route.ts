import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// POST - ย้ายรถไปสนามใหม่
export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Received transfer data:', body);
    
    const { 
      vehicle_ids, 
      target_golf_course_id, 
      target_golf_course_name,
      transfer_date,
      performed_by = 'administrator'
    } = body;

    // Validation
    if (!vehicle_ids || !Array.isArray(vehicle_ids) || vehicle_ids.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Vehicle IDs are required and must be an array'
      }, { status: 400 });
    }

    if (!target_golf_course_id || !target_golf_course_name) {
      return NextResponse.json({
        success: false,
        message: 'Target golf course ID and name are required'
      }, { status: 400 });
    }

    // ตรวจสอบว่าสนามปลายทางมีอยู่จริง
    const targetCourse = await prisma.golfCourse.findUnique({
      where: { id: String(target_golf_course_id) }
    });

    if (!targetCourse) {
      return NextResponse.json({
        success: false,
        message: 'Target golf course not found'
      }, { status: 404 });
    }

    // ดึงข้อมูลรถที่จะย้าย
    const vehiclesToTransfer = await prisma.vehicle.findMany({
      where: {
        id: { in: vehicle_ids }
      }
    });

    if (vehiclesToTransfer.length !== vehicle_ids.length) {
      return NextResponse.json({
        success: false,
        message: 'Some vehicles not found'
      }, { status: 404 });
    }

    // อัปเดตข้อมูลรถ
    const updatedVehicles = await Promise.all(
      vehiclesToTransfer.map(async (vehicle) => {
        const updatedVehicle = await prisma.vehicle.update({
          where: { id: vehicle.id },
          data: {
            golf_course_id: String(target_golf_course_id),
            golf_course_name: target_golf_course_name,
            transfer_date: transfer_date ? new Date(transfer_date) : new Date()
          }
        });

        // บันทึกประวัติการย้าย
        await prisma.serialHistoryEntry.create({
          data: {
            serial_number: vehicle.serial_number,
            vehicle_number: vehicle.vehicle_number,
            action_type: 'transfer',
            action_date: new Date(),
            actual_transfer_date: transfer_date ? new Date(transfer_date) : new Date(),
            details: `โยกย้ายรถจาก ${vehicle.golf_course_name} ไป ${target_golf_course_name}`,
            is_active: true,
            status: 'completed',
            golf_course_name: target_golf_course_name,
            vehicle_id: vehicle.id,
            performed_by_id: '000000000000000000000001' // Default admin ID
          }
        });

        return updatedVehicle;
      })
    );

    console.log('Vehicles transferred successfully:', updatedVehicles.length);

    return NextResponse.json({
      success: true,
      message: `Successfully transferred ${updatedVehicles.length} vehicles`,
      data: updatedVehicles
    }, { status: 200 });

  } catch (error: unknown) {
    console.error('Error transferring vehicles:', error);
    let errorMessage = 'An unknown error occurred.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({
      success: false,
      message: 'Failed to transfer vehicles',
      error: errorMessage
    }, { status: 500 });
  }
}