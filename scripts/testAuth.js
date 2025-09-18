const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Import the AuthService
const { createAuthService } = require('../lib/auth/AuthService.ts');

async function testAuth() {
  try {
    console.log('🔍 Testing AuthService...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Test Firebase UID from the database
    const firebaseUid = 'aiHEBdBirGREMw2fuPsE1Xi2HTV2';
    
    console.log(`\n🔐 Testing authentication for Firebase UID: ${firebaseUid}`);
    
    const authService = createAuthService({
      ip: '127.0.0.1',
      userAgent: 'test'
    });

    const user = await authService.authenticateUser(firebaseUid);
    
    if (user) {
      console.log('✅ User found successfully!');
      console.log('📋 User details:');
      console.log('ID:', user._id);
      console.log('Email:', user.email);
      console.log('Display Name:', user.displayName);
      console.log('Role:', user.role);
      console.log('Status:', user.status);
      console.log('Permissions:', user.getAllPermissions());
    } else {
      console.log('❌ User not found or not active');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testAuth();