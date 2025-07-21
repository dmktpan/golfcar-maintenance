
// --- TYPE DEFINITIONS ---
export type UserRole = 'staff' | 'supervisor' | 'admin';
export type JobType = 'PM' | 'BM' | 'Recondition';
export type JobStatus = 'pending' | 'in_progress' | 'completed' | 'assigned' | 'approved' | 'rejected';
export type BMCause = 'breakdown' | 'accident'; // เพิ่ม type สำหรับสาเหตุ BM

export interface User {
  id: number;
  code: string;
  name: string;
  role: UserRole;
  golf_course_id: number;
  managed_golf_courses?: number[]; // เพิ่มฟิลด์สำหรับหัวหน้าที่ดูแลุยสนาม
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
  golf_course_name: string; // เพิ่มชื่อสนาม
  model: string; // เพิ่มรุ่นรถ
  battery_serial?: string; // เพิ่มซีเรียลแบตเตอรี่
  status?: 'active' | 'inactive' | 'parked' | 'spare'; // เพิ่มสถานะใหม่
  transfer_date?: string; // เพิ่มวันที่ย้ายรถ
}

// แก้ไข Part interface เพื่อเพิ่มข้อมูลเพิ่มเติม
export interface Part {
  id: number;
  name: string;
  unit: string;
  price: number;
  stock_qty: number;
  category?: string; // เพิ่มหมวดหมู่อะไหล่
  description?: string; // เพิ่มคำอธิบาย
}

// แก้ไข Job interface เพื่อรองรับจำนวนอะไหล่ที่ใช้
export interface Job {
  id: number;
  user_id: number;
  userName: string;
  vehicle_id: number;
  vehicle_number: string;
  golf_course_id: number;
  type: JobType;
  status: JobStatus;
  created_at: string;
  updated_at?: string;
  parts: { part_id: number; quantity_used: number; part_name?: string }[]; // เพิ่ม part_name
  system: string;
  subTasks: string[];
  partsNotes: string;
  remarks: string;
  imageUrl?: string;
  assigned_by?: number;
  assigned_by_name?: string;
  assigned_to?: number;
  bmCause?: BMCause; // เพิ่ม field สำหรับเก็บสาเหตุ BM
  battery_serial?: string; // เพิ่มฟิลด์สำหรับเก็บซีเรียลแบตที่พนักงานกรอกด้วยตนเอง
}

// เพิ่ม interface สำหรับการเลือกอะไหล่พร้อมจำนวน (เอาราคาออก)
export interface SelectedPart {
  id: number;
  name: string;
  quantity: number;
  unit: string;
}

// เพิ่ม View type ที่ส่วนท้ายของไฟล์
export type View = 'dashboard' | 'create_job' | 'parts_management' | 'admin_dashboard' | 'history' | 'profile' | 'manage_users' | 'multi_assign' | 'serial_history' | 'admin_management' | 'golf_course_management' | 'assigned_job_form' | 'view_assigned_jobs' | 'supervisor_pending_jobs';

// ลบ Job interface ที่ซ้ำออก (บรรทัด 65-81)

// --- MOCK DATA (Simulating Database) ---
export const MOCK_GOLF_COURSES: GolfCourse[] = [
    { id: 1, name: 'วอเตอร์แลนด์', location: 'Bangkok' },
    { id: 2, name: 'กรีนวัลเลย์', location: 'Chonburi' },
];

// เพิ่มผู้ใช้งานมากขึ้น
export const MOCK_USERS: User[] = [
  { id: 1, code: 'staff123', name: 'tape1408', role: 'staff', golf_course_id: 1 },
  { 
    id: 2, 
    code: 'super567', 
    name: 'สมศรี หัวหน้า', 
    role: 'supervisor', 
    golf_course_id: 1,
    managed_golf_courses: [1] // หัวหน้าดูแลเฉพาะสนาม 1
  },
  { 
    id: 3, 
    code: 'admin000', 
    name: 'administrator', 
    role: 'admin', 
    golf_course_id: 1,
    managed_golf_courses: [1, 2] // admin ดูแลทุกสนาม
  },
  { id: 4, code: 'staff456', name: 'สมชาย พนักงาน', role: 'staff', golf_course_id: 2 },
  { id: 5, code: 'staff789', name: 'สมหญิง ช่างซ่อม', role: 'staff', golf_course_id: 1 },
  { id: 6, code: 'staff101', name: 'วิชัย เทคนิค', role: 'staff', golf_course_id: 2 },
  { 
    id: 7, 
    code: 'super890', 
    name: 'ประยุทธ หัวหน้าช่าง', 
    role: 'supervisor', 
    golf_course_id: 2,
    managed_golf_courses: [2] // หัวหน้าดูแลเฉพาะสนาม 2
  },
  // เพิ่มหัวหน้าที่ดูแลหลายสนาม
  { 
    id: 8, 
    code: 'super999', 
    name: 'วิชัย หัวหน้าใหญู่', 
    role: 'supervisor', 
    golf_course_id: 1,
    managed_golf_courses: [1, 2] // หัวหน้าดูแลทั้ง 2 สนาม
  },
];

// เพิ่มรถกอล์ฟมากขึ้น
export const MOCK_VEHICLES: Vehicle[] = [
  { id: 101, serial_number: 'KT-20220601', vehicle_number: 'A01', golf_course_id: 1, golf_course_name: 'วอเตอร์แลนด์', model: 'Club Car Precedent', battery_serial: 'BAT-2024-001', status: 'active', transfer_date: '2024-01-15' },
  { id: 102, serial_number: 'GC-SN-002', vehicle_number: 'A02', golf_course_id: 1, golf_course_name: 'วอเตอร์แลนด์', model: 'E-Z-GO RXV', battery_serial: 'BAT-2024-002', status: 'active' },
  { id: 103, serial_number: 'GC-SN-003', vehicle_number: 'B05', golf_course_id: 1, golf_course_name: 'วอเตอร์แลนด์', model: 'Yamaha Drive2', battery_serial: 'BAT-2023-015', status: 'inactive', transfer_date: '2023-12-20' },
  { id: 104, serial_number: 'WL-2023-001', vehicle_number: 'A03', golf_course_id: 1, golf_course_name: 'วอเตอร์แลนด์', model: 'Club Car Precedent', battery_serial: 'BAT-2024-003', status: 'active' },
  { id: 105, serial_number: 'WL-2023-002', vehicle_number: 'A04', golf_course_id: 1, golf_course_name: 'วอเตอร์แลนด์', model: 'E-Z-GO TXT', battery_serial: 'BAT-2024-004', status: 'parked', transfer_date: '2024-02-10' },
  { id: 106, serial_number: 'WL-2023-003', vehicle_number: 'B01', golf_course_id: 1, golf_course_name: 'วอเตอร์แลนด์', model: 'Yamaha G29', battery_serial: 'BAT-2024-005', status: 'active' },
  { id: 107, serial_number: 'WL-2023-004', vehicle_number: 'B02', golf_course_id: 1, golf_course_name: 'วอเตอร์แลนด์', model: 'Club Car DS', battery_serial: 'BAT-2023-020', status: 'spare' },
  { id: 108, serial_number: 'WL-2023-005', vehicle_number: 'B03', golf_course_id: 1, golf_course_name: 'วอเตอร์แลนด์', model: 'E-Z-GO Freedom', battery_serial: 'BAT-2024-006', status: 'active', transfer_date: '2024-03-05' },
  { id: 201, serial_number: 'GV-20230101', vehicle_number: 'C01', golf_course_id: 2, golf_course_name: 'กรีนวัลเลย์', model: 'Club Car Precedent', battery_serial: 'BAT-2024-007', status: 'active' },
  { id: 202, serial_number: 'GV-20230102', vehicle_number: 'C02', golf_course_id: 2, golf_course_name: 'กรีนวัลเลย์', model: 'Yamaha Drive2', battery_serial: 'BAT-2023-025', status: 'inactive', transfer_date: '2024-01-25' },
  { id: 203, serial_number: 'GV-2023-003', vehicle_number: 'C03', golf_course_id: 2, golf_course_name: 'กรีนวัลเลย์', model: 'E-Z-GO RXV', battery_serial: 'BAT-2024-008', status: 'active' },
  { id: 204, serial_number: 'GV-2023-004', vehicle_number: 'C04', golf_course_id: 2, golf_course_name: 'กรีนวัลเลย์', model: 'Club Car DS', battery_serial: 'BAT-2023-030', status: 'spare', transfer_date: '2023-11-30' },
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
        'inspection': ['การทำงานกลไกเบรก', 'ความคล่องตัวสายเบรก', 'ความคล่องตัวของการเบรกและล็อกเบรก', 'ซีลลูอหลัง การรั่วของน้ำมันเฟืองท้าย']
    },
    'steering': {
        'cleaning': ['ถอดยอยออกเพื่อทำความสะอาดด้วยโซแนกส์ส้ม', 'ทำความสะอาดคราบสกปรกต่างที่เกาะตามกระปุกพ่วงมาลัย', 'ทำความลูกหมากปลายโช๊คและใต้โช๊ค', 'ล้างเอาจารีเก่าออกแล้วเป่าลม-กรณีเป็นตับเอียง'],
        'lubrication': ['ใช้น้ำมันหล่อลื่นหยอดตามกากบาทยอยและโยกให้คล่องตัว', 'เปลี่ยนยางกันฝุ่นและเติมจารบีเฟืองแร็ก', 'ไม่มีจุดหล่อลืน', 'เติมจารบีใหม่ให้เหมาะสม'],
        'tightening': ['ติดตั้งยอยและขันน็อตยอยด้วยประแจเบอร์ 12 ให้แน่นทุกจุด', 'ขันน็อตยึดแกนให้แน่น', 'ไล่ขันแน่นน็อตลูกมากจุด', 'ไล่ขันน็อตแกนล้อหน้าและน็อตลูกปืน'],
        'inspection': ['ตรวจหมุนให้แน่ว่าไม่มีการรูดเมื่อขันน็อตยึด', 'ตรวจเช็ค END RACK และจุดยึดต่างของกระปุกพวงมาลัย', 'ตรวจเช็คลูกหมากว่ามีโยกหลวมหรือไม่', 'ลอยล้อกเพื่อฟังเสียงลูกปืนแตก']
    },
    'motor': {
        'cleaning': ['ทำความสะอาดชุดเฟืองท้ายให้สะอาดด้วยปืนแรงดัน', 'ถอดมอเตอร์เป่าฝุ่นทำความสะอาด', 'ล้างำความสะอาดคราบสกปรก ทอร์ชั่นบาร์', 'ล้างำความสะอาดคราบสกปรก โช๊คหลัง'],
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
    // งานที่พนักงานสร้างเอง (ไม่มี assigned_by) - มีอะไหล่
    { id: 1, user_id: 1, userName: 'tape1408', vehicle_id: 101, vehicle_number: 'A01', golf_course_id: 1, type: 'BM', status: 'pending', created_at: new Date(Date.now() - 86400000).toISOString(), parts: [
      { part_id: 1, quantity_used: 1, part_name: 'แบตเตอรี่ 12V' }
    ], system: 'brake', subTasks: ['การทำงานกลไกเบรก'], partsNotes: 'เปลี่ยนแบตเตอรี่ใหม่ 1 ลูก', remarks: 'สตาร์ทไม่ติด', bmCause: 'breakdown', battery_serial: 'หลุด' },
    
    // งานที่หัวหน้างานมอบหมาย - มีอะไหล่
    { id: 2, user_id: 1, userName: 'tape1408', vehicle_id: 102, vehicle_number: 'A02', golf_course_id: 1, type: 'PM', status: 'assigned', created_at: new Date(Date.now() - 3600000).toISOString(), parts: [
      { part_id: 5, quantity_used: 2, part_name: 'น้ำมันเฟืองท้าย' }
    ], system: 'motor', subTasks: ['ทำความสะอาดชุดเฟืองท้ายให้สะอาดด้วยปืนแรงดัน', 'ถ่ายและเปลี่ยนน้ำมันเฟืองท้าย ทุกๆปี'], partsNotes: 'เปลี่ยนน้ำมันเฟืองท้าย 2 ลิตร', remarks: 'เช็คระยะ 500 ชั่วโมง', assigned_by: 2, assigned_by_name: 'สมศรี หัวหน้า', assigned_to: 1, battery_serial: 'ไม่มีสติ๊กเกอร์' },
    
    // งานที่กำลังดำเนินการ - มีอะไหล่
    { id: 5, user_id: 5, userName: 'สมหญิง ช่างซ่อม', vehicle_id: 104, vehicle_number: 'A03', golf_course_id: 1, type: 'BM', status: 'in_progress', created_at: new Date(Date.now() - 7200000).toISOString(), parts: [
      { part_id: 8, quantity_used: 2, part_name: 'ลูกหมาก' },
      { part_id: 9, quantity_used: 2, part_name: 'ยางกันฝุ่น' }
    ], system: 'steering', subTasks: ['ทำความสะอาดคราบสกปรกต่างที่เกาะตามกระปุกพ่วงมาลัย'], partsNotes: 'เปลี่ยนลูกหมาก 2 ชิ้น, เปลี่ยนยางกันฝุ่น 2 ชิ้น', remarks: 'พวงมาลัยหนัก', assigned_by: 2, assigned_by_name: 'สมศรี หัวหน้า', assigned_to: 5, bmCause: 'breakdown' },
    
    // งานที่เสร็จสิ้นแล้ว - มีอะไหล่
    { id: 6, user_id: 1, userName: 'tape1408', vehicle_id: 105, vehicle_number: 'A04', golf_course_id: 1, type: 'PM', status: 'completed', created_at: new Date(Date.now() - 259200000).toISOString(), parts: [
      { part_id: 5, quantity_used: 1, part_name: 'น้ำมันเฟืองท้าย' },
      { part_id: 3, quantity_used: 1, part_name: 'น้ำมันเครื่อง' }
    ], system: 'motor', subTasks: ['ถ่ายและเปลี่ยนน้ำมันเฟืองท้าย ทุกๆปี'], partsNotes: 'เปลี่ยนน้ำมันเฟืองท้าย 1 ลิตร, เปลี่ยนน้ำมันเครื่อง 1 ลิตร', remarks: 'เช็คประจำ', assigned_by: 2, assigned_by_name: 'สมศรี หัวหน้า', assigned_to: 1 },
    
    // งานที่เสร็จแล้ว (ประวัติ) - มีอะไหล่
    { id: 3, user_id: 1, userName: 'tape1408', vehicle_id: 103, vehicle_number: 'B05', golf_course_id: 1, type: 'BM', status: 'approved', created_at: new Date(Date.now() - 172800000).toISOString(), parts: [
      { part_id: 2, quantity_used: 2, part_name: 'ยางล้อ' },
      { part_id: 6, quantity_used: 1, part_name: 'แบตเตอรี่' }
    ], system: 'brake', subTasks: ['ติดตั้งผ้าเบรก'], partsNotes: 'เปลี่ยนยางล้อ 2 เส้น, เปลี่ยนแบตเตอรี่ใหม่', remarks: 'ยางล้อหน้าแตก', assigned_by: 2, assigned_by_name: 'สมศรี หัวหน้า', bmCause: 'accident' },
    
    // งานที่พนักงานคนอื่นทำ - มีอะไหล่
    { id: 4, user_id: 4, userName: 'สมชาย พนักงาน', vehicle_id: 201, vehicle_number: 'C01', golf_course_id: 2, type: 'PM', status: 'pending', created_at: new Date(Date.now() - 7200000).toISOString(), parts: [
      { part_id: 7, quantity_used: 2, part_name: 'หลอดไฟหน้า' }
    ], system: 'steering', subTasks: ['ทำความสะอาดคราบสกปรกต่างที่เกาะตามกระปุกพ่วงมาลัย'], partsNotes: 'เปลี่ยนหลอดไฟหน้า 2 หลอด', remarks: 'เช็คประจำเดือน', assigned_by: 2, assigned_by_name: 'สมศรี หัวหน้า' },
    
    // เพิ่มงานประเภท PM พร้อมอะไหล่ที่ใช้
    { id: 7, user_id: 1, userName: 'tape1408', vehicle_id: 106, vehicle_number: 'A05', golf_course_id: 1, type: 'PM', status: 'pending', created_at: new Date(Date.now() - 43200000).toISOString(), parts: [
      { part_id: 3, quantity_used: 1, part_name: 'น้ำมันเครื่อง' },
      { part_id: 4, quantity_used: 1, part_name: 'กรองน้ำมันเครื่อง' },
      { part_id: 7, quantity_used: 2, part_name: 'หลอดไฟหน้า' }
    ], system: 'motor', subTasks: ['ถ่ายและเปลี่ยนน้ำมันเฟืองท้าย ทุกๆปี', 'ตรวจเช็คการไหลลื่นของแปรงถ่านและการคลยตัวของน็อตขั้วมอเตอร์ทุกๆจุด ตรวจลูกปืนมอเตอร์ด้วยการหมุนฟังเสียง'], partsNotes: 'เปลี่ยนน้ำมันเครื่อง 1 ลิตร, เปลี่ยนกรองน้ำมันเครื่อง 1 ชิ้น, เปลี่ยนหลอดไฟหน้า 2 หลอด', remarks: 'บำรุงรักษาตามระยะ 1,000 ชั่วโมง' },
    
    // เพิ่มงานประเภท Recondition พร้อมอะไหล่ที่ใช้
    { id: 8, user_id: 5, userName: 'สมหญิง ช่างซ่อม', vehicle_id: 107, vehicle_number: 'B01', golf_course_id: 1, type: 'Recondition', status: 'in_progress', created_at: new Date(Date.now() - 129600000).toISOString(), parts: [
      { part_id: 2, quantity_used: 4, part_name: 'ยางล้อ' },
      { part_id: 6, quantity_used: 1, part_name: 'แบตเตอรี่' },
      { part_id: 8, quantity_used: 2, part_name: 'ลูกหมาก' },
      { part_id: 9, quantity_used: 4, part_name: 'ยางกันฝุ่น' },
      { part_id: 10, quantity_used: 2, part_name: 'สายเบรค' }
    ], system: 'brake', subTasks: ['เป่าฝุ่น ขัดหน้าผ้าเบรก', 'ทำความสะอาดสายเบรก', 'ติดตั้งผ้าเบรก', 'ติดตั้งสายเบรกและปรับตั้งสาย'], partsNotes: 'เปลี่ยนยางล้อทั้ง 4 เส้น, เปลี่ยนแบตเตอรี่ใหม่, เปลี่ยนลูกหมาก 2 ชิ้น, เปลี่ยนยางกันฝุ่น 4 ชิ้น, เปลี่ยนสายเบรค 2 เส้น', remarks: 'ปรับปรุงสภาพรถกอล์ฟเก่าให้กลับมาใช้งานได้', assigned_by: 2, assigned_by_name: 'สมศรี หัวหน้า', assigned_to: 5 },
    
    // เพิ่มงานประเภท Recondition ที่เสร็จแล้ว
    { id: 9, user_id: 1, userName: 'tape1408', vehicle_id: 108, vehicle_number: 'B02', golf_course_id: 1, type: 'Recondition', status: 'completed', created_at: new Date(Date.now() - 345600000).toISOString(), parts: [
      { part_id: 1, quantity_used: 1, part_name: 'แบตเตอรี่ 12V' },
      { part_id: 2, quantity_used: 4, part_name: 'ยางล้อ' },
      { part_id: 5, quantity_used: 2, part_name: 'น้ำมันเฟืองท้าย' },
      { part_id: 7, quantity_used: 2, part_name: 'หลอดไฟหน้า' },
      { part_id: 8, quantity_used: 4, part_name: 'ลูกหมาก' }
    ], system: 'steering', subTasks: ['ถอดยอยออกเพื่อทำความสะอาดด้วยโซแนกส์ส้ม', 'ทำความสะอาดคราบสกปรกต่างที่เกาะตามกระปุกพ่วงมาลัย', 'ใช้น้ำมันหล่อลื่นหยอดตามกากบาทยอยและโยกให้คล่องตัว', 'เปลี่ยนยางกันฝุ่นและเติมจารบีเฟืองแร็ก'], partsNotes: 'เปลี่ยนแบตเตอรี่ใหม่, เปลี่ยนยางล้อทั้ง 4 เส้น, เติมน้ำมันเฟืองท้าย 2 ลิตร, เปลี่ยนหลอดไฟหน้า 2 หลอด, เปลี่ยนลูกหมาก 4 ชิ้น', remarks: 'ปรับปรุงสภาพรถกอล์ฟเก่าที่จอดทิ้งไว้นาน', assigned_by: 2, assigned_by_name: 'สมศรี หัวหน้า', assigned_to: 1 },
    
    // เพิ่มงานใหม่ที่มีอะไหล่หลากหลาย
    { id: 10, user_id: 1, userName: 'tape1408', vehicle_id: 109, vehicle_number: 'A06', golf_course_id: 1, type: 'BM', status: 'completed', created_at: new Date(Date.now() - 518400000).toISOString(), parts: [
      { part_id: 1, quantity_used: 1, part_name: 'แบตเตอรี่ 12V' },
      { part_id: 2, quantity_used: 2, part_name: 'ยางล้อ' },
      { part_id: 7, quantity_used: 1, part_name: 'หลอดไฟหน้า' }
    ], system: 'electric', subTasks: ['ตรวจเช็คระบบไฟฟ้า'], partsNotes: 'เปลี่ยนแบตเตอรี่ใหม่ 1 ลูก, เปลี่ยนยางล้อหลัง 2 เส้น, เปลี่ยนหลอดไฟหน้า 1 หลอด', remarks: 'ไฟไม่ติด แบตหมด' },
    
    { id: 11, user_id: 5, userName: 'สมหญิง ช่างซ่อม', vehicle_id: 110, vehicle_number: 'B03', golf_course_id: 1, type: 'PM', status: 'approved', created_at: new Date(Date.now() - 604800000).toISOString(), parts: [
      { part_id: 3, quantity_used: 2, part_name: 'น้ำมันเครื่อง' },
      { part_id: 4, quantity_used: 1, part_name: 'กรองน้ำมันเครื่อง' },
      { part_id: 5, quantity_used: 1, part_name: 'น้ำมันเฟืองท้าย' },
      { part_id: 10, quantity_used: 1, part_name: 'สายเบรค' }
    ], system: 'motor', subTasks: ['ถ่ายและเปลี่ยนน้ำมันเฟืองท้าย ทุกๆปี', 'ตรวจเช็คการไหลลื่นของแปรงถ่านและการคลยตัวของน็อตขั้วมอเตอร์ทุกๆจุด'], partsNotes: 'เปลี่ยนน้ำมันเครื่อง 2 ลิตร, เปลี่ยนกรองน้ำมันเครื่อง 1 ชิ้น, เปลี่ยนน้ำมันเฟืองท้าย 1 ลิตร, เปลี่ยนสายเบรค 1 เส้น', remarks: 'บำรุงรักษาตามแผน 2,000 ชั่วโมง', assigned_by: 2, assigned_by_name: 'สมศรี หัวหน้า', assigned_to: 5 }
];

// เพิ่ม interface สำหรับ Serial History Log
export interface SerialHistoryEntry {
  id: number;
  serial_number: string;
  vehicle_id: number;
  vehicle_number: string;
  action_type: 'registration' | 'transfer' | 'maintenance' | 'decommission' | 'inspection' | 'status_change' | 'data_edit' | 'data_delete' | 'bulk_transfer' | 'bulk_upload';
  action_date: string; // วันที่/เวลาที่บันทึกในระบบ (เวลาจริงที่ทำงาน)
  actual_transfer_date?: string; // วันที่ย้ายจริงตามสัญญาหรือในสถานที่จริง (เฉพาะการโอนย้าย)
  details: string;
  performed_by: string;
  performed_by_id: number;
  golf_course_id: number;
  golf_course_name: string;
  is_active: boolean;
  related_job_id?: number;
  job_type?: 'PM' | 'BM' | 'Recondition';
  system?: string;
  parts_used?: string[];
  status?: 'completed' | 'pending' | 'in_progress' | 'approved' | 'assigned';
  battery_serial?: string; // เพิ่มฟิลด์สำหรับเก็บซีเรียลแบตที่พนักงานกรอก
  // เพิ่มฟิลด์สำหรับบันทึกการเปลี่ยนแปลง
  previous_data?: any;
  new_data?: any;
  change_type?: 'create' | 'update' | 'delete' | 'transfer' | 'status_change';
  affected_fields?: string[];
}

// ข้อมูล mock สำหรับ Serial History Log ที่เชื่อมโยงกับข้อมูลจริง
export const MOCK_SERIAL_HISTORY: SerialHistoryEntry[] = [
  // การลงทะเบียนรถ
  {
    id: 1,
    serial_number: 'KT-20220601',
    vehicle_id: 101,
    vehicle_number: 'A01',
    action_type: 'registration',
    action_date: '2022-06-01T08:00:00.000Z',
    details: 'ลงทะเบียนรถกอล์ฟใหม่เข้าระบบ - รถยี่ห้อ Club Car รุ่น Precedent',
    performed_by: 'administrator',
    performed_by_id: 3,
    golf_course_id: 1,
    golf_course_name: 'วอเตอร์แลนด์',
    is_active: true
  },
  {
    id: 2,
    serial_number: 'GC-SN-002',
    vehicle_id: 102,
    vehicle_number: 'A02',
    action_type: 'registration',
    action_date: '2022-04-15T08:00:00.000Z',
    details: 'ลงทะเบียนรถกอล์ฟใหม่เข้าระบบ - รถยี่ห้อ E-Z-GO รุ่น RXV',
    performed_by: 'administrator',
    performed_by_id: 3,
    golf_course_id: 1,
    golf_course_name: 'วอเตอร์แลนด์',
    is_active: true
  },
  {
    id: 3,
    serial_number: 'GC-SN-003',
    vehicle_id: 103,
    vehicle_number: 'B05',
    action_type: 'registration',
    action_date: '2022-03-10T08:00:00.000Z',
    details: 'ลงทะเบียนรถกอล์ฟใหม่เข้าระบบ - รถยี่ห้อ Yamaha รุ่น Drive2',
    performed_by: 'administrator',
    performed_by_id: 3,
    golf_course_id: 1,
    golf_course_name: 'วอเตอร์แลนด์',
    is_active: true
  },
  
  // งานซ่อมำรุงจาก MOCK_JOBS
  {
    id: 4,
    serial_number: 'KT-20220601',
    vehicle_id: 101,
    vehicle_number: 'A01',
    action_type: 'maintenance',
    action_date: new Date(Date.now() - 86400000).toISOString(),
    details: 'งานซ่อมแซม (BM) - ระบบเบรก: การทำงานกลไกเบรก | อะไหล่ที่ใช้: แบตเตอรี่ 12V (1 ลูก)',
    performed_by: 'tape1408',
    performed_by_id: 1,
    golf_course_id: 1,
    golf_course_name: 'วอเตอร์แลนด์',
    is_active: true,
    related_job_id: 1,
    job_type: 'BM',
    system: 'brake',
    parts_used: ['แบตเตอรี่ 12V'],
    status: 'pending'
  },
  {
    id: 5,
    serial_number: 'GC-SN-002',
    vehicle_id: 102,
    vehicle_number: 'A02',
    action_type: 'maintenance',
    action_date: new Date(Date.now() - 3600000).toISOString(),
    details: 'งานซ่อมำรุงตามแผน (PM) - ระบบมอเตอร์: ทำความสะอาดชุดเฟืองท้าย, เปลี่ยนน้ำมันเฟืองท้าย',
    performed_by: 'tape1408',
    performed_by_id: 1,
    golf_course_id: 1,
    golf_course_name: 'วอเตอร์แลนด์',
    is_active: true,
    related_job_id: 2,
    job_type: 'PM',
    system: 'motor',
    parts_used: [],
    status: 'assigned'
  },
  {
    id: 6,
    serial_number: 'WL-2023-001',
    vehicle_id: 104,
    vehicle_number: 'A03',
    action_type: 'maintenance',
    action_date: new Date(Date.now() - 7200000).toISOString(),
    details: 'งานซ่อมแซม (BM) - ระบบพวงมาลัย: ทำความสะอาดคราบสกปรกตามกระปุกพวงมาล',
    performed_by: 'สมหญิง ช่างซ่อม',
    performed_by_id: 5,
    golf_course_id: 1,
    golf_course_name: 'วอเตอร์แลนด์',
    is_active: true,
    related_job_id: 5,
    job_type: 'BM',
    system: 'steering',
    parts_used: [],
    status: 'in_progress'
  },
  {
    id: 7,
    serial_number: 'WL-2023-002',
    vehicle_id: 105,
    vehicle_number: 'A04',
    action_type: 'maintenance',
    action_date: new Date(Date.now() - 259200000).toISOString(),
    details: 'งานซ่อมำรุงตามแผน (PM) - ระบบมอเตอร์: เปลี่ยนน้ำมันเฟืองท้าย | อะไหล่ที่ใช้: น้ำมันเฟืองท้าย (1 ลิตร)',
    performed_by: 'tape1408',
    performed_by_id: 1,
    golf_course_id: 1,
    golf_course_name: 'วอเตอร์แลนด์',
    is_active: true,
    related_job_id: 6,
    job_type: 'BM',
    system: 'motor',
    parts_used: ['น้ำมันเฟืองท้าย'],
    status: 'completed'
  },
  {
    id: 8,
    serial_number: 'GC-SN-003',
    vehicle_id: 103,
    vehicle_number: 'B05',
    action_type: 'maintenance',
    action_date: new Date(Date.now() - 172800000).toISOString(),
    details: 'งานซ่อมแซม (BM) - ระบบเบรก: ติดตั้งผ้าเบรก | อะไหล่ที่ใช้: ยางล้อ (2 เส้น)',
    performed_by: 'tape1408',
    performed_by_id: 1,
    golf_course_id: 1,
    golf_course_name: 'วอเตอร์แลนด์',
    is_active: true,
    related_job_id: 3,
    job_type: 'BM',
    system: 'brake',
    parts_used: ['ยางล้อ'],
    status: 'approved'
  },
  
  // การตรวจสอบประจำ
  {
    id: 9,
    serial_number: 'KT-20220601',
    vehicle_id: 101,
    vehicle_number: 'A01',
    action_type: 'inspection',
    action_date: '2024-11-01T09:00:00.000Z',
    details: 'ตรวจสอบสภาพรถประจำเดือน - ระบบทั้งหมดปกติ',
    performed_by: 'สมศรี หัวหน้า',
    performed_by_id: 2,
    golf_course_id: 1,
    golf_course_name: 'วอเตอร์แลนด์',
    is_active: true
  },
  {
    id: 10,
    serial_number: 'GC-SN-002',
    vehicle_id: 102,
    vehicle_number: 'A02',
    action_type: 'inspection',
    action_date: '2024-10-15T09:00:00.000Z',
    details: 'ตรวจสอบสภาพรถประจำเดือน - พบปัญหาเล็กน้อยที่ระบบมอเตอร์',
    performed_by: 'สมศรี หัวหน้า',
    performed_by_id: 2,
    golf_course_id: 1,
    golf_course_name: 'วอเตอร์แลนด์',
    is_active: true
  },
  
  // รถที่โอนย้าย
  {
    id: 11,
    serial_number: 'GV-20230101',
    vehicle_id: 201,
    vehicle_number: 'C01',
    action_type: 'registration',
    action_date: '2023-01-01T08:00:00.000Z',
    details: 'ลงทะเบียนรถกอล์ฟใหม่เข้าระบบ - รถยี่ห้อ Club Car รุ่น Onward',
    performed_by: 'administrator',
    performed_by_id: 3,
    golf_course_id: 2,
    golf_course_name: 'กรีนวัลเลย์',
    is_active: true
  },
  {
    id: 12,
    serial_number: 'GV-20230101',
    vehicle_id: 201,
    vehicle_number: 'C01',
    action_type: 'transfer',
    action_date: '2024-06-15T10:00:00.000Z',
    actual_transfer_date: '2024-06-14T08:00:00.000Z',
    details: 'โอนย้ายรถจากสนาม กรีนวัลเลย์ ไปยัง วอเตอร์แลนด์ เนื่องจากการปรับโครงสร้างการใช้งาน (วันที่ย้ายจริง: 14 มิ.ย. 2024)',
    performed_by: 'administrator',
    performed_by_id: 3,
    golf_course_id: 1,
    golf_course_name: 'วอเตอร์แลนด์',
    is_active: true
  },
  
  // การเปลี่ยนสถานะรถ
  {
    id: 13,
    serial_number: 'KT-20220601',
    vehicle_id: 101,
    vehicle_number: 'A01',
    action_type: 'status_change',
    action_date: '2024-12-05T14:30:00.000Z',
    details: 'เปลี่ยนสถานะรถจาก "ใช้งาน" เป็น "ฝากจอด"',
    performed_by: 'สมศรี หัวหน้า',
    performed_by_id: 2,
    golf_course_id: 1,
    golf_course_name: 'วอเตอร์แลนด์',
    is_active: true,
    change_type: 'status_change',
    affected_fields: ['status'],
    previous_data: { status: 'active' },
    new_data: { status: 'parked' }
  },
  
  // การแก้ไขข้อมูลรถ
  {
    id: 14,
    serial_number: 'GC-SN-002',
    vehicle_id: 102,
    vehicle_number: 'A02',
    action_type: 'data_edit',
    action_date: '2024-12-05T15:45:00.000Z',
    details: 'แก้ไขข้อมูลรถ - หมายเลขรถ: A02 → A02-NEW',
    performed_by: 'administrator',
    performed_by_id: 3,
    golf_course_id: 1,
    golf_course_name: 'วอเตอร์แลนด์',
    is_active: true,
    change_type: 'update',
    affected_fields: ['vehicle_number'],
    previous_data: { vehicle_number: 'A02' },
    new_data: { vehicle_number: 'A02-NEW' }
  },
  
  // WL-2023-005 - การลงทะเบียนและงานซ่อมแซม
  {
    id: 15,
    serial_number: 'WL-2023-005',
    vehicle_id: 108,
    vehicle_number: 'B03',
    action_type: 'registration',
    action_date: '2023-05-01T08:00:00.000Z',
    details: 'ลงทะเบียนรถกอล์ฟใหม่เข้าระบบ - รถยี่ห้อ E-Z-GO รุ่น Freedom',
    performed_by: 'administrator',
    performed_by_id: 3,
    golf_course_id: 1,
    golf_course_name: 'วอเตอร์แลนด์',
    is_active: true
  },

  // เพิ่ม SerialHistoryEntry สำหรับ Serial Numbers ที่ขาดหายไป
  // GV-20230102 - การลงทะเบียนและงานซ่อมแซม
  {
    id: 16,
    serial_number: 'GV-20230102',
    vehicle_id: 202,
    vehicle_number: 'C02',
    action_type: 'registration',
    action_date: '2023-01-02T08:00:00.000Z',
    details: 'ลงทะเบียนรถกอล์ฟใหม่เข้าระบบ - รถยี่ห้อ E-Z-GO รุ่น RXV',
    performed_by: 'administrator',
    performed_by_id: 3,
    golf_course_id: 2,
    golf_course_name: 'กรีนวัลเลย์',
    is_active: true
  },
  {
    id: 17,
    serial_number: 'GV-20230102',
    vehicle_id: 202,
    vehicle_number: 'C02',
    action_type: 'maintenance',
    action_date: '2024-11-22',
    details: 'งานซ่อมแซม (BM) - ระบบเบรก: เปลี่ยนผ้าเบรค | อะไหล่ที่ใช้: ผ้าเบรค (1 ชุด)',
    performed_by: 'วิชัย เทคนิค',
    performed_by_id: 4,
    golf_course_id: 2,
    golf_course_name: 'กรีนวัลเลย์',
    is_active: true,
    related_job_id: 104,
    job_type: 'BM',
    system: 'brake',
    parts_used: ['ผ้าเบรค'],
    status: 'approved'
  },

  // WL-2023-003 - การลงทะเบียนและงานซ่อมแซม
  {
    id: 18,
    serial_number: 'WL-2023-003',
    vehicle_id: 106,
    vehicle_number: 'B01',
    action_type: 'registration',
    action_date: '2023-03-01T08:00:00.000Z',
    details: 'ลงทะเบียนรถกอล์ฟใหม่เข้าระบบ - รถยี่ห้อ Yamaha รุ่น Drive2',
    performed_by: 'administrator',
    performed_by_id: 3,
    golf_course_id: 1,
    golf_course_name: 'วอเตอร์แลนด์',
    is_active: true
  },
  {
    id: 19,
    serial_number: 'WL-2023-003',
    vehicle_id: 106,
    vehicle_number: 'B01',
    action_type: 'maintenance',
    action_date: '2024-12-03',
    details: 'งานซ่อมแซม (BM) - ระบบพวงมาลัย: เปลี่ยนลูกหมาก | อะไหล่ที่ใช้: ลูกหมาก (2 ชิ้น)',
    performed_by: 'สมหญิง ช่างซ่อม',
    performed_by_id: 5,
    golf_course_id: 1,
    golf_course_name: 'วอเตอร์แลนด์',
    is_active: true,
    related_job_id: 107,
    job_type: 'BM',
    system: 'steering',
    parts_used: ['ลูกหมาก'],
    status: 'approved'
  },

  // GV-2023-003 - การลงทะเบียนและงานซ่อมแซม
  {
    id: 20,
    serial_number: 'GV-2023-003',
    vehicle_id: 203,
    vehicle_number: 'C03',
    action_type: 'registration',
    action_date: '2023-03-15T08:00:00.000Z',
    details: 'ลงทะเบียนรถกอล์ฟใหม่เข้าระบบ - รถยี่ห้อ Club Car รุ่น Precedent',
    performed_by: 'administrator',
    performed_by_id: 3,
    golf_course_id: 2,
    golf_course_name: 'กรีนวัลเลย์',
    is_active: true
  },
  {
    id: 21,
    serial_number: 'GV-2023-003',
    vehicle_id: 203,
    vehicle_number: 'C03',
    action_type: 'maintenance',
    action_date: '2024-12-04',
    details: 'งานซ่อมแซม (BM) - ระบบพวงมาลัย: เปลี่ยนยางกันฝุ่น | อะไหล่ที่ใช้: ยางกันฝุ่น (4 ชิ้น)',
    performed_by: 'วิชัย เทคนิค',
    performed_by_id: 4,
    golf_course_id: 2,
    golf_course_name: 'กรีนวัลเลย์',
    is_active: true,
    related_job_id: 108,
    job_type: 'BM',
    system: 'steering',
    parts_used: ['ยางกันฝุ่น'],
    status: 'approved'
  },

  // GV-2023-004 - การลงทะเบียนและงานซ่อมแซม
  {
    id: 22,
    serial_number: 'GV-2023-004',
    vehicle_id: 204,
    vehicle_number: 'C04',
    action_type: 'registration',
    action_date: '2023-04-01T08:00:00.000Z',
    details: 'ลงทะเบียนรถกอล์ฟใหม่เข้าระบบ - รถยี่ห้อ E-Z-GO รุ่น TXT',
    performed_by: 'administrator',
    performed_by_id: 3,
    golf_course_id: 2,
    golf_course_name: 'กรีนวัลเลย์',
    is_active: true
  },
  {
    id: 23,
    serial_number: 'GV-2023-004',
    vehicle_id: 204,
    vehicle_number: 'C04',
    action_type: 'maintenance',
    action_date: '2024-12-05',
    details: 'งานซ่อมแซม (BM) - ระบบเบรก: เปลี่ยนสายเบรค | อะไหล่ที่ใช้: สายเบรค (1 เส้น)',
    performed_by: 'สมชาย พนักงาน',
    performed_by_id: 6,
    golf_course_id: 2,
    golf_course_name: 'กรีนวัลเลย์',
    is_active: true,
    related_job_id: 109,
    job_type: 'BM',
    system: 'brake',
    parts_used: ['สายเบรค'],
    status: 'approved'
  },

  // WL-2023-004 - การลงทะเบียนและงานซ่อมแซม
  {
    id: 24,
    serial_number: 'WL-2023-004',
    vehicle_id: 107,
    vehicle_number: 'B02',
    action_type: 'registration',
    action_date: '2023-04-15T08:00:00.000Z',
    details: 'ลงทะเบียนรถกอล์ฟใหม่เข้าระบบ - รถยี่ห้อ Yamaha รุ่น G29',
    performed_by: 'administrator',
    performed_by_id: 3,
    golf_course_id: 1,
    golf_course_name: 'วอเตอร์แลนด์',
    is_active: true
  },
  {
    id: 25,
    serial_number: 'WL-2023-004',
    vehicle_id: 107,
    vehicle_number: 'B02',
    action_type: 'maintenance',
    action_date: new Date().toISOString().split('T')[0],
    details: 'งานซ่อมแซม (BM) - ระบบมอเตอร์: เปลี่ยนชุดควบคุมมอเตอร์ | อะไหล่ที่ใช้: ชุดควบคุมมอเตอร์ (1 ชุด)',
    performed_by: 'สมหญิง ช่างซ่อม',
    performed_by_id: 5,
    golf_course_id: 1,
    golf_course_name: 'วอเตอร์แลนด์',
    is_active: true,
    related_job_id: 111,
    job_type: 'BM',
    system: 'motor',
    parts_used: ['ชุดควบคุมมอเตอร์'],
    status: 'approved'
  }
];

// เพิ่ม interface สำหรับ PartsUsageLog
export interface PartsUsageLog {
    id: number;
    jobId: number;
    partName: string;
    partId: string;
    quantity: number;
    usedDate: string;
    userName: string;
    vehicleNumber: string;
    serialNumber: string;
    golfCourseName: string;
    jobType: 'PM' | 'BM' | 'Recondition';
    system: string;
}

// เพิ่มข้อมูล mock สำหรับ Parts Usage Log
// ฟังก์ชันสำหรับเพิ่มประวัติการเปลี่ยนแปลง
export const addSerialHistoryEntry = (entry: Omit<SerialHistoryEntry, 'id'>): SerialHistoryEntry => {
  const newEntry: SerialHistoryEntry = {
    ...entry,
    id: MOCK_SERIAL_HISTORY.length + 1
  };
  MOCK_SERIAL_HISTORY.push(newEntry);
  return newEntry;
};

// ฟังก์ชันสำหรับบันทึกการเปลี่ยนแปลงรถ
export const logVehicleChange = (
  action: 'create' | 'update' | 'delete' | 'transfer' | 'status_change',
  vehicle: Vehicle,
  performedBy: string,
  previousData?: Partial<Vehicle>,
  newData?: Partial<Vehicle>,
  affectedFields?: string[]
): SerialHistoryEntry => {
  const actionTypeMap = {
    create: 'registration' as const,
    update: 'data_edit' as const,
    delete: 'data_delete' as const,
    transfer: 'transfer' as const,
    status_change: 'status_change' as const
  };

  const entry = addSerialHistoryEntry({
    serial_number: vehicle.serial_number,
    vehicle_id: vehicle.id,
    vehicle_number: vehicle.vehicle_number,
    action_type: actionTypeMap[action],
    action_date: new Date().toISOString(),
    details: getActionDetails(action, vehicle, previousData, newData),
    performed_by: performedBy,
    performed_by_id: 3, // ในการใช้งานจริงควรใช้ ID ผู้ใช้ปัจจุบัน
    golf_course_id: vehicle.golf_course_id,
    golf_course_name: vehicle.golf_course_name,
    is_active: vehicle.status === 'active',
    status: vehicle.status === 'active' ? 'completed' : 'pending',
    previous_data: previousData,
    new_data: newData,
    change_type: action,
    affected_fields: affectedFields
  });

  return entry;
};

// ฟังก์ชันสำหรับบันทึกการโอนย้ายหลายคัน
export const logBulkTransfer = (
  vehicles: Vehicle[],
  targetGolfCourseId: number,
  targetGolfCourseName: string,
  performedBy: string,
  actualTransferDate?: string // วันที่ย้ายจริงตามสัญญา
): SerialHistoryEntry[] => {
  return vehicles.map(vehicle => {
    const previousData = { 
      golf_course_id: vehicle.golf_course_id, 
      golf_course_name: vehicle.golf_course_name 
    };
    const newData = { 
      golf_course_id: targetGolfCourseId, 
      golf_course_name: targetGolfCourseName 
    };

    return addSerialHistoryEntry({
      serial_number: vehicle.serial_number,
      vehicle_id: vehicle.id,
      vehicle_number: vehicle.vehicle_number,
      action_type: 'bulk_transfer',
      action_date: new Date().toISOString(), // วันที่/เวลาที่บันทึกในระบบ (ปัจจุบัน)
      actual_transfer_date: actualTransferDate ? new Date(actualTransferDate).toISOString() : undefined, // วันที่ย้ายจริง
      details: `โอนย้ายรถจาก ${vehicle.golf_course_name} ไปยัง ${targetGolfCourseName}${actualTransferDate ? ` (วันที่ย้ายจริง: ${new Date(actualTransferDate).toLocaleDateString('th-TH')})` : ''}`,
      performed_by: performedBy,
      performed_by_id: 3,
      golf_course_id: targetGolfCourseId,
      golf_course_name: targetGolfCourseName,
      is_active: vehicle.status === 'active',
      status: vehicle.status === 'active' ? 'completed' : 'pending',
      previous_data: previousData,
      new_data: newData,
      change_type: 'transfer',
      affected_fields: ['golf_course_id', 'golf_course_name']
    });
  });
};

// ฟังก์ชันสำหรับบันทึกการอัปโหลดหลายคัน
export const logBulkUpload = (
  vehicles: Vehicle[],
  performedBy: string
): SerialHistoryEntry[] => {
  return vehicles.map(vehicle => 
    addSerialHistoryEntry({
      serial_number: vehicle.serial_number,
      vehicle_id: vehicle.id,
      vehicle_number: vehicle.vehicle_number,
      action_type: 'bulk_upload',
      action_date: new Date().toISOString(),
      details: `เพิ่มรถใหม่ผ่านการอัปโหลดไฟล์ - ${vehicle.vehicle_number} (${vehicle.model})`,
      performed_by: performedBy,
      performed_by_id: 3,
      golf_course_id: vehicle.golf_course_id,
      golf_course_name: vehicle.golf_course_name,
      is_active: vehicle.status === 'active',
      status: 'completed',
      new_data: vehicle,
      change_type: 'create',
      affected_fields: Object.keys(vehicle)
    })
  );
};

// ฟังก์ชันช่วยสำหรับสร้างรายละเอียดการกระทำ
const getActionDetails = (
  action: string,
  vehicle: Vehicle,
  previousData?: Partial<Vehicle>,
  newData?: Partial<Vehicle>
): string => {
  switch (action) {
    case 'create':
      return `ลงทะเบียนรถใหม่ - ${vehicle.vehicle_number} (${vehicle.model})`;
    case 'update':
      return `แก้ไขข้อมูลรถ - ${vehicle.vehicle_number}`;
    case 'delete':
      return `ลบข้อมูลรถ - ${vehicle.vehicle_number}`;
    case 'transfer':
      return `โอนย้ายรถจาก ${previousData?.golf_course_name} ไปยัง ${newData?.golf_course_name}`;
    case 'status_change':
      return `เปลี่ยนสถานะรถจาก ${previousData?.status} เป็น ${newData?.status}`;
    default:
      return `การกระทำ: ${action}`;
  }
};



export const MOCK_PARTS_USAGE_LOG: PartsUsageLog[] = [
    // ข้อมูลจากเดือนที่แล้ว
    {
        id: 1,
        jobId: 101,
        partName: 'แบตเตอรี่ 12V',
        partId: 'PART-1',
        quantity: 1,
        usedDate: '2024-11-15',
        userName: 'tape1408',
        vehicleNumber: 'A01',
        serialNumber: 'KT-20220601',
        golfCourseName: 'วอเตอร์แลนด์',
        jobType: 'BM',
        system: 'electric'
    },
    {
        id: 2,
        jobId: 102,
        partName: 'ยางล้อ',
        partId: 'PART-2',
        quantity: 2,
        usedDate: '2024-11-18',
        userName: 'สมหญิง ช่างซ่อม',
        vehicleNumber: 'B05',
        serialNumber: 'GC-SN-003',
        golfCourseName: 'วอเตอร์แลนด์',
        jobType: 'BM',
        system: 'brake'
    },
    {
        id: 3,
        jobId: 103,
        partName: 'น้ำมันเฟืองท้าย',
        partId: 'PART-5',
        quantity: 1,
        usedDate: '2024-11-20',
        userName: 'tape1408',
        vehicleNumber: 'A04',
        serialNumber: 'WL-2023-002',
        golfCourseName: 'วอเตอร์แลนด์',
        jobType: 'BM',
        system: 'motor'
    },
    {
        id: 4,
        jobId: 104,
        partName: 'ผ้าเบรค',
        partId: 'PART-4',
        quantity: 1,
        usedDate: '2024-11-22',
        userName: 'วิชัย เทคนิค',
        vehicleNumber: 'C02',
        serialNumber: 'GV-20230102',
        golfCourseName: 'กรีนวัลเลย์',
        jobType: 'BM',
        system: 'brake'
    },
    {
        id: 5,
        jobId: 105,
        partName: 'จารบี',
        partId: 'PART-6',
        quantity: 3,
        usedDate: '2024-11-25',
        userName: 'สมชาย พนักงาน',
        vehicleNumber: 'C01',
        serialNumber: 'GV-20230101',
        golfCourseName: 'กรีนวัลเลย์',
        jobType: 'BM',
        system: 'steering'
    },
    // ข้อมูลจากสัปดาห์นี้
    {
        id: 6,
        jobId: 106,
        partName: 'แปรงถ่าน',
        partId: 'PART-7',
        quantity: 1,
        usedDate: '2024-12-02',
        userName: 'tape1408',
        vehicleNumber: 'A02',
        serialNumber: 'GC-SN-002',
        golfCourseName: 'วอเตอร์แลนด์',
        jobType: 'BM',
        system: 'motor'
    },
    {
        id: 7,
        jobId: 107,
        partName: 'ลูกหมาก',
        partId: 'PART-8',
        quantity: 2,
        usedDate: '2024-12-03',
        userName: 'สมหญิง ช่างซ่อม',
        vehicleNumber: 'B01',
        serialNumber: 'WL-2023-003',
        golfCourseName: 'วอเตอร์แลนด์',
        jobType: 'BM',
        system: 'steering'
    },
    {
        id: 8,
        jobId: 108,
        partName: 'ยางกันฝุ่น',
        partId: 'PART-9',
        quantity: 4,
        usedDate: '2024-12-04',
        userName: 'วิชัย เทคนิค',
        vehicleNumber: 'C03',
        serialNumber: 'GV-2023-003',
        golfCourseName: 'กรีนวัลเลย์',
        jobType: 'BM',
        system: 'steering'
    },
    {
        id: 9,
        jobId: 109,
        partName: 'สายเบรค',
        partId: 'PART-10',
        quantity: 1,
        usedDate: '2024-12-05',
        userName: 'สมชาย พนักงาน',
        vehicleNumber: 'C04',
        serialNumber: 'GV-2023-004',
        golfCourseName: 'กรีนวัลเลย์',
        jobType: 'BM',
        system: 'brake'
    },
    // ข้อมูลจากวันนี้
    {
        id: 10,
        jobId: 110,
        partName: 'แบตเตอรี่ 12V',
        partId: 'PART-1',
        quantity: 1,
        usedDate: new Date().toISOString().split('T')[0],
        userName: 'tape1408',
        vehicleNumber: 'A03',
        serialNumber: 'WL-2023-001',
        golfCourseName: 'วอเตอร์แลนด์',
        jobType: 'BM',
        system: 'electric'
    },
    {
        id: 11,
        jobId: 111,
        partName: 'ชุดควบคุมมอเตอร์',
        partId: 'PART-3',
        quantity: 1,
        usedDate: new Date().toISOString().split('T')[0],
        userName: 'สมหญิง ช่างซ่อม',
        vehicleNumber: 'B02',
        serialNumber: 'WL-2023-004',
        golfCourseName: 'วอเตอร์แลนด์',
        jobType: 'BM',
        system: 'motor'
    },
    {
        id: 12,
        jobId: 112,
        partName: 'น้ำมันเฟืองท้าย',
        partId: 'PART-5',
        quantity: 2,
        usedDate: new Date().toISOString().split('T')[0],
        userName: 'วิชัย เทคนิค',
        vehicleNumber: 'C01',
        serialNumber: 'GV-20230101',
        golfCourseName: 'กรีนวัลเลย์',
        jobType: 'BM',
        system: 'motor'
    }
];

// รายการอะไหล่ตามระบบสำหรับการแสดงผล
export const PARTS_BY_SYSTEM_DISPLAY = {
    'brake': [
        { id: 1, name: 'แป้นเบรค', unit: 'ชิ้น' },
        { id: 2, name: 'ชุดล็อคเบรค', unit: 'ชุด' },
        { id: 3, name: 'เฟืองปาร์คเบรค', unit: 'ชิ้น' },
        { id: 4, name: 'สปริงคันเร่ง', unit: 'ชิ้น' },
        { id: 5, name: 'สายเบรกสั้น', unit: 'เส้น' },
        { id: 6, name: 'สายเบรกยาว', unit: 'เส้น' },
        { id: 7, name: 'ผ้าเบรก EZGO', unit: 'ชุด' },
        { id: 8, name: 'ผ้าเบรก EZGO สั้น', unit: 'ชุด' },
        { id: 9, name: 'ผ้าเบรก EZGO ยาว', unit: 'ชุด' },
        { id: 10, name: 'ซีลล้อหลัง', unit: 'ชิ้น' },
        { id: 11, name: 'ลูกปืน 6205', unit: 'ชิ้น' },
        { id: 12, name: 'น๊อตยึดแป้นเบรก', unit: 'ชิ้น' }
    ],
    'steering': [
        { id: 13, name: 'ยอยด์', unit: 'ชิ้น' },
        { id: 14, name: 'ระปุกพวงมาลัย', unit: 'ชิ้น' },
        { id: 15, name: 'เอ็นแร็ค', unit: 'ชิ้น' },
        { id: 16, name: 'ลูกหมาก', unit: 'ชิ้น' },
        { id: 17, name: 'ลูกหมากใต้โช๊ค', unit: 'ชิ้น' },
        { id: 18, name: 'ลูกปืน 6005', unit: 'ชิ้น' },
        { id: 19, name: 'ลูกปืน 6204', unit: 'ชิ้น' },
        { id: 20, name: 'ยางกันฝุ่น', unit: 'ชิ้น' },
        { id: 21, name: 'โช้คหน้า', unit: 'ชิ้น' },
        { id: 22, name: 'ลูกหมากหัวโช้คบน', unit: 'ชิ้น' },
        { id: 23, name: 'ปีกนก L+R', unit: 'คู่' }
    ],
    'motor': [
        { id: 24, name: 'แปรงถ่าน', unit: 'ชิ้น' },
        { id: 25, name: 'ลูกปืน 6205', unit: 'ชิ้น' },
        { id: 26, name: 'แม่เหล็กมอเตอร์', unit: 'ชิ้น' },
        { id: 27, name: 'เซ็นเซอร์มอเตอร์', unit: 'ชิ้น' }
    ],
    'electric': [
        { id: 28, name: 'แบตเตอรี่ 12V', unit: 'ก้อน' },
        { id: 29, name: 'ชุดควบคุมมอเตอร์', unit: 'ชุด' },
        { id: 30, name: 'สายไฟหลัก', unit: 'เมตร' }
    ],
    'others': [
        { id: 31, name: 'บอดี้หน้า', unit: 'ชิ้น' },
        { id: 32, name: 'บอดี้หลัง', unit: 'ชิ้น' },
        { id: 33, name: 'โครงหลังคาหน้า', unit: 'ชิ้น' },
        { id: 34, name: 'โครงหลังคาหลัง', unit: 'ชิ้น' },
        { id: 35, name: 'หลังคา', unit: 'ชิ้น' },
        { id: 36, name: 'เบาะนั่ง', unit: 'ชิ้น' },
        { id: 37, name: 'พนักพิง', unit: 'ชิ้น' },
        { id: 38, name: 'ยาง', unit: 'เส้น' },
        { id: 39, name: 'แคดดี้เพลต', unit: 'ชิ้น' }
    ]
};
