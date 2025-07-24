// scripts/reset-password.ts
import { prisma } from '../lib/db/prisma';
import bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// โหลด environment variables จากไฟล์ .env.local ที่ root directory
dotenv.config({ path: resolve(__dirname, '../.env.local') });

async function main() {
  // 1. รับค่า username และ password ใหม่จาก command line
  const args = process.argv.slice(2);
  const username = args[0];
  const newPassword = args[1];

  if (!username || !newPassword) {
    console.error('❌ กรุณาระบุ username และ newPassword');
    console.log('ตัวอย่าง: npm run reset-password <username> <new_password>');
    return;
  }

  console.log(`กำลังสร้าง หรือ รีเซ็ตรหัสผ่านสำหรับผู้ใช้: ${username}...`);

  try {
    // 2. เข้ารหัส (Hash) รหัสผ่านใหม่ (หรือใช้ plain text สำหรับทดสอบ)
    const password = newPassword; // ใช้ plain text ก่อน เพื่อให้ตรงกับ API

    // 3. ใช้ upsert: ถ้าเจอ user จะอัปเดต, ถ้าไม่เจอจะสร้างใหม่
    const user = await prisma.user.upsert({
      where: {
        username: username,
      },
      update: {
        password: password,
      },
      create: {
        username: username,
        password: password,
        name: `ผู้ใช้ ${username}`,
        code: username,
        role: 'admin', // ใช้ string literal แทน enum
        golf_course_id: "6881e0fc062cd6d0fb32a03c",
        golf_course_name: "สำนักงานใหญ่",
        managed_golf_courses: [1],
      },
    });

    console.log(`✅ สร้าง/รีเซ็ตรหัสผ่านสำหรับผู้ใช้ '${user.name}' เรียบร้อยแล้ว!`);

  } catch (error) {
    console.error('เกิดข้อผิดพลาด:', error);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
