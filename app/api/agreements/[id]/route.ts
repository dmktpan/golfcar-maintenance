import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const agreement = await prisma.agreement.findUnique({
      where: { id: params.id },
      include: {
        golfCourse: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        vehicles: {
          select: {
            id: true,
            vehicle_number: true,
            serial_number: true,
          }
        }
      },
    });

    if (!agreement) {
      return NextResponse.json({ error: 'Agreement not found' }, { status: 404 });
    }

    return NextResponse.json(agreement);
  } catch (error) {
    console.error('Error fetching agreement:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agreement' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();

    // Check if new agreement number already exists for another agreement
    if (data.agreement_number) {
      const existing = await prisma.agreement.findUnique({
        where: { agreement_number: data.agreement_number }
      });
      if (existing && existing.id !== params.id) {
        return NextResponse.json(
          { error: 'Agreement number already exists' },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};
    if (data.agreement_number) updateData.agreement_number = data.agreement_number;
    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.endDate) updateData.endDate = new Date(data.endDate);
    if (data.golf_course_id) updateData.golf_course_id = data.golf_course_id;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const agreement = await prisma.agreement.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(agreement);
  } catch (error) {
    console.error('Error updating agreement:', error);
    return NextResponse.json(
      { error: 'Failed to update agreement' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check if there are vehicles still tied to it
    const vehiclesCount = await prisma.vehicle.count({
      where: { agreement_id: params.id }
    });

    if (vehiclesCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete agreement with assigned vehicles. Reassign or remove vehicles first.' },
        { status: 400 }
      );
    }

    await prisma.agreement.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Agreement deleted successfully' });
  } catch (error) {
    console.error('Error deleting agreement:', error);
    return NextResponse.json(
      { error: 'Failed to delete agreement' },
      { status: 500 }
    );
  }
}
