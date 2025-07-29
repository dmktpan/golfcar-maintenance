// ทดสอบการเชื่อมต่อฐานข้อมูลโดยตรงโดยไม่ใช้ Prisma
const { MongoClient } = require('mongodb');

const testDirectConnection = async () => {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    console.log('Connected to MongoDB directly');
    
    const db = client.db('golfcarmaintenance_db');
    
    // ดู collections ทั้งหมด
    const collections = await db.listCollections().toArray();
    console.log('\nAll collections:');
    collections.forEach(col => console.log(`- ${col.name}`));
    
    // ตรวจสอบ users collection
    console.log('\n=== users collection ===');
    const users = await db.collection('users').find({}).toArray();
    console.log(`Found ${users.length} users:`);
    
    users.forEach((user, index) => {
      console.log(`\n${index + 1}. User: ${user.code}`);
      console.log(`   _id: ${user._id} (${typeof user._id})`);
      console.log(`   name: ${user.name}`);
      console.log(`   role: ${user.role}`);
      console.log(`   golf_course_id: ${user.golf_course_id} (${typeof user.golf_course_id})`);
      console.log(`   managed_golf_courses: ${JSON.stringify(user.managed_golf_courses)}`);
      if (user.managed_golf_courses && user.managed_golf_courses.length > 0) {
        console.log(`   managed_golf_courses[0] type: ${typeof user.managed_golf_courses[0]}`);
      }
      console.log(`   createdAt: ${user.createdAt} (${typeof user.createdAt})`);
      console.log(`   updatedAt: ${user.updatedAt} (${typeof user.updatedAt})`);
    });
    
    // ลองค้นหา user ด้วย code
    console.log('\n=== Testing findOne ===');
    const admin000 = await db.collection('users').findOne({ code: 'admin000' });
    if (admin000) {
      console.log('Found admin000:');
      console.log(`   golf_course_id: ${admin000.golf_course_id} (${typeof admin000.golf_course_id})`);
      console.log(`   managed_golf_courses: ${JSON.stringify(admin000.managed_golf_courses)}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
};

testDirectConnection();