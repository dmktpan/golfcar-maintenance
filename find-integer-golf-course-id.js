// ตรวจสอบทุก collection ที่มี golf_course_id = 1
const { MongoClient } = require('mongodb');

const findIntegerGolfCourseId = async () => {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('golfcarmaintenance_db');
    
    // ดูทุก collection
    const collections = await db.listCollections().toArray();
    console.log('All collections:');
    collections.forEach(col => console.log(`- ${col.name}`));
    
    // ตรวจสอบทุก collection ที่มี golf_course_id เป็น integer
    console.log('\n=== Searching for integer golf_course_id ===');
    for (const col of collections) {
      try {
        // ค้นหา golf_course_id ที่เป็น number
        const docs = await db.collection(col.name).find({ 
          golf_course_id: { $type: "number" } 
        }).toArray();
        
        if (docs.length > 0) {
          console.log(`\nFound ${docs.length} documents with integer golf_course_id in ${col.name}:`);
          docs.forEach((doc, index) => {
            console.log(`  ${index + 1}. _id: ${doc._id}`);
            console.log(`     golf_course_id: ${doc.golf_course_id} (${typeof doc.golf_course_id})`);
            if (doc.code) console.log(`     code: ${doc.code}`);
            if (doc.name) console.log(`     name: ${doc.name}`);
            if (doc.vehicle_number) console.log(`     vehicle_number: ${doc.vehicle_number}`);
          });
        }
      } catch (error) {
        // ignore errors for collections that don't have golf_course_id
      }
    }
    
    // ตรวจสอบ managed_golf_courses ที่เป็น array ของ integers
    console.log('\n=== Searching for managed_golf_courses with integers ===');
    for (const col of collections) {
      try {
        const docs = await db.collection(col.name).find({ 
          managed_golf_courses: { $exists: true } 
        }).toArray();
        
        if (docs.length > 0) {
          console.log(`\nFound ${docs.length} documents with managed_golf_courses in ${col.name}:`);
          docs.forEach((doc, index) => {
            console.log(`  ${index + 1}. _id: ${doc._id}`);
            console.log(`     managed_golf_courses: ${JSON.stringify(doc.managed_golf_courses)}`);
            if (doc.code) console.log(`     code: ${doc.code}`);
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

findIntegerGolfCourseId();