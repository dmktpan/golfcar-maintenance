import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const golf_course_id = searchParams.get('golf_course_id');

    let whereClause = {};

    // Filter by golf course if provided
    if (golf_course_id) {
      whereClause = { golf_course_id };
    }

    const agreements = await prisma.agreement.findMany({
      where: whereClause,
      include: {
        golfCourse: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        _count: {
          select: { vehicles: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(agreements);
  } catch (error: any) {
    console.error('Error fetching agreements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agreements', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.agreement_number || !data.startDate || !data.endDate || !data.golf_course_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if agreement number already exists
    const existingAgreement = await prisma.agreement.findUnique({
      where: { agreement_number: data.agreement_number }
    });

    if (existingAgreement) {
      return NextResponse.json(
        { error: 'Agreement number already exists' },
        { status: 400 }
      );
    }

    const agreement = await prisma.agreement.create({
      data: {
        agreement_number: data.agreement_number,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        golf_course_id: data.golf_course_id,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
      include: {
        golfCourse: true
      }
    });

    return NextResponse.json(agreement, { status: 201 });
  } catch (error: any) {
    console.error('Error creating agreement:', error);
    return NextResponse.json(
      { error: 'Failed to create agreement', details: error.message },
      { status: 500 }
    );
  }
}
