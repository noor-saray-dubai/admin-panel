// scripts/upgrade-super-admin.js

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Enhanced User Schema - matching your current model
const userSchema = new mongoose.Schema({
  firebaseUid: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  displayName: { type: String, required: true },
  
  // Permission system
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
      enum: ['projects', 'blogs', 'news', 'careers', 'developers', 'plots', 'malls', 'buildings', 'communities', 'users', 'system'],
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
      enum: ['projects', 'blogs', 'news', 'careers', 'developers', 'plots', 'malls', 'buildings', 'communities', 'users', 'system'],
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
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'EnhancedUser' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'EnhancedUser' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'EnhancedUser' }
});

const User = mongoose.model('EnhancedUser', userSchema, 'enhancedusers');

// All collections including buildings
const ALL_COLLECTIONS = [
  'projects', 'blogs', 'news', 'careers', 'developers', 
  'plots', 'malls', 'buildings', 'communities', 'users', 'system'
];

async function upgradeSuperAdmin() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const targetEmail = 'afzal@noorsaray.com';
    
    console.log(`\nLooking for user: ${targetEmail}`);
    const user = await User.findOne({ email: targetEmail });
    
    if (!user) {
      console.log(`User ${targetEmail} not found!`);
      return;
    }

    console.log('\nCurrent user details:');
    console.log('ID:', user._id);
    console.log('Firebase UID:', user.firebaseUid);
    console.log('Email:', user.email);
    console.log('Display Name:', user.displayName);
    console.log('Current Full Role:', user.fullRole);
    console.log('Current Status:', user.status);
    console.log('Current Collection Permissions:', user.collectionPermissions?.length || 0);

    console.log('\nUpgrading to Super Admin with full permissions...');
    
    // Use direct update to bypass middleware
    await User.updateOne(
      { email: targetEmail },
      {
        $set: {
          fullRole: 'super_admin',
          status: 'active',
          collectionPermissions: ALL_COLLECTIONS.map(collection => ({
            collection: collection,
            subRole: 'collection_admin',
            customActions: [],
            restrictions: {
              ownContentOnly: false,
              approvedContentOnly: false,
              departmentContentOnly: false
            }
          })),
          permissionOverrides: [],
          updatedAt: new Date()
        }
      }
    );

    console.log('User successfully upgraded to Super Admin!');
    
    // Verify the upgrade
    const updatedUser = await User.findById(user._id);
    console.log('\nUpdated user details:');
    console.log('ID:', updatedUser._id);
    console.log('Firebase UID:', updatedUser.firebaseUid);
    console.log('Email:', updatedUser.email);
    console.log('Display Name:', updatedUser.displayName);
    console.log('Full Role:', updatedUser.fullRole);
    console.log('Status:', updatedUser.status);
    console.log('Collection Permissions:', updatedUser.collectionPermissions.length);
    
    console.log('\nCollection Permissions Details:');
    updatedUser.collectionPermissions.forEach(permission => {
      console.log(`  - ${permission.collection}: ${permission.subRole}`);
    });

    console.log('\nSuccess! You now have full super admin permissions.');
    console.log('Please log out and log back in to see the changes.');

  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

upgradeSuperAdmin();