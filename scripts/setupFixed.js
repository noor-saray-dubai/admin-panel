const readline = require('readline');
const { MongoClient } = require('mongodb');
const admin = require('firebase-admin');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function interactiveSetup() {
  console.log('🎉 Welcome to Noorsaray Admin Panel Setup!\n');
  console.log('This script will create your first Super Admin account.\n');

  try {
    // Get user details
    console.log('📝 Please provide your Super Admin details:\n');

    const email = await question('👤 Enter your email address: ');
    if (!email || !email.includes('@')) {
      console.log('❌ Please enter a valid email address');
      process.exit(1);
    }

    const displayName = await question('✨ Enter your full name: ');
    if (!displayName) {
      console.log('❌ Please enter your name');
      process.exit(1);
    }

    let password = await question('🔒 Enter a secure password (min 8 chars): ');
    if (!password || password.length < 8) {
      console.log('❌ Password must be at least 8 characters');
      process.exit(1);
    }

    // Confirmation
    console.log('\n📋 Please confirm your details:');
    console.log('   Email:', email);
    console.log('   Name:', displayName);
    console.log('   Password: ' + '*'.repeat(password.length));

    const confirm = await question('\n✅ Is this correct? (y/N): ');
    if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
      console.log('❌ Setup cancelled');
      process.exit(1);
    }

    rl.close();

    console.log('\n🚀 Starting Super Admin Creation Process...\n');

    // Step 1: Initialize Firebase Admin
    console.log('1️⃣ Initializing Firebase Admin...');
    
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        }),
      });
    }

    const auth = admin.auth();
    console.log('✅ Firebase Admin initialized\n');

    // Step 2: Create Firebase User
    console.log('2️⃣ Creating Firebase user...');
    let firebaseUser;
    
    try {
      firebaseUser = await auth.getUserByEmail(email);
      console.log('⚠️ Firebase user already exists, using existing user');
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        firebaseUser = await auth.createUser({
          email: email,
          displayName: displayName,
          password: password,
          emailVerified: true,
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
      permissions: ['all'],
    });
    console.log('✅ Custom claims set\n');

    // Step 4: Connect to MongoDB
    console.log('4️⃣ Connecting to MongoDB...');
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db();
    console.log('✅ Connected to MongoDB\n');

    // Step 5: Create MongoDB User Record (using enhanced user structure)
    console.log('5️⃣ Creating MongoDB user record...');
    
    const userDoc = {
      firebaseUid: firebaseUser.uid,
      email: email,
      displayName: displayName,
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

    // Step 6: Create Audit Log
    console.log('6️⃣ Creating audit log...');
    await db.collection('auditlogs').insertOne({
      action: 'user_created',
      level: 'info',
      userId: userDoc.firebaseUid,
      userEmail: userDoc.email,
      targetUserId: userDoc.firebaseUid,
      targetUserEmail: userDoc.email,
      ip: 'localhost',
      userAgent: 'interactive-setup',
      resource: 'users',
      details: {
        role: 'super_admin',
        method: 'interactive_setup',
        note: 'Initial super admin creation via interactive script',
      },
      success: true,
      timestamp: new Date(),
    });
    console.log('✅ Audit log created\n');

    await client.close();
    console.log('✅ MongoDB connection closed\n');

    // Success
    console.log('🎉 SUCCESS! Super Admin account created successfully!\n');
    console.log('📋 Account Details:');
    console.log('   Email:', email);
    console.log('   Name:', displayName);
    console.log('   Role: Super Admin');
    console.log('   Firebase UID:', firebaseUser.uid);
    console.log('\n💡 Next Steps:');
    console.log('   1. Start your development server: npm run dev');
    console.log('   2. Go to: http://localhost:3000');
    console.log('   3. Login with your email and password');
    console.log('   4. You will have access to all features');
    console.log('   5. Create other admin and user accounts as needed');
    console.log('\n🔥 Your admin panel is ready to rock!');

  } catch (error) {
    console.error('❌ Error:', error);
    rl.close();
    process.exit(1);
  }
}

// Run interactive setup
interactiveSetup().then(() => {
  console.log('\n✨ Setup completed successfully!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Setup failed:', error);
  process.exit(1);
});