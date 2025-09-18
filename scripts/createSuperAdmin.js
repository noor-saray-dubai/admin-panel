const { MongoClient } = require('mongodb');
const { adminAuth } = require('../lib/firebaseAdmin');

// Configuration
const MONGODB_URI = process.env.MONGODB_URI;

// Super Admin Details - UPDATE THESE WITH YOUR INFO
const SUPER_ADMIN = {
  email: 'your-email@example.com', // 👈 CHANGE THIS TO YOUR EMAIL
  displayName: 'Super Admin', // 👈 CHANGE THIS TO YOUR NAME
  password: 'TempPassword123!', // 👈 CHANGE THIS TO A SECURE PASSWORD
};

async function createSuperAdmin() {
  console.log('🚀 Starting Super Admin Creation Process...\n');

  try {
    // Step 1: Use existing Firebase Admin configuration
    console.log('1️⃣ Using existing Firebase Admin configuration...');
    const auth = adminAuth;
    console.log('✅ Firebase Admin initialized\n');

    // Step 2: Create Firebase User
    console.log('2️⃣ Creating Firebase user...');
    let firebaseUser;
    
    try {
      // Try to get existing user first
      firebaseUser = await auth.getUserByEmail(SUPER_ADMIN.email);
      console.log('⚠️ Firebase user already exists, using existing user');
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        // Create new user
        firebaseUser = await auth.createUser({
          email: SUPER_ADMIN.email,
          displayName: SUPER_ADMIN.displayName,
          password: SUPER_ADMIN.password,
          emailVerified: true, // Auto-verify super admin
        });
        console.log('✅ Firebase user created:', firebaseUser.uid);
      } else {
        throw error;
      }
    }

    // Step 3: Set Firebase Custom Claims
    console.log('3️⃣ Setting Firebase custom claims...');
    await auth.setCustomUserClaims(firebaseUser.uid, {
      role: 'super_admin',
      permissions: ['all'], // Super admin has all permissions
    });
    console.log('✅ Custom claims set\n');

    // Step 4: Connect to MongoDB
    console.log('4️⃣ Connecting to MongoDB...');
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db();
    console.log('✅ Connected to MongoDB\n');

    // Step 5: Create MongoDB User Record
    console.log('5️⃣ Creating MongoDB user record...');
    
    const userDoc = {
      firebaseUid: firebaseUser.uid,
      email: SUPER_ADMIN.email,
      displayName: SUPER_ADMIN.displayName,
      fullRole: 'super_admin',
      status: 'active',
      
      // Grant access to all collections with admin sub-role
      collectionPermissions: [
        { collection: 'projects', subRole: 'admin' },
        { collection: 'blogs', subRole: 'admin' },
        { collection: 'news', subRole: 'admin' },
        { collection: 'careers', subRole: 'admin' },
        { collection: 'developers', subRole: 'admin' },
        { collection: 'plots', subRole: 'admin' },
        { collection: 'malls', subRole: 'admin' },
        { collection: 'communities', subRole: 'admin' },
        { collection: 'users', subRole: 'admin' },
        { collection: 'system', subRole: 'admin' },
      ],
      
      permissionOverrides: [],
      loginAttempts: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Check if user already exists in MongoDB
    const existingUser = await db.collection('enhancedusers').findOne({ 
      firebaseUid: firebaseUser.uid 
    });

    if (existingUser) {
      console.log('⚠️ User already exists in MongoDB, updating...');
      await db.collection('enhancedusers').updateOne(
        { firebaseUid: firebaseUser.uid },
        { $set: userDoc }
      );
      console.log('✅ User updated in MongoDB');
    } else {
      await db.collection('enhancedusers').insertOne(userDoc);
      console.log('✅ User created in MongoDB');
    }

    // Step 6: Create Audit Log Entry
    console.log('6️⃣ Creating audit log...');
    await db.collection('auditlogs').insertOne({
      action: 'user_created',
      level: 'info',
      userId: userDoc.firebaseUid,
      userEmail: userDoc.email,
      targetUserId: userDoc.firebaseUid,
      targetUserEmail: userDoc.email,
      ip: 'localhost',
      userAgent: 'setup-script',
      resource: 'users',
      details: {
        role: 'super_admin',
        method: 'manual_setup',
        note: 'Initial super admin creation',
      },
      success: true,
      timestamp: new Date(),
    });
    console.log('✅ Audit log created\n');

    // Step 7: Close connections
    await client.close();
    console.log('✅ MongoDB connection closed\n');

    // Success message
    console.log('🎉 SUCCESS! Super Admin account created successfully!\n');
    console.log('📋 Account Details:');
    console.log('   Email:', SUPER_ADMIN.email);
    console.log('   Name:', SUPER_ADMIN.displayName);
    console.log('   Role: Super Admin');
    console.log('   Firebase UID:', firebaseUser.uid);
    console.log('\n💡 Next Steps:');
    console.log('   1. Login with your email and password');
    console.log('   2. You will have access to all features and collections');
    console.log('   3. You can now create other admin and user accounts');
    console.log('   4. Consider changing your password after first login');
    console.log('\n🔥 Your admin panel is ready to use!');

  } catch (error) {
    console.error('❌ Error creating Super Admin:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  createSuperAdmin().then(() => {
    console.log('\n✨ Script completed successfully!');
    process.exit(0);
  }).catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
}

module.exports = { createSuperAdmin };