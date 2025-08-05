// app/api/proxy/vehicles/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

const EXTERNAL_API_BASE = process.env.EXTERNAL_API_BASE || 'https://api.example.com';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    console.log('🔄 GET /api/proxy/vehicles/[id] - Using External API');
    console.log('📝 Vehicle ID:', id);
    
    // เรียกใช้ External API
    console.log('🌐 Fetching vehicle from external API...');
    
    const response = await fetch(`${EXTERNAL_API_BASE}/vehicles/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    if (!response.ok) {
      console.log(`❌ External API error: ${response.status} ${response.statusText}`);
      
      if (response.status === 404) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'Vehicle not found',
            details: `Vehicle with ID ${id} does not exist`
          },
          { status: 404 }
        );
      }
      
      throw new Error(`External API error: ${response.status} ${response.statusText}`);
    }

    const vehicleData = await response.json();
    console.log('✅ Vehicle fetched successfully from external API');
    console.log('📝 Vehicle data:', JSON.stringify(vehicleData, null, 2));
    
    // แมปสถานะจาก External API กลับมายัง frontend
    if (vehicleData.data && vehicleData.data.status) {
      vehicleData.data.status = mapStatusFromExternalAPI(vehicleData.data.status);
    } else if (vehicleData.status) {
      vehicleData.status = mapStatusFromExternalAPI(vehicleData.status);
    }
    
    return NextResponse.json(vehicleData);
    
  } catch (error) {
    console.error('❌ Error fetching vehicle from external API:', error);
    
    if (error instanceof Error && error.name === 'TimeoutError') {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Request timeout',
          details: 'External API request timed out after 30 seconds'
        },
        { status: 504 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch vehicle from external API',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// แมปสถานะจาก frontend ไปยัง External API
// ตอนนี้ External API ใช้สถานะเดียวกันกับ frontend แล้ว ไม่ต้องแมป
function mapStatusToExternalAPI(status: string): string {
  // ส่งสถานะตรงไปยัง External API เลย
  return status;
}

// แมปสถานะจาก External API กลับมายัง frontend
// ตอนนี้ External API ใช้สถานะเดียวกันกับ frontend แล้ว
function mapStatusFromExternalAPI(externalStatus: string): string {
  // สำหรับ backward compatibility กับข้อมูลเก่า
  const legacyStatusMap: { [key: string]: string } = {
    'inactive': 'maintenance', // inactive เก่า -> รอซ่อม
    'spare': 'retired',        // spare เก่า -> เสื่อมแล้ว
    'parked': 'ready'          // parked เก่า -> พร้อมใช้
  };
  
  // ถ้าเป็นสถานะเก่า ให้แมป ถ้าไม่ใช่ ให้ใช้สถานะเดิม
  return legacyStatusMap[externalStatus] || externalStatus;
}

// แปลงสถานะเป็นข้อความภาษาไทยที่เข้าใจง่าย
function getStatusLabel(status: string): string {
  switch (status) {
    case 'active': return 'ใช้งาน';
    case 'ready': return 'พร้อมใช้';
    case 'maintenance': return 'รอซ่อม';
    case 'retired': return 'เสื่อมแล้ว';
    case 'parked': return 'จอดไว้';
    case 'spare': return 'อะไหล่';
    case 'inactive': return 'ไม่ใช้งาน';
    default: return 'ใช้งาน';
  }
}

// สร้าง Serial History หลังจากอัปเดตสำเร็จ
async function createSerialHistory(vehicleId: string, originalBody: any, updatedData: any) {
  try {
    // ใช้ข้อมูลที่ได้จาก External API แทนการดึงจากฐานข้อมูลโดยตรง
    const currentVehicle = updatedData;

    if (!currentVehicle) {
      console.log('⚠️ Vehicle data not available, skipping serial history');
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
      // แมปสถานะจาก External API กลับมาเป็น frontend status
      const currentExternalStatus = currentVehicle.status || 'active';
      const currentFrontendStatus = mapStatusFromExternalAPI(currentExternalStatus);
      const newFrontendStatus = originalBody.status; // สถานะใหม่จาก frontend
      
      if (currentFrontendStatus !== newFrontendStatus) {
        const currentStatusLabel = getStatusLabel(currentFrontendStatus);
        const newStatusLabel = getStatusLabel(newFrontendStatus);
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
      // สร้าง Serial History ผ่าน Prisma (เฉพาะ Serial History ยังคงใช้ฐานข้อมูลท้องถิ่น)
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
    console.log('🔄 PUT /api/proxy/vehicles/[id] - Using External API');
    console.log('📝 Vehicle ID:', id);
    console.log('📝 Original request body:', JSON.stringify(originalBody, null, 2));
    
    // แมปสถานะจาก frontend ไปยัง External API
    const requestBody = { ...originalBody };
    if (requestBody.status) {
      requestBody.status = mapStatusToExternalAPI(requestBody.status);
      console.log('📝 Mapped status for external API:', requestBody.status);
    }
    
    // เรียกใช้ External API
    console.log('🌐 Updating vehicle via external API...');
    
    const response = await fetch(`${EXTERNAL_API_BASE}/vehicles/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    if (!response.ok) {
      console.log(`❌ External API error: ${response.status} ${response.statusText}`);
      throw new Error(`External API error: ${response.status} ${response.statusText}`);
    }

    const updatedData = await response.json();
    console.log('✅ Vehicle updated successfully via external API');
    console.log('📝 Updated vehicle data:', JSON.stringify(updatedData, null, 2));
    
    // แมปสถานะกลับจาก External API
    if (updatedData.data && updatedData.data.status) {
      updatedData.data.status = mapStatusFromExternalAPI(updatedData.data.status);
    }
    
    // สร้าง Serial History หลังจากอัปเดตสำเร็จ
    try {
      await createSerialHistory(id, originalBody, updatedData.data || updatedData);
      console.log('✅ Serial History created successfully');
    } catch (historyError) {
      console.error('❌ Error creating Serial History:', historyError);
    }
    
    return NextResponse.json(updatedData);
    
  } catch (error) {
    console.error('❌ Error updating vehicle via external API:', error);
    
    if (error instanceof Error && error.name === 'TimeoutError') {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Request timeout',
          details: 'External API request timed out after 30 seconds'
        },
        { status: 504 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to update vehicle via external API',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    console.log('🔄 DELETE /api/proxy/vehicles/[id] - Using External API');
    console.log('📝 Vehicle ID:', id);
    
    // ดึงข้อมูลรถก่อนลบเพื่อสร้าง Serial History
    let vehicleData = null;
    try {
      const getResponse = await fetch(`${EXTERNAL_API_BASE}/vehicles/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(30000),
      });
      
      if (getResponse.ok) {
        const vehicleResponse = await getResponse.json();
        vehicleData = vehicleResponse.data || vehicleResponse;
      }
    } catch (error) {
      console.log('⚠️ Could not fetch vehicle data for serial history:', error);
    }
    
    // เรียกใช้ External API
    console.log('🌐 Deleting vehicle via external API...');
    
    const response = await fetch(`${EXTERNAL_API_BASE}/vehicles/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    if (!response.ok) {
      console.log(`❌ External API error: ${response.status} ${response.statusText}`);
      throw new Error(`External API error: ${response.status} ${response.statusText}`);
    }

    const deletedData = await response.json();
    console.log('✅ Vehicle deleted successfully via external API');
    console.log('📝 Deleted vehicle data:', JSON.stringify(deletedData, null, 2));
    
    // สร้าง Serial History หลังจากลบสำเร็จ
    if (vehicleData) {
      try {
        await createSerialHistory(id, vehicleData, { deleted: true });
        console.log('✅ Serial History created successfully for deleted vehicle');
      } catch (historyError) {
        console.error('❌ Error creating Serial History for deleted vehicle:', historyError);
      }
    }
    
    return NextResponse.json(deletedData);
    
  } catch (error) {
    console.error('❌ Error deleting vehicle via external API:', error);
    
    if (error instanceof Error && error.name === 'TimeoutError') {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Request timeout',
          details: 'External API request timed out after 30 seconds'
        },
        { status: 504 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to delete vehicle via external API',
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
    console.log('🔄 PATCH /api/proxy/vehicles/[id] - Using External API');
    console.log('📝 Vehicle ID:', id);
    console.log('📝 Original request body:', JSON.stringify(originalBody, null, 2));
    
    // แมปสถานะจาก frontend ไปยัง External API
    const requestBody = { ...originalBody };
    if (requestBody.status) {
      requestBody.status = mapStatusToExternalAPI(requestBody.status);
      console.log('📝 Mapped status for external API:', requestBody.status);
    }
    
    // เรียกใช้ External API
    console.log('🌐 Updating vehicle via external API (PATCH)...');
    
    const response = await fetch(`${EXTERNAL_API_BASE}/vehicles/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    if (!response.ok) {
      console.log(`❌ External API error: ${response.status} ${response.statusText}`);
      throw new Error(`External API error: ${response.status} ${response.statusText}`);
    }

    const updatedData = await response.json();
    console.log('✅ Vehicle updated successfully via external API (PATCH)');
    console.log('📝 Updated vehicle data:', JSON.stringify(updatedData, null, 2));
    
    // แมปสถานะกลับจาก External API
    if (updatedData.data && updatedData.data.status) {
      updatedData.data.status = mapStatusFromExternalAPI(updatedData.data.status);
    }
    
    // สร้าง Serial History สำหรับ PATCH เช่นกัน เพื่อให้แน่ใจว่า Serial History จะถูกสร้าง
    try {
      await createSerialHistory(id, originalBody, updatedData.data || updatedData);
      console.log('✅ Serial History created successfully');
    } catch (historyError) {
      console.error('❌ Error creating Serial History:', historyError);
    }
    
    return NextResponse.json(updatedData);
    
  } catch (error) {
    console.error('❌ Error updating vehicle via external API (PATCH):', error);
    
    if (error instanceof Error && error.name === 'TimeoutError') {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Request timeout',
          details: 'External API request timed out after 30 seconds'
        },
        { status: 504 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to update vehicle via external API',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}