// ทดสอบ Prisma Client โดยตรง
const { PrismaClient } = require('@prisma/client');

const testPrismaLogin = async () => {
  const prisma = new PrismaClient();
  
  try {
    console.log('Testing Prisma Client...');
    
    // ทดสอบการเชื่อมต่อ
    await prisma.$connect();
    console.log('✅ Prisma connected successfully');
    
    // ทดสอบค้นหา users ทั้งหมด
    console.log('\nTesting findMany...');
    const allUsers = await prisma.user.findMany();
    console.log(`Found ${allUsers.length} users`);
    
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.code} - ${user.name} (${user.role})`);
      console.log(`   createdAt: ${user.createdAt} (${typeof user.createdAt})`);
      console.log(`   golf_course_id: ${user.golf_course_id} (${typeof user.golf_course_id})`);
    });
    
    // ทดสอบค้นหา admin000
    console.log('\nTesting findFirst for admin000...');
    const user = await prisma.user.findFirst({
      where: {
        code: {
          equals: 'admin000',
          mode: 'insensitive'
        },
        role: 'admin'
      }
    });
    
    if (user) {
      console.log('✅ Found admin000:', {
        code: user.code,
        username: user.username,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
        password: user.password ? 'Present' : 'Missing'
      });
    } else {
      console.log('❌ admin000 not found');
    }
    
  } catch (error) {
    console.error('Prisma error:', error);
  } finally {
    await prisma.$disconnect();
  }
};

testPrismaLogin();