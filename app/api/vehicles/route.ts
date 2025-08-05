import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// GET - ดึงข้อมูลรถทั้งหมด
export async function GET() {
  try {
    const vehicles = await prisma.vehicle.findMany({
      include: {
        golfCourse: {
          select: {
            id: true,
            name: true,
            location: true
          }
        },
        jobs: {
          select: {
            id: true,
            type: true,
            status: true,
            createdAt: true
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 5 // เอาแค่ 5 งานล่าสุด
        },
        _count: {
          select: {
            jobs: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

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

// POST - สร้างรถใหม่
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      vehicle_number, 
      serial_number, 
      brand, 
      model, 
      year, 
      battery_serial, 
      status, 
      golf_course_id, 
      golf_course_name,
      transfer_date,
      user_id // สำหรับบันทึก Serial History
    } = body;

    // Validation
    if (!vehicle_number || !serial_number || !golf_course_id || !golf_course_name) {
      return NextResponse.json({
        success: false,
        message: 'Vehicle number, serial number, golf_course_id, and golf_course_name are required'
      }, { status: 400 });
    }

    // ตรวจสอบว่า serial_number ซ้ำหรือไม่
    const existingVehicle = await prisma.vehicle.findUnique({
      where: { serial_number: serial_number.trim() }
    });

    if (existingVehicle) {
      return NextResponse.json({
        success: false,
        message: 'Vehicle with this serial number already exists'
      }, { status: 409 });
    }

    // ตรวจสอบว่า golf course มีอยู่จริง
    const golfCourse = await prisma.golfCourse.findUnique({
      where: { id: golf_course_id }
    });

    if (!golfCourse) {
      return NextResponse.json({
        success: false,
        message: 'Golf course not found'
      }, { status: 404 });
    }

    // ใช้ transaction เพื่อสร้างรถและบันทึก Serial History
    const vehicle = await prisma.$transaction(async (tx) => {
      // สร้างรถใหม่
      const newVehicle = await tx.vehicle.create({
        data: {
          vehicle_number: vehicle_number.trim(),
          serial_number: serial_number.trim(),
          brand: brand?.trim(),
          model: model?.trim(),
          year: year ? parseInt(year) : null,
          battery_serial: battery_serial?.trim(),
          status: status || 'active',
          golf_course_id,
          golf_course_name: golf_course_name.trim(),
          transfer_date: transfer_date ? new Date(transfer_date) : null
        },
        include: {
          golfCourse: {
            select: {
              id: true,
              name: true,
              location: true
            }
          }
        }
      });

      // บันทึก Serial History สำหรับการลงทะเบียนรถใหม่
      if (user_id) {
        await tx.serialHistoryEntry.create({
          data: {
            serial_number: serial_number.trim(),
            vehicle_number: vehicle_number.trim(),
            action_type: 'registration',
            action_date: new Date(),
            details: `ลงทะเบียนรถใหม่ - ${brand || ''} ${model || ''} ${year || ''}`.trim(),
            is_active: true,
            status: status || 'active',
            golf_course_name: golf_course_name.trim(),
            vehicle_id: newVehicle.id,
            performed_by_id: user_id
          }
        });
      }

      return newVehicle;
    });

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

// PUT - อัพเดทรถ
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { 
      id,
      vehicle_number, 
      serial_number, 
      brand, 
      model, 
      year, 
      battery_serial, 
      status, 
      golf_course_id, 
      golf_course_name,
      transfer_date,
      user_id // สำหรับบันทึก Serial History
    } = body;

    // Validation
    if (!id) {
      return NextResponse.json({
        success: false,
        message: 'Vehicle ID is required'
      }, { status: 400 });
    }

    // ตรวจสอบว่ารถมีอยู่จริง
    const existingVehicle = await prisma.vehicle.findUnique({
      where: { id }
    });

    if (!existingVehicle) {
      return NextResponse.json({
        success: false,
        message: 'Vehicle not found'
      }, { status: 404 });
    }

    // ตรวจสอบว่า serial_number ซ้ำหรือไม่ (ยกเว้นรถคันนี้)
    if (serial_number && serial_number !== existingVehicle.serial_number) {
      const duplicateVehicle = await prisma.vehicle.findUnique({
        where: { serial_number: serial_number.trim() }
      });

      if (duplicateVehicle) {
        return NextResponse.json({
          success: false,
          message: 'Vehicle with this serial number already exists'
        }, { status: 409 });
      }
    }

    // ตรวจสอบว่า golf course มีอยู่จริง (ถ้ามีการเปลี่ยน)
    if (golf_course_id && golf_course_id !== existingVehicle.golf_course_id) {
      const golfCourse = await prisma.golfCourse.findUnique({
        where: { id: golf_course_id }
      });

      if (!golfCourse) {
        return NextResponse.json({
          success: false,
          message: 'Golf course not found'
        }, { status: 404 });
      }
    }

    // เตรียมข้อมูลสำหรับอัพเดท
    const updateData: any = {};
    
    if (vehicle_number !== undefined) updateData.vehicle_number = vehicle_number.trim();
    if (serial_number !== undefined) updateData.serial_number = serial_number.trim();
    if (brand !== undefined) updateData.brand = brand?.trim();
    if (model !== undefined) updateData.model = model?.trim();
    if (year !== undefined) updateData.year = year ? parseInt(year) : null;
    if (battery_serial !== undefined) updateData.battery_serial = battery_serial?.trim();
    if (status !== undefined) updateData.status = status;
    if (golf_course_id !== undefined) updateData.golf_course_id = golf_course_id;
    if (golf_course_name !== undefined) updateData.golf_course_name = golf_course_name.trim();
    if (transfer_date !== undefined) updateData.transfer_date = transfer_date ? new Date(transfer_date) : null;

    // ใช้ transaction เพื่ออัพเดทรถและบันทึก Serial History
    const vehicle = await prisma.$transaction(async (tx) => {
      // อัพเดทรถ
      const updatedVehicle = await tx.vehicle.update({
        where: { id },
        data: updateData,
        include: {
          golfCourse: {
            select: {
              id: true,
              name: true,
              location: true
            }
          }
        }
      });

      // บันทึก Serial History สำหรับการอัพเดท
      if (user_id) {
        const changes = [];
        
        if (status && status !== existingVehicle.status) {
          changes.push(`เปลี่ยนสถานะจาก ${existingVehicle.status} เป็น ${status}`);
        }
        
        if (golf_course_name && golf_course_name !== existingVehicle.golf_course_name) {
          changes.push(`โอนย้ายจาก ${existingVehicle.golf_course_name} ไป ${golf_course_name}`);
        }
        
        if (vehicle_number && vehicle_number !== existingVehicle.vehicle_number) {
          changes.push(`เปลี่ยนหมายเลขรถจาก ${existingVehicle.vehicle_number} เป็น ${vehicle_number}`);
        }

        if (changes.length > 0) {
          await tx.serialHistoryEntry.create({
            data: {
              serial_number: updatedVehicle.serial_number,
              vehicle_number: updatedVehicle.vehicle_number,
              action_type: golf_course_name && golf_course_name !== existingVehicle.golf_course_name ? 'transfer' : 'data_edit',
              action_date: new Date(),
              actual_transfer_date: transfer_date ? new Date(transfer_date) : null,
              details: `อัพเดทข้อมูลรถ: ${changes.join(', ')}`,
              is_active: true,
              status: updatedVehicle.status,
              golf_course_name: updatedVehicle.golf_course_name,
              vehicle_id: updatedVehicle.id,
              performed_by_id: user_id
            }
          });
        }
      }

      return updatedVehicle;
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

// DELETE - ลบรถ
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const user_id = searchParams.get('user_id');

    if (!id) {
      return NextResponse.json({
        success: false,
        message: 'Vehicle ID is required'
      }, { status: 400 });
    }

    // ตรวจสอบว่ารถมีอยู่จริง
    const existingVehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: {
        jobs: true
      }
    });

    if (!existingVehicle) {
      return NextResponse.json({
        success: false,
        message: 'Vehicle not found'
      }, { status: 404 });
    }

    // ตรวจสอบว่ามีงานที่เกี่ยวข้องหรือไม่
    if (existingVehicle.jobs.length > 0) {
      return NextResponse.json({
        success: false,
        message: 'Cannot delete vehicle with existing jobs. Please remove all related jobs first.'
      }, { status: 409 });
    }

    // ใช้ transaction เพื่อลบรถและบันทึก Serial History
    await prisma.$transaction(async (tx) => {
      // บันทึก Serial History สำหรับการลบ
      if (user_id) {
        await tx.serialHistoryEntry.create({
          data: {
            serial_number: existingVehicle.serial_number,
            vehicle_number: existingVehicle.vehicle_number,
            action_type: 'data_delete',
            action_date: new Date(),
            details: `ลบข้อมูลรถ ${existingVehicle.brand || ''} ${existingVehicle.model || ''} ${existingVehicle.year || ''}`.trim(),
            is_active: false,
            status: existingVehicle.status,
            golf_course_name: existingVehicle.golf_course_name,
            vehicle_id: existingVehicle.id,
            performed_by_id: user_id
          }
        });
      }

      // ลบรถ
      await tx.vehicle.delete({
        where: { id }
      });
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