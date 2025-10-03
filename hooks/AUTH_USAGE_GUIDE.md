# 🔥 **UNIFIED useAuth HOOK - COMPLETE GUIDE**

## 🎯 **ONE HOOK FOR EVERYTHING**

The `useAuth` hook provides **everything** you need for authentication and permissions in a single call.

## 📝 **Basic Usage**

```typescript
import { useAuth, SystemCapability, CollectionCapability, Collection } from '@/hooks/useAuth';

function MyComponent() {
  const { 
    user,                    // Current user data
    loading,                 // Loading state
    isSystemAdmin,           // System admin check
    hasCollectionCapability, // Collection permission check
    canAccessNav,           // Navigation access
    signOut                 // Sign out function
  } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Please login</div>;

  return (
    <div>
      <h1>Welcome {user.displayName}</h1>
      
      {isSystemAdmin() && (
        <AdminPanel />
      )}
      
      {hasCollectionCapability(Collection.BLOGS, CollectionCapability.EDIT_CONTENT) && (
        <EditBlogButton />
      )}
      
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

## 🛡️ **SECURITY FUNCTIONS**

### **System-Level Security** (Only True System Admins)

```typescript
const {
  hasSystemCapability,      // Check specific system capability
  isSystemAdmin,            // Is true system admin?
  isSuperAdmin,            // Is super admin?
  canManageUsers,          // Can manage other users?
  canManageRoles,          // Can change user roles?
  canAccessSystemSettings, // Can access system settings?
  canViewAuditTrail,       // Can view audit logs?
} = useAuth();

// Examples
if (canManageUsers()) {
  // Show user management UI
}

if (hasSystemCapability(SystemCapability.MANAGE_USERS)) {
  // Show specific system capability UI
}
```

### **Collection-Level Security** (Content Specific)

```typescript
const {
  hasCollectionCapability,        // Check collection permission
  getUserSubRoleForCollection,    // Get sub-role for collection
  getUserAccessibleCollections,   // Get all accessible collections
} = useAuth();

// Examples
if (hasCollectionCapability(Collection.BLOGS, CollectionCapability.CREATE_CONTENT)) {
  // Show create blog button
}

if (hasCollectionCapability(Collection.PROJECTS, CollectionCapability.MANAGE_COLLECTION)) {
  // Show project management UI
}

const blogSubRole = getUserSubRoleForCollection(Collection.BLOGS);
const accessibleCollections = getUserAccessibleCollections();
```

## 🧭 **NAVIGATION & UI**

```typescript
const {
  canAccessNav,           // Can access navigation item?
  getAccessibleNavItems, // Get all accessible nav items
} = useAuth();

// Examples
{canAccessNav('blogs') && <NavLink href="/blogs">Blogs</NavLink>}
{canAccessNav('users') && <NavLink href="/users">Users</NavLink>}

// Dynamic navigation
const navItems = getAccessibleNavItems();
```

## 👤 **USER STATUS**

```typescript
const {
  isActive,      // Account is active?
  isInvited,     // Account is invited?
  isSuspended,   // Account is suspended?
  hasRole,       // Has specific role?
  hasAnyRole,    // Has any of roles?
} = useAuth();

// Examples
if (!isActive()) {
  return <div>Account not activated</div>;
}

if (hasRole(FullRole.MARKETING)) {
  // Marketing specific UI
}

if (hasAnyRole([FullRole.ADMIN, FullRole.SUPER_ADMIN])) {
  // Admin UI
}
```

## 🔒 **PERMISSION GUARDS**

### **Component-Level Protection**

```typescript
import { PermissionGuard, SystemCapability, CollectionCapability, Collection } from '@/hooks/useAuth';

// System capability guard
<PermissionGuard 
  systemCapability={SystemCapability.MANAGE_USERS}
  fallback={<div>No access</div>}
>
  <UserManagementPanel />
</PermissionGuard>

// Collection capability guard
<PermissionGuard 
  collectionCapability={{
    collection: Collection.BLOGS, 
    capability: CollectionCapability.EDIT_CONTENT
  }}
>
  <EditBlogForm />
</PermissionGuard>

// Role guard
<PermissionGuard 
  role={FullRole.MARKETING}
  requireActive={true}
>
  <MarketingDashboard />
</PermissionGuard>

// System admin guard
<PermissionGuard requireSystemAdmin>
  <SystemSettings />
</PermissionGuard>
```

### **Navigation Guards**

```typescript
import { NavGuard } from '@/hooks/useAuth';

<NavGuard navItem="blogs">
  <NavLink href="/blogs">Blogs</NavLink>
</NavGuard>

<NavGuard navItem="users" fallback={null}>
  <NavLink href="/users">User Management</NavLink>
</NavGuard>
```

## 🔧 **HIGHER-ORDER COMPONENTS**

```typescript
import { 
  withSystemAdmin, 
  withSuperAdmin, 
  withSystemCapability, 
  withCollectionCapability,
  withRole 
} from '@/hooks/useAuth';

// System admin only component
const AdminOnlyComponent = withSystemAdmin(MyComponent);

// Super admin only component
const SuperAdminOnlyComponent = withSuperAdmin(MyComponent);

// Specific capability required
const UserManagerComponent = withSystemCapability(
  MyComponent, 
  SystemCapability.MANAGE_USERS
);

// Collection capability required
const BlogEditorComponent = withCollectionCapability(
  MyComponent,
  Collection.BLOGS,
  CollectionCapability.EDIT_CONTENT
);

// Role required
const MarketingComponent = withRole(MyComponent, FullRole.MARKETING);
```

## ✨ **REAL-WORLD EXAMPLES**

### **Dynamic Sidebar**

```typescript
function Sidebar() {
  const { getAccessibleNavItems, canAccessNav } = useAuth();
  
  const allNavItems = [
    { key: 'dashboard', label: 'Dashboard', href: '/' },
    { key: 'projects', label: 'Projects', href: '/projects' },
    { key: 'blogs', label: 'Blogs', href: '/blogs' },
    { key: 'users', label: 'Users', href: '/users' },
    { key: 'settings', label: 'Settings', href: '/settings' },
  ];

  return (
    <nav>
      {allNavItems.map(item => (
        <NavGuard key={item.key} navItem={item.key as NavigationItem}>
          <NavLink href={item.href}>{item.label}</NavLink>
        </NavGuard>
      ))}
    </nav>
  );
}
```

### **Conditional Content**

```typescript
function BlogPost({ blog }) {
  const { hasCollectionCapability, getUserSubRoleForCollection } = useAuth();
  
  const canEdit = hasCollectionCapability(Collection.BLOGS, CollectionCapability.EDIT_CONTENT);
  const canDelete = hasCollectionCapability(Collection.BLOGS, CollectionCapability.DELETE_CONTENT);
  const canModerate = hasCollectionCapability(Collection.BLOGS, CollectionCapability.MODERATE_CONTENT);
  const userRole = getUserSubRoleForCollection(Collection.BLOGS);
  
  return (
    <div>
      <h1>{blog.title}</h1>
      <p>{blog.content}</p>
      
      <div className="actions">
        {canEdit && <EditButton blog={blog} />}
        {canDelete && <DeleteButton blog={blog} />}
        {canModerate && <ApproveButton blog={blog} />}
      </div>
      
      <div className="user-info">
        Your role in blogs: {userRole}
      </div>
    </div>
  );
}
```

### **User Management Page**

```typescript
function UserManagement() {
  const { canManageUsers, hasSystemCapability, isSystemAdmin } = useAuth();
  
  if (!canManageUsers()) {
    return <div>You don't have permission to manage users</div>;
  }
  
  return (
    <div>
      <h1>User Management</h1>
      
      <UserList />
      
      {hasSystemCapability(SystemCapability.MANAGE_ROLES) && (
        <RoleManagement />
      )}
      
      {isSystemAdmin() && (
        <SystemAdminPanel />
      )}
    </div>
  );
}
```

## 🚀 **MIGRATION FROM OLD HOOKS**

### **From useAuth (old)**

```typescript
// ❌ OLD WAY
const { user, isAdmin, hasPermission } = useAuth();
if (isAdmin()) { /* DANGEROUS! */ }

// ✅ NEW WAY  
const { user, isSystemAdmin, hasSystemCapability } = useAuth();
if (isSystemAdmin()) { /* SECURE! */ }
if (hasSystemCapability(SystemCapability.MANAGE_USERS)) { /* SPECIFIC! */ }
```

### **From useEnhancedAuth**

```typescript
// ❌ OLD WAY
const { user, isAdmin, hasCollectionPermission } = useEnhancedAuth();

// ✅ NEW WAY
const { user, isSystemAdmin, hasCollectionCapability } = useAuth();
```

### **From usePermissions**

```typescript
// ❌ OLD WAY
const { hasSystemCapability } = usePermissions();
const { user } = useAuth(); // Two hooks!

// ✅ NEW WAY
const { user, hasSystemCapability } = useAuth(); // One hook!
```

## ⚡ **PERFORMANCE OPTIMIZATIONS**

- ✅ **Deduplication**: API calls are automatically deduplicated
- ✅ **Memoization**: All permission checks are memoized
- ✅ **Single Hook**: No need for multiple auth hooks
- ✅ **Efficient Re-renders**: Only re-renders when user changes

## 🔒 **SECURITY GUARANTEES**

- ✅ **Zero Trust**: Uses ZeroTrust security system
- ✅ **No Privilege Escalation**: Collection admins cannot become system admins
- ✅ **Type Safe**: Full TypeScript support
- ✅ **Server Verified**: All permissions verified on server

---

**🎉 You now have ONE HOOK for all your auth needs! No more juggling multiple hooks or worrying about security vulnerabilities.**