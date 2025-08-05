import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// GET - ดึงสถิติและข้อมูลวิเคราะห์รถ
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Query parameters
    const golf_course_id = searchParams.get('golf_course_id');
    const date_from = searchParams.get('date_from');
    const date_to = searchParams.get('date_to');
    const include_details = searchParams.get('include_details') === 'true';

    // สร้าง where clause สำหรับการกรอง
    const whereClause: any = {};
    
    if (golf_course_id) {
      whereClause.golf_course_id = golf_course_id;
    }

    if (date_from || date_to) {
      whereClause.createdAt = {};
      if (date_from) whereClause.createdAt.gte = new Date(date_from);
      if (date_to) whereClause.createdAt.lte = new Date(date_to);
    }

    // ดึงสถิติพื้นฐาน
    const [
      totalVehicles,
      statusStats,
      golfCourseStats,
      brandStats,
      yearStats,
      recentTransfers,
      vehiclesWithJobs,
      vehiclesWithPendingJobs
    ] = await Promise.all([
      // จำนวนรถทั้งหมด
      prisma.vehicle.count({ where: whereClause }),
      
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
        _count: { golf_course_name: true },
        orderBy: { _count: { golf_course_name: 'desc' } }
      }),
      
      // สถิติตามยี่ห้อ
      prisma.vehicle.groupBy({
        by: ['brand'],
        where: whereClause,
        _count: { brand: true },
        orderBy: { _count: { brand: 'desc' } }
      }),
      
      // สถิติตามปี
      prisma.vehicle.groupBy({
        by: ['year'],
        where: whereClause,
        _count: { year: true },
        orderBy: { year: 'desc' }
      }),
      
      // การโอนย้ายล่าสุด (30 วันที่ผ่านมา)
      prisma.vehicle.count({
        where: {
          ...whereClause,
          transfer_date: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      
      // รถที่มีงาน
      prisma.vehicle.count({
        where: {
          ...whereClause,
          jobs: { some: {} }
        }
      }),
      
      // รถที่มีงานค้างอยู่
      prisma.vehicle.count({
        where: {
          ...whereClause,
          jobs: {
            some: {
              status: { in: ['pending', 'assigned', 'in_progress'] }
            }
          }
        }
      })
    ]);

    // สถิติการบำรุงรักษา
    const maintenanceStats = await prisma.job.groupBy({
      by: ['type', 'status'],
      where: {
        vehicle: whereClause.golf_course_id ? { golf_course_id: whereClause.golf_course_id } : undefined,
        createdAt: whereClause.createdAt
      },
      _count: { type: true }
    });

    // สถิติการใช้อะไหล่
    const partsUsageStats = await prisma.jobPart.groupBy({
      by: ['part_name'],
      where: {
        job: {
          vehicle: whereClause.golf_course_id ? { golf_course_id: whereClause.golf_course_id } : undefined,
          createdAt: whereClause.createdAt
        }
      },
      _sum: { quantity_used: true },
      _count: { part_name: true },
      orderBy: { _sum: { quantity_used: 'desc' } },
      take: 10
    });

    // ข้อมูลรายละเอียดเพิ่มเติม (ถ้าต้องการ)
    let detailStats = null;
    if (include_details) {
      const [
        oldestVehicles,
        newestVehicles,
        mostActiveVehicles,
        vehiclesNeedingMaintenance
      ] = await Promise.all([
        // รถที่เก่าที่สุด
        prisma.vehicle.findMany({
          where: whereClause,
          orderBy: { year: 'asc' },
          take: 5,
          select: {
            id: true,
            vehicle_number: true,
            serial_number: true,
            brand: true,
            model: true,
            year: true,
            status: true,
            golf_course_name: true
          }
        }),
        
        // รถที่ใหม่ที่สุด
        prisma.vehicle.findMany({
          where: whereClause,
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            vehicle_number: true,
            serial_number: true,
            brand: true,
            model: true,
            year: true,
            status: true,
            golf_course_name: true,
            createdAt: true
          }
        }),
        
        // รถที่มีงานมากที่สุด
        prisma.vehicle.findMany({
          where: whereClause,
          include: {
            _count: { select: { jobs: true } }
          },
          orderBy: { jobs: { _count: 'desc' } },
          take: 5
        }),
        
        // รถที่ต้องการบำรุงรักษา (สถานะ maintenance)
        prisma.vehicle.findMany({
          where: {
            ...whereClause,
            status: 'maintenance'
          },
          include: {
            jobs: {
              where: {
                status: { in: ['pending', 'assigned', 'in_progress'] }
              },
              select: {
                id: true,
                type: true,
                status: true,
                createdAt: true
              }
            }
          },
          take: 10
        })
      ]);

      detailStats = {
        oldest_vehicles: oldestVehicles,
        newest_vehicles: newestVehicles,
        most_active_vehicles: mostActiveVehicles.map(v => ({
          ...v,
          job_count: v._count.jobs
        })),
        vehicles_needing_maintenance: vehiclesNeedingMaintenance
      };
    }

    // คำนวณเปอร์เซ็นต์
    const calculatePercentage = (count: number, total: number) => 
      total > 0 ? Math.round((count / total) * 100) : 0;

    const response = {
      success: true,
      message: 'Vehicle statistics retrieved successfully',
      data: {
        summary: {
          total_vehicles: totalVehicles,
          vehicles_with_jobs: vehiclesWithJobs,
          vehicles_with_pending_jobs: vehiclesWithPendingJobs,
          recent_transfers_30_days: recentTransfers,
          vehicles_without_jobs: totalVehicles - vehiclesWithJobs
        },
        
        by_status: statusStats.map(stat => ({
          status: stat.status,
          count: stat._count.status,
          percentage: calculatePercentage(stat._count.status, totalVehicles)
        })),
        
        by_golf_course: golfCourseStats.map(stat => ({
          golf_course_name: stat.golf_course_name,
          count: stat._count.golf_course_name,
          percentage: calculatePercentage(stat._count.golf_course_name, totalVehicles)
        })),
        
        by_brand: brandStats.map(stat => ({
          brand: stat.brand || 'Unknown',
          count: stat._count.brand,
          percentage: calculatePercentage(stat._count.brand, totalVehicles)
        })),
        
        by_year: yearStats.map(stat => ({
          year: stat.year || 0,
          count: stat._count.year,
          percentage: calculatePercentage(stat._count.year, totalVehicles)
        })),
        
        maintenance_stats: maintenanceStats.map(stat => ({
          job_type: stat.type,
          job_status: stat.status,
          count: stat._count.type
        })),
        
        top_parts_used: partsUsageStats.map(stat => ({
          part_name: stat.part_name,
          total_quantity_used: stat._sum.quantity_used || 0,
          usage_count: stat._count.part_name
        })),
        
        details: detailStats
      },
      
      filters_applied: {
        golf_course_id,
        date_from,
        date_to,
        include_details
      },
      
      generated_at: new Date().toISOString()
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error: unknown) {
    console.error('Error fetching vehicle statistics:', error);
    let errorMessage = 'An unknown error occurred.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch vehicle statistics',
      error: errorMessage
    }, { status: 500 });
  }
}

// POST - สร้างรายงานสถิติแบบกำหนดเอง
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      report_type, // 'summary', 'detailed', 'maintenance', 'transfer', 'custom'
      filters = {},
      date_range = {},
      group_by = [], // ['status', 'golf_course', 'brand', 'year', 'month']
      metrics = [] // ['count', 'percentage', 'trends']
    } = body;

    // สร้าง where clause จาก filters
    const whereClause: any = {};
    
    if (filters.golf_course_ids && Array.isArray(filters.golf_course_ids)) {
      whereClause.golf_course_id = { in: filters.golf_course_ids };
    }
    
    if (filters.statuses && Array.isArray(filters.statuses)) {
      whereClause.status = { in: filters.statuses };
    }
    
    if (filters.brands && Array.isArray(filters.brands)) {
      whereClause.brand = { in: filters.brands };
    }
    
    if (date_range.from || date_range.to) {
      whereClause.createdAt = {};
      if (date_range.from) whereClause.createdAt.gte = new Date(date_range.from);
      if (date_range.to) whereClause.createdAt.lte = new Date(date_range.to);
    }

    const results: any = {
      report_type,
      generated_at: new Date().toISOString(),
      filters_applied: filters,
      date_range_applied: date_range,
      data: {}
    };

    // สร้างรายงานตาม group_by
    for (const groupField of group_by) {
      let groupBy: any = {};
      let orderBy: any = {};

      switch (groupField) {
        case 'status':
          groupBy = { by: ['status'] };
          break;
        case 'golf_course':
          groupBy = { by: ['golf_course_name'] };
          orderBy = { _count: { golf_course_name: 'desc' } };
          break;
        case 'brand':
          groupBy = { by: ['brand'] };
          orderBy = { _count: { brand: 'desc' } };
          break;
        case 'year':
          groupBy = { by: ['year'] };
          orderBy = { year: 'desc' };
          break;
        case 'month':
          // สำหรับ month จะใช้การ group by month แบบง่าย
          const monthlyStats = await prisma.vehicle.findMany({
            where: whereClause,
            select: {
              createdAt: true
            }
          });
          
          // Group by month manually
          const monthGroups: { [key: string]: number } = {};
          monthlyStats.forEach(vehicle => {
            const monthKey = vehicle.createdAt.toISOString().substring(0, 7); // YYYY-MM
            monthGroups[monthKey] = (monthGroups[monthKey] || 0) + 1;
          });
          
          results.data[`by_${groupField}`] = Object.entries(monthGroups)
            .map(([month, count]) => ({ month, count }))
            .sort((a, b) => b.month.localeCompare(a.month));
          continue;
      }

      if (Object.keys(groupBy).length > 0) {
        const stats = await prisma.vehicle.groupBy({
          ...groupBy,
          where: whereClause,
          _count: { [groupBy.by[0]]: true },
          ...(Object.keys(orderBy).length > 0 && { orderBy })
        });

        results.data[`by_${groupField}`] = stats;
      }
    }

    // เพิ่ม metrics เฉพาะ
    if (metrics.includes('count')) {
      results.data.total_count = await prisma.vehicle.count({ where: whereClause });
    }

    if (metrics.includes('trends') && date_range.from && date_range.to) {
      // คำนวณ trend การเพิ่มรถใหม่
      const startDate = new Date(date_range.from);
      const endDate = new Date(date_range.to);
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff <= 365) { // ถ้าไม่เกิน 1 ปี ให้แสดง daily trend
        const vehiclesInRange = await prisma.vehicle.findMany({
          where: {
            ...whereClause,
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          },
          select: {
            createdAt: true
          }
        });
        
        // Group by date manually
        const dailyGroups: { [key: string]: number } = {};
        vehiclesInRange.forEach(vehicle => {
          const dateKey = vehicle.createdAt.toISOString().substring(0, 10); // YYYY-MM-DD
          dailyGroups[dateKey] = (dailyGroups[dateKey] || 0) + 1;
        });
        
        results.data.daily_trends = Object.entries(dailyGroups)
          .map(([date, count]) => ({ date, count }))
          .sort((a, b) => a.date.localeCompare(b.date));
      }
    }

    // รายงานเฉพาะตาม report_type
    switch (report_type) {
      case 'maintenance':
        const maintenanceReport = await prisma.job.groupBy({
          by: ['type', 'status'],
          where: {
            vehicle: whereClause.golf_course_id ? { golf_course_id: whereClause.golf_course_id } : undefined,
            createdAt: whereClause.createdAt
          },
          _count: { type: true }
        });
        results.data.maintenance_breakdown = maintenanceReport;
        break;

      case 'transfer':
        const transferReport = await prisma.serialHistoryEntry.groupBy({
          by: ['golf_course_name'],
          where: {
            action_type: 'transfer',
            action_date: whereClause.createdAt
          },
          _count: { golf_course_name: true }
        });
        results.data.transfer_activity = transferReport;
        break;
    }

    return NextResponse.json({
      success: true,
      message: 'Custom vehicle report generated successfully',
      ...results
    }, { status: 200 });

  } catch (error: unknown) {
    console.error('Error generating custom vehicle report:', error);
    let errorMessage = 'An unknown error occurred.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({
      success: false,
      message: 'Failed to generate custom vehicle report',
      error: errorMessage
    }, { status: 500 });
  }
}