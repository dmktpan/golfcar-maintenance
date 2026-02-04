// app/api/proxy/jobs/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';

const EXTERNAL_API_BASE = process.env.EXTERNAL_API_BASE_URL || 'http://golfcar.go2kt.com:8080/api';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    console.log(`🔄 GET /api/proxy/jobs/${id} - External API Only`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    // เพิ่ม query parameter เพื่อขอข้อมูล parts ด้วย
    const url = new URL(`${EXTERNAL_API_BASE}/jobs/${id}`);
    url.searchParams.append('include', 'parts');

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    console.log('🌐 External API response status:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ External API success');
      return NextResponse.json(data);
    } else {
      console.log('❌ External API failed with status:', response.status);
      const errorText = await response.text();
      console.log('❌ Error response:', errorText);

      return NextResponse.json(
        {
          success: false,
          message: `External API failed with status ${response.status}`,
          data: null,
          details: errorText
        },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error('❌ Error fetching job:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch job from external API',
        data: null,
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await request.json();
    console.log(`🔄 PUT /api/proxy/jobs/${id} - External API Only`);
    console.log('📝 Request body:', JSON.stringify(body, null, 2));

    // ตรวจสอบว่ามี ID ใน body หรือไม่ ถ้าไม่มีให้เพิ่มเข้าไป
    if (!body.id) {
      body.id = id;
    }

    // เตรียมข้อมูลสำหรับ External API โดยรวมข้อมูลอะไหล่ด้วย
    const jobData: any = {
      ...body,
      // ตรวจสอบและเพิ่มข้อมูลอะไหล่ถ้ามี
      parts: body.parts || [],
      parts_used: body.parts_used || (body.parts ? body.parts.map((part: any) => `${part.part_name} (จำนวน: ${part.quantity_used || part.quantity || 1})`) : []),
      system: body.system || 'job'
    };

    // เพิ่มข้อมูลผู้อนุมัติเมื่อสถานะเป็น approved หรือ rejected
    if (body.status === 'approved' || body.status === 'rejected') {
      jobData.approved_by_id = body.approved_by_id || null;
      jobData.approved_by_name = body.approved_by_name?.trim() || null;
      // ถ้าไม่ได้ส่ง approved_at มา ให้สร้างใหม่
      if (!jobData.approved_at) {
        jobData.approved_at = new Date().toISOString();
      }

      if (body.status === 'rejected') {
        jobData.rejection_reason = body.rejection_reason || 'ไม่ระบุเหตุผล';
      }
    }

    console.log('📝 Job data with parts:', JSON.stringify(jobData, null, 2));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    const response = await fetch(`${EXTERNAL_API_BASE}/jobs/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(jobData),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    console.log('🌐 External API response status:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ External API success:', data);

      // ตรวจสอบว่า response มี success field หรือไม่
      if (data && typeof data === 'object') {
        // ถ้า External API ไม่ส่ง success field ให้เพิ่มเข้าไป
        if (!('success' in data)) {
          data.success = true;
        }
        return NextResponse.json(data);
      } else {
        // ถ้า response ไม่ใช่ object ให้ wrap ใน standard format
        return NextResponse.json({
          success: true,
          message: 'Job updated successfully',
          data: data
        });
      }
    } else {
      console.log('❌ External API failed with status:', response.status);
      const errorText = await response.text();
      console.log('❌ Error response:', errorText);

      // พยายาม parse error response เป็น JSON
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }

      return NextResponse.json(
        {
          success: false,
          message: errorData.message || `External API failed with status ${response.status}`,
          data: null,
          details: errorText
        },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error('❌ Error updating job:', error);

    // จัดการ error ต่างๆ
    let errorMessage = 'Failed to update job with external API';
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = 'Request timeout - External API took too long to respond';
        statusCode = 408;
      } else if (error.message.includes('fetch')) {
        errorMessage = 'Network error - Unable to connect to external API';
        statusCode = 503;
      } else {
        errorMessage = error.message;
      }
    }

    return NextResponse.json(
      {
        success: false,
        message: errorMessage,
        data: null,
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: statusCode }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    console.log(`🗑️ DELETE /api/proxy/jobs/${id} - External API Only`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    const response = await fetch(`${EXTERNAL_API_BASE}/jobs/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    console.log('🌐 External API response status:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ External API success');
      return NextResponse.json(data);
    } else {
      console.log('❌ External API failed with status:', response.status);
      const errorText = await response.text();
      console.log('❌ Error response:', errorText);

      return NextResponse.json(
        {
          success: false,
          message: `External API failed with status ${response.status}`,
          data: null,
          details: errorText
        },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error('❌ Error deleting job:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete job with external API',
        data: null,
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}