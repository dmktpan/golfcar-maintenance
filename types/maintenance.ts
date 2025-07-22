// types/maintenance.ts
export interface MaintenanceRequest {
  description: string;
  date: string;
  cost: number;
  notes?: string;
  vehicle_id: number;
  vehicle_number: string;
  golf_course_id: number;
  user_id: number;
  userName: string;
  images?: string[];
}

export interface MaintenanceInput {
  description: string;
  date: string;
  cost: number;
  notes?: string;
  vehicle_id: number;
  vehicle_number: string;
  golf_course_id: number;
  user_id: number;
  userName: string;
  images?: string[];
}

export interface MaintenanceResponse {
  id: string;
  description: string;
  date: string;
  cost: number;
  notes: string;
  vehicle_id: number;
  vehicle_number: string;
  golf_course_id: number;
  user_id: number;
  userName: string;
  createdAt: Date;
  updatedAt: Date;
  images?: string[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}