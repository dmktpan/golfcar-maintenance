// ลบ User collection (uppercase) และตรวจสอบข้อมูล
const { MongoClient } = require('mongodb');

const cleanUserCollection = async () => {
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
          console.log(`${index + 1}. ${doc.code} - managed_golf_courses: ${JSON.stringify(doc.managed_golf_courses)}`);
        });
        
        console.log('Dropping User collection (uppercase)...');
        await db.collection('User').drop();
        console.log('User collection dropped');
      }
    } catch (error) {
      console.log('User collection not found');
    }
    
    // ตรวจสอบ users collection (lowercase)
    const users = await db.collection('users').find({}).toArray();
    console.log(`\nFound ${users.length} documents in users collection (lowercase)`);
    users.forEach((doc, index) => {
      console.log(`${index + 1}. ${doc.code} - managed_golf_courses: ${JSON.stringify(doc.managed_golf_courses)}`);
      console.log(`   managed_golf_courses type: ${typeof doc.managed_golf_courses[0]}`);
    });
    
    // ตรวจสอบทุก collection ที่มี managed_golf_courses เป็น integer
    const collections = await db.listCollections().toArray();
    console.log('\n=== Checking all collections for integer managed_golf_courses ===');
    
    for (const col of collections) {
      try {
        const docs = await db.collection(col.name).find({ 
          managed_golf_courses: { $elemMatch: { $type: "number" } }
        }).toArray();
        
        if (docs.length > 0) {
          console.log(`\nFound ${docs.length} documents with integer managed_golf_courses in ${col.name}:`);
          docs.forEach((doc, index) => {
            console.log(`  ${index + 1}. _id: ${doc._id}`);
            console.log(`     managed_golf_courses: ${JSON.stringify(doc.managed_golf_courses)}`);
          });
        }
      } catch (error) {
        // ignore errors
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
};

cleanUserCollection();