import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// POST - การดำเนินการกับรถหลายคันพร้อมกัน
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      operation, // 'create', 'update_status', 'delete', 'transfer'
      vehicles, // array ของข้อมูลรถ
      user_id,
      golf_course_id, // สำหรับ operation ที่ต้องการ
      golf_course_name, // สำหรับ operation ที่ต้องการ
      target_golf_course_id, // สำหรับ transfer
      target_golf_course_name, // สำหรับ transfer
      status, // สำหรับ update_status
      reason // เหตุผล
    } = body;

    // Validation
    if (!operation || !vehicles || !Array.isArray(vehicles) || vehicles.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Operation and vehicles array are required'
      }, { status: 400 });
    }

    if (!user_id) {
      return NextResponse.json({
        success: false,
        message: 'User ID is required'
      }, { status: 400 });
    }

    let result: any = {};

    switch (operation) {
      case 'create':
        result = await bulkCreateVehicles(vehicles, golf_course_id, golf_course_name, user_id);
        break;
      
      case 'update_status':
        result = await bulkUpdateStatus(vehicles, status, user_id, reason);
        break;
      
      case 'delete':
        result = await bulkDeleteVehicles(vehicles, user_id);
        break;
      
      case 'transfer':
        result = await bulkTransferVehicles(vehicles, target_golf_course_id, target_golf_course_name, user_id, reason);
        break;
      
      default:
        return NextResponse.json({
          success: false,
          message: 'Invalid operation. Supported operations: create, update_status, delete, transfer'
        }, { status: 400 });
    }

    return NextResponse.json(result, { status: result.success ? 200 : 400 });

  } catch (error: unknown) {
    console.error('Error in bulk operation:', error);
    let errorMessage = 'An unknown error occurred.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({
      success: false,
      message: 'Failed to perform bulk operation',
      error: errorMessage
    }, { status: 500 });
  }
}

// ฟังก์ชันสำหรับสร้างรถหลายคันพร้อมกัน
async function bulkCreateVehicles(vehicles: any[], golf_course_id: string, golf_course_name: string, user_id: string) {
  const results = {
    success: true,
    message: '',
    data: {
      created: [] as any[],
      failed: [] as any[],
      summary: {
        total: vehicles.length,
        created_count: 0,
        failed_count: 0
      }
    }
  };

  // ตรวจสอบว่า golf course มีอยู่จริง
  const golfCourse = await prisma.golfCourse.findUnique({
    where: { id: golf_course_id }
  });

  if (!golfCourse) {
    return {
      success: false,
      message: 'Golf course not found',
      data: null
    };
  }

  for (const vehicleData of vehicles) {
    try {
      const { vehicle_number, serial_number, brand, model, year, battery_serial, status } = vehicleData;

      // ตรวจสอบข้อมูลที่จำเป็น
      if (!vehicle_number || !serial_number) {
        results.data.failed.push({
          vehicle_data: vehicleData,
          error: 'Vehicle number and serial number are required'
        });
        continue;
      }

      // ตรวจสอบว่า serial_number ซ้ำหรือไม่
      const existingVehicle = await prisma.vehicle.findUnique({
        where: { serial_number: serial_number.trim() }
      });

      if (existingVehicle) {
        results.data.failed.push({
          vehicle_data: vehicleData,
          error: 'Vehicle with this serial number already exists'
        });
        continue;
      }

      // สร้างรถใหม่
      const vehicle = await prisma.$transaction(async (tx) => {
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
            golf_course_name: golf_course_name.trim()
          }
        });

        // บันทึก Serial History
        await tx.serialHistoryEntry.create({
          data: {
            serial_number: serial_number.trim(),
            vehicle_number: vehicle_number.trim(),
            action_type: 'bulk_upload',
            action_date: new Date(),
            details: `สร้างรถใหม่ (Bulk Upload) - ${brand || ''} ${model || ''} ${year || ''}`.trim(),
            is_active: true,
            status: status || 'active',
            golf_course_name: golf_course_name.trim(),
            vehicle_id: newVehicle.id,
            performed_by_id: user_id
          }
        });

        return newVehicle;
      });

      results.data.created.push(vehicle);
      results.data.summary.created_count++;

    } catch (error) {
      results.data.failed.push({
        vehicle_data: vehicleData,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      results.data.summary.failed_count++;
    }
  }

  results.message = `Bulk create completed. Created: ${results.data.summary.created_count}, Failed: ${results.data.summary.failed_count}`;
  
  if (results.data.summary.failed_count > 0) {
    results.success = false;
  }

  return results;
}

// ฟังก์ชันสำหรับอัพเดทสถานะรถหลายคันพร้อมกัน
async function bulkUpdateStatus(vehicle_ids: string[], status: 'active' | 'ready' | 'maintenance' | 'retired' | 'parked' | 'spare' | 'inactive', user_id: string, reason?: string) {
  const results = {
    success: true,
    message: '',
    data: {
      updated: [] as any[],
      failed: [] as any[],
      summary: {
        total: vehicle_ids.length,
        updated_count: 0,
        failed_count: 0
      }
    }
  };

  for (const vehicle_id of vehicle_ids) {
    try {
      const existingVehicle = await prisma.vehicle.findUnique({
        where: { id: vehicle_id }
      });

      if (!existingVehicle) {
        results.data.failed.push({
          vehicle_id,
          error: 'Vehicle not found'
        });
        continue;
      }

      const vehicle = await prisma.$transaction(async (tx) => {
        const updatedVehicle = await tx.vehicle.update({
          where: { id: vehicle_id },
          data: { status }
        });

        // บันทึก Serial History
        if (status !== existingVehicle.status) {
          await tx.serialHistoryEntry.create({
            data: {
              serial_number: existingVehicle.serial_number,
              vehicle_number: existingVehicle.vehicle_number,
              action_type: 'status_change',
              action_date: new Date(),
              details: `เปลี่ยนสถานะจาก ${existingVehicle.status} เป็น ${status} (Bulk Update)${reason ? ` - เหตุผล: ${reason}` : ''}`,
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

      results.data.updated.push(vehicle);
      results.data.summary.updated_count++;

    } catch (error) {
      results.data.failed.push({
        vehicle_id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      results.data.summary.failed_count++;
    }
  }

  results.message = `Bulk status update completed. Updated: ${results.data.summary.updated_count}, Failed: ${results.data.summary.failed_count}`;
  
  if (results.data.summary.failed_count > 0) {
    results.success = false;
  }

  return results;
}

// ฟังก์ชันสำหรับลบรถหลายคันพร้อมกัน
async function bulkDeleteVehicles(vehicle_ids: string[], user_id: string) {
  const results = {
    success: true,
    message: '',
    data: {
      deleted: [] as any[],
      failed: [] as any[],
      summary: {
        total: vehicle_ids.length,
        deleted_count: 0,
        failed_count: 0
      }
    }
  };

  for (const vehicle_id of vehicle_ids) {
    try {
      const existingVehicle = await prisma.vehicle.findUnique({
        where: { id: vehicle_id },
        include: { jobs: true }
      });

      if (!existingVehicle) {
        results.data.failed.push({
          vehicle_id,
          error: 'Vehicle not found'
        });
        continue;
      }

      if (existingVehicle.jobs.length > 0) {
        results.data.failed.push({
          vehicle_id,
          error: 'Cannot delete vehicle with existing jobs'
        });
        continue;
      }

      await prisma.$transaction(async (tx) => {
        // บันทึก Serial History
        await tx.serialHistoryEntry.create({
          data: {
            serial_number: existingVehicle.serial_number,
            vehicle_number: existingVehicle.vehicle_number,
            action_type: 'data_delete',
            action_date: new Date(),
            details: `ลบข้อมูลรถ (Bulk Delete) ${existingVehicle.brand || ''} ${existingVehicle.model || ''} ${existingVehicle.year || ''}`.trim(),
            is_active: false,
            status: existingVehicle.status,
            golf_course_name: existingVehicle.golf_course_name,
            vehicle_id: existingVehicle.id,
            performed_by_id: user_id
          }
        });

        // ลบรถ
        await tx.vehicle.delete({
          where: { id: vehicle_id }
        });
      });

      results.data.deleted.push({
        id: vehicle_id,
        vehicle_number: existingVehicle.vehicle_number,
        serial_number: existingVehicle.serial_number
      });
      results.data.summary.deleted_count++;

    } catch (error) {
      results.data.failed.push({
        vehicle_id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      results.data.summary.failed_count++;
    }
  }

  results.message = `Bulk delete completed. Deleted: ${results.data.summary.deleted_count}, Failed: ${results.data.summary.failed_count}`;
  
  if (results.data.summary.failed_count > 0) {
    results.success = false;
  }

  return results;
}

// ฟังก์ชันสำหรับโอนย้ายรถหลายคันพร้อมกัน
async function bulkTransferVehicles(vehicle_ids: string[], target_golf_course_id: string, target_golf_course_name: string, user_id: string, reason?: string) {
  const results = {
    success: true,
    message: '',
    data: {
      transferred: [] as any[],
      failed: [] as any[],
      summary: {
        total: vehicle_ids.length,
        transferred_count: 0,
        failed_count: 0
      }
    }
  };

  // ตรวจสอบว่าสนามกอล์ฟปลายทางมีอยู่จริง
  const targetGolfCourse = await prisma.golfCourse.findUnique({
    where: { id: target_golf_course_id }
  });

  if (!targetGolfCourse) {
    return {
      success: false,
      message: 'Target golf course not found',
      data: null
    };
  }

  for (const vehicle_id of vehicle_ids) {
    try {
      const existingVehicle = await prisma.vehicle.findUnique({
        where: { id: vehicle_id },
        include: {
          jobs: {
            where: {
              status: { in: ['pending', 'assigned', 'in_progress'] }
            }
          }
        }
      });

      if (!existingVehicle) {
        results.data.failed.push({
          vehicle_id,
          error: 'Vehicle not found'
        });
        continue;
      }

      if (existingVehicle.jobs.length > 0) {
        results.data.failed.push({
          vehicle_id,
          error: 'Cannot transfer vehicle with pending or in-progress jobs'
        });
        continue;
      }

      const vehicle = await prisma.$transaction(async (tx) => {
        const updatedVehicle = await tx.vehicle.update({
          where: { id: vehicle_id },
          data: {
            golf_course_id: target_golf_course_id,
            golf_course_name: target_golf_course_name,
            transfer_date: new Date()
          }
        });

        // บันทึก Serial History
        await tx.serialHistoryEntry.create({
          data: {
            serial_number: existingVehicle.serial_number,
            vehicle_number: existingVehicle.vehicle_number,
            action_type: 'bulk_transfer',
            action_date: new Date(),
            actual_transfer_date: new Date(),
            details: `โอนย้ายจาก ${existingVehicle.golf_course_name} ไป ${target_golf_course_name} (Bulk Transfer)${reason ? ` - เหตุผล: ${reason}` : ''}`,
            is_active: true,
            status: existingVehicle.status,
            golf_course_name: target_golf_course_name,
            vehicle_id: existingVehicle.id,
            performed_by_id: user_id
          }
        });

        return updatedVehicle;
      });

      results.data.transferred.push(vehicle);
      results.data.summary.transferred_count++;

    } catch (error) {
      results.data.failed.push({
        vehicle_id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      results.data.summary.failed_count++;
    }
  }

  results.message = `Bulk transfer completed. Transferred: ${results.data.summary.transferred_count}, Failed: ${results.data.summary.failed_count}`;
  
  if (results.data.summary.failed_count > 0) {
    results.success = false;
  }

  return results;
}