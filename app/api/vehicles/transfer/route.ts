import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// POST - โอนย้ายรถระหว่างสนามกอล์ฟ
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      vehicle_ids, // array ของ vehicle IDs ที่ต้องการโอนย้าย
      from_golf_course_id,
      to_golf_course_id,
      to_golf_course_name,
      transfer_date,
      user_id,
      reason // เหตุผลในการโอนย้าย
    } = body;

    // Validation
    if (!vehicle_ids || !Array.isArray(vehicle_ids) || vehicle_ids.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Vehicle IDs array is required and must not be empty'
      }, { status: 400 });
    }

    if (!from_golf_course_id || !to_golf_course_id || !to_golf_course_name || !user_id) {
      return NextResponse.json({
        success: false,
        message: 'From golf course ID, to golf course ID, to golf course name, and user ID are required'
      }, { status: 400 });
    }

    if (from_golf_course_id === to_golf_course_id) {
      return NextResponse.json({
        success: false,
        message: 'Source and destination golf courses cannot be the same'
      }, { status: 400 });
    }

    // ตรวจสอบว่าสนามกอล์ฟปลายทางมีอยู่จริง
    const toGolfCourse = await prisma.golfCourse.findUnique({
      where: { id: to_golf_course_id }
    });

    if (!toGolfCourse) {
      return NextResponse.json({
        success: false,
        message: 'Destination golf course not found'
      }, { status: 404 });
    }

    // ตรวจสอบว่ารถทั้งหมดมีอยู่จริงและอยู่ในสนามกอล์ฟต้นทาง
    const vehicles = await prisma.vehicle.findMany({
      where: {
        id: { in: vehicle_ids },
        golf_course_id: from_golf_course_id
      }
    });

    if (vehicles.length !== vehicle_ids.length) {
      return NextResponse.json({
        success: false,
        message: 'Some vehicles not found or not in the source golf course'
      }, { status: 404 });
    }

    // ตรวจสอบว่ารถมีงานที่ยังไม่เสร็จหรือไม่
    const vehiclesWithPendingJobs = await prisma.vehicle.findMany({
      where: {
        id: { in: vehicle_ids },
        jobs: {
          some: {
            status: {
              in: ['pending', 'assigned', 'in_progress']
            }
          }
        }
      },
      include: {
        jobs: {
          where: {
            status: {
              in: ['pending', 'assigned', 'in_progress']
            }
          },
          select: {
            id: true,
            type: true,
            status: true
          }
        }
      }
    });

    if (vehiclesWithPendingJobs.length > 0) {
      return NextResponse.json({
        success: false,
        message: 'Cannot transfer vehicles with pending or in-progress jobs',
        data: {
          vehicles_with_pending_jobs: vehiclesWithPendingJobs.map(v => ({
            id: v.id,
            vehicle_number: v.vehicle_number,
            pending_jobs: v.jobs
          }))
        }
      }, { status: 409 });
    }

    // ใช้ transaction เพื่อโอนย้ายรถและบันทึก Serial History
    const transferResult = await prisma.$transaction(async (tx) => {
      const transferredVehicles = [];
      const transferDateTime = transfer_date ? new Date(transfer_date) : new Date();

      for (const vehicle of vehicles) {
        // อัพเดทข้อมูลรถ
        const updatedVehicle = await tx.vehicle.update({
          where: { id: vehicle.id },
          data: {
            golf_course_id: to_golf_course_id,
            golf_course_name: to_golf_course_name,
            transfer_date: transferDateTime
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

        // บันทึก Serial History สำหรับการโอนย้าย
        await tx.serialHistoryEntry.create({
          data: {
            serial_number: vehicle.serial_number,
            vehicle_number: vehicle.vehicle_number,
            action_type: 'transfer',
            action_date: new Date(),
            actual_transfer_date: transferDateTime,
            details: `โอนย้ายจาก ${vehicle.golf_course_name} ไป ${to_golf_course_name}${reason ? ` - เหตุผล: ${reason}` : ''}`,
            is_active: true,
            status: vehicle.status,
            golf_course_name: to_golf_course_name,
            vehicle_id: vehicle.id,
            performed_by_id: user_id
          }
        });

        transferredVehicles.push(updatedVehicle);
      }

      return transferredVehicles;
    });

    return NextResponse.json({
      success: true,
      message: `Successfully transferred ${transferResult.length} vehicle(s)`,
      data: {
        transferred_vehicles: transferResult,
        transfer_summary: {
          count: transferResult.length,
          from_golf_course_id,
          to_golf_course_id,
          to_golf_course_name,
          transfer_date: transfer_date ? new Date(transfer_date) : new Date(),
          user_id: user_id
        }
      }
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

// GET - ดึงประวัติการโอนย้ายรถ
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vehicle_id = searchParams.get('vehicle_id');
    const golf_course_id = searchParams.get('golf_course_id');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;

    let whereClause: any = {
      action_type: 'transfer'
    };

    if (vehicle_id) {
      whereClause.vehicle_id = vehicle_id;
    }

    if (golf_course_id) {
      // ดึงรถที่เคยอยู่ในสนามกอล์ฟนี้
      const vehicles = await prisma.vehicle.findMany({
        where: { golf_course_id },
        select: { id: true }
      });
      whereClause.vehicle_id = { in: vehicles.map(v => v.id) };
    }

    const transferHistory = await prisma.serialHistoryEntry.findMany({
      where: whereClause,
      include: {
        vehicle: {
          select: {
            id: true,
            vehicle_number: true,
            serial_number: true,
            brand: true,
            model: true,
            year: true
          }
        },
        performed_by: {
          select: {
            id: true,
            name: true,
            username: true
          }
        }
      },
      orderBy: {
        action_date: 'desc'
      },
      take: limit
    });

    return NextResponse.json({
      success: true,
      message: 'Transfer history retrieved successfully',
      data: transferHistory,
      count: transferHistory.length
    }, { status: 200 });

  } catch (error: unknown) {
    console.error('Error fetching transfer history:', error);
    let errorMessage = 'An unknown error occurred.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch transfer history',
      error: errorMessage
    }, { status: 500 });
  }
}