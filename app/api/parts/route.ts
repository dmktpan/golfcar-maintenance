import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// GET - ดึงข้อมูลอะไหล่ทั้งหมด
export async function GET() {
  try {
    // ใช้ raw MongoDB operations เพื่อหลีกเลี่ยงปัญหา createdAt null
    let parts: any[] = [];

    try {
      // ลองใช้ Prisma findMany ก่อน
      parts = await prisma.part.findMany({
        include: {
          inventory: {
            include: {
              golfCourse: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    } catch (prismaError) {
      console.warn('Prisma findMany failed, using raw MongoDB:', prismaError);

      // Fallback ใช้ raw MongoDB operations
      try {
        const result = await prisma.$runCommandRaw({
          find: 'parts',
          sort: { createdAt: -1 }
        }) as { cursor?: { firstBatch?: any[] } };

        parts = result?.cursor?.firstBatch || [];

        // แปลง _id เป็น id สำหรับ compatibility
        parts = parts.map(part => ({
          ...part,
          id: part._id,
          _id: undefined
        }));
      } catch (rawError) {
        console.error('Raw MongoDB query also failed:', rawError);
        throw rawError;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Parts retrieved successfully',
      data: parts,
      count: parts.length
    }, { status: 200 });

  } catch (error: unknown) {
    console.error('Error fetching parts:', error);
    let errorMessage = 'An unknown error occurred.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch parts',
      error: errorMessage
    }, { status: 500 });
  }
}

// POST - สร้างอะไหล่ใหม่
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, part_number, category, unit, stock_qty, min_qty, max_qty } = body;

    // Validation
    if (!name || !unit || stock_qty === undefined || min_qty === undefined || max_qty === undefined) {
      return NextResponse.json({
        success: false,
        message: 'Name, unit, stock_qty, min_qty, and max_qty are required'
      }, { status: 400 });
    }

    if (stock_qty < 0 || min_qty < 0 || max_qty < 0) {
      return NextResponse.json({
        success: false,
        message: 'Quantities must be non-negative numbers'
      }, { status: 400 });
    }

    if (min_qty > max_qty) {
      return NextResponse.json({
        success: false,
        message: 'Minimum quantity cannot be greater than maximum quantity'
      }, { status: 400 });
    }

    const part = await prisma.part.create({
      data: {
        name: name.trim(),
        part_number: part_number ? part_number.trim() : null,
        category: category ? category.trim() : null,
        unit: unit.trim(),
        stock_qty: parseInt(stock_qty),
        min_qty: parseInt(min_qty),
        max_qty: parseInt(max_qty)
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Part created successfully',
      data: part
    }, { status: 201 });

  } catch (error: unknown) {
    console.error('Error creating part:', error);
    let errorMessage = 'An unknown error occurred.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({
      success: false,
      message: 'Failed to create part',
      error: errorMessage
    }, { status: 500 });
  }
}