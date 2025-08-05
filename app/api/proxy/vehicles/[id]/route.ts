// app/api/proxy/vehicles/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

const EXTERNAL_API_BASE = process.env.EXTERNAL_API_BASE_URL || 'http://golfcar.go2kt.com:8080/api';

// แมปสถานะจาก frontend ไปยัง External API
function mapStatusToExternalAPI(status: string): string {
  const statusMap: { [key: string]: string } = {
    'active': 'active',
    'ready': 'active',      // แมป ready เป็น active
    'maintenance': 'inactive', // แมป maintenance เป็น inactive
    'retired': 'spare'      // แมป retired เป็น spare
  };
  
  return statusMap[status] || 'active';
}

// แมปสถานะจาก External API กลับมายัง frontend
function mapStatusFromExternalAPI(externalStatus: string): string {
  const statusMap: { [key: string]: string } = {
    'active': 'active',     // active ยังคงเป็น active
    'inactive': 'maintenance', // inactive กลับเป็น maintenance
    'spare': 'retired'      // spare กลับเป็น retired
  };
  
  return statusMap[externalStatus] || 'active';
}

// แปลงสถานะเป็นข้อความภาษาไทยที่เข้าใจง่าย
function getStatusLabel(status: string): string {
  switch (status) {
    case 'active': return 'ใช้งาน';
    case 'ready': return 'พร้อมใช้';
    case 'maintenance': return 'รอซ่อม';
    case 'retired': return 'เสื่อมแล้ว';
    default: return 'ใช้งาน';
  }
}

// สร้าง Serial History หลังจากอัปเดตสำเร็จ
async function createSerialHistory(vehicleId: string, originalBody: any, updatedData: any) {
  try {
    // ดึงข้อมูลรถปัจจุบันจากฐานข้อมูล (ข้อมูลก่อนการอัปเดต)
    const currentVehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId }
    });

    if (!currentVehicle) {
      console.log('⚠️ Vehicle not found in local database, skipping serial history');
      return;
    }

    const changes: string[] = [];
    
    // เปรียบเทียบการเปลี่ยนแปลง (เปรียบเทียบข้อมูลเก่ากับข้อมูลใหม่)
    if (originalBody.serial_number && originalBody.serial_number.trim() !== currentVehicle.serial_number) {
      changes.push(`หมายเลขซีเรียล: ${currentVehicle.serial_number} → ${originalBody.serial_number.trim()}`);
    }
    if (originalBody.vehicle_number && originalBody.vehicle_number.trim() !== currentVehicle.vehicle_number) {
      changes.push(`หมายเลขรถ: ${currentVehicle.vehicle_number} → ${originalBody.vehicle_number.trim()}`);
    }
    if (originalBody.golf_course_name && originalBody.golf_course_name.trim() !== currentVehicle.golf_course_name) {
      changes.push(`สนาม: ${currentVehicle.golf_course_name} → ${originalBody.golf_course_name.trim()}`);
    }
    
    // สำหรับสถานะ ให้เปรียบเทียบสถานะต้นฉบับจาก frontend
    if (originalBody.status) {
      const currentStatus = currentVehicle.status || 'active';
      const newStatus = originalBody.status; // ใช้สถานะต้นฉบับจาก frontend โดยตรง
      
      if (currentStatus !== newStatus) {
        const currentStatusLabel = getStatusLabel(currentStatus);
        const newStatusLabel = getStatusLabel(newStatus);
        changes.push(`สถานะ: ${currentStatusLabel} → ${newStatusLabel}`);
      }
    }
    
    if (originalBody.model && originalBody.model.trim() !== (currentVehicle.model || '')) {
      changes.push(`รุ่น: ${currentVehicle.model || 'ไม่ระบุ'} → ${originalBody.model.trim()}`);
    }
    if (originalBody.battery_serial !== undefined) {
      const newBattery = originalBody.battery_serial?.trim() || '';
      const currentBattery = currentVehicle.battery_serial || '';
      if (newBattery !== currentBattery) {
        changes.push(`หมายเลขแบตเตอรี่: ${currentBattery || 'ไม่ระบุ'} → ${newBattery || 'ไม่ระบุ'}`);
      }
    }
    
    if (changes.length > 0) {
      // ตรวจสอบว่ามี history ที่เหมือนกันในช่วง 5 วินาทีที่ผ่านมาหรือไม่
      const recentHistory = await prisma.serialHistoryEntry.findFirst({
        where: {
          vehicle_id: vehicleId,
          action_type: 'data_edit',
          action_date: {
            gte: new Date(Date.now() - 5000) // 5 วินาทีที่ผ่านมา
          },
          details: `แก้ไขข้อมูลรถ - ${changes.join(', ')}`
        }
      });

      if (recentHistory) {
        console.log('ℹ️ Duplicate history detected, skipping creation');
        return;
      }

      await prisma.serialHistoryEntry.create({
        data: {
          serial_number: originalBody.serial_number?.trim() || currentVehicle.serial_number,
          vehicle_number: originalBody.vehicle_number?.trim() || currentVehicle.vehicle_number,
          action_type: 'data_edit',
          action_date: new Date(),
          details: `แก้ไขข้อมูลรถ - ${changes.join(', ')}`,
          is_active: true,
          status: 'completed',
          golf_course_name: originalBody.golf_course_name?.trim() || currentVehicle.golf_course_name,
          vehicle_id: vehicleId,
          performed_by_id: '000000000000000000000001' // Default admin ID
        }
      });
      
      console.log('✅ Serial history created successfully:', changes);
    } else {
      console.log('ℹ️ No changes detected, skipping serial history');
    }
  } catch (error) {
    console.error('❌ Error creating serial history:', error);
    // ไม่ throw error เพื่อไม่ให้กระทบต่อการอัปเดตหลัก
  }
}



export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const originalBody = await request.json();
    console.log('🔄 PUT /api/proxy/vehicles/[id] - External API Only');
    console.log('📝 Vehicle ID:', id);
    console.log('📝 Original request body:', JSON.stringify(originalBody, null, 2));
    
    // เก็บสถานะต้นฉบับไว้สำหรับ Serial History
    const originalStatusForHistory = originalBody.status;
    
    // สร้าง body สำหรับส่งไป External API
    const body = { ...originalBody };
    
    // แมปสถานะให้ตรงกับ External API
    if (body.status) {
      const frontendStatus = body.status;
      body.status = mapStatusToExternalAPI(body.status);
      console.log(`📝 Status mapping: ${frontendStatus} → ${body.status}`);
    }
    
    console.log('📝 Mapped request body:', JSON.stringify(body, null, 2));
    
    // ใช้ External API เท่านั้น
    console.log('🌐 Calling external API...');
    
    // เพิ่ม timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    // ลองใช้ endpoint ที่แตกต่างกัน
    const endpoints = [
      `${EXTERNAL_API_BASE}/vehicles/${id}`,
      `${EXTERNAL_API_BASE}/vehicles`,
      `${EXTERNAL_API_BASE}/vehicle/${id}`,
      `${EXTERNAL_API_BASE}/vehicle`
    ];
    
    let lastError = null;
    
    for (const endpoint of endpoints) {
      try {
        console.log(`🔄 Trying endpoint: ${endpoint}`);
        
        const response = await fetch(endpoint, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ...body, id }),
          signal: controller.signal,
        });

        console.log(`🌐 External API response status for ${endpoint}:`, response.status);

        if (response.ok) {
          const data = await response.json();
          console.log('✅ External API success (PUT method - creating serial history)');
          
          // สร้าง Serial History หลังจากอัปเดตสำเร็จ (ใช้ originalBody ที่มีสถานะต้นฉบับ)
          try {
            await createSerialHistory(id, originalBody, data);
            console.log('✅ Serial History created successfully');
          } catch (historyError) {
            console.error('❌ Error creating Serial History:', historyError);
          }
          
          clearTimeout(timeoutId);
          return NextResponse.json(data);
        } else if (response.status !== 405 && response.status !== 404) {
          // ถ้าไม่ใช่ Method Not Allowed หรือ Not Found ให้ return error
          const errorText = await response.text();
          console.log('❌ Error response:', errorText);
          clearTimeout(timeoutId);
          return NextResponse.json(
            { 
              success: false, 
              message: `External API failed with status ${response.status}`,
              details: errorText
            },
            { status: response.status }
          );
        } else {
          console.log(`⚠️ Endpoint ${endpoint} not supported (${response.status}), trying next...`);
          lastError = await response.text();
        }
      } catch (endpointError) {
        console.log(`❌ Error with endpoint ${endpoint}:`, endpointError);
        lastError = endpointError;
        continue;
      }
    }
    
    clearTimeout(timeoutId);
    
    // ถ้าทุก endpoint ล้มเหลว
    console.error('❌ All endpoints failed');
    return NextResponse.json(
      { 
        success: false, 
        message: 'All external API endpoints failed',
        details: lastError instanceof Error ? lastError.message : lastError
      },
      { status: 500 }
    );
    
  } catch (error) {
    console.error('❌ Error updating vehicle:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to update vehicle with external API',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    console.log('🔄 DELETE /api/proxy/vehicles/[id] - External API Only');
    console.log('📝 Vehicle ID:', id);
    
    // ดึงข้อมูลรถก่อนลบเพื่อสร้าง Serial History
    let vehicleData = null;
    try {
      const vehicle = await prisma.vehicle.findUnique({
        where: { id }
      });
      vehicleData = vehicle;
    } catch (error) {
      console.log('⚠️ Could not fetch vehicle data for serial history:', error);
    }
    
    // ใช้ External API เท่านั้น
    console.log('🌐 Calling external API...');
    
    // เพิ่ม timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    // ลองใช้ endpoint ที่แตกต่างกัน
    const endpoints = [
      `${EXTERNAL_API_BASE}/vehicles/${id}`,
      `${EXTERNAL_API_BASE}/vehicle/${id}`
    ];
    
    let lastError = null;
    
    for (const endpoint of endpoints) {
      try {
        console.log(`🔄 Trying DELETE endpoint: ${endpoint}`);
        
        const response = await fetch(endpoint, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        });

        console.log(`🌐 External API response status for ${endpoint}:`, response.status);

        if (response.ok) {
          console.log('✅ External API success (DELETE method - creating serial history)');
          
          // สร้าง Serial History หลังจากลบสำเร็จ
          if (vehicleData) {
            try {
              await createSerialHistory(id, vehicleData, { deleted: true });
              console.log('✅ Serial History created successfully for deleted vehicle');
            } catch (historyError) {
              console.error('❌ Error creating Serial History for deleted vehicle:', historyError);
            }
          }
          
          clearTimeout(timeoutId);
          return NextResponse.json({ success: true, message: 'Vehicle deleted successfully' });
        } else if (response.status !== 405 && response.status !== 404) {
          // ถ้าไม่ใช่ Method Not Allowed หรือ Not Found ให้ return error
          const errorText = await response.text();
          console.log('❌ Error response:', errorText);
          clearTimeout(timeoutId);
          return NextResponse.json(
            { 
              success: false, 
              message: `External API failed with status ${response.status}`,
              details: errorText
            },
            { status: response.status }
          );
        } else {
          console.log(`⚠️ Endpoint ${endpoint} not supported (${response.status}), trying next...`);
          lastError = await response.text();
        }
      } catch (endpointError) {
        console.log(`❌ Error with endpoint ${endpoint}:`, endpointError);
        lastError = endpointError;
        continue;
      }
    }
    
    clearTimeout(timeoutId);
    
    // ถ้าทุก endpoint ล้มเหลว
    console.error('❌ All endpoints failed');
    return NextResponse.json(
      { 
        success: false, 
        message: 'All external API endpoints failed',
        details: lastError instanceof Error ? lastError.message : lastError
      },
      { status: 500 }
    );
    
  } catch (error) {
    console.error('❌ Error deleting vehicle:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to delete vehicle with external API',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const originalBody = await request.json();
    console.log('🔄 PATCH /api/proxy/vehicles/[id] - External API Only');
    console.log('📝 Vehicle ID:', id);
    console.log('📝 Original request body:', JSON.stringify(originalBody, null, 2));
    
    // สร้าง body สำหรับส่งไป External API
    const body = { ...originalBody };
    
    // แมปสถานะให้ตรงกับ External API
    if (body.status) {
      const frontendStatus = body.status;
      body.status = mapStatusToExternalAPI(body.status);
      console.log(`📝 Status mapping: ${frontendStatus} → ${body.status}`);
    }
    
    console.log('📝 Mapped request body:', JSON.stringify(body, null, 2));
    
    // ใช้ External API เท่านั้น
    console.log('🌐 Calling external API...');
    
    // เพิ่ม timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    // ลองใช้ endpoint ที่แตกต่างกัน
    const endpoints = [
      `${EXTERNAL_API_BASE}/vehicles/${id}`,
      `${EXTERNAL_API_BASE}/vehicles`,
      `${EXTERNAL_API_BASE}/vehicle/${id}`,
      `${EXTERNAL_API_BASE}/vehicle`
    ];
    
    let lastError = null;
    
    for (const endpoint of endpoints) {
      try {
        console.log(`🔄 Trying PATCH endpoint: ${endpoint}`);
        
        const response = await fetch(endpoint, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ...body, id }),
          signal: controller.signal,
        });

        console.log(`🌐 External API response status for ${endpoint}:`, response.status);

        if (response.ok) {
          const data = await response.json();
          console.log('✅ External API success (PATCH method - creating serial history)');
          
          // สร้าง Serial History สำหรับ PATCH เช่นกัน เพื่อให้แน่ใจว่า Serial History จะถูกสร้าง
          // เนื่องจาก External API อาจใช้ PATCH แทน PUT
          try {
            await createSerialHistory(id, originalBody, data);
            console.log('✅ Serial History created successfully');
          } catch (historyError) {
            console.error('❌ Error creating Serial History:', historyError);
          }
          
          clearTimeout(timeoutId);
          return NextResponse.json(data);
        } else if (response.status !== 405 && response.status !== 404) {
          // ถ้าไม่ใช่ Method Not Allowed หรือ Not Found ให้ return error
          const errorText = await response.text();
          console.log('❌ Error response:', errorText);
          clearTimeout(timeoutId);
          return NextResponse.json(
            { 
              success: false, 
              message: `External API failed with status ${response.status}`,
              details: errorText
            },
            { status: response.status }
          );
        } else {
          console.log(`⚠️ Endpoint ${endpoint} not supported (${response.status}), trying next...`);
          lastError = await response.text();
        }
      } catch (endpointError) {
        console.log(`❌ Error with endpoint ${endpoint}:`, endpointError);
        lastError = endpointError;
        continue;
      }
    }
    
    clearTimeout(timeoutId);
    
    // ถ้าทุก endpoint ล้มเหลว
    console.error('❌ All endpoints failed');
    return NextResponse.json(
      { 
        success: false, 
        message: 'All external API endpoints failed',
        details: lastError instanceof Error ? lastError.message : lastError
      },
      { status: 500 }
    );
    
  } catch (error) {
    console.error('❌ Error updating vehicle:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to update vehicle with external API',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}