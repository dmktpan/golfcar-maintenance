import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// GET - ดึงข้อมูลรถกอล์ฟตาม ID
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    
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

    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: {
        serial_number: serial_number.trim(),
        vehicle_number: vehicle_number.trim(),
        golf_course_id: parseInt(golf_course_id),
        golf_course_name: golf_course_name.trim(),
        model: model.trim(),
        battery_serial: battery_serial?.trim(),
        status: status || 'active',
        transfer_date: transfer_date?.trim()
      }
    });

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