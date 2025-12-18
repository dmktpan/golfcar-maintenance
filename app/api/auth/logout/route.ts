import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId } = body;

        if (!userId) {
            return NextResponse.json(
                { success: false, message: 'User ID is required' },
                { status: 400 }
            );
        }

        // Set isOnline to false in the database
        await (prisma.user.update as any)({
            where: { id: userId },
            data: {
                isOnline: false,
                lastActive: new Date() // Still update lastActive to the logout time
            }
        });

        console.log(`✅ User ${userId} logged out successfully (isOnline: false)`);

        return NextResponse.json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        console.error('❌ Error logging out user:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Failed to process logout',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
