
// Types
export type UserRole = 'admin' | 'supervisor' | 'technician' | 'viewer';

export type View = 
  | 'dashboard'
  | 'create_job'
  | 'parts_management'
  | 'admin_dashboard'
  | 'manage_users'
  | 'history'
  | 'multi_assign'
  | 'serial_history'
  | 'admin_management'
  | 'golf_course_management'
  | 'assigned_job_form'
  | 'view_assigned_jobs'
  | 'supervisor_pending_jobs';
export type JobType = 'PM' | 'BM' | 'Recondition';
export type JobStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'approved';
export type BMCause = 'breakdown' | 'accident' | 'wear' | 'other';

// Interfaces
export interface User {
  id: number;
  username: string;
  name: string;
  role: UserRole;
  golf_course_id: number;
  golf_course_name: string;
  created_at: string;
}

export interface GolfCourse {
  id: number;
  name: string;
  location: string;
  created_at: string;
}

export interface Vehicle {
  id: number;
  vehicle_number: string;
  serial_number: string;
  brand: string;
  model: string;
  year: number;
  golf_course_id: number;
  golf_course_name: string;
  status: 'active' | 'maintenance' | 'retired' | 'parked';
  created_at: string;
}

export interface Part {
  id: number;
  name: string;
  part_number: string;
  category: string;
  unit: string;
  stock_quantity: number;
  min_stock: number;
  golf_course_id: number;
  golf_course_name: string;
  created_at: string;
}

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
  parts?: SelectedPart[];
  system?: string;
  subTasks?: string[];
  partsNotes?: string;
  remarks?: string;
  assigned_by?: number;
  assigned_by_name?: string;
  assigned_to?: number;
  bmCause?: BMCause;
  battery_serial?: string;
}

export interface SelectedPart {
  part_id: number;
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
    tasks: [
      'เป่าฝุ่น ขัดหน้าผ้าเบรก',
      'ทำความสะอาดสายเบรก',
      'ติดตั้งผ้าเบรก',
      'ติดตั้งสายเบรกและปรับตั้งสาย'
    ]
  },
  {
    id: 'steering',
    name: 'ระบบพวงมาลัย',
    description: 'ระบบพวงมาลัยและการควบคุมทิศทาง',
    tasks: [
      'ถอดยอยออกเพื่อทำความสะอาดด้วยโซแนกส์ส้ม',
      'ทำความสะอาดคราบสกปรกต่างที่เกาะตามกระปุกพ่วงมาลัย',
      'ใช้น้ำมันหล่อลื่นหยอดตามกากบาทยอยและโยกให้คล่องตัว',
      'เปลี่ยนยางกันฝุ่นและเติมจารบีเฟืองแร็ก'
    ]
  },
  {
    id: 'motor',
    name: 'ระบบมอเตอร์',
    description: 'ระบบมอเตอร์และเฟืองท้าย',
    tasks: [
      'ถ่ายและเปลี่ยนน้ำมันเฟืองท้าย ทุกๆปี',
      'ตรวจเช็คการไหลลื่นของแปรงถ่านและการคลยตัวของน็อตขั้วมอเตอร์ทุกๆจุด ตรวจลูกปืนมอเตอร์ด้วยการหมุนฟังเสียง',
      'ทำความสะอาดชุดเฟืองท้าย',
      'เปลี่ยนน้ำมันเฟืองท้าย'
    ]
  },
  {
    id: 'electric',
    name: 'ระบบไฟฟ้า',
    description: 'ระบบไฟฟ้าและแบตเตอรี่',
    tasks: [
      'ตรวจเช็คระบบไฟฟ้า',
      'ตรวจสอบแบตเตอรี่',
      'ทำความสะอาดขั้วแบตเตอรี่',
      'ตรวจสอบสายไฟ'
    ]
  }
];

export const MOCK_JOBS: Job[] = [];

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

// ข้อมูล mock สำหรับ Serial History Log - เริ่มต้นเป็นอาร์เรย์ว่าง
export const MOCK_SERIAL_HISTORY: SerialHistoryEntry[] = [];

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
