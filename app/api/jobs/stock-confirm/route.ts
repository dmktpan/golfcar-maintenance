import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { Prisma } from '@prisma/client';
import * as xlsx from 'xlsx';
import { StockError } from '@/lib/stock';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('user_id') as string;

    if (!file) {
      return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ success: false, message: 'User ID is required' }, { status: 400 });
    }

    // อ่านค่าไฟล์ Excel
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // แปลงข้อมูลเป็น JSON
    const data: any[] = xlsx.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      return NextResponse.json({ success: false, message: 'Excel file is empty' }, { status: 400 });
    }

    // จัดกลุ่มข้อมูลตาม MWR Code
    const mwrGroups: Record<string, any[]> = {};
    for (const row of data) {
      const mwr = row['MWR Code'];
      if (!mwr) continue;
      if (!mwrGroups[mwr]) mwrGroups[mwr] = [];
      mwrGroups[mwr].push(row);
    }

    const processedMwr: string[] = [];

    // ประมวลผลแต่ละ MWR
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      for (const [mwrCode, items] of Object.entries(mwrGroups)) {
        
        // 1. ตรวจสอบสถานะของ MWR (Job) ว่าทำไปแล้วหรือยัง
        const job = await tx.job.findFirst({
          where: { mwr_code: mwrCode }
        });

        if (!job) {
          throw new Error(`ไม่พบเอกสารใบขอเบิก MWR Code: ${mwrCode} ในระบบ`);
        }

        if (job.status === 'completed') {
          throw new StockError(`รหัสใบเบิก ${mwrCode} ถูกประมวลผล (Completed) ไปแล้ว ไม่สามารถทำซ้ำได้`);
        }

        if (job.status !== 'stock_pending' && job.status !== 'approved') {
           throw new StockError(`รหัสใบเบิก ${mwrCode} ไม่ได้อยู่ในสถานะรอคลังจ่ายของ (สถานะปัจจุบัน: ${job.status})`);
        }

        const bplusCode = items[0]['BPlus Code'] || 'N/A';
        const courseIdTo = items[0]['Course ID'] || job.golf_course_id; // ปลายทางที่ต้องการโอนของ

        // 2. ลูปย้ายของจากส่วนกลาง (Central) -> ไปยังสาขา (Site) ตารายการใน Excel
        for (const item of items) {
           let partId = item['Part ID (DB)'];
           const bplusPartCode = item['BPlus Code'] || item['รหัสอะไหล่'] || item['Part Number'];
           const partName = item['Part Name'] || 'Unknown';
           const actualQty = parseInt(item['Actual Quantity']?.toString() || '0', 10);

           // หากไม่มี Part ID (DB) แต่มีรหัส BPlus ให้พยายามค้นหาจากตาราง Part แทน
           if (!partId && bplusPartCode) {
               const partMatch = await tx.part.findFirst({
                   where: { part_number: String(bplusPartCode).trim() }
               });
               if (partMatch) {
                   partId = partMatch.id;
               }
           }

           if (!partId) {
             throw new Error(`ลืมระบุรหัส Part ID หรือรหัสไม่ตรงกับระบบสำหรับ MWR ${mwrCode} (รหัสอะไหล่ที่ส่งมา: ${bplusPartCode || partId})`);
           }
           if (actualQty <= 0) continue; // ถ้าให้แค่ 0 ก็ไม่ต้องหักของ

           // --- ตัดสต๊อกจาก Central ---
           const centralInv = await tx.inventory.findFirst({
               where: {
                   part_id: partId,
                   golf_course_id: null // ส่วนกลาง
               }
           });

           if (!centralInv || centralInv.quantity < actualQty) {
              const currentQty = centralInv ? centralInv.quantity : 0;
              throw new StockError(`กรุณาเพิ่มสต๊อกกลาง! อะไหล่ ${partName} ไม่เพียงพอในส่วนกลาง (ต้องการ ${actualQty}, มีเพียง ${currentQty})`);
           }

           // Deduct Central
           await tx.inventory.update({
               where: { id: centralInv.id },
               data: { quantity: centralInv.quantity - actualQty }
           });

           // Log OUT from Central
           await tx.stockTransaction.create({
               data: {
                   type: 'TRANSFER',
                   quantity: actualQty,
                   previous_balance: centralInv.quantity,
                   new_balance: centralInv.quantity - actualQty,
                   part_id: partId,
                   location_id: null, // Central
                   to_location_id: courseIdTo,
                   ref_type: 'MWR',
                   ref_id: job.id,
                   ref_document: mwrCode,
                   user_id: userId,
                   notes: `MWR Stock Transfer (BPlus: ${bplusCode})`
               }
           });

           // --- เพิ่มสต๊อกให้ปลายทาง (Site) ---
           const siteInv = await tx.inventory.findUnique({
               where: {
                   part_id_golf_course_id: {
                       part_id: partId,
                       golf_course_id: courseIdTo
                   }
               }
           });

           let newSiteBalance = actualQty;

           if (siteInv) {
               newSiteBalance = siteInv.quantity + actualQty;
               await tx.inventory.update({
                   where: { id: siteInv.id },
                   data: { quantity: newSiteBalance }
               });
           } else {
               await tx.inventory.create({
                   data: {
                       part_id: partId,
                       golf_course_id: courseIdTo,
                       quantity: actualQty
                   }
               });
           }

           // Log IN to Site
           await tx.stockTransaction.create({
               data: {
                   type: 'IN', // TransactionType.IN
                   quantity: actualQty,
                   previous_balance: siteInv ? siteInv.quantity : 0,
                   new_balance: newSiteBalance,
                   part_id: partId,
                   location_id: courseIdTo,
                   ref_type: 'MWR_IN',
                   ref_id: job.id,
                   ref_document: mwrCode,
                   user_id: userId,
                   notes: `Received from MWR (BPlus: ${bplusCode})`
               }
           });
        }

        // 3. จบการประมวลผล MWR อัพเดท Job Status
        await tx.job.update({
            where: { id: job.id },
            data: {
                status: 'completed',
                bplus_code: bplusCode,
                // นำไฟล์ที่อัพโหลดเก็บไว้ที่ไหนสักที่ (ตัวอย่างนี้เราแค่บันทึกไว้ว่าอัพโหลด)
                attachment_url: `uploaded_excel_for_${mwrCode}`,
                updatedAt: new Date()
            }
        });

        processedMwr.push(mwrCode);
      }
    }, {
       timeout: 30000 // เพิ่ม Timeout กรณีไฟล์ใหญ่
    });

    return NextResponse.json({
      success: true,
      message: 'Processing successful. Stock updated.',
      data: { processedMwr }
    }, { status: 200 });

  } catch (error: unknown) {
    console.error('Error confirming stock with Excel:', error);
    
    let errorMessage = 'An error occurred while uploading. Please check the template formatting.';
    if (error instanceof StockError) {
      errorMessage = error.message; // แจ้ง Error ของสต๊อกว่าไม่พอตรงๆ
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json({
      success: false,
      message: errorMessage
    }, { status: 400 });
  }
}
