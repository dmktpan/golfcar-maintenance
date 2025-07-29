// ตรวจสอบข้อมูลในฐานข้อมูล
const { MongoClient } = require('mongodb');

const checkDatabase = async () => {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('golfcarmaintenance_db');
    
    // ตรวจสอบ users collection
    console.log('\n=== users collection ===');
    const users = await db.collection('users').find({}).toArray();
    console.log('Total users:', users.length);
    
    users.forEach((user, index) => {
      console.log(`\nUser ${index + 1}:`);
      console.log('- _id:', user._id);
      console.log('- code:', user.code);
      console.log('- username:', user.username);
      console.log('- name:', user.name);
      console.log('- role:', user.role);
      console.log('- password:', user.password);
      console.log('- golf_course_id:', user.golf_course_id);
      console.log('- golf_course_name:', user.golf_course_name);
    });
    
    // ตรวจสอบ User collection (uppercase)
    console.log('\n=== User collection (uppercase) ===');
    const upperUsers = await db.collection('User').find({}).toArray();
    console.log('Total User:', upperUsers.length);
    
    upperUsers.forEach((user, index) => {
      console.log(`\nUser ${index + 1}:`);
      console.log('- _id:', user._id);
      console.log('- code:', user.code);
      console.log('- username:', user.username);
      console.log('- name:', user.name);
      console.log('- role:', user.role);
      console.log('- password:', user.password);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
};

checkDatabase();