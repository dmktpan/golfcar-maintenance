// app/api/maintenance/route.ts
import { NextResponse } from 'next/server';
import { validateMaintenanceInput } from '@/lib/validation/maintenance';
import { MaintenanceService } from '@/lib/services/maintenanceService';
import type { MaintenanceResponse, ApiResponse } from '@/types/maintenance';

// --- ฟังก์ชัน POST (สำหรับสร้างข้อมูล Maintenance ใหม่) ---
export async function POST(request: Request): Promise<NextResponse<ApiResponse<MaintenanceResponse>>> {
  try {
    const body = await request.json();
    
    // Validate input data
    const validation = validateMaintenanceInput(body);
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        message: 'Invalid input data',
        error: validation.error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ')
      }, { status: 400 });
    }

    // Use service layer to create maintenance
    const maintenanceResponse = await MaintenanceService.createMaintenance(validation.data);

    return NextResponse.json({ 
      success: true,
      message: 'Maintenance item added successfully', 
      data: maintenanceResponse 
    }, { status: 201 });

  } catch (error: unknown) {
    console.error('Error adding maintenance item:', error);
    let errorMessage = 'An unknown error occurred.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ 
      success: false,
      message: 'Failed to add maintenance item', 
      error: errorMessage 
    }, { status: 500 });
  }
}

// --- ฟังก์ชัน GET (สำหรับดึงข้อมูล Maintenance ทั้งหมด) ---
export async function GET(): Promise<NextResponse<ApiResponse<MaintenanceResponse[]>>> {
  try {
    // Use service layer to get all maintenance items
    const maintenanceItems = await MaintenanceService.getAllMaintenance();

    return NextResponse.json({
      success: true,
      message: 'Maintenance items retrieved successfully',
      data: maintenanceItems
    }, { status: 200 });

  } catch (error: unknown) {
    console.error('Error fetching maintenance items:', error);
    let errorMessage = 'An unknown error occurred.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ 
      success: false,
      message: 'Failed to fetch maintenance items', 
      error: errorMessage 
    }, { status: 500 });
  }
}