const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// New User Schema - matching your permission system
const userSchema = new mongoose.Schema({
  firebaseUid: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  displayName: { type: String, required: true },
  
  // NEW PERMISSION SYSTEM
  fullRole: { 
    type: String, 
    enum: ['super_admin', 'admin', 'agent', 'marketing', 'sales', 'hr', 'community_manager', 'user'], 
    default: 'user'
  },
  status: { 
    type: String, 
    enum: ['active', 'invited', 'suspended', 'deleted'], 
    default: 'invited'
  },
  collectionPermissions: [{
    collection: { 
      type: String, 
      enum: ['projects', 'blogs', 'news', 'careers', 'developers', 'plots', 'malls', 'communities', 'users', 'system'],
      required: true 
    },
    subRole: { 
      type: String, 
      enum: ['observer', 'contributor', 'moderator', 'collection_admin'],
      required: true 
    },
    customActions: [String],
    restrictions: {
      ownContentOnly: { type: Boolean, default: false },
      approvedContentOnly: { type: Boolean, default: false },
      departmentContentOnly: { type: Boolean, default: false }
    }
  }],
  permissionOverrides: [{
    collection: { 
      type: String, 
      enum: ['projects', 'blogs', 'news', 'careers', 'developers', 'plots', 'malls', 'communities', 'users', 'system'],
      required: true 
    },
    subRole: { 
      type: String, 
      enum: ['observer', 'contributor', 'moderator', 'collection_admin'],
      required: true 
    },
    customActions: [String],
    restrictions: {
      ownContentOnly: { type: Boolean, default: false },
      approvedContentOnly: { type: Boolean, default: false },
      departmentContentOnly: { type: Boolean, default: false }
    }
  }],
  
  // OLD SYSTEM (for backward compatibility)
  role: { 
    type: String, 
    enum: ['USER', 'ADMIN', 'SUPER_ADMIN'], 
    default: 'USER'
  },
  permissions: [String],
  
  // Profile fields
  department: String,
  phone: String,
  address: String,
  bio: String,
  profileImage: String,
  
  // Security fields
  loginAttempts: { type: Number, default: 0 },
  lastLogin: Date,
  lockedUntil: Date,
  
  // Audit fields
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const User = mongoose.model('EnhancedUser', userSchema, 'enhancedusers');

// All collections that super admin should have access to
const ALL_COLLECTIONS = [
  'projects', 'blogs', 'news', 'careers', 'developers', 
  'plots', 'malls', 'communities', 'users', 'system'
];

async function upgradeSuperAdmin() {
  try {
    console.log('🔍 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find the user that needs to be upgraded
    const targetEmail = 'afzal@noorsaray.com';
    
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
    console.log('Current Role (old):', user.role);
    console.log('Current Full Role (new):', user.fullRole);
    console.log('Current Status:', user.status);
    console.log('Current Collection Permissions:', user.collectionPermissions?.length || 0);

    console.log('\n🚀 Upgrading user to Super Admin with full permissions...');
    
    // Update to new permission system
    user.fullRole = 'super_admin';
    user.status = 'active';
    user.role = 'SUPER_ADMIN'; // Keep old field for compatibility
    
    // Create collection permissions for all collections with admin access
    user.collectionPermissions = ALL_COLLECTIONS.map(collection => ({
      collection: collection,
      subRole: 'collection_admin',
      customActions: [],
      restrictions: {
        ownContentOnly: false,
        approvedContentOnly: false,
        departmentContentOnly: false
      }
    }));
    
    // Clear any permission overrides (not needed for super admin)
    user.permissionOverrides = [];
    
    // Update audit fields
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
    console.log('Full Role:', updatedUser.fullRole);
    console.log('Status:', updatedUser.status);
    console.log('Collection Permissions:', updatedUser.collectionPermissions.length);
    
    console.log('\n📋 Collection Permissions Details:');
    updatedUser.collectionPermissions.forEach(permission => {
      console.log(`  - ${permission.collection}: ${permission.subRole}`);
    });

    console.log('\n🎉 Success! You now have full super admin permissions.');
    console.log('Please refresh your browser after logging in to see all admin features.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Also add a function to verify the upgrade worked
async function verifyUpgrade() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const user = await User.findOne({ email: 'afzal@noorsaray.com' });
    if (!user) {
      console.log('❌ User not found for verification');
      return;
    }
    
    console.log('\n🔍 VERIFICATION RESULTS:');
    console.log('Full Role:', user.fullRole);
    console.log('Status:', user.status);
    console.log('Has Collection Permissions:', user.collectionPermissions?.length > 0);
    
    // Check specific developer permission
    const developerPermission = user.collectionPermissions?.find(cp => cp.collection === 'developers');
    console.log('Developer Permission:', developerPermission ? 
      `${developerPermission.collection} -> ${developerPermission.subRole}` : 
      'NOT FOUND'
    );
    
    // Verify all collections are present
    console.log('Collections with permissions:', 
      user.collectionPermissions?.map(cp => cp.collection).join(', ') || 'NONE'
    );
    
  } catch (error) {
    console.error('Verification error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

// Run both upgrade and verification
async function main() {
  await upgradeSuperAdmin();
  console.log('\n⏳ Waiting 2 seconds before verification...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  await verifyUpgrade();
}

main();