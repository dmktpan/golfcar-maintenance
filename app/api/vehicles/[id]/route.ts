import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// GET - ดึงข้อมูลรถตาม ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;

    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: {
        golfCourse: {
          select: {
            id: true,
            name: true,
            location: true
          }
        },
        jobs: {
          include: {
            parts: true,
            author: {
              select: {
                id: true,
                name: true,
                username: true
              }
            },
            assignee: {
              select: {
                id: true,
                name: true,
                username: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        historyLogs: {
          include: {
            performed_by: {
              select: {
                id: true,
                name: true,
                username: true
              }
            },
            related_job: {
              select: {
                id: true,
                type: true,
                status: true
              }
            }
          },
          orderBy: {
            action_date: 'desc'
          }
        },
        _count: {
          select: {
            jobs: true,
            historyLogs: true
          }
        }
      }
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

// PUT - อัพเดทรถตาม ID
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
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

        if (battery_serial && battery_serial !== existingVehicle.battery_serial) {
          changes.push(`เปลี่ยนหมายเลขแบตเตอรี่จาก ${existingVehicle.battery_serial || 'ไม่มี'} เป็น ${battery_serial}`);
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

// PATCH - อัพเดทบางส่วนของรถ
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const body = await request.json();
    const { 
      status, 
      user_id, // สำหรับบันทึก Serial History
      reason // เหตุผลในการเปลี่ยนสถานะ
    } = body;

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

    // ใช้ transaction เพื่ออัพเดทสถานะและบันทึก Serial History
    const vehicle = await prisma.$transaction(async (tx) => {
      // อัพเดทสถานะ
      const updatedVehicle = await tx.vehicle.update({
        where: { id },
        data: { status },
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

      // บันทึก Serial History สำหรับการเปลี่ยนสถานะ
      if (user_id && status !== existingVehicle.status) {
        await tx.serialHistoryEntry.create({
          data: {
            serial_number: existingVehicle.serial_number,
            vehicle_number: existingVehicle.vehicle_number,
            action_type: 'status_change',
            action_date: new Date(),
            details: `เปลี่ยนสถานะจาก ${existingVehicle.status} เป็น ${status}${reason ? ` - เหตุผล: ${reason}` : ''}`,
            is_active: true,
            status: status,
            golf_course_name: existingVehicle.golf_course_name,
            vehicle_id: existingVehicle.id,
            performed_by_id: user_id
          }
        });
      }

      return updatedVehicle;
    });

    return NextResponse.json({
      success: true,
      message: 'Vehicle status updated successfully',
      data: vehicle
    }, { status: 200 });

  } catch (error: unknown) {
    console.error('Error updating vehicle status:', error);
    let errorMessage = 'An unknown error occurred.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({
      success: false,
      message: 'Failed to update vehicle status',
      error: errorMessage
    }, { status: 500 });
  }
}

// DELETE - ลบรถตาม ID
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');

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