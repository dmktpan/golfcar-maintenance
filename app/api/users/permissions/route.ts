// app/api/users/permissions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

const EXTERNAL_API_BASE = process.env.EXTERNAL_API_BASE_URL || 'http://golfcar.go2kt.com:8080/api';

// PUT - อัปเดต permissions ของ user
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, permissions } = body;

        console.log('🔐 PUT /api/users/permissions - Updating user permissions');
        console.log('📝 User ID:', userId);
        console.log('📝 Permissions:', permissions);

        if (!userId) {
            return NextResponse.json(
                { success: false, message: 'userId is required' },
                { status: 400 }
            );
        }

        if (!Array.isArray(permissions)) {
            return NextResponse.json(
                { success: false, message: 'permissions must be an array' },
                { status: 400 }
            );
        }

        // บันทึกผ่าน Prisma โดยตรงเสมอ (เพื่อให้แน่ใจว่าข้อมูลถูกเก็บใน local DB)
        console.log('📊 Saving permissions to local database via Prisma...');

        try {
            // ใช้ raw MongoDB update เพื่อเพิ่ม permissions field
            const result = await prisma.$runCommandRaw({
                update: 'users',
                updates: [
                    {
                        q: { _id: { $oid: userId } },
                        u: { $set: { permissions: permissions } },
                        upsert: false
                    }
                ]
            }) as { nModified?: number; n?: number; ok?: number };

            console.log('📊 Prisma update result:', result);

            if (result.ok === 1) {
                console.log('✅ Permissions saved to local database successfully');

                // ลองอัปเดต External API ด้วย (optional, ไม่ block ถ้าล้มเหลว)
                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 5000);

                    const getResponse = await fetch(`${EXTERNAL_API_BASE}/users/${userId}`, {
                        method: 'GET',
                        headers: { 'Content-Type': 'application/json' },
                        signal: controller.signal,
                    });

                    clearTimeout(timeoutId);

                    if (getResponse.ok) {
                        const userData = await getResponse.json();
                        const user = userData.data || userData;

                        const updateController = new AbortController();
                        const updateTimeoutId = setTimeout(() => updateController.abort(), 5000);

                        await fetch(`${EXTERNAL_API_BASE}/users/${userId}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ ...user, permissions }),
                            signal: updateController.signal,
                        });

                        clearTimeout(updateTimeoutId);
                        console.log('✅ Also synced to External API');
                    }
                } catch (externalError) {
                    console.warn('⚠️ Could not sync to External API (non-blocking):', externalError);
                }

                return NextResponse.json({
                    success: true,
                    message: 'Permissions updated successfully',
                    data: { userId, permissions }
                });
            } else {
                console.log('❌ Prisma update failed:', result);
                return NextResponse.json(
                    { success: false, message: 'Failed to update permissions in database' },
                    { status: 500 }
                );
            }
        } catch (prismaError) {
            console.error('❌ Prisma error:', prismaError);
            return NextResponse.json(
                { success: false, message: 'Database error', details: prismaError instanceof Error ? prismaError.message : 'Unknown error' },
                { status: 500 }
            );
        }

    } catch (error) {
        console.error('❌ Error updating permissions:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Failed to update permissions',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

// GET - ดึง permissions ของ user ตาม userId
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        console.log('🔐 GET /api/users/permissions - Getting user permissions');
        console.log('📝 User ID:', userId);

        if (!userId) {
            return NextResponse.json(
                { success: false, message: 'userId query parameter is required' },
                { status: 400 }
            );
        }

        // ลองดึงจาก External API ก่อน
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const response = await fetch(`${EXTERNAL_API_BASE}/users/${userId}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                const userData = await response.json();
                const user = userData.data || userData;

                if (user.permissions && user.permissions.length > 0) {
                    console.log('✅ User permissions retrieved from External API:', user.permissions);
                    return NextResponse.json({
                        success: true,
                        data: {
                            userId: userId,
                            permissions: user.permissions
                        }
                    });
                }
            }
        } catch (externalError) {
            console.warn('⚠️ External API failed, trying Prisma...', externalError);
        }

        // Fallback: ใช้ Prisma
        console.log('📊 Using Prisma to get permissions...');

        try {
            const result = await prisma.$runCommandRaw({
                find: 'users',
                filter: { _id: { $oid: userId } },
                projection: { permissions: 1 }
            }) as { cursor?: { firstBatch?: any[] } };

            const user = result?.cursor?.firstBatch?.[0];
            const permissions = user?.permissions || [];

            console.log('✅ User permissions retrieved from Prisma:', permissions);

            return NextResponse.json({
                success: true,
                data: {
                    userId: userId,
                    permissions: permissions
                }
            });
        } catch (prismaError) {
            console.error('❌ Prisma error:', prismaError);
            return NextResponse.json({
                success: true,
                data: {
                    userId: userId,
                    permissions: []
                }
            });
        }

    } catch (error) {
        console.error('❌ Error getting permissions:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Failed to get permissions',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
