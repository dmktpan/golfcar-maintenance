import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// GET - ดึงข้อมูลรถกอล์ฟทั้งหมด
export async function GET() {
  try {
    // ใช้ raw MongoDB operations เพื่อหลีกเลี่ยงปัญหา createdAt null
    let vehicles: any[] = [];
    
    try {
      // ลองใช้ Prisma findMany ก่อน
      vehicles = await prisma.vehicle.findMany({
        orderBy: {
          createdAt: 'desc'
        }
      });
    } catch (prismaError) {
      console.warn('Prisma findMany failed, using raw MongoDB:', prismaError);
      
      // Fallback ใช้ raw MongoDB operations
      try {
        const result = await prisma.$runCommandRaw({
          find: 'vehicles',
          sort: { createdAt: -1 }
        }) as { cursor?: { firstBatch?: any[] } };
        
        vehicles = result?.cursor?.firstBatch || [];
        
        // แปลง _id เป็น id สำหรับ compatibility
        vehicles = vehicles.map(vehicle => ({
          ...vehicle,
          id: vehicle._id,
          _id: undefined
        }));
      } catch (rawError) {
        console.error('Raw MongoDB query also failed:', rawError);
        throw rawError;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Vehicles retrieved successfully',
      data: vehicles,
      count: vehicles.length
    }, { status: 200 });

  } catch (error: unknown) {
    console.error('Error fetching vehicles:', error);
    let errorMessage = 'An unknown error occurred.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch vehicles',
      error: errorMessage
    }, { status: 500 });
  }
}

// POST - สร้างรถกอล์ฟใหม่
export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Received vehicle data:', body);
    
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
    if (!serial_number || !vehicle_number || !golf_course_id) {
      return NextResponse.json({
        success: false,
        message: 'Serial number, vehicle number, and golf course ID are required'
      }, { status: 400 });
    }

    if (status && !['active', 'inactive', 'spare', 'parked'].includes(status)) {
      return NextResponse.json({
        success: false,
        message: 'Status must be active, inactive, spare, or parked'
      }, { status: 400 });
    }

    // ตรวจสอบการซ้ำของ serial_number เท่านั้น
    const existingSerial = await prisma.vehicle.findUnique({
      where: { serial_number: serial_number.trim() }
    });

    if (existingSerial) {
      return NextResponse.json({
        success: false,
        message: `หมายเลขซีเรียล "${serial_number}" มีอยู่ในระบบแล้ว`
      }, { status: 400 });
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        serial_number: serial_number.trim(),
        vehicle_number: vehicle_number.trim(),
        golf_course_id: String(golf_course_id),
        golf_course_name: golf_course_name?.trim() || 'ไม่ระบุ',
        model: model?.trim() || 'ไม่ระบุ',
        battery_serial: battery_serial?.trim(),
        status: status || 'active',
        transfer_date: transfer_date?.trim()
      }
    });

    // บันทึก Serial History สำหรับการสร้างรถใหม่
    await prisma.serialHistoryEntry.create({
      data: {
        serial_number: vehicle.serial_number,
        vehicle_number: vehicle.vehicle_number,
        action_type: 'registration',
        action_date: new Date(),
        details: `เพิ่มรถใหม่ - หมายเลขรถ: ${vehicle.vehicle_number}, สนาม: ${vehicle.golf_course_name}`,
        is_active: true,
        status: 'completed',
        golf_course_name: vehicle.golf_course_name,
        vehicle_id: vehicle.id,
        performed_by_id: '000000000000000000000001' // Default admin ID
      }
    });

    console.log('Vehicle created successfully:', vehicle);

    return NextResponse.json({
      success: true,
      message: 'Vehicle created successfully',
      data: vehicle
    }, { status: 201 });

  } catch (error: unknown) {
    console.error('Error creating vehicle:', error);
    let errorMessage = 'An unknown error occurred.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({
      success: false,
      message: 'Failed to create vehicle',
      error: errorMessage
    }, { status: 500 });
  }
}