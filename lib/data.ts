
// --- TYPE DEFINITIONS ---
export type UserRole = 'staff' | 'supervisor' | 'admin';

export interface User {
  id: number;
  code: string;
  name: string;
  role: UserRole;
  golf_course_id: number;
}

export interface GolfCourse {
    id: number;
    name: string;
    location: string;
}

export interface Vehicle {
  id: number;
  serial_number: string;
  vehicle_number: string;
  golf_course_id: number;
  status?: 'active' | 'inactive'; // เพิ่ม status field
}

export interface Part {
  id: number;
  name: string;
  unit: string;
  price: number;
  stock_qty: number;
}

export type JobType = 'PM' | 'BM' | 'Recondition';
export type JobStatus = 'pending' | 'approved' | 'rejected' | 'assigned' | 'in_progress' | 'completed';

export interface Job {
  id: number;
  user_id: number;
  userName: string;
  vehicle_id: number;
  vehicle_number: string;
  golf_course_id: number; // เพิ่ม field นี้
  type: JobType;
  status: JobStatus;
  created_at: string;
  updated_at?: string;
  parts: { part_id: number; quantity_used: number }[];
  system: string;
  subTasks: string[];
  partsNotes: string;
  remarks: string;
  imageUrl?: string;
  assigned_by?: number;
  assigned_by_name?: string;
  assigned_to?: number;
}

// --- MOCK DATA (Simulating Database) ---
export const MOCK_GOLF_COURSES: GolfCourse[] = [
    { id: 1, name: 'วอเตอร์แลนด์', location: 'Bangkok' },
    { id: 2, name: 'กรีนวัลเลย์', location: 'Chonburi' },
];

// เพิ่มผู้ใช้งานมากขึ้น
export const MOCK_USERS: User[] = [
  { id: 1, code: 'staff123', name: 'tape1408', role: 'staff', golf_course_id: 1 },
  { id: 2, code: 'super567', name: 'สมศรี หัวหน้า', role: 'supervisor', golf_course_id: 1 },
  { id: 3, code: 'admin000', name: 'administrator', role: 'admin', golf_course_id: 1 },
  { id: 4, code: 'staff456', name: 'สมชาย พนักงาน', role: 'staff', golf_course_id: 2 },
  { id: 5, code: 'staff789', name: 'สมหญิง ช่างซ่อม', role: 'staff', golf_course_id: 1 },
  { id: 6, code: 'staff101', name: 'วิชัย เทคนิค', role: 'staff', golf_course_id: 2 },
  { id: 7, code: 'super890', name: 'ประยุทธ หัวหน้าช่าง', role: 'supervisor', golf_course_id: 2 },
];

// เพิ่มรถกอล์ฟมากขึ้น
export const MOCK_VEHICLES: Vehicle[] = [
  { id: 101, serial_number: 'KT-20220601', vehicle_number: 'A01', golf_course_id: 1 },
  { id: 102, serial_number: 'GC-SN-002', vehicle_number: 'A02', golf_course_id: 1 },
  { id: 103, serial_number: 'GC-SN-003', vehicle_number: 'B05', golf_course_id: 1 },
  { id: 104, serial_number: 'WL-2023-001', vehicle_number: 'A03', golf_course_id: 1 },
  { id: 105, serial_number: 'WL-2023-002', vehicle_number: 'A04', golf_course_id: 1 },
  { id: 106, serial_number: 'WL-2023-003', vehicle_number: 'B01', golf_course_id: 1 },
  { id: 107, serial_number: 'WL-2023-004', vehicle_number: 'B02', golf_course_id: 1 },
  { id: 108, serial_number: 'WL-2023-005', vehicle_number: 'B03', golf_course_id: 1 },
  { id: 201, serial_number: 'GV-20230101', vehicle_number: 'C01', golf_course_id: 2 },
  { id: 202, serial_number: 'GV-20230102', vehicle_number: 'C02', golf_course_id: 2 },
  { id: 203, serial_number: 'GV-2023-003', vehicle_number: 'C03', golf_course_id: 2 },
  { id: 204, serial_number: 'GV-2023-004', vehicle_number: 'C04', golf_course_id: 2 },
];

// เพิ่มอะไหล่มากขึ้น
export const MOCK_PARTS: Part[] = [
  { id: 1, name: 'แบตเตอรี่ 12V', unit: 'ลูก', price: 3500, stock_qty: 15 },
  { id: 2, name: 'ยางล้อ', unit: 'เส้น', price: 1200, stock_qty: 40 },
  { id: 3, name: 'ชุดควบคุมมอเตอร์', unit: 'ชุด', price: 8500, stock_qty: 5 },
  { id: 4, name: 'ผ้าเบรค', unit: 'ชุด', price: 800, stock_qty: 22 },
  { id: 5, name: 'น้ำมันเฟืองท้าย', unit: 'ลิตร', price: 450, stock_qty: 30 },
  { id: 6, name: 'จารบี', unit: 'หลอด', price: 120, stock_qty: 50 },
  { id: 7, name: 'แปรงถ่าน', unit: 'ชุด', price: 650, stock_qty: 18 },
  { id: 8, name: 'ลูกหมาก', unit: 'ชิ้น', price: 350, stock_qty: 25 },
  { id: 9, name: 'ยางกันฝุ่น', unit: 'ชิ้น', price: 80, stock_qty: 60 },
  { id: 10, name: 'สายเบรค', unit: 'เส้น', price: 280, stock_qty: 35 },
];

export const MOCK_SYSTEMS: Record<string, Record<string, string[]>> = {
    'brake': {
        'cleaning': ['เป่าฝุ่น ขัดหน้าผ้าเบรก', 'ทำความสะอาดสายเบรก', 'ทำความสะอาดชุดแป้นเบรก'],
        'lubrication': ['หล่อลื่นรางสไลด์', 'หล่อลื่นแกนสลิง', 'หล่อลื่นแป้นเบรก'],
        'tightening': ['ติดตั้งผ้าเบรก', 'ติดตั้งสายเบรกและปรับตั้งสาย', 'ติดตั้งแป้นเบรก'],
        'inspection': ['การทำงานกลไกเบรก', 'ความคล่องตัวสายเบรก', 'ความคล่องตัวของการเบรกและล็อกเบรก', 'ซีลล้อหลัง การรั่วของน้ำมันเฟืองท้าย']
    },
    'steering': {
        'cleaning': ['ถอดยอยออกเพื่อทำความสะอาดด้วยโซแนกส์ส้ม', 'ทำความสะอาดคราบสกปรกต่างที่เกาะตามกระปุกพ่วงมาลัย', 'ทำความลูกหมากปลายโช๊คและใต้โช๊ค', 'ล้างเอาจารีเก่าออกแล้วเป่าลม-กรณีเป็นตับเอียง'],
        'lubrication': ['ใช้น้ำมันหล่อลื่นหยอดตามกากบาทยอยและโยกให้คล่องตัว', 'เปลี่ยนยางกันฝุ่นและเติมจารบีเฟืองแร็ก', 'ไม่มีจุดหล่อลืน', 'เติมจารบีใหม่ให้เหมาะสม'],
        'tightening': ['ติดตั้งยอยและขันน็อตยอยด้วยประแจเบอร์ 12 ให้แน่นทุกจุด', 'ขันน็อตยึดแกนให้แน่น', 'ไล่ขันแน่นน็อตลูกหมากทุกจุด', 'ไล่ขันน็อตแกนล้อหน้าและน็อตลูกปืน'],
        'inspection': ['ตรวจหมุนให้แน่ว่าไม่มีการรูดเมื่อขันน็อตยึด', 'ตรวจเช็ค END RACK และจุดยึดต่างของกระปุกพวงมาลัย', 'ตรวจเช็คลูกหมากว่ามีโยกหลวมหรือไม่', 'ลอยล้อกเพื่อฟังเสียงลูกปืนแตก']
    },
    'motor': {
        'cleaning': ['ทำความสะอาดชุดเฟืองท้ายให้สะอาดด้วยปืนแรงดัน', 'ถอดมอเตอร์เป่าฝุ่นทำความสะอาด', 'ล้างทำความสะอาดคราบสกปรก ทอร์ชั่นบาร์', 'ล้างทำความสะอาดคราบสกปรก โช๊คหลัง'],
        'lubrication': ['ถ่ายและเปลี่ยนน้ำมันเฟืองท้าย ทุกๆปี', 'ชโลมน้ำมันตรงล้างแปรงถ่าน', 'หยอดน้ำหล่อลื่นตรงบูชและจุดหมุน', 'หยอดน้ำตรงหัวบูชบน'],
        'tightening': ['ไล่ขันน็อตปิดน้ำมันเฟืองท้ายให้แน่น', 'ไล่ขันขั่วมอเตอร์ที่คลายตัว', 'ไล่ขันน็อตยึด', 'ขันน๊อตยึดหัวโช๊คให้แน่นพอดี'],
        'inspection': ['ระดับน้ำมันเฟืองที่น็อตตัวบนและตรวจเช็คน็อตยึดทุกจัดการคลยตัวหรือไม่', 'ตรวจเช็คการไหลลื่นของแปรงถ่านและการคลยตัวของน็อตขั้วมอเตอร์ทุกๆจุด ตรวจลูกปืนมอเตอร์ด้วยการหมุนฟังเสียง', 'ตรวจเช็คการคลยตัวของน็อตยึดทอร์ชั่นบาร์ และตรวจรอบแตกรอยราวของจุดเชื่อมมดเชื่อม', 'ตรวจการรั่วของน้ำมันโช๊ค']
    },
    'electric': {
        'cleaning': ['blank'],
        'lubrication': ['blank'],
        'tightening': ['blank'],
        'inspection': ['blank']
    }
};

export const MOCK_JOBS: Job[] = [
    // งานที่พนักงานสร้างเอง (ไม่มี assigned_by)
    { id: 1, user_id: 1, userName: 'tape1408', vehicle_id: 101, vehicle_number: 'A01', golf_course_id: 1, type: 'BM', status: 'pending', created_at: new Date(Date.now() - 86400000).toISOString(), parts: [{ part_id: 1, quantity_used: 1 }], system: 'brake', subTasks: ['การทำงานกลไกเบรก'], partsNotes: 'เปลี่ยนแบตเตอรี่ใหม่ 1 ลูก', remarks: 'สตาร์ทไม่ติด' },
    
    // งานที่หัวหน้างานมอบหมาย
    { id: 2, user_id: 1, userName: 'tape1408', vehicle_id: 102, vehicle_number: 'A02', golf_course_id: 1, type: 'PM', status: 'assigned', created_at: new Date(Date.now() - 3600000).toISOString(), parts: [], system: 'motor', subTasks: ['ทำความสะอาดชุดเฟืองท้ายให้สะอาดด้วยปืนแรงดัน', 'ถ่ายและเปลี่ยนน้ำมันเฟืองท้าย ทุกๆปี'], partsNotes: '', remarks: 'เช็คระยะ 500 ชั่วโมง', assigned_by: 2, assigned_by_name: 'สมศรี หัวหน้า', assigned_to: 1 },
    
    // งานที่กำลังดำเนินการ
    { id: 5, user_id: 5, userName: 'สมหญิง ช่างซ่อม', vehicle_id: 104, vehicle_number: 'A03', golf_course_id: 1, type: 'BM', status: 'in_progress', created_at: new Date(Date.now() - 7200000).toISOString(), parts: [], system: 'steering', subTasks: ['ทำความสะอาดคราบสกปรกต่างที่เกาะตามกระปุกพ่วงมาลัย'], partsNotes: '', remarks: 'พวงมาลัยหนัก', assigned_by: 2, assigned_by_name: 'สมศรี หัวหน้า', assigned_to: 5 },
    
    // งานที่เสร็จสิ้นแล้ว
    { id: 6, user_id: 1, userName: 'tape1408', vehicle_id: 105, vehicle_number: 'A04', golf_course_id: 1, type: 'PM', status: 'completed', created_at: new Date(Date.now() - 259200000).toISOString(), parts: [{ part_id: 5, quantity_used: 1 }], system: 'motor', subTasks: ['ถ่ายและเปลี่ยนน้ำมันเฟืองท้าย ทุกๆปี'], partsNotes: 'เปลี่ยนน้ำมันเฟืองท้าย 1 ลิตร', remarks: 'เช็คประจำ', assigned_by: 2, assigned_by_name: 'สมศรี หัวหน้า', assigned_to: 1 },
    
    // งานที่เสร็จแล้ว (ประวัติ)
    { id: 3, user_id: 1, userName: 'tape1408', vehicle_id: 103, vehicle_number: 'B05', golf_course_id: 1, type: 'BM', status: 'approved', created_at: new Date(Date.now() - 172800000).toISOString(), parts: [{ part_id: 2, quantity_used: 2 }], system: 'brake', subTasks: ['ติดตั้งผ้าเบรก'], partsNotes: 'เปลี่ยนยางล้อ 2 เส้น', remarks: 'ยางล้อหน้าแตก', assigned_by: 2, assigned_by_name: 'สมศรี หัวหน้า' },
    
    // งานที่พนักงานคนอื่นทำ
    { id: 4, user_id: 4, userName: 'สมชาย พนักงาน', vehicle_id: 201, vehicle_number: 'C01', golf_course_id: 2, type: 'PM', status: 'pending', created_at: new Date(Date.now() - 7200000).toISOString(), parts: [], system: 'steering', subTasks: ['ทำความสะอาดคราบสกปรกต่างที่เกาะตามกระปุกพ่วงมาลัย'], partsNotes: '', remarks: 'เช็คประจำเดือน', assigned_by: 2, assigned_by_name: 'สมศรี หัวหน้า' },
];
