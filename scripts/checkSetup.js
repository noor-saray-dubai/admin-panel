const { MongoClient } = require('mongodb');

async function checkSetup() {
  console.log('🔍 Checking Your Setup...\n');

  let allGood = true;

  // Check 1: Environment Variables
  console.log('1️⃣ Checking Environment Variables...');
  
  const requiredEnvVars = [
    'MONGODB_URI',
    'FIREBASE_PROJECT_ID',
    'FIREBASE_PRIVATE_KEY', 
    'FIREBASE_CLIENT_EMAIL'
  ];

  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      console.log(`   ✅ ${envVar}: Set`);
    } else {
      console.log(`   ❌ ${envVar}: Missing`);
      allGood = false;
    }
  }

  // Check 2: MongoDB Connection
  console.log('\n2️⃣ Testing MongoDB Connection...');
  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    console.log('   ✅ MongoDB: Connected successfully');
    
    // Check for existing super admin
    const db = client.db();
    const superAdmin = await db.collection('enhancedusers').findOne({ 
      fullRole: 'super_admin' 
    });
    
    if (superAdmin) {
      console.log(`   ✅ Super Admin Found: ${superAdmin.email}`);
    } else {
      console.log('   ⚠️  No Super Admin found - run npm run setup');
    }
    
    await client.close();
  } catch (error) {
    console.log('   ❌ MongoDB: Connection failed');
    console.log('      Error:', error.message);
    allGood = false;
  }

  // Check 3: Firebase Admin SDK
  console.log('\n3️⃣ Testing Firebase Admin SDK...');
  try {
    const admin = require('firebase-admin');
    
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        }),
      });
    }

    // Test if we can access auth
    const auth = admin.auth();
    await auth.listUsers(1); // Test with minimal query
    console.log('   ✅ Firebase Admin SDK: Working correctly');
    
  } catch (error) {
    console.log('   ❌ Firebase Admin SDK: Failed');
    console.log('      Error:', error.message);
    allGood = false;
  }

  // Check 4: Project Structure
  console.log('\n4️⃣ Checking Project Structure...');
  const fs = require('fs');
  const path = require('path');
  
  const requiredFiles = [
    'firebase.ts',
    'models/enhancedUser.ts',
    'hooks/useEnhancedAuth.tsx',
    'lib/auth/authChecker.ts',
    'components/luxury-sidebar.tsx'
  ];

  for (const file of requiredFiles) {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      console.log(`   ✅ ${file}: Exists`);
    } else {
      console.log(`   ❌ ${file}: Missing`);
      allGood = false;
    }
  }

  // Final result
  console.log('\n' + '='.repeat(50));
  if (allGood) {
    console.log('🎉 ALL CHECKS PASSED!');
    console.log('\n✨ Your setup looks great! You can now:');
    console.log('   1. Run: npm run dev');
    console.log('   2. Visit: http://localhost:3000');
    console.log('   3. Login with your admin credentials');
    console.log('\n🚀 Happy coding!');
  } else {
    console.log('❌ SOME CHECKS FAILED');
    console.log('\n🔧 To fix issues:');
    console.log('   1. Check your .env.local file');
    console.log('   2. Ensure MongoDB is running');
    console.log('   3. Verify Firebase setup');
    console.log('   4. Run: npm run setup (if no super admin)');
    console.log('\n📖 Check SETUP.md for detailed instructions');
  }
  console.log('='.repeat(50));
}

// Run the check
checkSetup().catch((error) => {
  console.error('💥 Check failed:', error);
  process.exit(1);
});