const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function testEnhancedUser() {
  try {
    console.log('🔍 Testing EnhancedUser model...');
    
    // Connect to database directly without models first
    const db = mongoose.connection.db;
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('\n📋 Examining database collections...');
    
    // Check what collections exist
    const collections = await db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
    
    // Test Firebase UID from the database
    const firebaseUid = 'aiHEBdBirGREMw2fuPsE1Xi2HTV2';
    
    console.log(`\n🔍 Looking for user with Firebase UID: ${firebaseUid}`);
    
    // Check enhancedusers collection directly
    const enhancedUsersCollection = db.collection('enhancedusers');
    const rawUser = await enhancedUsersCollection.findOne({ firebaseUid });
    
    if (rawUser) {
      console.log('✅ User found in enhancedusers collection!');
      console.log('📋 Raw user document:');
      console.log(JSON.stringify(rawUser, null, 2));
    } else {
      console.log('❌ User not found in enhancedusers collection');
      
      // Check if user exists in any collection
      const allCollections = ['users', 'enhancedusers', 'user', 'enhanceduser'];
      
      for (const collectionName of allCollections) {
        try {
          const collection = db.collection(collectionName);
          const count = await collection.countDocuments();
          console.log(`\n📊 Collection '${collectionName}': ${count} documents`);
          
          if (count > 0) {
            const sampleUser = await collection.findOne({});
            console.log(`Sample document structure:`, Object.keys(sampleUser));
            
            // Check if our user exists in this collection
            const userInCollection = await collection.findOne({ firebaseUid });
            if (userInCollection) {
              console.log(`✅ User found in '${collectionName}' collection!`);
              console.log('Document:', JSON.stringify(userInCollection, null, 2));
            }
          }
        } catch (err) {
          console.log(`❌ Error checking collection '${collectionName}':`, err.message);
        }
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testEnhancedUser();