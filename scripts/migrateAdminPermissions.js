// scripts/migrateAdminPermissions.js

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
      enum: ['projects', 'properties', 'blogs', 'news', 'careers', 'developers', 'plots', 'malls', 'buildings', 'communities', 'users', 'system'],
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
      enum: ['projects', 'properties', 'blogs', 'news', 'careers', 'developers', 'plots', 'malls', 'buildings', 'communities', 'users', 'system'],
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

// Collections for different roles
const SUPER_ADMIN_COLLECTIONS = [
  'projects', 'properties', 'blogs', 'news', 'careers', 'developers', 
  'plots', 'malls', 'buildings', 'communities', 'users', 'system'
];

const ADMIN_COLLECTIONS = [
  'projects', 'properties', 'blogs', 'news', 'careers', 'developers', 
  'plots', 'malls', 'buildings', 'communities', 'users'
]; // Note: 'system' is excluded for regular admins

async function migrateAdminPermissions() {
  try {
    console.log('🚀 Starting Admin Permissions Migration...\n');
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all users with admin or super_admin roles
    console.log('🔍 Finding all admin users...');
    const adminUsers = await User.find({ 
      fullRole: { $in: ['admin', 'super_admin'] },
      status: { $in: ['active', 'invited'] }
    });
    
    console.log(`Found ${adminUsers.length} admin users:\n`);
    
    if (adminUsers.length === 0) {
      console.log('No admin users found to migrate.');
      return;
    }

    // Show current users
    adminUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.displayName} (${user.email})`);
      console.log(`   Role: ${user.fullRole}`);
      console.log(`   Status: ${user.status}`);
      console.log(`   Current Collections: ${user.collectionPermissions?.length || 0}`);
      
      const collections = user.collectionPermissions?.map(p => p.collection) || [];
      const missingCollections = user.fullRole === 'super_admin' 
        ? SUPER_ADMIN_COLLECTIONS.filter(c => !collections.includes(c))
        : ADMIN_COLLECTIONS.filter(c => !collections.includes(c));
      
      if (missingCollections.length > 0) {
        console.log(`   Missing: ${missingCollections.join(', ')}`);
      } else {
        console.log(`   ✅ All collections present`);
      }
      console.log('');
    });

    console.log('📝 Starting migration process...\n');

    let updatedCount = 0;
    let skippedCount = 0;

    for (const user of adminUsers) {
      console.log(`Processing: ${user.displayName} (${user.email})`);
      
      // Get current collection permissions
      const currentCollections = user.collectionPermissions?.map(p => p.collection) || [];
      
      // Determine target collections based on role
      const targetCollections = user.fullRole === 'super_admin' 
        ? SUPER_ADMIN_COLLECTIONS 
        : ADMIN_COLLECTIONS;
      
      // Find missing collections
      const missingCollections = targetCollections.filter(c => !currentCollections.includes(c));
      
      if (missingCollections.length === 0) {
        console.log(`  ⏭️ Skipping - already has all required permissions\n`);
        skippedCount++;
        continue;
      }
      
      console.log(`  📋 Adding missing collections: ${missingCollections.join(', ')}`);
      
      // Create new permission objects for missing collections
      const newPermissions = missingCollections.map(collection => ({
        collection: collection,
        subRole: 'collection_admin',
        customActions: [],
        restrictions: {
          ownContentOnly: false,
          approvedContentOnly: false,
          departmentContentOnly: false
        }
      }));
      
      // Combine existing permissions with new ones
      const updatedCollectionPermissions = [
        ...(user.collectionPermissions || []),
        ...newPermissions
      ];
      
      // Update the user
      await User.updateOne(
        { _id: user._id },
        {
          $set: {
            collectionPermissions: updatedCollectionPermissions,
            updatedAt: new Date()
          }
        }
      );
      
      console.log(`  ✅ Updated successfully\n`);
      updatedCount++;
    }

    console.log('🎉 Migration completed!\n');
    console.log('📊 Summary:');
    console.log(`  Updated: ${updatedCount} users`);
    console.log(`  Skipped: ${skippedCount} users`);
    console.log(`  Total: ${adminUsers.length} users processed\n`);
    
    // Verify the migration
    console.log('🔍 Verifying migration results...\n');
    const updatedUsers = await User.find({ 
      fullRole: { $in: ['admin', 'super_admin'] },
      status: { $in: ['active', 'invited'] }
    });
    
    updatedUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.displayName} (${user.email})`);
      console.log(`   Role: ${user.fullRole}`);
      console.log(`   Collections: ${user.collectionPermissions?.length || 0}`);
      
      const collections = user.collectionPermissions?.map(p => p.collection) || [];
      const targetCollections = user.fullRole === 'super_admin' 
        ? SUPER_ADMIN_COLLECTIONS 
        : ADMIN_COLLECTIONS;
      
      const hasAllRequired = targetCollections.every(c => collections.includes(c));
      console.log(`   Status: ${hasAllRequired ? '✅ Complete' : '⚠️ Missing collections'}`);
      
      if (user.fullRole === 'admin' && collections.includes('system')) {
        console.log(`   ⚠️ WARNING: Admin has 'system' collection (should be super_admin only)`);
      }
      
      console.log('   Collections:', collections.join(', '));
      console.log('');
    });

    console.log('✨ All admin users now have proper collection permissions!');
    console.log('💡 Users should log out and log back in to see the changes.');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the migration
if (require.main === module) {
  migrateAdminPermissions().then(() => {
    console.log('\n🏁 Migration script completed successfully!');
    process.exit(0);
  }).catch((error) => {
    console.error('\n💥 Migration script failed:', error);
    process.exit(1);
  });
}

module.exports = { migrateAdminPermissions };