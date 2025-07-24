import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// GET - ดึงข้อมูลประวัติการใช้อะไหล่ทั้งหมด
export async function GET() {
  try {
    const partsUsageLogs = await prisma.partsUsageLog.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Parts usage logs retrieved successfully',
      data: partsUsageLogs
    }, { status: 200 });

  } catch (error: unknown) {
    console.error('Error fetching parts usage logs:', error);
    let errorMessage = 'An unknown error occurred.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch parts usage logs',
      error: errorMessage
    }, { status: 500 });
  }
}

// POST - สร้างบันทึกการใช้อะไหล่ใหม่
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      jobId, 
      partName, 
      partId, 
      quantity, 
      usedDate, 
      userName, 
      vehicleNumber, 
      serialNumber, 
      golfCourseName, 
      jobType, 
      system 
    } = body;

    // Validation
    if (!jobId || !partName || !partId || !quantity || !usedDate || !userName || !vehicleNumber || !serialNumber || !golfCourseName || !jobType || !system) {
      return NextResponse.json({
        success: false,
        message: 'All fields are required'
      }, { status: 400 });
    }

    if (quantity <= 0) {
      return NextResponse.json({
        success: false,
        message: 'Quantity must be greater than 0'
      }, { status: 400 });
    }

    if (!['PM', 'BM', 'Recondition'].includes(jobType)) {
      return NextResponse.json({
        success: false,
        message: 'Job type must be PM, BM, or Recondition'
      }, { status: 400 });
    }

    const partsUsageLog = await prisma.partsUsageLog.create({
      data: {
        jobId: jobId.trim(),
        partId: partId.trim(),
        quantity: parseInt(quantity),
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Parts usage log created successfully',
      data: partsUsageLog
    }, { status: 201 });

  } catch (error: unknown) {
    console.error('Error creating parts usage log:', error);
    let errorMessage = 'An unknown error occurred.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({
      success: false,
      message: 'Failed to create parts usage log',
      error: errorMessage
    }, { status: 500 });
  }
}