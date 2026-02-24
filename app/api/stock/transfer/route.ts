import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { part_id, from_location_id, to_location_id, quantity } = body;
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
            // Note: for Central (null), Prisma requires explicit filtering handling usually or just null?
            // In prisma schema: golf_course_id String? @db.ObjectId

            const fromInventory = await tx.inventory.findUnique({
                where: {
                    part_id_golf_course_id: {
                        part_id: part_id,
                        golf_course_id: fromId as any // Cast for TS if strict
                    }
                }
            });

            if (!fromInventory || fromInventory.quantity < qty) {
                throw new Error(`Insufficient stock at source (Available: ${fromInventory?.quantity || 0})`);
            }

            // 2. Deduct from Source
            await tx.inventory.update({
                where: { id: fromInventory.id },
                data: { quantity: fromInventory.quantity - qty }
            });

            // Also update Legacy Part.stock_qty if Source is Central
            if (fromId === null) {
                await tx.part.update({
                    where: { id: part_id },
                    data: { stock_qty: { decrement: qty } }
                });
            }

            // 3. Add to Destination
            const toInventory = await tx.inventory.findUnique({
                where: {
                    part_id_golf_course_id: {
                        part_id: part_id,
                        golf_course_id: toId as any
                    }
                }
            });

            if (toInventory) {
                await tx.inventory.update({
                    where: { id: toInventory.id },
                    data: { quantity: toInventory.quantity + qty }
                });
            } else {
                await tx.inventory.create({
                    data: {
                        part_id: part_id,
                        golf_course_id: toId,
                        quantity: qty
                    }
                });
            }

            // Also update Legacy Part.stock_qty if Destination is Central
            if (toId === null) {
                await tx.part.update({
                    where: { id: part_id },
                    data: { stock_qty: { increment: qty } }
                });
            }

            // 4. Log Transaction
            // Log OUT from Source
            await tx.stockTransaction.create({
                data: {
                    type: 'TRANSFER',
                    quantity: qty,
                    previous_balance: fromInventory.quantity,
                    new_balance: fromInventory.quantity - qty,
                    part_id: part_id,
                    location_id: fromId,
                    to_location_id: toId,
                    ref_type: 'MANUAL_TRANSFER',
                    user_id: 'SYSTEM', // TODO: Get User ID from Session/Headers if available
                    notes: 'Manual Transfer via Stock Management Screen'
                }
            });

            // Log IN to Destination
            await tx.stockTransaction.create({
                data: {
                    type: 'IN',
                    quantity: qty,
                    previous_balance: toInventory ? toInventory.quantity : 0,
                    new_balance: (toInventory ? toInventory.quantity : 0) + qty,
                    part_id: part_id,
                    location_id: toId,
                    ref_type: 'MANUAL_TRANSFER_IN',
                    user_id: 'SYSTEM'
                }
            });

        });

        return NextResponse.json({ success: true, message: 'Transfer successful' });

    } catch (error: any) {
        console.error('Manual Transfer Error:', error);
        return NextResponse.json({ success: false, message: error.message || 'Transfer failed' }, { status: 500 });
    }
}
