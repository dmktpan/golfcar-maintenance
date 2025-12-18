import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
    try {
        // Define "online" as active within the last 15 minutes
        // But fetch anyone active in the last 24 hours to show "recently offline"
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const activeUsers = await (prisma.user.findMany as any)({
            where: {
                lastActive: {
                    gte: twentyFourHoursAgo,
                },
            },
            select: {
                id: true,
                name: true,
                username: true,
                role: true,
                lastActive: true,
                isOnline: true,
            },
            orderBy: {
                lastActive: 'desc',
            },
        });

        return NextResponse.json({
            users: activeUsers,
            thresholdMs: 15 * 60 * 1000
        });
    } catch (error) {
        console.error("Fetch online users error:", error);
        return NextResponse.json({ error: "Failed to fetch online users" }, { status: 500 });
    }
}
