// ลบ User collection (uppercase) ที่เหลืออยู่
const { MongoClient } = require('mongodb');

const removeUserCollection = async () => {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('golfcarmaintenance_db');
    
    // ตรวจสอบ User collection (uppercase)
    try {
      const userDocs = await db.collection('User').find({}).toArray();
      console.log(`Found ${userDocs.length} documents in User collection (uppercase)`);
      
      if (userDocs.length > 0) {
        userDocs.forEach((doc, index) => {
          console.log(`${index + 1}. ${doc.code || doc._id}`);
          if (doc.managed_golf_courses) {
            console.log(`   managed_golf_courses: ${JSON.stringify(doc.managed_golf_courses)}`);
          }
        });
      }
      
      console.log('Dropping User collection (uppercase)...');
      await db.collection('User').drop();
      console.log('User collection dropped successfully');
      
    } catch (error) {
      if (error.message.includes('ns not found')) {
        console.log('User collection not found - already dropped');
      } else {
        console.error('Error dropping User collection:', error.message);
      }
    }
    
    // ตรวจสอบ collections ที่เหลือ
    const collections = await db.listCollections().toArray();
    console.log('\nRemaining collections:');
    collections.forEach(col => console.log(`- ${col.name}`));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
};

removeUserCollection();