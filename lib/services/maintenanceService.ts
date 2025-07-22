// lib/services/maintenanceService.ts
import { prisma } from '@/lib/db/prisma';
import type { MaintenanceInput, MaintenanceResponse } from '@/types/maintenance';

export class MaintenanceService {
  static async createMaintenance(data: MaintenanceInput): Promise<MaintenanceResponse> {
    const { description, date, cost, notes, vehicle_id, vehicle_number, golf_course_id, user_id, userName, images } = data;

    const newMaintenanceJob = await prisma.job.create({
      data: {
        type: 'PM', // Preventive Maintenance
        status: 'completed',
        vehicle_id,
        vehicle_number,
        golf_course_id,
        user_id,
        userName,
        system: 'Maintenance System',
        remarks: this.buildRemarks(description, cost, notes),
        created_at: new Date(date).toISOString(),
        updated_at: new Date().toISOString(),
        // Note: Add images field to Job model in Prisma schema if needed
      },
    });

    return this.formatMaintenanceResponse(newMaintenanceJob);
  }

  static async getAllMaintenance(): Promise<MaintenanceResponse[]> {
    const maintenanceItems = await prisma.job.findMany({
      where: {
        type: 'PM' // Preventive Maintenance
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return maintenanceItems.map(item => this.formatMaintenanceResponse(item));
  }

  static async getMaintenanceById(id: string): Promise<MaintenanceResponse | null> {
    const item = await prisma.job.findFirst({
      where: {
        id,
        type: 'PM'
      }
    });

    return item ? this.formatMaintenanceResponse(item) : null;
  }

  static async updateMaintenance(id: string, data: Partial<MaintenanceInput>): Promise<MaintenanceResponse | null> {
    const existingItem = await this.getMaintenanceById(id);
    if (!existingItem) return null;

    const updateData: any = {};
    
    if (data.description || data.cost || data.notes) {
      updateData.remarks = this.buildRemarks(
        data.description || existingItem.description,
        data.cost || existingItem.cost,
        data.notes || existingItem.notes
      );
    }

    if (data.vehicle_id) updateData.vehicle_id = data.vehicle_id;
    if (data.vehicle_number) updateData.vehicle_number = data.vehicle_number;
    if (data.golf_course_id) updateData.golf_course_id = data.golf_course_id;
    if (data.user_id) updateData.user_id = data.user_id;
    if (data.userName) updateData.userName = data.userName;
    if (data.date) updateData.created_at = new Date(data.date).toISOString();

    updateData.updated_at = new Date().toISOString();

    const updatedItem = await prisma.job.update({
      where: { id },
      data: updateData,
    });

    return this.formatMaintenanceResponse(updatedItem);
  }

  static async deleteMaintenance(id: string): Promise<boolean> {
    try {
      await prisma.job.delete({
        where: { id }
      });
      return true;
    } catch {
      return false;
    }
  }

  private static buildRemarks(description: string, cost: number, notes?: string): string {
    let remarks = `${description} - Cost: ${cost}`;
    if (notes) {
      remarks += ` - Notes: ${notes}`;
    }
    return remarks;
  }

  private static formatMaintenanceResponse(item: any): MaintenanceResponse {
    return {
      id: item.id,
      description: item.remarks?.split(' - Cost:')[0] || '',
      date: item.created_at || item.createdAt.toISOString(),
      cost: this.extractCostFromRemarks(item.remarks || ''),
      notes: this.extractNotesFromRemarks(item.remarks || ''),
      vehicle_id: item.vehicle_id,
      vehicle_number: item.vehicle_number,
      golf_course_id: item.golf_course_id,
      user_id: item.user_id,
      userName: item.userName,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    };
  }

  private static extractCostFromRemarks(remarks: string): number {
    const costMatch = remarks.match(/Cost:\s*(\d+(?:\.\d+)?)/);
    return costMatch ? parseFloat(costMatch[1]) : 0;
  }

  private static extractNotesFromRemarks(remarks: string): string {
    const notesMatch = remarks.match(/Notes:\s*(.+)$/);
    return notesMatch ? notesMatch[1] : '';
  }
}