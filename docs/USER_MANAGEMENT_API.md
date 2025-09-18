# User Management API Documentation

This document covers the comprehensive user management API endpoints for creating, updating, listing, and deleting users with role-based permissions.

## 🔗 API Endpoints

### 1. Create User - `POST /api/users/create`

Creates a new user with specified role and collection permissions.

#### Authentication Required
- **Session Cookie**: `__session` cookie must be present
- **Permission Required**: `users:add` - User must have ADD permission for USERS collection

#### Request Body
```json
{
  "email": "user@example.com",
  "displayName": "User Full Name",
  "fullRole": "admin", // "user" | "admin" | "super_admin"
  "collectionPermissions": [
    {
      "collection": "blogs", // Collection name
      "subRole": "admin"     // "viewer" | "editor" | "admin"
    }
  ],
  "status": "active",        // Optional: "invited" | "active" | "suspended"
  "department": "IT",        // Optional
  "phoneNumber": "+1234567890", // Optional
  "sendInvitation": true     // Optional: default true
}
```

#### Collection Names
- `projects`
- `blogs`  
- `news`
- `careers`
- `developers`
- `plots`
- `malls`
- `communities`
- `users`
- `system`

#### Sub-Roles and Permissions
- **`viewer`**: Can only view/read data
- **`editor`**: Can view, add, and edit data
- **`admin`**: Can view, add, edit, and delete data

#### Response
```json
{
  "success": true,
  "user": {
    "firebaseUid": "abc123...",
    "email": "user@example.com",
    "displayName": "User Full Name",
    "fullRole": "admin",
    "status": "active",
    "invitationSent": true
  },
  "message": "User created successfully"
}
```

### 2. Get Form Data - `GET /api/users/create`

Returns available options for user creation form.

#### Response
```json
{
  "success": true,
  "data": {
    "fullRoles": ["user", "admin", "super_admin"],
    "collections": ["projects", "blogs", "news", ...],
    "subRoles": ["viewer", "editor", "admin"],
    "userStatuses": ["invited", "active", "suspended"],
    "roleHierarchy": {
      "user": { "level": 1, "description": "..." },
      "admin": { "level": 2, "description": "..." },
      "super_admin": { "level": 3, "description": "..." }
    }
  }
}
```

### 3. List Users - `GET /api/users/manage`

Retrieves users with pagination, filtering, and sorting.

#### Query Parameters
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `sortBy`: Field to sort by (default: createdAt)
- `sortOrder`: asc | desc (default: desc)
- `status`: Filter by status
- `role`: Filter by full role
- `search`: Search in name, email, department

#### Example Request
```
GET /api/users/manage?page=1&limit=10&status=active&search=admin
```

#### Response
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "firebaseUid": "abc123...",
      "email": "user@example.com",
      "displayName": "User Name",
      "fullRole": "admin",
      "status": "active",
      "collectionPermissions": [...],
      "department": "IT",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "lastLogin": "2023-01-02T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### 4. Update User - `PUT /api/users/manage`

Updates existing user properties.

#### Request Body
```json
{
  "firebaseUid": "abc123...",
  "updates": {
    "displayName": "Updated Name",     // Optional
    "fullRole": "admin",              // Optional
    "status": "active",               // Optional
    "collectionPermissions": [...],   // Optional
    "department": "Marketing",        // Optional
    "phoneNumber": "+9876543210"      // Optional
  }
}
```

#### Response
```json
{
  "success": true,
  "message": "User updated successfully",
  "user": {
    "firebaseUid": "abc123...",
    "email": "user@example.com",
    "displayName": "Updated Name",
    "fullRole": "admin",
    "status": "active",
    "collectionPermissions": [...]
  }
}
```

### 5. Delete User - `DELETE /api/users/manage`

Permanently deletes a user from both Firebase and MongoDB.

#### Request Body
```json
{
  "firebaseUid": "abc123..."
}
```

#### Response
```json
{
  "success": true,
  "message": "User John Doe deleted successfully"
}
```

## 🔐 Security & Role Hierarchy

### Role Levels
1. **User** (Level 1): Basic access
2. **Admin** (Level 2): Broad administrative access  
3. **Super Admin** (Level 3): Full system access

### Security Rules
- Users can only create/edit/delete users with **lower** roles than themselves
- Super Admins can manage Admins and Users
- Admins can manage Users only
- Users cannot manage other users (unless given specific permissions)
- Users cannot delete themselves
- All actions are logged in audit trail

### Permission Checks
- **Create**: Requires `users:add` permission
- **View**: Requires `users:view` permission
- **Edit**: Requires `users:edit` permission  
- **Delete**: Requires `users:delete` permission

## 🔧 Error Responses

### Common Error Formats
```json
{
  "success": false,
  "error": "Error message",
  "details": "Detailed error information"
}
```

### HTTP Status Codes
- `200`: Success
- `201`: Created successfully
- `400`: Bad request / validation error
- `401`: Authentication required
- `403`: Insufficient permissions
- `404`: User not found
- `409`: User already exists
- `500`: Server error

## 📝 Usage Examples

### Using cURL

#### Create Admin User
```bash
curl -X POST "http://localhost:3000/api/users/create" \
  -H "Content-Type: application/json" \
  -H "Cookie: __session=YOUR_SESSION_COOKIE" \
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
```

#### List Users
```bash
curl -X GET "http://localhost:3000/api/users/manage?page=1&limit=10" \
  -H "Cookie: __session=YOUR_SESSION_COOKIE"
```

### Using JavaScript (Frontend)

#### Create User
```javascript
const createUser = async (userData) => {
  try {
    const response = await fetch('/api/users/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData)
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('User created:', result.user);
    } else {
      console.error('Error:', result.error);
    }
  } catch (error) {
    console.error('Network error:', error);
  }
};
```

#### List Users with Filters
```javascript
const listUsers = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  
  try {
    const response = await fetch(`/api/users/manage?${params}`);
    const result = await response.json();
    
    if (result.success) {
      console.log('Users:', result.data);
      console.log('Pagination:', result.pagination);
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

// Usage
listUsers({
  page: 1,
  limit: 10,
  status: 'active',
  search: 'admin'
});
```

## 🔄 Integration with Frontend Components

### With React Hook
```jsx
import { useEnhancedAuth } from '@/hooks/useEnhancedAuth';

function UserManagement() {
  const { canCreateUsers, canManageUsers } = useEnhancedAuth();
  
  if (!canCreateUsers()) {
    return <div>Access denied</div>;
  }
  
  // Your user management UI here
}
```

### With Permission Guard
```jsx
import { PermissionGuard } from '@/hooks/useEnhancedAuth';
import { Collection, Action } from '@/models/enhancedUser';

function UserList() {
  return (
    <PermissionGuard 
      collection={Collection.USERS} 
      action={Action.VIEW}
    >
      {/* User list component */}
    </PermissionGuard>
  );
}
```

## 📊 Audit Logging

All user management actions are automatically logged with:
- Action performed (create, update, delete)
- User who performed the action
- Target user affected
- Timestamp and IP address
- Detailed changes made
- Success/failure status

## 🚀 Best Practices

1. **Always validate permissions** on both frontend and backend
2. **Use role hierarchy** - don't assign higher roles than necessary
3. **Send invitations** for new users instead of sharing temporary passwords
4. **Monitor audit logs** for security compliance
5. **Test role changes** in development before applying to production
6. **Use descriptive display names** and departments for better user management

## 🔧 Testing

Use the provided test script:
```bash
node scripts/testUserApi.js
```

Or test individual endpoints using the curl examples provided above.

Remember to replace `YOUR_SESSION_COOKIE` with your actual session cookie value obtained from the browser after logging in.