import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// GET - ค้นหาและกรองข้อมูลรถ
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Query parameters
    const search = searchParams.get('search'); // ค้นหาทั่วไป
    const golf_course_id = searchParams.get('golf_course_id');
    const status = searchParams.get('status');
    const brand = searchParams.get('brand');
    const model = searchParams.get('model');
    const year = searchParams.get('year');
    const vehicle_number = searchParams.get('vehicle_number');
    const serial_number = searchParams.get('serial_number');
    const battery_serial = searchParams.get('battery_serial');
    
    // Pagination
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20;
    const skip = (page - 1) * limit;
    
    // Sorting
    const sort_by = searchParams.get('sort_by') || 'createdAt';
    const sort_order = searchParams.get('sort_order') || 'desc';
    
    // Date range filters
    const created_from = searchParams.get('created_from');
    const created_to = searchParams.get('created_to');
    const transfer_from = searchParams.get('transfer_from');
    const transfer_to = searchParams.get('transfer_to');

    // สร้าง where clause
    const whereClause: any = {};

    // ค้นหาทั่วไป
    if (search) {
      whereClause.OR = [
        { vehicle_number: { contains: search, mode: 'insensitive' } },
        { serial_number: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
        { battery_serial: { contains: search, mode: 'insensitive' } },
        { golf_course_name: { contains: search, mode: 'insensitive' } }
      ];
    }

    // กรองตามสนามกอล์ฟ
    if (golf_course_id) {
      whereClause.golf_course_id = golf_course_id;
    }

    // กรองตามสถานะ
    if (status) {
      whereClause.status = status;
    }

    // กรองตามยี่ห้อ
    if (brand) {
      whereClause.brand = { contains: brand, mode: 'insensitive' };
    }

    // กรองตามรุ่น
    if (model) {
      whereClause.model = { contains: model, mode: 'insensitive' };
    }

    // กรองตามปี
    if (year) {
      whereClause.year = parseInt(year);
    }

    // กรองตามหมายเลขรถ
    if (vehicle_number) {
      whereClause.vehicle_number = { contains: vehicle_number, mode: 'insensitive' };
    }

    // กรองตามหมายเลขซีเรียล
    if (serial_number) {
      whereClause.serial_number = { contains: serial_number, mode: 'insensitive' };
    }

    // กรองตามหมายเลขแบตเตอรี่
    if (battery_serial) {
      whereClause.battery_serial = { contains: battery_serial, mode: 'insensitive' };
    }

    // กรองตามวันที่สร้าง
    if (created_from || created_to) {
      whereClause.createdAt = {};
      if (created_from) {
        whereClause.createdAt.gte = new Date(created_from);
      }
      if (created_to) {
        whereClause.createdAt.lte = new Date(created_to);
      }
    }

    // กรองตามวันที่โอนย้าย
    if (transfer_from || transfer_to) {
      whereClause.transfer_date = {};
      if (transfer_from) {
        whereClause.transfer_date.gte = new Date(transfer_from);
      }
      if (transfer_to) {
        whereClause.transfer_date.lte = new Date(transfer_to);
      }
    }

    // สร้าง orderBy clause
    const orderBy: any = {};
    orderBy[sort_by] = sort_order;

    // ดึงข้อมูลรถ
    const [vehicles, totalCount] = await Promise.all([
      prisma.vehicle.findMany({
        where: whereClause,
        include: {
          golfCourse: {
            select: {
              id: true,
              name: true,
              location: true
            }
          },
          jobs: {
            select: {
              id: true,
              type: true,
              status: true,
              createdAt: true
            },
            orderBy: {
              createdAt: 'desc'
            },
            take: 3 // เอาแค่ 3 งานล่าสุด
          },
          _count: {
            select: {
              jobs: true,
              historyLogs: true
            }
          }
        },
        orderBy,
        skip,
        take: limit
      }),
      prisma.vehicle.count({ where: whereClause })
    ]);

    // คำนวณข้อมูล pagination
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      success: true,
      message: 'Vehicles search completed successfully',
      data: vehicles,
      pagination: {
        current_page: page,
        total_pages: totalPages,
        total_count: totalCount,
        limit,
        has_next_page: hasNextPage,
        has_prev_page: hasPrevPage
      },
      filters_applied: {
        search,
        golf_course_id,
        status,
        brand,
        model,
        year,
        vehicle_number,
        serial_number,
        battery_serial,
        created_from,
        created_to,
        transfer_from,
        transfer_to
      },
      sorting: {
        sort_by,
        sort_order
      }
    }, { status: 200 });

  } catch (error: unknown) {
    console.error('Error searching vehicles:', error);
    let errorMessage = 'An unknown error occurred.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({
      success: false,
      message: 'Failed to search vehicles',
      error: errorMessage
    }, { status: 500 });
  }
}

// POST - ค้นหาขั้นสูงด้วย complex queries
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      filters, // object ของ filters ที่ซับซ้อน
      pagination = { page: 1, limit: 20 },
      sorting = { sort_by: 'createdAt', sort_order: 'desc' },
      include_stats = false // รวมสถิติหรือไม่
    } = body;

    const { page, limit } = pagination;
    const { sort_by, sort_order } = sorting;
    const skip = (page - 1) * limit;

    // สร้าง where clause จาก filters
    const whereClause: any = {};

    if (filters) {
      // Multiple golf courses
      if (filters.golf_course_ids && Array.isArray(filters.golf_course_ids)) {
        whereClause.golf_course_id = { in: filters.golf_course_ids };
      }

      // Multiple statuses
      if (filters.statuses && Array.isArray(filters.statuses)) {
        whereClause.status = { in: filters.statuses };
      }

      // Year range
      if (filters.year_from || filters.year_to) {
        whereClause.year = {};
        if (filters.year_from) whereClause.year.gte = parseInt(filters.year_from);
        if (filters.year_to) whereClause.year.lte = parseInt(filters.year_to);
      }

      // Has jobs filter
      if (filters.has_jobs !== undefined) {
        if (filters.has_jobs) {
          whereClause.jobs = { some: {} };
        } else {
          whereClause.jobs = { none: {} };
        }
      }

      // Has pending jobs
      if (filters.has_pending_jobs) {
        whereClause.jobs = {
          some: {
            status: { in: ['pending', 'assigned', 'in_progress'] }
          }
        };
      }

      // Recently transferred (within last N days)
      if (filters.recently_transferred_days) {
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - filters.recently_transferred_days);
        whereClause.transfer_date = { gte: daysAgo };
      }

      // Custom text search across multiple fields
      if (filters.text_search) {
        whereClause.OR = [
          { vehicle_number: { contains: filters.text_search, mode: 'insensitive' } },
          { serial_number: { contains: filters.text_search, mode: 'insensitive' } },
          { brand: { contains: filters.text_search, mode: 'insensitive' } },
          { model: { contains: filters.text_search, mode: 'insensitive' } },
          { battery_serial: { contains: filters.text_search, mode: 'insensitive' } },
          { golf_course_name: { contains: filters.text_search, mode: 'insensitive' } }
        ];
      }
    }

    // สร้าง orderBy clause
    const orderBy: any = {};
    orderBy[sort_by] = sort_order;

    // ดึงข้อมูลรถ
    const [vehicles, totalCount] = await Promise.all([
      prisma.vehicle.findMany({
        where: whereClause,
        include: {
          golfCourse: {
            select: {
              id: true,
              name: true,
              location: true
            }
          },
          jobs: {
            select: {
              id: true,
              type: true,
              status: true,
              createdAt: true,
              system: true
            },
            orderBy: {
              createdAt: 'desc'
            },
            take: 5
          },
          historyLogs: {
            select: {
              id: true,
              action_type: true,
              action_date: true,
              details: true
            },
            orderBy: {
              action_date: 'desc'
            },
            take: 3
          },
          _count: {
            select: {
              jobs: true,
              historyLogs: true
            }
          }
        },
        orderBy,
        skip,
        take: limit
      }),
      prisma.vehicle.count({ where: whereClause })
    ]);

    // สถิติเพิ่มเติม (ถ้าต้องการ)
    let stats = null;
    if (include_stats) {
      const [statusStats, golfCourseStats, brandStats] = await Promise.all([
        // สถิติตามสถานะ
        prisma.vehicle.groupBy({
          by: ['status'],
          where: whereClause,
          _count: { status: true }
        }),
        // สถิติตามสนามกอล์ฟ
        prisma.vehicle.groupBy({
          by: ['golf_course_name'],
          where: whereClause,
          _count: { golf_course_name: true }
        }),
        // สถิติตามยี่ห้อ
        prisma.vehicle.groupBy({
          by: ['brand'],
          where: whereClause,
          _count: { brand: true }
        })
      ]);

      stats = {
        by_status: statusStats,
        by_golf_course: golfCourseStats,
        by_brand: brandStats
      };
    }

    // คำนวณข้อมูล pagination
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      success: true,
      message: 'Advanced vehicles search completed successfully',
      data: vehicles,
      pagination: {
        current_page: page,
        total_pages: totalPages,
        total_count: totalCount,
        limit,
        has_next_page: hasNextPage,
        has_prev_page: hasPrevPage
      },
      stats,
      filters_applied: filters,
      sorting
    }, { status: 200 });

  } catch (error: unknown) {
    console.error('Error in advanced vehicle search:', error);
    let errorMessage = 'An unknown error occurred.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({
      success: false,
      message: 'Failed to perform advanced vehicle search',
      error: errorMessage
    }, { status: 500 });
  }
}