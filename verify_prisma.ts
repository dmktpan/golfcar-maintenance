
import { PrismaClient, TransactionType, Job } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('TransactionType:', TransactionType);
    try {
        // Check if mwr_code is valid in where clause
        const job = await prisma.job.findFirst({
            where: { mwr_code: 'TEST' },
            select: { mwr_code: true }
        });
        console.log('Job query successful');
    } catch (e) {
        console.error('Job query failed:', e);
    }
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
