# 📚 Noorsaray Admin Panel - Knowledge Base

> **Complete guide to custom features, implementations, and architectural decisions**

---

## 🏗️ Architecture Overview

### **Tech Stack**
- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Firebase Admin SDK
- **Database**: MongoDB with Mongoose
- **Authentication**: Firebase Auth + Custom Session Management
- **UI Components**: Custom shadcn/ui components
- **File Uploads**: Cloudinary integration
- **Email**: Nodemailer with Firebase generated links

---

## 🔐 Authentication & Authorization System

### **Hybrid Authentication Flow**
**Location**: `app/api/sessionLogin/route.ts`, `hooks/useEnhancedAuth.tsx`

**How it Works**:
1. Client authenticates with Firebase (gets ID token)
2. Server validates token and creates session cookie (`__session`)
3. Client and server both maintain user state
4. Role-based permissions checked on both sides

**Key Files**:
- `lib/auth/AuthService.ts` - Core authentication service
- `models/enhancedUser.ts` - MongoDB user model with roles
- `middleware.ts` - Route protection middleware

### **Role System**
```typescript
enum FullRole {
  USER = 'user',
  ADMIN = 'admin', 
  SUPER_ADMIN = 'super_admin'
}
```

**Permissions**:
- **User**: Basic access to assigned collections
- **Admin**: User management, system settings
- **Super Admin**: Everything + audit trails, system administration

---

## 🎨 Custom UI Components

### **Toast Notification System**
**Location**: `components/ui/toast.tsx`, `hooks/use-toast.ts`

**Features**:
- Custom toast implementation (not react-hot-toast)
- Automatic dismiss with configurable timeout
- Multiple variants (success, error, warning, info)
- Queue management (limit 1 toast at a time)

**Usage**:
```typescript
import { useToast } from '@/hooks/use-toast';

const { toast } = useToast();
toast({
  title: "Success!",
  description: "Operation completed",
  variant: "default"
});
```

### **Instant Image Upload Component**
**Location**: `components/ui/instant-image-upload.tsx`

**Features**:
- Direct Cloudinary upload with progress bars
- Image optimization and resizing
- Multiple file support
- Drag & drop interface
- Preview with delete functionality
- Real-time upload progress

**Usage**:
```typescript
<InstantImageUpload
  onUploadComplete={(urls) => setImages(urls)}
  maxFiles={5}
  folder="plots"
/>
```

### **Luxury Sidebar Navigation**
**Location**: `components/ui/luxury-sidebar.tsx`

**Features**:
- Collapsible design with smooth animations
- Role-based navigation item visibility
- Active state indicators
- Internal scrolling (no page scroll)
- Tooltip support in collapsed state
- User info footer with role badges

---

## 👥 User Management System

### **Enhanced User Model**
**Location**: `models/enhancedUser.ts`

**Features**:
- MongoDB integration with Firebase UID linking
- Comprehensive role and permission system
- Collection-level permissions with sub-roles
- Account status management (active, suspended, deleted)
- Login attempt tracking and account locking
- Audit trail integration

### **User Creation Flow**
**Location**: `app/api/users/create/route.ts`, `lib/auth/AuthService.ts`

**Process**:
1. Admin creates user with basic info
2. Firebase user account created with temp password
3. MongoDB enhanced user record created
4. Invitation email sent (if enabled)
5. User must reset password on first login

### **Role-Based UI Rendering**
**Location**: `hooks/useEnhancedAuth.tsx`

**Features**:
- `isSuperAdmin()`, `isAdmin()`, `hasRole()` checks
- Navigation item filtering
- Component-level permission checking
- Collection access validation

---

## 📊 Business Data Management

### **Mall Management System**
**Location**: `components/mall-tabs.tsx`, `components/mall-form-modal.tsx`

**Features**:
- Complete CRUD operations for malls
- Image gallery management
- Status tracking (draft, pending, approved, rejected)
- Admin approval workflow
- Bulk operations support
- Export functionality

### **Plot Management System**
**Location**: `components/plot-form-modal.tsx`

**Features**:
- Plot creation and management
- Location mapping integration
- Price and availability tracking
- Document upload support
- Ownership history
- Search and filtering

### **Developer Management**
**Location**: `components/developer-form-modal.tsx`

**Features**:
- Developer profile management
- Project portfolio tracking
- Contact information management
- Logo and image uploads
- Performance metrics

---

## 📧 Email System

### **Custom Email Service**
**Location**: `lib/emailService.ts`

**Features**:
- Nodemailer integration with Gmail/SMTP
- Beautiful HTML email templates
- Noorsaray branding
- Password reset emails
- Invitation emails
- Transactional email support

**Configuration**:
```env
EMAIL_USER=your-email@gmail.com
EMAIL_APP_PASSWORD=your-app-password
```

### **Password Reset Flow**
**Location**: `app/api/auth/password-reset/route.ts`, `app/auth/reset-password/page.tsx`

**Process**:
1. Admin/User requests password reset
2. Firebase generates secure reset link
3. Custom branded email sent via Nodemailer
4. User clicks link → Custom reset page (not Firebase UI)
5. Password updated → Success message → Login redirect

---

## 🔍 Audit Trail System

### **Comprehensive Logging**
**Location**: `models/auditLog.ts`, `app/api/admin/audit-logs/route.ts`

**What's Tracked**:
- User authentication (login, logout, failures)
- User management actions (create, update, delete, role changes)
- Business operations (mall approvals, plot updates, etc.)
- System changes (settings, configurations)
- Security events (unauthorized access attempts)

**Features**:
- **Super Admin Only Access** - Multiple security layers
- **Advanced Filtering** - By level, action, user, date range
- **Real-time Search** - Across all log fields
- **Export Functionality** - CSV download with filtering
- **Performance Optimized** - Pagination and indexing

### **Audit Trail Security**
**Location**: `app/dashboard/settings/audit-trail/page.tsx`

**Security Layers**:
1. **Settings UI** - Only visible to super admin
2. **Middleware** - Route protection
3. **Client Component** - Forbidden state (not redirect)
4. **API Endpoint** - Role validation + session verification
5. **Database** - Role-based queries

---

## 🛡️ Security Features

### **Multi-Layer Security**
1. **Middleware Protection** (`middleware.ts`)
   - Session validation
   - Route protection
   - Cache control headers

2. **API Security**
   - Firebase session cookie validation
   - Role-based access control
   - Input sanitization
   - Rate limiting considerations

3. **Client-Side Security**
   - Role-based UI rendering
   - Forbidden states instead of redirects
   - Toast notifications for unauthorized access

### **Session Management**
**Location**: `app/api/sessionLogin/route.ts`

**Features**:
- Firebase session cookies (`__session`)
- Configurable expiration (1 day / 5 days)
- Remember me functionality
- Secure cookie attributes
- Automatic cleanup on logout

---

## 📱 UI/UX Features

### **Responsive Design**
- Mobile-first approach
- Collapsible sidebar
- Touch-friendly interfaces
- Adaptive layouts

### **Loading States**
- Skeleton loading for tables
- Progress indicators for uploads
- Spinner animations for forms
- Optimistic UI updates

### **Error Handling**
- Toast notifications for errors
- Detailed error messages in development
- Generic messages in production
- Graceful fallback states

### **Keyboard Shortcuts**
**Location**: `app/dashboard/settings/audit-trail/page.tsx`

**Available Shortcuts**:
- `←` `→` - Navigate pages
- `Home` - First page
- `End` - Last page

---

## 🗂️ File Structure & Patterns

### **API Route Patterns**
```
app/api/
├── auth/           # Authentication endpoints
├── users/          # User management
├── admin/          # Admin-only endpoints
└── [resource]/     # Business resource endpoints
```

### **Component Organization**
```
components/
├── ui/             # Reusable UI components
├── [feature]/      # Feature-specific components
└── hooks/          # Custom React hooks
```

### **Type Definitions**
**Location**: `types/user.ts`, `types/audit.ts`

**Features**:
- Comprehensive TypeScript types
- Client-safe type transformations
- Enum definitions for constants
- Interface extensions for flexibility

---

## 🔧 Development Tools

### **Environment Variables**
```env
# Firebase
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# Database
MONGODB_URI=

# Email
EMAIL_USER=
EMAIL_APP_PASSWORD=

# App
NEXT_PUBLIC_APP_URL=
```

### **Custom Hooks**
- `useEnhancedAuth()` - Authentication state management
- `useToast()` - Toast notification system
- `useMallFormLogic()` - Mall form state management

---

## 📈 Performance Optimizations

### **Database**
- MongoDB indexing on frequently queried fields
- Lean queries for list operations
- Pagination for large datasets
- Connection pooling

### **Frontend**
- Image optimization with Cloudinary
- Component lazy loading
- Memoization for expensive computations
- Efficient state management

### **API**
- Response caching where appropriate
- Request/response size optimization
- Error handling without exposing internals

---

## 🚀 Deployment Considerations

### **Environment Setup**
- Production environment variables
- Database security configurations
- Email service setup
- Cloudinary configuration

### **Security Checklist**
- [ ] Firebase security rules configured
- [ ] MongoDB access controls set
- [ ] Environment variables secured
- [ ] Email credentials protected
- [ ] Session cookies secured (HTTPS)

---

## 🔍 Debugging & Troubleshooting

### **Common Issues**

**Authentication Problems**:
- Check Firebase configuration
- Verify session cookie settings
- Validate middleware patterns

**Permission Issues**:
- Check role assignments in MongoDB
- Verify API endpoint protections
- Validate client-side role checks

**Email Issues**:
- Verify Gmail app password setup
- Check environment variables
- Test SMTP connections

### **Logging Patterns**
```typescript
// Good logging
console.log('✅ Operation successful:', data);
console.error('❌ Operation failed:', error);
console.warn('⚠️ Potential issue:', warning);
```

---

## 📝 Development Guidelines

### **Code Patterns**
- Use TypeScript strictly
- Implement proper error handling
- Add comprehensive audit logging
- Follow security-first approach

### **Component Guidelines**
- Keep components focused and reusable
- Use proper TypeScript types
- Implement loading and error states
- Add proper accessibility features

### **API Guidelines**
- Validate all inputs
- Implement proper error responses
- Add comprehensive logging
- Use consistent response formats

---

## 🎯 Future Enhancements

### **Planned Features**
- [ ] Two-factor authentication
- [ ] Advanced reporting dashboard
- [ ] Real-time notifications
- [ ] Advanced user permissions
- [ ] System health monitoring
- [ ] Advanced search capabilities

### **Performance Improvements**
- [ ] Redis caching layer
- [ ] Database query optimization
- [ ] CDN integration
- [ ] Image optimization pipeline

---

## 📞 Support & Maintenance

### **Key Contact Points**
- Firebase console for auth issues
- MongoDB Atlas for database issues
- Cloudinary for image upload issues
- Email service provider for email issues

### **Monitoring**
- Application logs
- Audit trail analysis
- Performance metrics
- Error tracking

---

*This knowledge base is maintained and updated with each new feature implementation.*