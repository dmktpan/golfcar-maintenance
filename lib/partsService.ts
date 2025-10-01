import { Part } from './data';

// ประเภทหมวดหมู่อะไหล่ตามที่ผู้ใช้ต้องการ
export type PartCategory = 'brake' | 'steering' | 'motor' | 'electric' | 'other';

// Interface สำหรับอะไหล่ที่จัดกลุ่มแล้ว
export interface CategorizedPart {
  id: string | number;
  name: string;
  unit: string;
  category?: string;
  stock_qty?: number;
  part_number?: string;
}

// Interface สำหรับอะไหล่ที่จัดกลุ่มตามระบบ
export interface PartsBySystem {
  brake: CategorizedPart[];
  steering: CategorizedPart[];
  motor: CategorizedPart[];
  electric: CategorizedPart[];
  other: CategorizedPart[];
}

// ฟังก์ชันดึงข้อมูลอะไหล่ทั้งหมดจาก API
export async function fetchAllParts(): Promise<Part[]> {
  try {
    const response = await fetch('/api/parts');
    const result = await response.json();
    
    if (result.success) {
      return result.data || [];
    } else {
      console.error('Failed to fetch parts:', result.message);
      return [];
    }
  } catch (error) {
    console.error('Error fetching parts:', error);
    return [];
  }
}

// ฟังก์ชันจัดกลุ่มอะไหล่ตามหมวดหมู่
export function categorizePartsBySystem(parts: Part[]): PartsBySystem {
  const categorizedParts: PartsBySystem = {
    brake: [],
    steering: [],
    motor: [],
    electric: [],
    other: []
  };

  parts.forEach(part => {
    const categorizedPart: CategorizedPart = {
      id: part.id,
      name: part.name,
      unit: part.unit,
      category: part.category,
      stock_qty: part.stock_qty,
      part_number: part.part_number
    };

    // จัดกลุ่มตามหมวดหมู่
    switch (part.category?.toLowerCase()) {
      case 'brake':
      case 'เบรก':
      case 'ระบบเบรก':
      case 'ระบบเบรค':
        categorizedParts.brake.push(categorizedPart);
        break;
      case 'steering':
      case 'พวงมาลัย':
      case 'ระบบพวงมาลัย':
      case 'ระบบพวงมาลัย/ช่วงล่าง':
      case 'ช่วงล่าง':
      case 'suspension':
        categorizedParts.steering.push(categorizedPart);
        break;
      case 'motor':
      case 'มอเตอร์':
      case 'ระบบมอเตอร์':
      case 'ระบบมอร์เตอร์':
      case 'เครื่องยนต์':
        categorizedParts.motor.push(categorizedPart);
        break;
      case 'electric':
      case 'electrical':
      case 'ไฟฟ้า':
      case 'ระบบไฟฟ้า':
      case 'แบตเตอรี่':
        categorizedParts.electric.push(categorizedPart);
        break;
      case 'other':
      case 'อื่นๆ':
        categorizedParts.other.push(categorizedPart);
        break;
      default:
        // หากไม่ตรงกับหมวดหมู่ใดๆ ให้ใส่ใน other
        categorizedParts.other.push(categorizedPart);
        break;
    }
  });

  return categorizedParts;
}

// ฟังก์ชันหลักสำหรับดึงและจัดกลุ่มอะไหล่
export async function getPartsBySystem(): Promise<PartsBySystem> {
  const parts = await fetchAllParts();
  return categorizePartsBySystem(parts);
}

// ฟังก์ชันดึงอะไหล่ตามหมวดหมู่เฉพาะ
export async function getPartsByCategory(category: PartCategory): Promise<CategorizedPart[]> {
  const partsBySystem = await getPartsBySystem();
  return partsBySystem[category] || [];
}

// ฟังก์ชันค้นหาอะไหล่ทั่วไป
export async function searchParts(searchTerm: string): Promise<CategorizedPart[]> {
  const parts = await fetchAllParts();
  const searchLower = searchTerm.toLowerCase();
  
  return parts
    .filter(part => 
      part.name.toLowerCase().includes(searchLower) ||
      (part.part_number && part.part_number.toLowerCase().includes(searchLower)) ||
      (part.category && part.category.toLowerCase().includes(searchLower))
    )
    .map(part => ({
      id: part.id,
      name: part.name,
      unit: part.unit,
      category: part.category,
      stock_qty: part.stock_qty,
      part_number: part.part_number
    }));
}

// ฟังก์ชันสำหรับแปลงชื่อหมวดหมู่เป็นภาษาไทย
export function getCategoryDisplayName(category: PartCategory): string {
  const categoryNames: Record<PartCategory, string> = {
    brake: 'ระบบเบรก',
    steering: 'ระบบพวงมาลัย/ช่วงล่าง',
    motor: 'ระบบมอเตอร์',
    electric: 'ระบบไฟฟ้า',
    other: 'อื่นๆ'
  };
  return categoryNames[category] || category;
}

// ฟังก์ชันสำหรับแปลงชื่อหมวดหมู่จากภาษาไทยเป็นภาษาอังกฤษ
export function getCategoryKey(displayName: string): PartCategory {
  const categoryMap: Record<string, PartCategory> = {
    'ระบบเบรก': 'brake',
    'ระบบพวงมาลัย/ช่วงล่าง': 'steering',
    'ระบบมอเตอร์': 'motor',
    'ระบบไฟฟ้า': 'electric',
    'อื่นๆ': 'other'
  };
  return categoryMap[displayName] || 'other';
}