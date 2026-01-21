import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { jobId } = body;

        if (!jobId) {
            return NextResponse.json({ error: "Job ID is required" }, { status: 400 });
        }

        // 1. Fetch the job and check status
        const job = await prisma.job.findUnique({
            where: { id: jobId },
            select: {
                id: true,
                status: true,
                prrNumber: true,
                createdAt: true
            } as any
        });

        if (!job) {
            return NextResponse.json({ error: "Job not found" }, { status: 404 });
        }

        // 2. Only allow for 'approved' status
        if ((job as any).status !== 'approved') {
            return NextResponse.json({
                error: "Only approved jobs can generate requisition numbers",
                currentStatus: (job as any).status
            }, { status: 400 });
        }

        // 3. Return existing PRR if already generated
        if ((job as any).prrNumber) {
            return NextResponse.json({
                success: true,
                prrNumber: (job as any).prrNumber,
                jobId: job.id,
                message: "Using existing requisition number"
            });
        }

        // 4. Generate new PRR number: PRR-YYMMDD-XXXX
        const now = new Date();
        const year = now.getFullYear().toString().slice(-2);
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        const dateStr = `${year}${month}${day}`;
        const prefix = `PRR-${dateStr}-`;

        // Start transaction to ensure uniqueness
        const result = await prisma.$transaction(async (tx) => {
            // Count existing PRRs for today
            const count = await tx.job.count({
                where: {
                    prrNumber: {
                        startsWith: prefix
                    }
                } as any
            });

            const nextNumber = (count + 1).toString().padStart(4, '0');
            const newPrrNumber = `${prefix}${nextNumber}`;

            // Update the job with the new PRR number
            const updatedJob = await tx.job.update({
                where: { id: jobId },
                data: { prrNumber: newPrrNumber } as any
            });

            return { prrNumber: newPrrNumber, updatedJob };
        });

        return NextResponse.json({
            success: true,
            prrNumber: result.prrNumber,
            jobId: job.id,
            message: "Generated new requisition number"
        });

    } catch (error) {
        console.error("Requisition generation error:", error);
        return NextResponse.json({ error: "Failed to generate requisition number" }, { status: 500 });
    }
}
