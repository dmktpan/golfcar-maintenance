// ค้นหาและลบข้อมูลที่มี golf_course_id = 1 ในทุก collection
const { MongoClient } = require('mongodb');

const cleanAllIntegerGolfCourseId = async () => {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('golfcarmaintenance_db');
    
    // ดูทุก collection
    const collections = await db.listCollections().toArray();
    console.log('All collections:');
    collections.forEach(col => console.log(`- ${col.name}`));
    
    // ค้นหาและลบในทุก collection
    console.log('\n=== Searching and cleaning golf_course_id = 1 (integer) ===');
    for (const col of collections) {
      try {
        // ค้นหาก่อน
        const docs = await db.collection(col.name).find({ golf_course_id: 1 }).toArray();
        if (docs.length > 0) {
          console.log(`\nFound ${docs.length} documents with golf_course_id = 1 in ${col.name}:`);
          docs.forEach((doc, index) => {
            console.log(`  ${index + 1}. _id: ${doc._id}`);
            console.log(`     golf_course_id: ${doc.golf_course_id} (${typeof doc.golf_course_id})`);
            if (doc.code) console.log(`     code: ${doc.code}`);
            if (doc.name) console.log(`     name: ${doc.name}`);
            if (doc.vehicle_number) console.log(`     vehicle_number: ${doc.vehicle_number}`);
            if (doc.serial_number) console.log(`     serial_number: ${doc.serial_number}`);
          });
          
          // ลบข้อมูลที่มี golf_course_id = 1
          const deleteResult = await db.collection(col.name).deleteMany({ golf_course_id: 1 });
          console.log(`     Deleted ${deleteResult.deletedCount} documents from ${col.name}`);
        }
      } catch (error) {
        console.log(`Error checking ${col.name}:`, error.message);
      }
    }
    
    // ค้นหา golf_course_id ที่เป็น number type และลบ
    console.log('\n=== Searching and cleaning golf_course_id with number type ===');
    for (const col of collections) {
      try {
        const docs = await db.collection(col.name).find({ 
          golf_course_id: { $type: "number" } 
        }).toArray();
        if (docs.length > 0) {
          console.log(`\nFound ${docs.length} documents with number golf_course_id in ${col.name}:`);
          docs.forEach((doc, index) => {
            console.log(`  ${index + 1}. _id: ${doc._id}`);
            console.log(`     golf_course_id: ${doc.golf_course_id} (${typeof doc.golf_course_id})`);
            if (doc.code) console.log(`     code: ${doc.code}`);
            if (doc.name) console.log(`     name: ${doc.name}`);
            if (doc.vehicle_number) console.log(`     vehicle_number: ${doc.vehicle_number}`);
          });
          
          // ลบข้อมูลที่มี golf_course_id เป็น number
          const deleteResult = await db.collection(col.name).deleteMany({ 
            golf_course_id: { $type: "number" } 
          });
          console.log(`     Deleted ${deleteResult.deletedCount} documents from ${col.name}`);
        }
      } catch (error) {
        console.log(`Error checking ${col.name}:`, error.message);
      }
    }
    
    console.log('\n=== Cleanup completed ===');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
};

cleanAllIntegerGolfCourseId();