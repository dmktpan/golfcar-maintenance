import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
    try {
        // Define "online" as active within the last 5 minutes
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

        const onlineUsers = await prisma.user.findMany({
            where: {
                lastActive: {
                    gte: fiveMinutesAgo,
                },
            },
            select: {
                id: true,
                name: true,
                username: true,
                role: true,
                lastActive: true,
            },
            orderBy: {
                lastActive: 'desc',
            },
        });

        return NextResponse.json({ users: onlineUsers });
    } catch (error) {
        console.error("Fetch online users error:", error);
        return NextResponse.json({ error: "Failed to fetch online users" }, { status: 500 });
    }
}
