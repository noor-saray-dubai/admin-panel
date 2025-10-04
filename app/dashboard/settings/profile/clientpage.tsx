//app/dashboard/settings/profile/clientpage.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Building2,
  FileText,
  Camera,
  ArrowLeft,
  Save,
  Loader2,
  Eye,
  EyeOff,
  Key,
  Shield
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Button
} from "@/components/ui/button";
import {
  Input
} from "@/components/ui/input";
import {
  Label
} from "@/components/ui/label";
import {
  Textarea
} from "@/components/ui/textarea";
import { toast } from 'sonner';

interface ProfileFormData {
  displayName: string;
  email: string;
  phone: string;
  address: string;
  bio: string;
  department: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading, refreshUserData } = useAuth();
  
  const [formData, setFormData] = useState<ProfileFormData>({
    displayName: '',
    email: '',
    phone: '',
    address: '',
    bio: '',
    department: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // Populate form with user data
  useEffect(() => {
    if (user) {
      setFormData({
        displayName: user.displayName || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        bio: user.bio || '',
        department: user.department || ''
      });
    }
  }, [user]);

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebaseUid: user.firebaseUid,
          ...formData
        }),
      });

      if (response.ok) {
        toast.success('Profile updated successfully!');
        await refreshUserData(); // Refresh user data in auth context
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('Network error occurred. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) {
      toast.error('No email address found. Please contact support.');
      return;
    }
    
    setIsResettingPassword(true);
    
    try {
      console.log('🔐 [Profile] Attempting password reset for:', user.email);
      
      const response = await fetch('/api/auth/password-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: user.email }),
      });
      
      console.log('🔐 [Profile] Password reset API response:', response.status, response.statusText);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ [Profile] Password reset successful:', result);
        toast.success(
          `Password reset email sent to ${user.email}! Check your inbox and spam folder.`, 
          { duration: 5000 }
        );
      } else {
        const error = await response.json();
        console.error('❌ [Profile] Password reset failed:', error);
        toast.error(error.error || 'Failed to send password reset email');
      }
    } catch (error) {
      console.error('❌ [Profile] Password reset error:', error);
      toast.error('Network error: Unable to send password reset email. Please try again.');
    } finally {
      setIsResettingPassword(false);
    }
  };

  if (authLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center space-x-4">
          <div className="w-6 h-6 bg-gray-200 rounded animate-pulse" />
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
            <p className="text-gray-600">Manage your personal information</p>
          </div>
        </div>
        <Button 
          onClick={handleSave}
          disabled={isSaving}
          className="bg-gray-900 hover:bg-gray-800"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {/* Profile Photo Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Camera className="w-5 h-5" />
            <span>Profile Photo</span>
          </CardTitle>
          <CardDescription>
            Update your profile picture
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-6">
            <div className="relative">
              <div className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-xl">
                  {user?.displayName ? user.displayName.substring(0, 2).toUpperCase() : 'U'}
                </span>
              </div>
              <button className="absolute -bottom-2 -right-2 w-8 h-8 bg-gray-100 hover:bg-gray-200 border-2 border-white rounded-full flex items-center justify-center transition-colors">
                <Camera className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Profile Picture</p>
              <p className="text-xs text-gray-500 mt-1">
                Upload a new profile picture (Coming Soon)
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                disabled
              >
                Upload Photo
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="w-5 h-5" />
            <span>Personal Information</span>
          </CardTitle>
          <CardDescription>
            Update your personal details and contact information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Display Name */}
            <div className="space-y-2">
              <Label htmlFor="displayName" className="flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-500" />
                <span>Full Name</span>
              </Label>
              <Input
                id="displayName"
                value={formData.displayName}
                onChange={(e) => handleInputChange('displayName', e.target.value)}
                placeholder="Enter your full name"
                className="h-11"
              />
            </div>

            {/* Email (Read-only) */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-gray-500" />
                <span>Email Address</span>
              </Label>
              <Input
                id="email"
                value={formData.email}
                readOnly
                className="h-11 bg-gray-50 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500">
                Email cannot be changed. Contact administrator if needed.
              </p>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-gray-500" />
                <span>Phone Number</span>
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+1 (555) 123-4567"
                className="h-11"
              />
            </div>

            {/* Department */}
            <div className="space-y-2">
              <Label htmlFor="department" className="flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-gray-500" />
                <span>Department</span>
              </Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => handleInputChange('department', e.target.value)}
                placeholder="e.g. Marketing, Sales, IT"
                className="h-11"
              />
            </div>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address" className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-gray-500" />
              <span>Address</span>
            </Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Enter your address"
              className="h-11"
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio" className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-gray-500" />
              <span>About Me</span>
            </Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              placeholder="Tell us about yourself..."
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-gray-500">
              Brief description about yourself and your role
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Account Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Account Security</span>
          </CardTitle>
          <CardDescription>
            Manage your account security settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-3">
              <Key className="w-5 h-5 text-gray-500" />
              <div>
                <p className="font-medium text-gray-900">Password</p>
                <p className="text-sm text-gray-500">Last changed: Unknown</p>
              </div>
            </div>
            <Button 
              variant="outline"
              onClick={handlePasswordReset}
              disabled={isResettingPassword}
              className="flex items-center space-x-2 min-w-[140px]"
            >
              {isResettingPassword ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Key className="w-4 h-4" />
                  <span>Reset Password</span>
                </>
              )}
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-3">
              <Shield className="w-5 h-5 text-gray-500" />
              <div>
                <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                <p className="text-sm text-gray-500">Not enabled (Coming Soon)</p>
              </div>
            </div>
            <Button variant="outline" disabled>
              Enable 2FA
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Account Status */}
      <Card>
        <CardHeader>
          <CardTitle>Account Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Account Type</p>
              <p className="font-semibold text-gray-900 capitalize">
                {user?.fullRole?.replace('_', ' ') || 'User'}
              </p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Status</p>
              <p className="font-semibold text-green-800">Active</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Member Since</p>
              <p className="font-semibold text-blue-800">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}