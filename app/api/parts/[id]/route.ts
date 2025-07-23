import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// GET - ดึงข้อมูลอะไหล่ตาม ID
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    
    const part = await prisma.part.findUnique({
      where: { id }
    });

    if (!part) {
      return NextResponse.json({
        success: false,
        message: 'Part not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Part retrieved successfully',
      data: part
    }, { status: 200 });

  } catch (error: unknown) {
    console.error('Error fetching part:', error);
    let errorMessage = 'An unknown error occurred.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch part',
      error: errorMessage
    }, { status: 500 });
  }
}

// PUT - อัปเดตข้อมูลอะไหล่
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const body = await request.json();
    const { name, unit, stock_qty, min_qty, max_qty } = body;

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

    const part = await prisma.part.update({
      where: { id },
      data: {
        name: name.trim(),
        unit: unit.trim(),
        stock_qty: parseInt(stock_qty),
        min_qty: parseInt(min_qty),
        max_qty: parseInt(max_qty)
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Part updated successfully',
      data: part
    }, { status: 200 });

  } catch (error: unknown) {
    console.error('Error updating part:', error);
    let errorMessage = 'An unknown error occurred.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({
      success: false,
      message: 'Failed to update part',
      error: errorMessage
    }, { status: 500 });
  }
}

// DELETE - ลบอะไหล่
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;

    await prisma.part.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Part deleted successfully'
    }, { status: 200 });

  } catch (error: unknown) {
    console.error('Error deleting part:', error);
    let errorMessage = 'An unknown error occurred.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({
      success: false,
      message: 'Failed to delete part',
      error: errorMessage
    }, { status: 500 });
  }
}