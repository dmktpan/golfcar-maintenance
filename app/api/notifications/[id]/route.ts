import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// PUT: Mark as read
export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;
        const body = await request.json();
        const { isRead } = body;

        const notification = await prisma.notification.update({
            where: { id },
            data: { isRead }
        });

        return NextResponse.json({ success: true, data: notification });
    } catch (error) {
        console.error('Error updating notification:', error);
        return NextResponse.json({ success: false, message: 'Failed to update notification' }, { status: 500 });
    }
}

// DELETE: Delete notification
export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;

        await prisma.notification.delete({
            where: { id }
        });

        return NextResponse.json({ success: true, message: 'Notification deleted' });
    } catch (error) {
        console.error('Error deleting notification:', error);
        return NextResponse.json({ success: false, message: 'Failed to delete notification' }, { status: 500 });
    }
}
