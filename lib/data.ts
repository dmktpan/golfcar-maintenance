
// Types
export type UserRole = 'admin' | 'supervisor' | 'technician' | 'viewer' | 'staff' | 'central';

export type View =
  | 'dashboard'
  | 'create_job'
  | 'central_create_job'
  | 'parts_management'
  | 'stock_management'
  | 'admin_dashboard'
  | 'manage_users'
  | 'history'
  | 'multi_assign'
  | 'serial_history'
  | 'admin_management'
  | 'golf_course_management'
  | 'assigned_job_form'
  | 'view_assigned_jobs'
  | 'supervisor_pending_jobs'
  | 'profile';
export type JobType = 'PM' | 'BM' | 'Recondition';
export type JobStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'approved' | 'rejected';
export type BMCause = 'breakdown' | 'accident' | 'wear' | 'other';

// Interfaces
export interface User {
  id: number;
  username: string;
  name: string;
  code: string;
  role: UserRole;
  golf_course_id: string;
  golf_course_name: string;
  created_at: string;
  managed_golf_courses?: string[];
  password?: string;
  permissions?: string[]; // สิทธิ์การใช้งานเพิ่มเติม
}

export interface GolfCourse {
  id: string;
  name: string;
  location: string;
  created_at: string;
}

export interface Vehicle {
  id: string;
  vehicle_number: string;
  serial_number: string;
  brand: string;
  model: string;
  year: number;
  battery_serial?: string; // เพิ่มฟิลด์สำหรับซีเรียลแบตเตอรี่
  golf_course_id: string;
  golf_course_name: string;
  status: 'active' | 'ready' | 'maintenance' | 'retired';
  created_at: string;
  transfer_date?: string; // เพิ่มฟิลด์สำหรับวันที่ย้าย
}

export interface Part {
  id: string;
  name: string;
  part_number?: string;
  category?: string;
  unit: string;
  stock_quantity?: number; // For backward compatibility
  stock_qty: number; // Primary field matching Prisma schema
  min_qty: number; // Primary field matching Prisma schema
  max_qty: number; // Primary field matching Prisma schema
  min_stock?: number; // For backward compatibility
  golf_course_id?: string;
  golf_course_name?: string;
  created_at?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Job {
  id: string;
  user_id: string;
  userName: string;
  vehicle_id: string;
  vehicle_number: string;
  golf_course_id: string;
  type: JobType;
  status: JobStatus;
  created_at: string;
  updated_at?: string;
  battery_serial?: string;
  parts?: SelectedPart[];
  system?: string;
  subTasks?: string[];
  partsNotes?: string;
  remarks?: string;
  assigned_by?: string;
  assigned_by_name?: string;
  assigned_to?: string;
  bmCause?: BMCause;
  images?: string[]; // เพิ่มฟิลด์สำหรับรูปภาพ
  prrNumber?: string; // เลขที่ใบเบิกอะไหล่
  // ข้อมูลการอนุมัติ
  approved_by_id?: string;
  approved_by_name?: string;
  approved_at?: string;
  rejection_reason?: string;
}

export interface SelectedPart {
  part_id: string;
  quantity_used: number;
  part_name: string;
}

// Mock Data - เริ่มต้นด้วยอาร์เรย์ว่าง
export const MOCK_GOLF_COURSES: GolfCourse[] = [];

export const MOCK_USERS: User[] = [];

export const MOCK_VEHICLES: Vehicle[] = [];

export const MOCK_PARTS: Part[] = [];

// เก็บ MOCK_SYSTEMS ไว้ตามที่ผู้ใช้ต้องการ
export const MOCK_SYSTEMS = [
  {
    id: 'brake',
    name: 'ระบบเบรก',
    description: 'ระบบเบรกและการหยุดรถ',
    tasks: {
      'ทำความสะอาด': ['เป่าฝุ่น/ขัดหน้าผ้าเบรก', 'ทำความสะอาดสายเบรก', 'ทำความสะอาดชุดแป้นเบรก'],
      'หล่อลื่น': ['หล่อลื่นรางสไลด์', 'หล่อลื่นแกนสลิง', 'หล่อลื่นแป้นเบรก'],
      'ขันแน่น': ['ติดตั้งผ้าเบรก', 'ติดตั้งสายเบรกและปรับตั้งสาย', 'ติดตั้งแป้นเบรก'],
      'ตรวจเช็ค': ['การทำงานกลไกเบรก', 'ความคล่องตัวสายเบรก', 'ความคล่องตัวของการเบรกและล็อกเบรก', 'ซีลล้อหลัง/การรั่วของน้ำมันเฟืองท้าย'],
    }
  },
  {
    id: 'steering',
    name: 'ระบบบังคับเลี้ยว',
    description: 'ระบบบังคับเลี้ยวและการควบคุมทิศทาง',
    tasks: {
      'ทำความสะอาด': ['ถอดยอยออกเพื่อทำความสะอาดด้วยโซแนกส์ส้ม', 'ทำความสะอาดคราบสกปรกต่างที่เกาะตามกระปุกพ่วงมาลัย', 'ทำความลูกหมากปลายโช๊คและใต้โช๊ค', 'ล้างเอาจารบีเก่าออกแล้วเป่าลม(กรณีเป็นตับเอียง'],
      'หล่อลื่น': ['ใช้น้ำมันหล่อลื่นหยอดตามกากบาทยอยและโยกให้คล่องตัว', 'เปลี่ยนยางกันฝุ่นและเติมจารบีเฟืองแร็ก', 'ไม่มีจุดหล่อลืน', 'เติมจารบีใหม่ให้เหมาะสม'],
      'ขันแน่น': ['ติดตั้งยอยและขั่วมอเตอร์ที่คลายตัว', 'ขันน็อตยึดแกนให้แน่น', 'ไล่ขันแน่นน็อตลูกหมากทุกจุด', 'ไล่ขันน็อตแกนล้อหน้าและน็อตลูกปืน'],
      'ตรวจเช็ค': ['ตรวจหมุนให้แน่ว่าไม่มีการรูดเมื่อขันน็อตยึด', 'ตรวจเช็ค END RACK และจุดยึดต่างของกระปุกพวงมาลัย', 'ตรวจเช็คลูกหมากว่ามีโยกหลวมหรือไม่', 'ลอยล้อกเพื่อฟังเสียงลูกปืนแตก']
    }
  },
  {
    id: 'motor',
    name: 'ระบบมอเตอร์',
    description: 'ระบบมอเตอร์และเฟืองท้าย',
    tasks: {
      'ทำความสะอาด': ['ทำความสะอาดชุดเฟืองท้ายให้สะอาดด้วยปืนแรงดัน', 'ถอดมอเตอร์เป่าฝุ่นทำความสะอาด', 'ล้างทำความสะอาดครabschสกปรก ทอร์ชั่นบาร์', 'ล้างทำความสะอาดครabschสกปรก โช๊คหลัง'],
      'หล่อลื่น': ['ถ่ายและเปลี่ยนน้ำมันเฟืองท้าย(ทุกๆปี)', 'ชโลมน้ำมันตรงล้างแปรงถ่าน', 'หยอดน้ำหล่อลื่นตรงบูชและจุดหมุน', 'หยอดน้ำตรงหัวบูชบน'],
      'ขันแน่น': ['ไล่ขันน็อตปิดน้ำมันเฟืองท้ายให้แน่น', 'ไล่ขันขั่วมอเตอร์ที่คลายตัว', 'ไล่ขันน็อตยึด', 'ขันน๊อตยึดหัวโช๊คให้แน่นพอดี'],
      'ตรวจเช็ค': ['ระดับน้ำมันเฟืองที่น็อตตัวบนและตรวจเช็คน็อตยึดทุกจัดการคลายตัวหรือไม่', 'ตรวจเช็คการไหลลื่นของแปรงถ่านและการคลายตัวของน็อตขั้วมอเตอร์ทุกๆจุด ตรวจลูกปืนมอเตอร์ด้วยการหมุนฟังเสียง', 'ตรวจเช็คการคลายตัวของน็อตยึดทอร์ชั่นบาร์ และตรวจรอบแตกรอยราวของจุดเชื่อมต่าง', 'ตรวจการรั่วของน้ำมันโช๊ค']
    }
  },
  {
    id: 'electric',
    name: 'ระบบไฟฟ้า',
    description: 'ระบบไฟฟ้าและแบตเตอรี่',
    tasks: {
      'ทำความสะอาด': ['blank'],
      'หล่อลื่น': ['blank'],
      'ขันแน่น': ['blank'],
      'ตรวจเช็ค': ['blank']
    }
  }
];

export const MOCK_JOBS: Job[] = [];

// เพิ่ม interface สำหรับ Serial History Log
export interface SerialHistoryEntry {
  id: string;
  serial_number: string;
  vehicle_id: string;
  vehicle_number: string;
  action_type: 'registration' | 'transfer' | 'maintenance' | 'decommission' | 'inspection' | 'status_change' | 'data_edit' | 'data_delete' | 'bulk_transfer' | 'bulk_upload';
  action_date: string; // วันที่/เวลาที่บันทึกในระบบ (เวลาจริงที่ทำงาน)
  actual_transfer_date?: string; // วันที่ย้ายจริงตามสัญญาหรือในสถานที่จริง (เฉพาะการโอนย้าย)
  details: string;
  performed_by: string;
  performed_by_id: string;
  golf_course_id: string;
  golf_course_name: string;
  is_active: boolean;
  related_job_id?: string;
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

// ข้อมูล mock สำหรับ Serial History Log - เริ่มต้นเป็นอาร์เรย์ว่าง
export const MOCK_SERIAL_HISTORY: SerialHistoryEntry[] = [];

// เพิ่ม interface สำหรับ PartsUsageLog
export interface PartsUsageLog {
  id: string;
  jobId: string;
  partName: string;
  partId: string;
  quantityUsed: number;
  vehicleNumber: string;
  vehicleSerial: string;
  golfCourseName: string;
  usedBy: string;
  usedDate: string;
  notes: string;
  jobType: 'PM' | 'BM' | 'Recondition';
  system: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// ฟังก์ชันสำหรับเพิ่มประวัตการเปลี่ยนแปลง
export const addSerialHistoryEntry = (entry: Omit<SerialHistoryEntry, 'id'>): SerialHistoryEntry => {
  const newEntry: SerialHistoryEntry = {
    ...entry,
    id: (MOCK_SERIAL_HISTORY.length + 1).toString()
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
    performed_by_id: "68885b9f2853f6353e4b2145", // ใช้ ObjectID ของ admin000 ที่มีอยู่จริง
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
  targetGolfCourseId: string,
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
      performed_by_id: "68885b9f2853f6353e4b2145", // ใช้ ObjectID ของ admin000 ที่มีอยู่จริง
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
      performed_by_id: "68885b9f2853f6353e4b2145", // ใช้ ObjectID ของ admin000 ที่มีอยู่จริง
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

// เริ่มต้นด้วยอาร์เรย์ว่าง
export const MOCK_PARTS_USAGE_LOG: PartsUsageLog[] = [];

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
  'other': [
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
