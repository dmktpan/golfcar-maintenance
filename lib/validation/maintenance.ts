// lib/validation/maintenance.ts
import { z } from 'zod';

export const maintenanceSchema = z.object({
  description: z.string().min(1, 'Description is required').max(500, 'Description too long'),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date format'),
  cost: z.number().min(0, 'Cost must be positive').max(999999, 'Cost too high'),
  notes: z.string().max(1000, 'Notes too long').optional(),
  vehicle_id: z.number().int().positive('Invalid vehicle ID'),
  vehicle_number: z.string().min(1, 'Vehicle number is required'),
  golf_course_id: z.number().int().positive('Invalid golf course ID'),
  user_id: z.number().int().positive('Invalid user ID'),
  userName: z.string().min(1, 'User name is required'),
  images: z.array(z.string()).optional(),
});

export type MaintenanceInput = z.infer<typeof maintenanceSchema>;

export function validateMaintenanceInput(data: unknown) {
  return maintenanceSchema.safeParse(data);
}