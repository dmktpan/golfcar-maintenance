const { PrismaClient } = require('@prisma/client');

const testPrismaFresh = async () => {
  console.log('Testing Prisma Client with fresh connection...');
  
  // สร้าง Prisma client ใหม่
  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });

  try {
    console.log('✅ Prisma connected successfully');

    // ทดสอบ raw query ก่อน
    console.log('\nTesting raw query...');
    const rawUsers = await prisma.$runCommandRaw({
      find: 'users',
      filter: {}
    });
    console.log('Raw users:', JSON.stringify(rawUsers, null, 2));

    // ทดสอบ findMany
    console.log('\nTesting findMany...');
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        role: true,
        createdAt: true,
        golf_course_id: true
      }
    });
    console.log('Found users:', allUsers.length);
    console.log('Users:', JSON.stringify(allUsers, null, 2));

  } catch (error) {
    console.error('Prisma error:', error);
  } finally {
    await prisma.$disconnect();
  }
};

testPrismaFresh();