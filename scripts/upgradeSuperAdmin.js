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

async function upgradeSuperAdmin() {
  try {
    console.log('🔍 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find the user that needs to be upgraded
    const targetEmail = 'afzal@noorsaray.com'; // The current user
    
    console.log(`\n🔍 Looking for user: ${targetEmail}`);
    const user = await User.findOne({ email: targetEmail });
    
    if (!user) {
      console.log(`❌ User ${targetEmail} not found!`);
      return;
    }

    console.log('\n👤 Current user details:');
    console.log('ID:', user._id);
    console.log('Firebase UID:', user.firebaseUid);
    console.log('Email:', user.email);
    console.log('Display Name:', user.displayName);
    console.log('Current Role:', user.role);
    console.log('Current Status:', user.status);

    if (user.role === 'SUPER_ADMIN') {
      console.log('\n✅ User is already a Super Admin!');
      return;
    }

    // Upgrade to Super Admin
    console.log('\n🚀 Upgrading user to Super Admin...');
    user.role = 'SUPER_ADMIN';
    user.status = 'active';
    user.updatedAt = new Date();
    await user.save();

    console.log('✅ User successfully upgraded to Super Admin!');
    
    // Display updated user info
    const updatedUser = await User.findById(user._id);
    console.log('\n👑 Updated user details:');
    console.log('ID:', updatedUser._id);
    console.log('Firebase UID:', updatedUser.firebaseUid);
    console.log('Email:', updatedUser.email);
    console.log('Display Name:', updatedUser.displayName);
    console.log('Role:', updatedUser.role);
    console.log('Status:', updatedUser.status);

    console.log('\n🎉 Success! You can now login and access all admin features.');
    console.log('Please refresh your browser after logging in to see the navigation menu.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

upgradeSuperAdmin();