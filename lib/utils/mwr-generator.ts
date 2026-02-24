
import { prisma } from '@/lib/db/prisma';

/**
 * Generates a unique MWR code in the format MWR-YYMM-XXX
 * Example: MWR-2402-001
 */
export async function generateMWRCode(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear().toString().substring(2); // 24
    const month = (now.getMonth() + 1).toString().padStart(2, '0'); // 02

    const prefix = `MWR-${year}${month}-`;

    // Find the last job with this prefix
    const lastJob = await prisma.job.findFirst({
        where: {
            mwr_code: {
                startsWith: prefix
            }
        },
        orderBy: {
            mwr_code: 'desc'
        },
        select: {
            mwr_code: true
        }
    });

    let sequence = 1;

    if (lastJob && lastJob.mwr_code) {
        const parts = lastJob.mwr_code.split('-');
        if (parts.length === 3) {
            const lastSeq = parseInt(parts[2]);
            if (!isNaN(lastSeq)) {
                sequence = lastSeq + 1;
            }
        }
    }

    const mwrCode = `${prefix}${sequence.toString().padStart(3, '0')}`;
    return mwrCode;
}
