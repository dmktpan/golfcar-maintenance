import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { part_id, from_location_id, to_location_id, quantity, user_id, user_name } = body;
        const qty = Number(quantity);

        // Validation
        if (!part_id || !qty || qty <= 0) {
            return NextResponse.json({ success: false, message: 'Invalid Input' }, { status: 400 });
        }
        if (from_location_id === to_location_id) {
            return NextResponse.json({ success: false, message: 'Source and Destination must be different' }, { status: 400 });
        }

        // Prepare IDs (null if empty string)
        const fromId = from_location_id === '' ? null : from_location_id;
        const toId = to_location_id === '' ? null : to_location_id;

        await prisma.$transaction(async (tx) => {
            // 1. Check Source Stock
            let fromQuantity = 0;
            let fromInventoryId = null;

            if (fromId === null) {
                // Moving from Central: check Part.stock_qty
                const sourcePart = await tx.part.findUnique({
                    where: { id: part_id }
                });

                fromQuantity = sourcePart?.stock_qty || 0;

                // For completeness, if there's an explicit Inventory record for Central, check that too
                const centralInventory = await tx.inventory.findFirst({
                    where: {
                        part_id: part_id,
                        golf_course_id: null
                    }
                });

                if (centralInventory) {
                    fromInventoryId = centralInventory.id;
                    // Usually we trust the Part.stock_qty for central, but let's sync them if needed
                    fromQuantity = centralInventory.quantity;
                }

                if (fromQuantity < qty) {
                    throw new Error(`Insufficient stock at Central (Available: ${fromQuantity})`);
                }

                // Deduct from Source (Central)
                await tx.part.update({
                    where: { id: part_id },
                    data: { stock_qty: { decrement: qty } }
                });

                if (fromInventoryId) {
                    await tx.inventory.update({
                        where: { id: fromInventoryId },
                        data: { quantity: { decrement: qty } }
                    });
                }
            } else {
                // Moving from a Site
                const fromInventory = await tx.inventory.findUnique({
                    where: {
                        part_id_golf_course_id: {
                            part_id: part_id,
                            golf_course_id: fromId
                        }
                    }
                });

                fromQuantity = fromInventory?.quantity || 0;

                if (!fromInventory || fromQuantity < qty) {
                    throw new Error(`Insufficient stock at source site (Available: ${fromQuantity})`);
                }

                // Deduct from Source (Site)
                await tx.inventory.update({
                    where: { id: fromInventory.id },
                    data: { quantity: { decrement: qty } }
                });
            }

            // 3. Add to Destination
            let toQuantityBefore = 0;
            let toQuantityAfter = qty;

            if (toId === null) {
                // Moving to Central
                const destPart = await tx.part.findUnique({
                    where: { id: part_id }
                });

                toQuantityBefore = destPart?.stock_qty || 0;
                toQuantityAfter = toQuantityBefore + qty;

                await tx.part.update({
                    where: { id: part_id },
                    data: { stock_qty: { increment: qty } }
                });

                // Update inventory record if it exists
                const centralInventory = await tx.inventory.findFirst({
                    where: {
                        part_id: part_id,
                        golf_course_id: null
                    }
                });

                if (centralInventory) {
                    await tx.inventory.update({
                        where: { id: centralInventory.id },
                        data: { quantity: { increment: qty } }
                    });
                }
            } else {
                // Moving to a Site
                const toInventory = await tx.inventory.findUnique({
                    where: {
                        part_id_golf_course_id: {
                            part_id: part_id,
                            golf_course_id: toId
                        }
                    }
                });

                if (toInventory) {
                    toQuantityBefore = toInventory.quantity;
                    toQuantityAfter = toQuantityBefore + qty;

                    await tx.inventory.update({
                        where: { id: toInventory.id },
                        data: { quantity: { increment: qty } }
                    });
                } else {
                    toQuantityBefore = 0;
                    toQuantityAfter = qty;

                    await tx.inventory.create({
                        data: {
                            part_id: part_id,
                            golf_course_id: toId,
                            quantity: qty
                        }
                    });
                }
            }

            // 4. Log Transaction
            const actionUser = user_id || 'SYSTEM';

            // Log OUT from Source
            await tx.stockTransaction.create({
                data: {
                    type: 'TRANSFER',
                    quantity: qty,
                    previous_balance: fromQuantity,
                    new_balance: fromQuantity - qty,
                    part_id: part_id,
                    location_id: fromId,
                    to_location_id: toId,
                    ref_type: 'MANUAL_TRANSFER',
                    user_id: actionUser,
                    notes: `Manual Transfer via Stock Management Screen by ${user_name || actionUser}`
                }
            });

            // Log IN to Destination
            await tx.stockTransaction.create({
                data: {
                    type: 'IN',
                    quantity: qty,
                    previous_balance: toQuantityBefore,
                    new_balance: toQuantityAfter,
                    part_id: part_id,
                    location_id: toId,
                    ref_type: 'MANUAL_TRANSFER_IN',
                    user_id: actionUser
                }
            });

        });

        return NextResponse.json({ success: true, message: 'Transfer successful' });

    } catch (error: any) {
        console.error('Manual Transfer Error:', error);
        return NextResponse.json({ success: false, message: error.message || 'Transfer failed' }, { status: 500 });
    }
}
