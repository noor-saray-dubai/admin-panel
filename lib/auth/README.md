# 🔐 Enhanced Auth System - Usage Guide

This is your comprehensive authentication and authorization system that works seamlessly across both client and server environments.

## 🚀 Quick Start

### Client-Side Usage

```typescript
import { useEnhancedAuth, PermissionGuard, NavGuard } from '@/hooks/useEnhancedAuth';
import { Collection, Action, FullRole } from '@/models/enhancedUser';

function MyComponent() {
  const { 
    user, 
    hasCollectionPermission, 
    isAdmin, 
    canAccessNav 
  } = useEnhancedAuth();

  return (
    <div>
      {/* Simple permission check */}
      {hasCollectionPermission(Collection.BLOGS, Action.EDIT) && (
        <button>Edit Blog</button>
      )}

      {/* Component-level permission guard */}
      <PermissionGuard 
        collection={Collection.BLOGS} 
        action={Action.ADD}
        fallback={<div>No access to create blogs</div>}
      >
        <CreateBlogForm />
      </PermissionGuard>

      {/* Admin-only content */}
      <PermissionGuard requireAdmin>
        <AdminPanel />
      </PermissionGuard>

      {/* Navigation guard */}
      <NavGuard navItem="blogs">
        <Link href="/blogs">Blogs</Link>
      </NavGuard>
    </div>
  );
}
```

### Server-Side API Protection

```typescript
// app/api/blogs/route.ts
import { withCollectionPermission, withAdmin } from '@/lib/auth/authChecker';
import { Collection, Action } from '@/models/enhancedUser';

// Protect with specific permission
export const POST = withCollectionPermission(Collection.BLOGS, Action.ADD)(
  async (request: NextRequest) => {
    const user = (request as any).user; // User is automatically attached
    
    // User is guaranteed to have ADD permission for BLOGS
    // ... handle blog creation
    
    return Response.json({ success: true });
  }
);

// Protect with admin requirement
export const DELETE = withAdmin(async (request: NextRequest) => {
  const user = (request as any).user; // User is guaranteed to be admin
  
  // ... handle deletion
  
  return Response.json({ success: true });
});
```

## 🎯 Permission System Overview

### Full Roles (Collection Scope)
Defines which collections a user can access:

```typescript
FullRole.SUPER_ADMIN  → All collections
FullRole.ADMIN        → Most collections (can't manage system)
FullRole.MARKETING    → [BLOGS, NEWS] 
FullRole.SALES        → [PLOTS, MALLS]
FullRole.HR           → [CAREERS, DEVELOPERS]
FullRole.AGENT        → [PROJECTS]
FullRole.USER         → [PROJECTS] (read-only)
```

### Sub-Roles (Action Scope)
Defines what actions can be performed on collections:

```typescript
SubRole.ADMIN         → All actions [VIEW, ADD, EDIT, DELETE, APPROVE, REJECT, PUBLISH, etc.]
SubRole.MANAGER       → [VIEW, ADD, EDIT, APPROVE, REJECT, PUBLISH, UNPUBLISH]
SubRole.MODERATOR     → [VIEW, ADD, EDIT, APPROVE, REJECT]
SubRole.EDITOR        → [VIEW, ADD, EDIT]
SubRole.CONTRIBUTOR   → [VIEW, ADD]
SubRole.OBSERVER      → [VIEW]
```

### How Permissions Work

```typescript
// User has Marketing role with Editor sub-role on Blogs
user.collectionPermissions = [
  { collection: Collection.BLOGS, subRole: SubRole.EDITOR }, // Can VIEW, ADD, EDIT blogs
  { collection: Collection.NEWS, subRole: SubRole.OBSERVER }, // Can only VIEW news
]

// Permission checks
user.hasCollectionPermission(Collection.BLOGS, Action.EDIT)   // ✅ true
user.hasCollectionPermission(Collection.BLOGS, Action.DELETE) // ❌ false
user.hasCollectionPermission(Collection.NEWS, Action.VIEW)    // ✅ true
user.hasCollectionPermission(Collection.NEWS, Action.ADD)     // ❌ false
```

## 🛠️ Client-Side API

### useEnhancedAuth Hook

```typescript
const {
  // User data
  user,           // Combined Firebase + MongoDB user
  mongoUser,      // MongoDB user data only
  loading,        // Loading state
  
  // Auth methods
  signOut,        // Sign out function
  refreshUserData, // Refresh user data from server
  
  // Permission checking
  hasCollectionPermission,    // (collection, action) => boolean
  getUserSubRoleForCollection, // (collection) => SubRole | null
  getUserActionsForCollection, // (collection) => Action[]
  getAccessibleCollections,   // () => Collection[]
  
  // Role checking
  hasRole,        // (role) => boolean
  hasAnyRole,     // (roles[]) => boolean
  isAdmin,        // () => boolean
  isSuperAdmin,   // () => boolean
  
  // User management
  canCreateUsers, // () => boolean
  canManageUsers, // () => boolean
  
  // Navigation
  canAccessNav,   // (navItem) => boolean
  getAccessibleNavItems, // () => NavigationItem[]
  
  // Status checks
  isActive,       // () => boolean
  isInvited,      // () => boolean
  isSuspended,    // () => boolean
} = useEnhancedAuth();
```

### Permission Guards

```typescript
// Basic permission guard
<PermissionGuard 
  collection={Collection.BLOGS} 
  action={Action.EDIT}
  fallback={<AccessDenied />}
>
  <EditButton />
</PermissionGuard>

// Role-based guard
<PermissionGuard 
  role={FullRole.ADMIN}
  fallback={<div>Admin only</div>}
>
  <AdminSettings />
</PermissionGuard>

// Multiple requirements
<PermissionGuard 
  collection={Collection.USERS} 
  action={Action.ADD}
  requireActive={true}
  fallback={<div>Cannot create users</div>}
>
  <CreateUserButton />
</PermissionGuard>

// Navigation guard
<NavGuard navItem="blogs" fallback={null}>
  <NavLink href="/blogs">Blogs</NavLink>
</NavGuard>
```

## 🔧 Server-Side API

### Route Protection HOCs

```typescript
// Basic auth requirement
export const GET = withAuth(async (request) => {
  const user = request.user; // User is attached
  return Response.json({ user: user.displayName });
});

// Role-based protection
export const POST = withRole(FullRole.ADMIN)(async (request) => {
  // Only admins can access
  return Response.json({ message: "Admin only endpoint" });
});

// Collection permission protection
export const PUT = withCollectionPermission(Collection.BLOGS, Action.EDIT)(
  async (request) => {
    // User guaranteed to have EDIT permission on BLOGS
    return Response.json({ success: true });
  }
);

// Multiple protection levels
export const DELETE = withSuperAdmin(async (request) => {
  // Only super admin can delete
  return Response.json({ success: true });
});
```

### Direct Server Auth Checks

```typescript
import { ServerAuth, AuthChecker } from '@/lib/auth/authChecker';

export async function POST(request: NextRequest) {
  // Get authenticated user
  const authResult = await ServerAuth.getAuthenticatedUser(request);
  
  if (authResult.error) {
    return Response.json({ error: authResult.error }, { status: authResult.status });
  }
  
  const { user } = authResult;
  
  // Check permissions directly
  if (!AuthChecker.userHasCollectionPermission(user, Collection.BLOGS, Action.ADD)) {
    return Response.json({ error: "No permission" }, { status: 403 });
  }
  
  // User has permission, proceed...
  return Response.json({ success: true });
}
```

## 🎨 UI Patterns

### Dynamic Navigation

```typescript
function Sidebar() {
  const { getAccessibleNavItems, canAccessNav } = useEnhancedAuth();
  
  const navItems = [
    { key: 'dashboard', label: 'Dashboard', href: '/' },
    { key: 'projects', label: 'Projects', href: '/projects' },
    { key: 'blogs', label: 'Blogs', href: '/blogs' },
    { key: 'users', label: 'Users', href: '/users' },
  ];
  
  return (
    <nav>
      {navItems.map(item => (
        <NavGuard key={item.key} navItem={item.key as NavigationItem}>
          <NavLink href={item.href}>{item.label}</NavLink>
        </NavGuard>
      ))}
    </nav>
  );
}
```

### Conditional UI Elements

```typescript
function BlogPost({ blog }) {
  const { hasCollectionPermission, getUserSubRoleForCollection } = useEnhancedAuth();
  
  const canEdit = hasCollectionPermission(Collection.BLOGS, Action.EDIT);
  const canApprove = hasCollectionPermission(Collection.BLOGS, Action.APPROVE);
  const subRole = getUserSubRoleForCollection(Collection.BLOGS);
  
  return (
    <div>
      <h1>{blog.title}</h1>
      <p>{blog.content}</p>
      
      <div className="actions">
        {canEdit && <EditButton blog={blog} />}
        {canApprove && <ApproveButton blog={blog} />}
        
        <div className="role-info">
          Your role: {subRole}
        </div>
      </div>
    </div>
  );
}
```

### Permission-Based Forms

```typescript
function UserForm() {
  const { canCreateUsers, isAdmin, getUserActionsForCollection } = useEnhancedAuth();
  
  if (!canCreateUsers()) {
    return <div>You cannot create users</div>;
  }
  
  const userActions = getUserActionsForCollection(Collection.USERS);
  
  return (
    <form>
      <input name="email" required />
      <input name="displayName" required />
      
      {isAdmin() && (
        <select name="role">
          <option value="user">User</option>
          <option value="marketing">Marketing</option>
          <option value="sales">Sales</option>
        </select>
      )}
      
      {userActions.includes(Action.EDIT) && (
        <fieldset>
          <legend>Advanced Options</legend>
          {/* Admin-specific fields */}
        </fieldset>
      )}
    </form>
  );
}
```

## 🔒 Security Best Practices

### 1. Always Validate on Server
Never trust client-side permission checks alone:

```typescript
// ✅ Good - Server validation
export const POST = withCollectionPermission(Collection.BLOGS, Action.ADD)(
  async (request) => {
    // Server has already validated permission
    return createBlog(request.body);
  }
);

// ❌ Bad - Client-only validation
function CreateBlog() {
  const { hasCollectionPermission } = useEnhancedAuth();
  
  // This can be bypassed!
  if (!hasCollectionPermission(Collection.BLOGS, Action.ADD)) {
    return null;
  }
  
  // Direct API call without server validation
  fetch('/api/blogs', { method: 'POST' });
}
```

### 2. Use Granular Permissions
Check specific actions, not just access:

```typescript
// ✅ Good - Specific permission
<PermissionGuard collection={Collection.BLOGS} action={Action.DELETE}>
  <DeleteButton />
</PermissionGuard>

// ❌ Bad - Too broad
<PermissionGuard role={FullRole.MARKETING}>
  <DeleteButton /> {/* Marketing users shouldn't delete! */}
</PermissionGuard>
```

### 3. Handle Loading States
Always show loading states:

```typescript
function ProtectedContent() {
  const { hasCollectionPermission, loading } = useEnhancedAuth();
  
  if (loading) {
    return <Skeleton />; // Don't flash content
  }
  
  return hasCollectionPermission(Collection.BLOGS, Action.VIEW) ? (
    <BlogList />
  ) : (
    <AccessDenied />
  );
}
```

## 🧪 Testing

```typescript
// Mock the auth hook for testing
jest.mock('@/hooks/useEnhancedAuth', () => ({
  useEnhancedAuth: () => ({
    user: mockUser,
    hasCollectionPermission: jest.fn(() => true),
    isAdmin: jest.fn(() => false),
    loading: false,
  }),
}));
```

---

**This system gives you industrial-level security with maximum flexibility! 🔥**