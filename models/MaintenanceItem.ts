import mongoose, { Schema, Document, Model } from 'mongoose';

// กำหนด Interface สำหรับ Document
export interface IMaintenanceItem extends Document {
  description: string;
  date: Date;
  cost: number;
  notes?: string; // Optional field
}

// กำหนด Schema
const MaintenanceItemSchema: Schema<IMaintenanceItem> = new Schema({
  description: { type: String, required: true },
  date: { type: Date, required: true, default: Date.now },
  cost: { type: Number, required: true },
  notes: { type: String },
}, { timestamps: true }); // เพิ่ม timestamps เพื่อให้มี createdAt และ updatedAt อัตโนมัติ

// สร้าง Model หรือใช้ Model ที่มีอยู่แล้ว
const MaintenanceItem: Model<IMaintenanceItem> = mongoose.models.MaintenanceItem || mongoose.model<IMaintenanceItem>('MaintenanceItem', MaintenanceItemSchema);

export default MaintenanceItem;
