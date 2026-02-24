
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyPartsUsage() {
    console.log('🔍 Verifying Parts Usage Logic...');

    try {
        // 1. Check Stock Transactions linked to Jobs
        const transactions = await prisma.stockTransaction.findMany({
            where: {
                type: 'OUT',
                ref_type: 'JOB',
                ref_id: { not: null }
            },
            take: 5,
            include: {
                part: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        console.log(`Found ${transactions.length} sample transactions (OUT, JOB)`);

        if (transactions.length === 0) {
            console.log('❌ No stock transactions found for jobs!');
            // Check if there are ANY OUT transactions
            const allOut = await prisma.stockTransaction.count({ where: { type: 'OUT' } });
            console.log(`Total OUT transactions: ${allOut}`);
            return;
        }

        // 2. Check related Jobs and Vehicles
        for (const t of transactions) {
            console.log(`\nTransaction ID: ${t.id}, Part: ${t.part.name}, Job ID: ${t.ref_id}`);

            if (t.ref_id) {
                const job = await prisma.job.findUnique({
                    where: { id: t.ref_id },
                    include: {
                        vehicle: true
                    }
                });

                if (job) {
                    console.log(`  ✅ Job found: ${job.id}`);
                    console.log(`  🚗 Vehicle: ${job.vehicle ? `${job.vehicle.vehicle_number} (${job.vehicle.serial_number})` : 'NULL'}`);
                    console.log(`  🚗 Job Vehicle Number (Fallback): ${job.vehicle_number}`);
                } else {
                    console.log(`  ❌ Job NOT found!`);
                }
            }
        }

        // 3. Check PartsUsageLog table
        const usageLogsCount = await prisma.partsUsageLog.count();
        console.log(`\nPartsUsageLog count: ${usageLogsCount}`);

        if (usageLogsCount > 0) {
            const logs = await prisma.partsUsageLog.findMany({ take: 3 });
            console.log('Sample PartsUsageLogs:', logs);
        }

        // 4. Check JobPart table
        const jobPartsCount = await prisma.jobPart.count();
        console.log(`\nJobPart count: ${jobPartsCount}`);

        if (jobPartsCount > 0) {
            const jobParts = await prisma.jobPart.findMany({ take: 3, include: { job: { include: { vehicle: true } } } });
            console.log('Sample JobParts:', jobParts.map(jp => ({
                part_name: jp.part_name,
                job_id: jp.jobId,
                vehicle: jp.job?.vehicle?.vehicle_number
            })));
        }

    } catch (error) {
        console.error('Error verifying parts usage:', error);
    } finally {
        await prisma.$disconnect();
    }
}

verifyPartsUsage();
