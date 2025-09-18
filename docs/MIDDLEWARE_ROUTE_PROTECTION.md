# 🛡️ Middleware-Based Route Protection

## Overview
The enhanced middleware provides **server-side route protection** based on user roles, eliminating the need for client-side permission checks and providing a more secure access control system.

## 🔧 How It Works

### 1. **Middleware Protection Flow**
```
Request → Middleware → Role Check → MongoDB User Lookup → Route Decision
```

### 2. **Route Categories**

#### 🟢 **Public Routes** (No Authentication Required)
- `/login` - Login page
- `/api/*` - All API routes (have their own protection)
- `/_next/*` - Next.js static files
- `/favicon.ico` - Favicon
- `/forbidden` - Access denied page

#### 🟡 **Protected Routes** (Authentication Required)
- `/dashboard/*` - All dashboard pages
- `/profile` - User profile
- `/settings` - General settings

#### 🔴 **Admin-Only Routes** (Admin/Super Admin Only)
- `/dashboard/users` - User management page

## 🔐 Security Features

### **Server-Side Validation**
```typescript
// Middleware verifies session cookie
const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);

// Fetches user from MongoDB
const user = await EnhancedUser.findOne({ firebaseUid }).lean();

// Checks role permissions
const isAdmin = [FullRole.ADMIN, FullRole.SUPER_ADMIN].includes(user.fullRole);
```

### **Automatic Redirects**
- ❌ **Insufficient Role** → `/forbidden?reason=insufficient_role`
- ❌ **User Not Found** → `/forbidden?reason=user_not_found` 
- ❌ **Auth Error** → `/forbidden?reason=auth_error`
- ❌ **No Session** → `/login`

## 📊 Role-Based Access Matrix

| Route | User | Agent/Marketing/Sales/HR | Admin | Super Admin |
|-------|------|-------------------------|--------|-------------|
| `/dashboard` | ✅ | ✅ | ✅ | ✅ |
| `/dashboard/users` | ❌ | ❌ | ✅ | ✅ |

## 🎯 Benefits

### **1. Server-Side Security**
- Routes are protected at the server level
- No client-side bypassing possible
- Unauthorized users never see the page content

### **2. Better User Experience**
- Clear error messages with specific reasons
- Professional forbidden page design
- Easy navigation back to allowed areas

### **3. Performance**
- No client-side permission loading states
- Immediate access control decisions
- Reduced client-side JavaScript

### **4. SEO & Security**
- Protected content not accessible to crawlers
- No sensitive page content in HTML for unauthorized users
- Server-side rendering respects access control

## 🚀 Implementation Details

### **Middleware Configuration**
```typescript
// Admin-only routes are defined in middleware
const adminOnlyRoutes = ["/dashboard/users"];

// Easily extensible for more admin routes
// const adminOnlyRoutes = [
//   "/dashboard/users",
//   "/dashboard/audit-logs", 
//   "/dashboard/system-config"
// ];
```

### **Error Page Integration**
The `/forbidden` page handles different error scenarios:

- **`insufficient_role`** - User doesn't have admin privileges
- **`user_not_found`** - MongoDB user profile missing
- **`auth_error`** - Session verification failed

### **Navigation Integration**
The sidebar automatically shows/hides navigation items based on user permissions:

```typescript
// Sidebar already uses getAccessibleCollections()
// Users menu only appears for admins/super admins
[Collection.USERS]: { 
  name: "Users", 
  href: "/dashboard/users", 
  icon: Users, 
  collection: Collection.USERS 
}
```

## 📋 Adding New Protected Routes

### **1. For Admin-Only Routes:**
```typescript
// In middleware.ts
const adminOnlyRoutes = [
  "/dashboard/users",
  "/dashboard/your-new-admin-route" // Add here
];
```

### **2. For Role-Specific Routes:**
```typescript
// Add to middleware with custom role check
if (pathname.startsWith('/dashboard/hr') && user.fullRole !== FullRole.HR) {
  return NextResponse.redirect(new URL("/forbidden?reason=insufficient_role", request.url));
}
```

### **3. For Collection-Based Routes:**
```typescript
// Check collection permissions
const hasAccess = user.collectionPermissions.some(p => 
  p.collection === Collection.YOUR_COLLECTION
);

if (!hasAccess) {
  return NextResponse.redirect(new URL("/forbidden", request.url));
}
```

## 🧪 Testing Route Protection

### **Test Cases:**

1. **Super Admin Access** ✅
   - Should see Users menu in sidebar
   - Should access `/dashboard/users` successfully
   - Should see all user management features

2. **Regular Admin Access** ✅
   - Should see Users menu in sidebar  
   - Should access `/dashboard/users` successfully
   - Should NOT see super admin features (like delete)

3. **Non-Admin Access** ❌
   - Should NOT see Users menu in sidebar
   - Should be redirected to `/forbidden` when accessing `/dashboard/users`
   - Should see "Insufficient Permissions" error

4. **Unauthenticated Access** ❌
   - Should be redirected to `/login`
   - Should not access any dashboard routes

### **Manual Testing:**

1. **Login as Super Admin** (afzal@noorsaray.com)
   ```bash
   # Should work
   curl http://localhost:3000/dashboard/users
   ```

2. **Login as Regular User**
   ```bash
   # Should redirect to /forbidden
   curl -L http://localhost:3000/dashboard/users
   ```

3. **No Authentication**
   ```bash
   # Should redirect to /login
   curl -L http://localhost:3000/dashboard/users
   ```

## 🔧 Configuration

### **Environment Variables**
All existing environment variables work with the enhanced middleware:
- `MONGODB_URI` - For user lookup
- `FIREBASE_PROJECT_ID` - For session verification
- `FIREBASE_PRIVATE_KEY` - For Firebase Admin
- `FIREBASE_CLIENT_EMAIL` - For Firebase Admin

### **Middleware Matcher**
The middleware runs on all routes except static files:
```typescript
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

## 🎯 Security Best Practices

1. **Always use server-side protection** - Client-side checks are supplementary
2. **Fail securely** - Default to access denied if verification fails
3. **Log access attempts** - All access denials are logged with context
4. **Use specific error messages** - Help users understand why access was denied
5. **Provide clear navigation** - Always offer a path back to allowed areas

## 🚀 Production Readiness

This middleware-based protection system is **production-ready** with:

- ✅ **Server-side validation** - Cannot be bypassed
- ✅ **Role hierarchy enforcement** - Proper admin controls
- ✅ **Error handling** - Graceful failure modes  
- ✅ **Performance optimized** - Minimal database lookups
- ✅ **Extensible design** - Easy to add new protected routes
- ✅ **User-friendly errors** - Professional error pages

Your admin panel now has **enterprise-grade route protection**! 🔒