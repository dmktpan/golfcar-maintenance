// ลบข้อมูลเก่าทั้งหมดและใช้ข้อมูลจาก frontend
const { MongoClient, ObjectId } = require('mongodb');

const cleanAndUseCorrectData = async () => {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('golfcarmaintenance_db');
    
    // ตรวจสอบ collection ทั้งหมด
    const collections = await db.listCollections().toArray();
    console.log('All collections:');
    collections.forEach(col => console.log(`- ${col.name}`));
    
    // ลบ users collection เก่า
    console.log('\nDropping users collection...');
    try {
      await db.collection('users').drop();
      console.log('users collection dropped');
    } catch (error) {
      console.log('users collection not found or already dropped');
    }
    
    // ตรวจสอบว่ามี collection อื่นที่มีข้อมูล user หรือไม่
    console.log('\nChecking for user data in other collections...');
    
    // ตรวจสอบ User collection (uppercase)
    try {
      const userDocs = await db.collection('User').find({}).toArray();
      if (userDocs.length > 0) {
        console.log(`Found ${userDocs.length} users in User collection`);
        console.log('Dropping User collection...');
        await db.collection('User').drop();
        console.log('User collection dropped');
      }
    } catch (error) {
      console.log('User collection not found');
    }
    
    // สร้าง users collection ใหม่ด้วยข้อมูลที่ถูกต้อง
    console.log('\nCreating new users with correct data...');
    
    // หา golf course ที่มีอยู่
    const golfCourses = await db.collection('GolfCourse').find({}).toArray();
    let defaultGolfCourse;
    
    if (golfCourses.length === 0) {
      console.log('Creating default golf course...');
      const newGolfCourse = await db.collection('GolfCourse').insertOne({
        name: 'สำนักงานใหญ่',
        location: 'กรุงเทพฯ',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      defaultGolfCourse = { _id: newGolfCourse.insertedId, name: 'สำนักงานใหญ่' };
    } else {
      defaultGolfCourse = golfCourses[0];
    }
    
    console.log(`Using golf course: ${defaultGolfCourse.name} (${defaultGolfCourse._id})`);
    
    // สร้าง users ใหม่
    const newUsers = [
      {
        code: 'admin000',
        username: 'admin000',
        name: 'ผู้ใช้ admin000',
        role: 'admin',
        password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
        managed_golf_courses: [1],
        golf_course_id: defaultGolfCourse._id,
        golf_course_name: defaultGolfCourse.name,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        code: 'admin002',
        username: 'admin002',
        name: 'ผู้ใช้ admin002',
        role: 'admin',
        password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
        managed_golf_courses: [1],
        golf_course_id: defaultGolfCourse._id,
        golf_course_name: defaultGolfCourse.name,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    const result = await db.collection('users').insertMany(newUsers);
    console.log(`Inserted ${result.insertedCount} users`);
    
    // ตรวจสอบข้อมูลที่สร้างใหม่
    const users = await db.collection('users').find({}).toArray();
    console.log('\nCreated users:');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.code} - ${user.name}`);
      console.log(`   golf_course_id: ${user.golf_course_id} (${typeof user.golf_course_id})`);
      console.log(`   createdAt: ${user.createdAt} (${typeof user.createdAt})`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
};

cleanAndUseCorrectData();