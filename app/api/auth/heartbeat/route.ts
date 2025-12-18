import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, code, username } = body;

        if (!userId && !code && !username) {
            return NextResponse.json({ error: "User identifier is required" }, { status: 400 });
        }

        // 1. Try to update by ID first
        try {
            await prisma.user.update({
                where: { id: userId },
                data: { lastActive: new Date() },
            });
            return NextResponse.json({ success: true });
        } catch {
            // 2. If ID fails (e.g. external ID doesn't match local), try by Code (for staff)
            if (code) {
                try {
                    const userByCode = await prisma.user.findUnique({
                        where: { code: code }
                    });

                    if (userByCode) {
                        await prisma.user.update({
                            where: { id: userByCode.id },
                            data: { lastActive: new Date() },
                        });
                        return NextResponse.json({ success: true, method: 'code' });
                    }
                } catch (codeError) {
                    console.error("Heartbeat fallback code error:", codeError);
                }
            }

            // 3. If Code fails, try by Username (for admin/supervisor)
            if (username) {
                try {
                    const userByUsername = await prisma.user.findUnique({
                        where: { username: username }
                    });

                    if (userByUsername) {
                        await prisma.user.update({
                            where: { id: userByUsername.id },
                            data: { lastActive: new Date() },
                        });
                        return NextResponse.json({ success: true, method: 'username' });
                    }
                } catch (usernameError) {
                    console.error("Heartbeat fallback username error:", usernameError);
                }
            }

            console.warn(`Heartbeat failed: User not found locally (ID: ${userId}, Code: ${code}, Username: ${username})`);
            return NextResponse.json({ error: "User not found locally" }, { status: 404 });
        }
    } catch (error) {
        console.error("Heartbeat error:", error);
        return NextResponse.json({ error: "Failed to update heartbeat" }, { status: 500 });
    }
}
