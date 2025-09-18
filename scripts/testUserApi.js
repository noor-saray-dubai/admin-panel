// scripts/testUserApi.js
// Test script for user creation and management APIs

const baseUrl = 'http://localhost:3000';

// Example 1: Create a new admin user
async function createAdminUser() {
  console.log('🚀 Creating Admin User...\n');
  
  const userData = {
    email: 'admin@noorsaray.com',
    displayName: 'Site Administrator',
    fullRole: 'admin', // FullRole.ADMIN
    status: 'active',
    department: 'IT',
    phoneNumber: '+1234567890',
    sendInvitation: true,
    collectionPermissions: [
      { collection: 'projects', subRole: 'admin' },
      { collection: 'blogs', subRole: 'admin' },
      { collection: 'news', subRole: 'admin' },
      { collection: 'careers', subRole: 'admin' },
      { collection: 'developers', subRole: 'editor' },
      { collection: 'plots', subRole: 'admin' },
      { collection: 'malls', subRole: 'admin' },
      { collection: 'users', subRole: 'editor' } // Can view/add/edit but not delete users
    ]
  };

  try {
    const response = await fetch(`${baseUrl}/api/users/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': '__session=your-session-cookie-here' // You need to get this from browser
      },
      body: JSON.stringify(userData)
    });

    const result = await response.json();
    console.log('✅ Admin User Created:', result);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Example 2: Create a regular user with limited permissions
async function createRegularUser() {
  console.log('🚀 Creating Regular User...\n');
  
  const userData = {
    email: 'editor@noorsaray.com',
    displayName: 'Content Editor',
    fullRole: 'user', // FullRole.USER
    status: 'invited',
    department: 'Marketing',
    sendInvitation: true,
    collectionPermissions: [
      { collection: 'blogs', subRole: 'editor' },      // Can view/add/edit blogs
      { collection: 'news', subRole: 'editor' },       // Can view/add/edit news
      { collection: 'careers', subRole: 'viewer' },    // Can only view careers
      { collection: 'projects', subRole: 'viewer' }    // Can only view projects
    ]
  };

  try {
    const response = await fetch(`${baseUrl}/api/users/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': '__session=your-session-cookie-here'
      },
      body: JSON.stringify(userData)
    });

    const result = await response.json();
    console.log('✅ Regular User Created:', result);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Example 3: Get form data (available roles, collections, etc.)
async function getFormData() {
  console.log('🚀 Getting Form Data...\n');
  
  try {
    const response = await fetch(`${baseUrl}/api/users/create`, {
      method: 'GET',
      headers: {
        'Cookie': '__session=your-session-cookie-here'
      }
    });

    const result = await response.json();
    console.log('✅ Form Data:', JSON.stringify(result.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Example 4: List all users
async function listUsers() {
  console.log('🚀 Listing Users...\n');
  
  try {
    const response = await fetch(`${baseUrl}/api/users/manage?page=1&limit=10&sortBy=createdAt&sortOrder=desc`, {
      method: 'GET',
      headers: {
        'Cookie': '__session=your-session-cookie-here'
      }
    });

    const result = await response.json();
    console.log('✅ Users:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Example 5: Update user
async function updateUser(firebaseUid) {
  console.log('🚀 Updating User...\n');
  
  const updates = {
    firebaseUid,
    updates: {
      status: 'active',
      department: 'Updated Department',
      collectionPermissions: [
        { collection: 'blogs', subRole: 'admin' }, // Promoted to admin for blogs
        { collection: 'news', subRole: 'editor' }
      ]
    }
  };

  try {
    const response = await fetch(`${baseUrl}/api/users/manage`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': '__session=your-session-cookie-here'
      },
      body: JSON.stringify(updates)
    });

    const result = await response.json();
    console.log('✅ User Updated:', result);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Example usage with curl commands (for testing)
console.log(`
📋 CURL COMMAND EXAMPLES:

1. Create Admin User:
curl -X POST "${baseUrl}/api/users/create" \\
  -H "Content-Type: application/json" \\
  -H "Cookie: __session=YOUR_SESSION_COOKIE" \\
  -d '{
    "email": "admin@noorsaray.com",
    "displayName": "Site Administrator", 
    "fullRole": "admin",
    "status": "active",
    "department": "IT",
    "sendInvitation": true,
    "collectionPermissions": [
      {"collection": "projects", "subRole": "admin"},
      {"collection": "blogs", "subRole": "admin"},
      {"collection": "users", "subRole": "editor"}
    ]
  }'

2. List Users:
curl -X GET "${baseUrl}/api/users/manage?page=1&limit=10" \\
  -H "Cookie: __session=YOUR_SESSION_COOKIE"

3. Update User:
curl -X PUT "${baseUrl}/api/users/manage" \\
  -H "Content-Type: application/json" \\
  -H "Cookie: __session=YOUR_SESSION_COOKIE" \\
  -d '{
    "firebaseUid": "USER_FIREBASE_UID",
    "updates": {
      "status": "active",
      "fullRole": "admin"
    }
  }'

4. Delete User:
curl -X DELETE "${baseUrl}/api/users/manage" \\
  -H "Content-Type: application/json" \\
  -H "Cookie: __session=YOUR_SESSION_COOKIE" \\
  -d '{
    "firebaseUid": "USER_FIREBASE_UID"
  }'

🔑 To get your session cookie:
1. Login to your admin panel
2. Open browser dev tools (F12)
3. Go to Application/Storage tab
4. Find the __session cookie value
5. Use that value in the Cookie header
`);

// For Node.js testing (uncomment to run)
// createAdminUser();
// createRegularUser(); 
// getFormData();
// listUsers();