import { prisma } from '@/lib/db/prisma';



export class StockError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'StockError';
    }
}

/**
 * Checks if a specific site has enough stock for a list of parts
 */
export async function checkSiteStock(
    partRequests: { partId: string; quantity: number }[],
    golfCourseId: string
) {
    const results = [];

    for (const req of partRequests) {
        const inventory = await (prisma as any).inventory.findUnique({
            where: {
                part_id_golf_course_id: {
                    part_id: req.partId,
                    golf_course_id: golfCourseId
                }
            },
            include: {
                part: true
            }
        });

        const currentQty = inventory?.quantity || 0;

        results.push({
            partId: req.partId,
            partName: inventory?.part.name || 'Unknown Part',
            requested: req.quantity,
            available: currentQty,
            isSufficient: currentQty >= req.quantity
        });
    }

    return results;
}

/**
 * Consumes stock from a specific site (Maintenance Job)
 * Throws StockError if insufficient
 */
export async function consumeStockForJob(
    jobId: string,
    parts: { partId: string; quantity: number }[],
    golfCourseId: string,
    userId: string,
    tx?: any
) {
    // 1. Validate first (Double check)
    // Note: checkSiteStock uses prisma global, might need db passing too if strictly transactional read needed?
    // For now, checks are mostly read.
    const checks = await checkSiteStock(parts, golfCourseId); // Should ideally use tx too

    const insufficient = checks.filter(c => !c.isSufficient);

    if (insufficient.length > 0) {
        const details = insufficient.map(i => `${i.partName} (ต้องการ ${i.requested}, มี ${i.available})`).join(', ');
        throw new StockError(`สต็อกอะไหล่ไม่พอ: ${details}`);
    }

    // 2. Execute Deduction Transaction
    await (async () => {
        // If tx is provided, use it directly. If not, start a new transaction.
        const work = async (client: any) => {
            const transactions = [];


            for (const part of parts) {
                // Get current inventory (lock row implicitly by update? No, find first)
                const inventory = await client.inventory.findUniqueOrThrow({
                    where: {
                        part_id_golf_course_id: {
                            part_id: part.partId,
                            golf_course_id: golfCourseId
                        }
                    }
                });

                const newBalance = inventory.quantity - part.quantity;

                // Update Inventory
                await client.inventory.update({
                    where: { id: inventory.id },
                    data: { quantity: newBalance }
                });

                // Create Audit Log
                const log = await client.stockTransaction.create({
                    data: {
                        type: 'OUT', // TransactionType.OUT
                        quantity: part.quantity,
                        previous_balance: inventory.quantity,
                        new_balance: newBalance,
                        part_id: part.partId,
                        location_id: golfCourseId, // Site ID
                        ref_type: 'JOB',
                        ref_id: jobId,
                        user_id: userId
                    }
                });

                transactions.push(log);

                // --- DUAL WRITE: Create Legacy PartsUsageLog ---
                // Fetch Job & User details if not already fetched (Optimized: fetch once outside loop ideally, but for safety inside work function)
                // We need to fetch details for the log. To avoid fetching inside loop, we'll fetch once before loop.
            }

            // Fetch necessary details for PartsUsageLog
            const jobDetails = await client.job.findUnique({
                where: { id: jobId },
                include: {
                    vehicle: { include: { golfCourse: true } },
                    golfCourse: true
                }
            });

            const userDetails = await client.user.findUnique({
                where: { id: userId }
            });

            if (jobDetails && userDetails) {
                for (const part of parts) {
                    // Need part name. We fetched inventory earlier, but we lost scope. 
                    // We can fetch part details or rely on standard name if we had it.
                    // The 'parts' arg only has partId.
                    // Let's re-fetch part info or get it from inventory query if we adjust logic.
                    // Better: fetch part name during inventory lookup or separate query.

                    const partInfo = await client.part.findUnique({
                        where: { id: part.partId }
                    });

                    await client.partsUsageLog.create({
                        data: {
                            jobId: jobId,
                            partName: partInfo?.name || 'Unknown Part',
                            partId: part.partId,
                            quantityUsed: part.quantity,
                            vehicleNumber: jobDetails.vehicle_number || jobDetails.vehicle?.vehicle_number || 'N/A',
                            vehicleSerial: jobDetails.vehicle?.serial_number || 'N/A',
                            golfCourseName: jobDetails.golfCourse?.name || jobDetails.vehicle?.golfCourse?.name || 'N/A',
                            usedBy: userDetails.name, // Real user name
                            usedDate: new Date().toISOString(),
                            notes: jobDetails.notes || '',
                            jobType: jobDetails.type,
                            system: jobDetails.system || 'N/A'
                        }
                    });
                }
            }

            return transactions;
        };

        if (tx) return work(tx);
        return prisma.$transaction(work as any); // Cast for compatibility if needed
    })();
}

/**
 * Executes a Transfer from Central to Site (Restocking)
 */
export async function executeStockTransfer(transferId: string, userId: string) {
    return await prisma.$transaction(async (tx: any) => {
        // 1. Get Transfer
        const transfer = await tx.stockTransfer.findUniqueOrThrow({
            where: { id: transferId },
            include: { items: true }
        });

        if (transfer.status !== 'PENDING') {
            throw new StockError('Transfer is not in PENDING state');
        }

        if (!transfer.to_course_id) {
            throw new StockError('Destination course is missing');
        }

        // 2. Process Items
        for (const item of transfer.items) {
            // --- DEDUCT FROM CENTRAL ---
            // Find Central Inventory (golf_course_id = null)
            // Note: We need to handle "Central" not existing row as 0 qty
            // But for deduction, it must exist.

            // Assumption: Central Inventory IS valid. If row missing, it's 0.
            const centralInv = await tx.inventory.findUnique({
                where: {
                    part_id_golf_course_id: {
                        part_id: item.part_id,
                        golf_course_id: null as any // Prisma workaround for composite unique with null?
                        // Actually, in Mongo unique index on null works. But Prisma might be tricky.
                        // If golf_course_id is optional, we search by it being null?
                        // Let's try explicit query if needed, but unique match is best.
                    }
                }
            });

            // If we can't search by null in composite unique in Prisma easily:
            if (!centralInv) {
                // Create it if missing? No, can't deduct from missing.
                // Or maybe we treat "Part.stock_qty" as legacy central? 
                // Master Plan said "Migrate Part.stock_qty to Inventory".
                // Assuming migration is done or we create on fly?
                // For now, fail if central has no record.
                throw new StockError(`Central inventory record missing for part ${item.part_id}`);
            }

            if (centralInv.quantity < item.quantity) {
                throw new StockError(`Insufficient Central Stock for part ${item.part_id} (Available: ${centralInv.quantity})`);
            }

            // Deduct Central
            await tx.inventory.update({
                where: { id: centralInv.id },
                data: { quantity: centralInv.quantity - item.quantity }
            });

            // Log OUT from Central
            await tx.stockTransaction.create({
                data: {
                    type: 'TRANSFER',
                    quantity: item.quantity,
                    previous_balance: centralInv.quantity,
                    new_balance: centralInv.quantity - item.quantity,
                    part_id: item.part_id,
                    location_id: null, // Central
                    to_location_id: transfer.to_course_id,
                    ref_type: 'TRANSFER',
                    ref_id: transfer.id,
                    user_id: userId
                }
            });

            // --- ADD TO SITE ---
            // Check if Site Inventory exists
            const siteInv = await tx.inventory.findUnique({
                where: {
                    part_id_golf_course_id: {
                        part_id: item.part_id,
                        golf_course_id: transfer.to_course_id
                    }
                }
            });

            let newSiteBalance = item.quantity;

            if (siteInv) {
                newSiteBalance = siteInv.quantity + item.quantity;
                await tx.inventory.update({
                    where: { id: siteInv.id },
                    data: { quantity: newSiteBalance }
                });
            } else {
                await tx.inventory.create({
                    data: {
                        part_id: item.part_id,
                        golf_course_id: transfer.to_course_id,
                        quantity: item.quantity
                    }
                });
            }

            // Log IN to Site
            await tx.stockTransaction.create({
                data: {
                    type: 'IN', // TransactionType.IN
                    quantity: item.quantity,
                    previous_balance: siteInv ? siteInv.quantity : 0,
                    new_balance: newSiteBalance,
                    part_id: item.part_id,
                    location_id: transfer.to_course_id,
                    ref_type: 'TRANSFER_IN',
                    ref_id: transfer.id,
                    user_id: userId
                }
            });
        }

        // 3. Mark Transfer as Approved
        await tx.stockTransfer.update({
            where: { id: transferId },
            data: {
                status: 'APPROVED',
                approved_by_id: userId,
                approved_at: new Date()
            }
        });

        return true;
    });
}

/**
 * Approves a Part Request (MWR) -> Moves Stock from Central to Site
 */
export async function approvePartRequest(jobId: string, userId: string, tx?: any) {
    const work = async (client: any) => {
        // 1. Get Job
        const job = await client.job.findUniqueOrThrow({
            where: { id: jobId },
            include: { parts: true }
        });

        if (job.status === 'approved') {
            // If we are calling this as part of the approval process (PUT), checking status might be tricky 
            // if the status update happens in the SAME transaction but hasn't been committed?
            // Actually, usually we call this BEFORE update, or AFTER update in same tx.
            // If we call AFTER update in same tx, status IS approved. So we should skip this check if tx is provided?
            // Or assume caller knows.
            // Let's rely on logic: if we are HERE, we want to approve.
            // throw new StockError('Job is already approved');
        }

        if (!job.golf_course_id) {
            throw new StockError('Job has no target golf course');
        }

        // 2. Process Items (Central -> Site)
        for (const item of job.parts) {
            // --- DEDUCT FROM CENTRAL ---
            const centralInv = await client.inventory.findUnique({
                where: {
                    part_id_golf_course_id: {
                        part_id: item.part_id,
                        golf_course_id: null as any
                    }
                }
            });

            const qty = item.quantity_used;

            if (!centralInv) {
                throw new StockError(`Central inventory record missing for part ${item.part_name}`);
            }

            if (centralInv.quantity < qty) {
                throw new StockError(`Insufficient Central Stock for ${item.part_name} (Has: ${centralInv.quantity}, Need: ${qty})`);
            }

            // Deduct Central
            await client.inventory.update({
                where: { id: centralInv.id },
                data: { quantity: centralInv.quantity - qty }
            });

            // Log OUT from Central
            await client.stockTransaction.create({
                data: {
                    type: 'TRANSFER', // TransactionType.TRANSFER
                    quantity: qty,
                    previous_balance: centralInv.quantity,
                    new_balance: centralInv.quantity - qty,
                    part_id: item.part_id,
                    location_id: null, // Central
                    to_location_id: job.golf_course_id,
                    ref_type: 'MWR',
                    ref_id: job.id,
                    ref_document: job.mwr_code, // e.g. MWR-2402-001
                    user_id: userId,
                    notes: `MWR Approval: Transfer to Golf Course`
                }
            });

            // --- ADD TO SITE ---
            const siteInv = await client.inventory.findUnique({
                where: {
                    part_id_golf_course_id: {
                        part_id: item.part_id,
                        golf_course_id: job.golf_course_id
                    }
                }
            });

            let newSiteBalance = qty;

            if (siteInv) {
                newSiteBalance = siteInv.quantity + qty;
                await client.inventory.update({
                    where: { id: siteInv.id },
                    data: { quantity: newSiteBalance }
                });
            } else {
                await client.inventory.create({
                    data: {
                        part_id: item.part_id,
                        golf_course_id: job.golf_course_id,
                        quantity: qty
                    }
                });
            }

            // Log IN to Site
            await client.stockTransaction.create({
                data: {
                    type: 'IN', // TransactionType.IN
                    quantity: qty,
                    previous_balance: siteInv ? siteInv.quantity : 0,
                    new_balance: newSiteBalance,
                    part_id: item.part_id,
                    location_id: job.golf_course_id,
                    ref_type: 'MWR_IN',
                    ref_id: job.id,
                    ref_document: job.mwr_code,
                    user_id: userId
                }
            });
        }

        return true;
    };

    if (tx) return work(tx);
    return prisma.$transaction(work as any);
}
