const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// User Schema (simplified version matching the model)
const userSchema = new mongoose.Schema({
  firebaseUid: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  displayName: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['USER', 'ADMIN', 'SUPER_ADMIN'], 
    default: 'USER'
  },
  status: { 
    type: String, 
    enum: ['active', 'invited', 'suspended'], 
    default: 'invited'
  },
  department: String,
  phone: String,
  address: String,
  bio: String,
  profileImage: String,
  permissions: [String],
  loginAttempts: { type: Number, default: 0 },
  lastLogin: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('EnhancedUser', userSchema, 'enhancedusers');

async function checkCurrentUser() {
  try {
    console.log('🔍 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('\n📋 All users in database:');
    const users = await User.find({}).select('firebaseUid email displayName role status');
    
    if (users.length === 0) {
      console.log('❌ No users found in database');
      return;
    }

    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   Firebase UID: ${user.firebaseUid}`);
      console.log(`   Display Name: ${user.displayName}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Status: ${user.status}`);
      console.log('   ---');
    });

    console.log(`\n📊 Summary:`);
    console.log(`Total users: ${users.length}`);
    console.log(`Super Admins: ${users.filter(u => u.role === 'SUPER_ADMIN').length}`);
    console.log(`Admins: ${users.filter(u => u.role === 'ADMIN').length}`);
    console.log(`Users: ${users.filter(u => u.role === 'USER').length}`);
    console.log(`Active: ${users.filter(u => u.status === 'active').length}`);
    console.log(`Invited: ${users.filter(u => u.status === 'invited').length}`);
    console.log(`Suspended: ${users.filter(u => u.status === 'suspended').length}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkCurrentUser();