import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect'; // ใช้ alias @/ ถ้า config ไว้ หรือปรับ path
import MaintenanceItem from '@/models/MaintenanceItem'; // ใช้ alias @/ ถ้า config ไว้ หรือปรับ path

export async function POST(request: Request) {
  await connectDB(); // เชื่อมต่อ Database

  try {
    const body = await request.json();
    const { description, date, cost, notes } = body;

    const newItem = new MaintenanceItem({
      description,
      date: new Date(date),
      cost,
      notes,
    });

    await newItem.save();
    return NextResponse.json({ message: 'Maintenance item added successfully', item: newItem }, { status: 201 });
  } catch (error) {
    console.error('Error adding maintenance item:', error);
    return NextResponse.json({ message: 'Failed to add maintenance item', error: error.message }, { status: 500 });
  }
}

export async function GET() {
  await connectDB();
  try {
    const items = await MaintenanceItem.find({});
    return NextResponse.json(items, { status: 200 });
  } catch (error) {
    console.error('Error fetching maintenance items:', error);
    return NextResponse.json({ message: 'Failed to fetch maintenance items', error: error.message }, { status: 500 });
  }
}
