// ทดสอบการเชื่อมต่อ MongoDB โดยตรงเพื่อทดสอบ login
const { MongoClient } = require('mongodb');

const testDirectLogin = async () => {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('golfcarmaintenance_db');
    
    // ทดสอบค้นหา admin000
    console.log('\nTesting direct MongoDB query for admin000...');
    const user = await db.collection('users').findOne({
      code: 'admin000'
    });
    
    if (user) {
      console.log('✅ Found user:', {
        code: user.code,
        username: user.username,
        name: user.name,
        role: user.role,
        golf_course_id: user.golf_course_id,
        managed_golf_courses: user.managed_golf_courses,
        createdAt: user.createdAt,
        createdAt_type: typeof user.createdAt,
        password: user.password ? 'Present' : 'Missing'
      });
      
      // ทดสอบการตรวจสอบรหัสผ่าน
      if (user.password === '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi') {
        console.log('✅ Password hash matches expected value');
      } else {
        console.log('❌ Password hash does not match');
      }
      
    } else {
      console.log('❌ User not found');
    }
    
    // ทดสอบค้นหาทั้งหมด
    console.log('\nAll users in collection:');
    const allUsers = await db.collection('users').find({}).toArray();
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.code} - ${user.name} (${user.role})`);
      console.log(`   createdAt: ${user.createdAt} (${typeof user.createdAt})`);
      console.log(`   password: ${user.password ? 'Present' : 'Missing'}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
};

testDirectLogin();