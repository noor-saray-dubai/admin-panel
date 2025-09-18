# 🚀 Noorsaray Admin Panel Setup Guide

Welcome! This guide will help you set up your Super Admin account and get your admin panel running.

## 📋 Prerequisites

Before running the setup, make sure you have:

### 1. Environment Variables
Create a `.env.local` file in your project root with:

```bash
# MongoDB
MONGODB_URI=mongodb://localhost:27017/noorsaray-admin
# OR MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/noorsaray-admin

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour Private Key Here\n-----END PRIVATE KEY-----"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com

# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Firebase Setup
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use existing
3. Go to Project Settings → Service Accounts
4. Click "Generate new private key"
5. Copy the values to your `.env.local`

### 3. MongoDB Setup
Either:
- **Local MongoDB**: Install MongoDB locally
- **MongoDB Atlas**: Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas)

## 🎯 Quick Setup

### Option 1: Interactive Setup (Recommended)
```bash
npm run setup
```

This will prompt you for:
- Your email address
- Your full name  
- A secure password

### Option 2: Manual Setup
1. Edit `scripts/createSuperAdmin.js`
2. Update the `SUPER_ADMIN` object with your details:
```javascript
const SUPER_ADMIN = {
  email: 'your-email@example.com',
  displayName: 'Your Name',
  password: 'YourSecurePassword123!',
};
```
3. Run: `npm run create-admin`

## ✅ What the Setup Does

The setup script will:

1. **Create Firebase User** - Your admin account in Firebase Auth
2. **Set Custom Claims** - Assigns super admin role and permissions
3. **Create MongoDB Record** - User profile with all collection permissions
4. **Setup Audit Log** - Initial log entry for tracking
5. **Grant Full Access** - Access to all collections with admin sub-role

## 🎉 After Setup

Once setup is complete:

1. **Start the development server:**
```bash
npm run dev
```

2. **Visit your admin panel:**
```
http://localhost:3000
```

3. **Login with your credentials:**
- Email: (the one you provided)
- Password: (the one you provided)

4. **You will have access to:**
- 📊 Dashboard (overview)
- 📝 All content collections (blogs, projects, etc.)
- 👥 User management (create/edit/delete users)
- ⚙️ System settings
- 📈 Audit logs
- 🔧 All admin features

## 🔒 Security Notes

- **Change your password** after first login
- **Enable 2FA** if needed
- **Keep your `.env.local` secure** - never commit to git
- **Use strong passwords** for all accounts

## 🚨 Troubleshooting

### Firebase Connection Issues
- Check your environment variables
- Ensure Firebase project has Authentication enabled
- Verify service account permissions

### MongoDB Connection Issues
- Check MongoDB is running (if local)
- Verify connection string format
- Check network access (if using Atlas)

### "User already exists" Error
- This is normal if you run setup multiple times
- The script will update existing user with new permissions

## 🎯 Next Steps

After successful setup:

1. **Create other admin accounts** through the user management interface
2. **Configure your collections** (blogs, projects, etc.)
3. **Set up team roles and permissions**
4. **Customize the dashboard** for your needs

## 📞 Need Help?

If you encounter issues:
1. Check the console output for specific error messages
2. Verify all environment variables are set correctly
3. Ensure MongoDB and Firebase are accessible
4. Check the `.env.local` file format

---

**🔥 Welcome to your new admin panel! You're now ready to manage your Noorsaray platform like a pro!** 🚀