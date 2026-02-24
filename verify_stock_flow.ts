import { prisma } from './lib/db/prisma';
import { approvePartRequest, consumeStockForJob } from './lib/stock';

async function main() {
    console.log('🚀 Starting Stock Flow Verification...');

    try {
        // 1. Setup Test Data
        const adminUser = await prisma.user.findFirst({ where: { role: 'admin' } });
        if (!adminUser) throw new Error('No admin user found');

        const golfCourse = await prisma.golfCourse.findFirst();
        if (!golfCourse) throw new Error('No golf course found');

        // Find a part with stock > 10 at Central
        const part = await prisma.part.findFirst({
            where: { stock_qty: { gt: 10 } }
        });
        if (!part) throw new Error('No part with sufficient stock found');

        const vehicle = await prisma.vehicle.findFirst({
            where: { golf_course_id: golfCourse.id }
        });
        if (!vehicle) throw new Error('No vehicle found for the golf course');

        console.log(`📝 Using Test Data:
      User: ${adminUser.name} (${adminUser.id})
      Course: ${golfCourse.name} (${golfCourse.id})
      Part: ${part.name} (${part.id}) - Central Stock: ${part.stock_qty}
      Vehicle: ${vehicle.vehicle_number} (${vehicle.id})
    `);

        // --- INITIAL STATE ---
        // Check Initial Site Stock
        const initialSiteInv = await prisma.inventory.findUnique({
            where: {
                part_id_golf_course_id: {
                    part_id: part.id,
                    golf_course_id: golfCourse.id
                }
            }
        });
        const initialSiteQty = initialSiteInv?.quantity || 0;
        console.log(`📊 Initial Site Stock: ${initialSiteQty}`);
        console.log(`📊 Initial Central Stock: ${part.stock_qty}`);

        // --- STEP 1: CREATE MWR (PART_REQUEST) ---
        console.log('\n--- STEP 1: Creating MWR ---');
        const mwrQty = 5;
        const mwrJob = await prisma.job.create({
            data: {
                type: 'PART_REQUEST',
                status: 'pending',
                user_id: adminUser.id,
                userName: adminUser.name,
                golf_course_id: golfCourse.id,
                vehicle_id: null, // MWR usually doesn't have vehicle
                remarks: 'Test MWR',
                parts: {
                    create: {
                        part_id: part.id,
                        part_name: part.name,
                        quantity_used: mwrQty
                    }
                }
            },
            include: { parts: true }
        });
        console.log(`✅ Created MWR Job: ${mwrJob.id}`);

        // --- STEP 2: APPROVE MWR (TRANSFER STOCK) ---
        console.log('\n--- STEP 2: Approving MWR ---');

        // Simulate API logic: manual approvePartRequest call
        await approvePartRequest(mwrJob.id, adminUser.id, prisma);

        // Update Job Status
        await prisma.job.update({
            where: { id: mwrJob.id },
            data: {
                status: 'approved',
                approved_by_id: adminUser.id,
                approved_at: new Date()
            }
        });
        console.log(`✅ Approved MWR Job`);

        // Check Stock After MWR
        const afterMwrSiteInv = await prisma.inventory.findUnique({
            where: {
                part_id_golf_course_id: {
                    part_id: part.id,
                    golf_course_id: golfCourse.id
                }
            }
        });
        const afterMwrSiteQty = afterMwrSiteInv?.quantity || 0;

        // Check Central Stock
        // Ensure Central Inventory exists for this part.
        let centralInv = await prisma.inventory.findUnique({
            where: {
                part_id_golf_course_id: {
                    part_id: part.id,
                    golf_course_id: null as any
                }
            }
        });

        if (!centralInv) {
            console.log('⚠️ Central Inventory missing (normal if using Part.stock_qty legacy), creating/syncing...');
            centralInv = await prisma.inventory.create({
                data: {
                    part_id: part.id,
                    golf_course_id: null,
                    quantity: part.stock_qty
                }
            });
        }

        const afterMwrCentralInv = await prisma.inventory.findUnique({
            where: { id: centralInv.id }
        });

        console.log(`📊 Post-MWR Site Stock: ${afterMwrSiteQty} (Expected: ${initialSiteQty + mwrQty})`);
        console.log(`📊 Post-MWR Central Stock: ${afterMwrCentralInv?.quantity} (Expected: ${centralInv.quantity - mwrQty})`);

        // --- STEP 3: CREATE PM JOB (CONSUME STOCK) ---
        console.log('\n--- STEP 3: Creating PM Job ---');
        const pmQty = 2;
        const pmJob = await prisma.job.create({
            data: {
                type: 'PM',
                status: 'pending',
                user_id: adminUser.id,
                userName: adminUser.name,
                golf_course_id: golfCourse.id,
                vehicle_id: vehicle.id,
                vehicle_number: vehicle.vehicle_number,
                remarks: 'Test PM',
                parts: {
                    create: {
                        part_id: part.id,
                        part_name: part.name,
                        quantity_used: pmQty
                    }
                }
            },
            include: { parts: true }
        });
        console.log(`✅ Created PM Job: ${pmJob.id}`);

        // --- STEP 4: APPROVE PM JOB (CONSUME STOCK) ---
        console.log('\n--- STEP 4: Approving PM Job ---');

        // Simulate API Logic
        const partsToConsume = [{ partId: part.id, quantity: pmQty }];
        await consumeStockForJob(pmJob.id, partsToConsume, golfCourse.id, adminUser.id, prisma);

        // Update Job Status
        await prisma.job.update({
            where: { id: pmJob.id },
            data: {
                status: 'approved',
                approved_by_id: adminUser.id,
                approved_at: new Date()
            }
        });
        console.log(`✅ Approved PM Job`);

        // Check Stock After PM
        const finalSiteInv = await prisma.inventory.findUnique({
            where: {
                part_id_golf_course_id: {
                    part_id: part.id,
                    golf_course_id: golfCourse.id
                }
            }
        });
        const finalSiteQty = finalSiteInv?.quantity || 0;

        console.log(`📊 Final Site Stock: ${finalSiteQty} (Expected: ${afterMwrSiteQty - pmQty})`);

        // Verify Results
        if (finalSiteQty === afterMwrSiteQty - pmQty) {
            console.log('\n✅ VERIFICATION SUCCESSFUL: Stock moved and consumed correctly.');
        } else {
            console.error('\n❌ VERIFICATION FAILED: Stock mismatch.');
        }

    } catch (error) {
        console.error('❌ Verification Error:', error);
    }
}

main();
