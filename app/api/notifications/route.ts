import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// GET: Fetch notifications for a user
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ success: false, message: 'User ID is required' }, { status: 400 });
        }

        const notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 50 // Limit to last 50 notifications
        });

        return NextResponse.json({ success: true, data: notifications });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return NextResponse.json({ success: false, message: 'Failed to fetch notifications' }, { status: 500 });
    }
}

// POST: Create a notification (Internal use mainly)
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userId, title, message, type, link } = body;

        if (!userId || !title || !message) {
            return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
        }

        const notification = await prisma.notification.create({
            data: {
                userId,
                title,
                message,
                type: type || 'info',
                link,
                isRead: false
            }
        });

        return NextResponse.json({ success: true, data: notification });
    } catch (error) {
        console.error('Error creating notification:', error);
        return NextResponse.json({ success: false, message: 'Failed to create notification' }, { status: 500 });
    }
}
