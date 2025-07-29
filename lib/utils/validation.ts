// lib/utils/validation.ts

/**
 * ตรวจสอบว่า string เป็น MongoDB ObjectID ที่ถูกต้องหรือไม่
 * @param id - string ที่ต้องการตรวจสอบ
 * @returns boolean - true ถ้าเป็น ObjectID ที่ถูกต้อง
 */
export function isValidObjectId(id: string): boolean {
  // MongoDB ObjectID ต้องเป็น hexadecimal string ยาว 24 ตัวอักษรเท่านั้น
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
  
  return isObjectId;
}

/**
 * ตรวจสอบว่า array ของ string เป็น MongoDB ObjectID ที่ถูกต้องทั้งหมดหรือไม่
 * @param ids - array ของ string ที่ต้องการตรวจสอบ
 * @returns boolean - true ถ้าทุก string เป็น ObjectID ที่ถูกต้อง
 */
export function areValidObjectIds(ids: string[]): boolean {
  return ids.every(id => isValidObjectId(id));
}

/**
 * ตรวจสอบและทำความสะอาด ObjectID
 * @param id - string ที่ต้องการตรวจสอบ
 * @returns string | null - ObjectID ที่ถูกต้อง หรือ null ถ้าไม่ถูกต้อง
 */
export function sanitizeObjectId(id: string): string | null {
  const trimmedId = id.trim();
  return isValidObjectId(trimmedId) ? trimmedId : null;
}