import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import * as xlsx from 'xlsx';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mwrCode = searchParams.get('mwr_code');

    let templateData: any[] = [];

    if (mwrCode) {
      // ดึงข้อมูลล่วงหน้าให้ถ้ามี MWR ให้มา
      const job = await prisma.job.findFirst({
        where: { mwr_code: mwrCode },
        include: { parts: true }
      });

      if (job) {
        templateData = job.parts.map(p => ({
          'MWR Code': job.mwr_code,
          'BPlus Code': '', // สต๊อกกรอกเอง
          'Part Name': p.part_name,
          'Part ID (DB)': p.part_id, // ใช้เป็นตัวอ้างอิงตอนอัพโหลด
          'Actual Quantity': p.quantity_used, // ตั้งค่าเริ่มต้นเป็นยอดที่ขอเบิก
          'Course ID': job.golf_course_id,
          'Date (YYYY-MM-DD)': new Date().toISOString().split('T')[0],
          'Remarks / Alerts': ''
        }));
      }
    }

    // ถ้าไม่มีข้อมูล หรือไม่ได้ระบุ MWR ให้โหลดแบบฟอร์มเปล่าตัวอย่าง
    if (templateData.length === 0) {
      templateData = [
        {
          'MWR Code': 'MWR-XXXX-XXX',
          'BPlus Code': 'RUxxxx/xxxxxxx',
          'Part Name': 'ชื่ออะไหล่',
          'Part ID (DB)': 'รหัสอะไหล่ MongoDB Object ID',
          'Actual Quantity': 1,
          'Course ID': 'รหัสสนามที่อ้างอิง',
          'Date (YYYY-MM-DD)': '202X-XX-XX',
          'Remarks / Alerts': 'แจ้งเตือนอะไหล่/หมายเหตุ'
        }
      ];
    }

    const worksheet = xlsx.utils.json_to_sheet(templateData);
    
    // ปรับความกว้างคอลัมน์ให้สวยงาม
    const wscols = [
      { wch: 20 }, // MWR Code
      { wch: 20 }, // BPlus Code
      { wch: 30 }, // Part Name
      { wch: 25 }, // Part ID (DB)
      { wch: 15 }, // Actual Quantity
      { wch: 25 }, // Course ID
      { wch: 15 }, // Date
      { wch: 30 }  // Remarks / Alerts
    ];
    worksheet['!cols'] = wscols;

    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'StockRequisition');

    // สร้าง Buffer เพื่อให้ client ดาวน์โหลด
    const buf = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    let filename = mwrCode ? `bplus_${mwrCode}.xlsx` : 'bplus_stock_template.xlsx';

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });

  } catch (error: any) {
    console.error('Error generating Excel template:', error);
    return NextResponse.json({ success: false, message: 'Failed to generate template' }, { status: 500 });
  }
}
