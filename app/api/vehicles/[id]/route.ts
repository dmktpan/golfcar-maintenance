import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { isValidObjectId } from '@/lib/utils/validation';

// GET - ดึงข้อมูลรถกอล์ฟตาม ID
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    
    // ตรวจสอบ ObjectID
    if (!isValidObjectId(id)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid vehicle ID format'
      }, { status: 400 });
    }
    
    const vehicle = await prisma.vehicle.findUnique({
      where: { id }
    });

    if (!vehicle) {
      return NextResponse.json({
        success: false,
        message: 'Vehicle not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Vehicle retrieved successfully',
      data: vehicle
    }, { status: 200 });

  } catch (error: unknown) {
    console.error('Error fetching vehicle:', error);
    let errorMessage = 'An unknown error occurred.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch vehicle',
      error: errorMessage
    }, { status: 500 });
  }
}

// PUT - อัปเดตข้อมูลรถกอล์ฟ
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    
    // ตรวจสอบ ObjectID
    if (!isValidObjectId(id)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid vehicle ID format'
      }, { status: 400 });
    }
    
    const body = await request.json();
    const { 
      serial_number, 
      vehicle_number, 
      golf_course_id, 
      golf_course_name, 
      model, 
      battery_serial, 
      status, 
      transfer_date 
    } = body;

    // Validation
    if (!serial_number || !vehicle_number || !golf_course_id || !golf_course_name || !model) {
      return NextResponse.json({
        success: false,
        message: 'Serial number, vehicle number, golf course ID, golf course name, and model are required'
      }, { status: 400 });
    }

    if (status && !['active', 'inactive', 'spare', 'parked'].includes(status)) {
      return NextResponse.json({
        success: false,
        message: 'Status must be active, inactive, spare, or parked'
      }, { status: 400 });
    }

    // ดึงข้อมูลเก่าก่อนอัปเดต
    const oldVehicle = await prisma.vehicle.findUnique({
      where: { id }
    });

    if (!oldVehicle) {
      return NextResponse.json({
        success: false,
        message: 'Vehicle not found'
      }, { status: 404 });
    }

    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: {
        serial_number: serial_number.trim(),
        vehicle_number: vehicle_number.trim(),
        golf_course_id: String(golf_course_id),
        golf_course_name: golf_course_name.trim(),
        model: model.trim(),
        battery_serial: battery_serial?.trim(),
        status: status || 'active',
        transfer_date: transfer_date?.trim()
      }
    });

    // บันทึก Serial History สำหรับการเปลี่ยนแปลงข้อมูล
    const changes: string[] = [];
    
    if (oldVehicle.serial_number !== vehicle.serial_number) {
      changes.push(`หมายเลขซีเรียล: ${oldVehicle.serial_number} → ${vehicle.serial_number}`);
    }
    if (oldVehicle.vehicle_number !== vehicle.vehicle_number) {
      changes.push(`หมายเลขรถ: ${oldVehicle.vehicle_number} → ${vehicle.vehicle_number}`);
    }
    if (oldVehicle.golf_course_id !== vehicle.golf_course_id) {
      changes.push(`สนาม: ${oldVehicle.golf_course_name} → ${vehicle.golf_course_name}`);
    }
    if (oldVehicle.status !== vehicle.status) {
      changes.push(`สถานะ: ${oldVehicle.status} → ${vehicle.status}`);
    }
    if (oldVehicle.model !== vehicle.model) {
      changes.push(`รุ่น: ${oldVehicle.model} → ${vehicle.model}`);
    }
    if (oldVehicle.battery_serial !== vehicle.battery_serial) {
      changes.push(`หมายเลขแบตเตอรี่: ${oldVehicle.battery_serial || 'ไม่ระบุ'} → ${vehicle.battery_serial || 'ไม่ระบุ'}`);
    }
    
    if (changes.length > 0) {
      await prisma.serialHistoryEntry.create({
        data: {
          serial_number: vehicle.serial_number,
          vehicle_number: vehicle.vehicle_number,
          action_type: 'data_edit',
          action_date: new Date(),
          details: `แก้ไขข้อมูลรถ - ${changes.join(', ')}`,
          is_active: true,
          status: 'completed',
          golf_course_name: vehicle.golf_course_name,
          vehicle_id: vehicle.id,
          performed_by_id: '000000000000000000000001' // Default admin ID
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Vehicle updated successfully',
      data: vehicle
    }, { status: 200 });

  } catch (error: unknown) {
    console.error('Error updating vehicle:', error);
    let errorMessage = 'An unknown error occurred.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({
      success: false,
      message: 'Failed to update vehicle',
      error: errorMessage
    }, { status: 500 });
  }
}

// DELETE - ลบรถกอล์ฟ
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;

    // ตรวจสอบ ObjectID
    if (!isValidObjectId(id)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid vehicle ID format'
      }, { status: 400 });
    }

    // ดึงข้อมูลรถก่อนลบ
    const vehicle = await prisma.vehicle.findUnique({
      where: { id }
    });

    if (!vehicle) {
      return NextResponse.json({
        success: false,
        message: 'Vehicle not found'
      }, { status: 404 });
    }

    // บันทึก Serial History ก่อนลบ
    await prisma.serialHistoryEntry.create({
      data: {
        serial_number: vehicle.serial_number,
        vehicle_number: vehicle.vehicle_number,
        action_type: 'data_delete',
        action_date: new Date(),
        details: `ลบรถออกจากระบบ - หมายเลขรถ: ${vehicle.vehicle_number}, สนาม: ${vehicle.golf_course_name}`,
        is_active: false,
        status: 'completed',
        golf_course_name: vehicle.golf_course_name,
        vehicle_id: vehicle.id,
        performed_by_id: '000000000000000000000001' // Default admin ID
      }
    });

    await prisma.vehicle.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Vehicle deleted successfully'
    }, { status: 200 });

  } catch (error: unknown) {
    console.error('Error deleting vehicle:', error);
    let errorMessage = 'An unknown error occurred.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({
      success: false,
      message: 'Failed to delete vehicle',
      error: errorMessage
    }, { status: 500 });
  }
}