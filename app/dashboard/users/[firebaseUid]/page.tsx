"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { 
  Collection, 
  Action, 
  FullRole, 
  SubRole, 
  UserStatus,
  CollectionPermission
} from '@/types/user';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft,
  Shield, 
  User, 
  Edit, 
  Trash2,
  Key,
  Unlock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  History,
  Settings,
  Eye,
  EyeOff,
  Save,
  X,
  Plus,
  Minus,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

interface UserData {
  _id: string;
  firebaseUid: string;
  email: string;
  displayName: string;
  fullRole: FullRole;
  status: UserStatus;
  collectionPermissions: CollectionPermission[];
  permissionOverrides: CollectionPermission[];
  department?: string;
  phone?: string;
  address?: string;
  bio?: string;
  profileImage?: string;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  loginAttempts: number;
  lockedUntil?: string;
  createdBy?: string;
  approvedBy?: string;
  lastRoleChange?: {
    previousRole: FullRole;
    newRole: FullRole;
    changedBy: string;
    changedAt: string;
    reason?: string;
  };
}

interface AvailableActions {
  canEdit: boolean;
  canDelete: boolean;
  canChangeRole: boolean;
  canChangeStatus: boolean;
  canManagePermissions: boolean;
  canViewSensitiveInfo: boolean;
  canResetPassword: boolean;
  canUnlock: boolean;
}

interface RoleHierarchy {
  currentUserLevel: number;
  targetUserLevel: number;
  availableRoles: FullRole[];
}

interface AuditSummary {
  totalActions: number;
  recentActions: Array<{
    action: string;
    timestamp: string;
    performedBy: string;
  }>;
}

export default function UserDetailPage() {
  const { user, loading, isSystemAdmin, isSuperAdmin } = useAuth();
  const router = useRouter();
  const params = useParams();
  const firebaseUid = params.firebaseUid as string;
  
  // Debug logging
  console.log('🔍 UserDetailPage loaded with params:', params);
  console.log('🔍 Extracted firebaseUid:', firebaseUid);
  console.log('👤 Current user loading state:', loading);
  console.log('👤 Current user:', user ? { uid: user.uid, email: user.email } : 'null');
  
  // State management
  const [userData, setUserData] = useState<UserData | null>(null);
  const [availableActions, setAvailableActions] = useState<AvailableActions | null>(null);
  const [roleHierarchy, setRoleHierarchy] = useState<RoleHierarchy | null>(null);
  const [auditSummary, setAuditSummary] = useState<AuditSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  
  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<UserData>>({});
  const [showSensitiveInfo, setShowSensitiveInfo] = useState(false);
  
  // Dialogs
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);
  const [showUnlockDialog, setShowUnlockDialog] = useState(false);
  
  // Permission editing
  const [editingPermissions, setEditingPermissions] = useState(false);
  const [permissionForm, setPermissionForm] = useState<CollectionPermission[]>([]);

  // Check access and redirect if needed
  useEffect(() => {
    if (!loading && user && !isSystemAdmin()) {
      router.push('/forbidden?reason=insufficient_role');
    }
  }, [user, loading, isSystemAdmin, router]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle keyboard shortcuts when not in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case 'Escape':
          if (isEditing) {
            setIsEditing(false);
            setEditForm({});
          } else if (editingPermissions) {
            setEditingPermissions(false);
            setPermissionForm([]);
          } else {
            router.back();
          }
          break;
        case 'e':
          if (e.ctrlKey && availableActions?.canEdit) {
            e.preventDefault();
            handleEditToggle();
          }
          break;
        case 's':
          if (e.ctrlKey && isEditing) {
            e.preventDefault();
            handleSaveChanges();
          }
          break;
        case 'r':
          if (e.ctrlKey) {
            e.preventDefault();
            fetchUserData();
          }
          break;
        case '1':
        case '2':
        case '3':
        case '4':
          if (!isEditing && !editingPermissions) {
            const tabs = ['profile', 'permissions', 'security', 'audit'];
            const tabIndex = parseInt(e.key) - 1;
            if (tabs[tabIndex]) {
              setActiveTab(tabs[tabIndex]);
            }
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditing, editingPermissions, availableActions, router]);

  // Fetch user data
  const fetchUserData = useCallback(async () => {
    if (!firebaseUid) {
      console.log('❌ No firebaseUid provided to fetchUserData');
      return;
    }
    
    console.log('🔍 Fetching user data for firebaseUid:', firebaseUid);
    console.log('🌐 Making request to:', `/api/users/${firebaseUid}`);
    
    setIsLoading(true);
    try {
      console.log('🚀 About to make fetch request...');
      const response = await fetch(`/api/users/${firebaseUid}`);
      console.log('📡 Response received:', response);
      console.log('📡 Response status:', response.status);
      console.log('📡 Response statusText:', response.statusText);
      console.log('📡 Response ok:', response.ok);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Successfully loaded user data:', result);
        setUserData(result.user);
        setAvailableActions(result.availableActions);
        setRoleHierarchy(result.roleHierarchy);
        setAuditSummary(result.auditSummary);
      } else {
        console.log('❌ Response not ok, attempting to parse error...');
        try {
          const error = await response.json();
          console.log('❌ Error response parsed:', error);
          toast.error(error.error || 'Failed to load user data');
        } catch (parseError) {
          console.log('❌ Failed to parse error response:', parseError);
          console.log('❌ Raw response text:', await response.text());
          toast.error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        if (response.status === 403) {
          router.push('/forbidden?reason=insufficient_permissions');
        } else if (response.status === 404) {
          router.push('/dashboard/users?error=user_not_found');
        }
      }
    } catch (error) {
      console.log('❌ Fetch error (network/other):', error);
      console.log('❌ Error type:', typeof error);
      console.log('❌ Error name:', error instanceof Error ? error.name : 'Unknown');
      console.log('❌ Error message:', error instanceof Error ? error.message : String(error));
      console.log('❌ Error stack:', error instanceof Error ? error.stack : 'No stack');
      toast.error('Network error loading user data');
    } finally {
      setIsLoading(false);
    }
  }, [firebaseUid, router]);

  useEffect(() => {
    if (user && isSystemAdmin()) {
      fetchUserData();
    }
  }, [user, isSystemAdmin, fetchUserData]);

  // Edit handlers
  const handleEditToggle = () => {
    if (!availableActions?.canEdit) {
      toast.error('You do not have permission to edit this user');
      return;
    }
    
    if (isEditing) {
      setIsEditing(false);
      setEditForm({});
    } else {
      setIsEditing(true);
      setEditForm({
        displayName: userData?.displayName || '',
        department: userData?.department || '',
        phone: userData?.phone || '',
        address: userData?.address || '',
        bio: userData?.bio || '',
        fullRole: userData?.fullRole,
        status: userData?.status
      });
    }
  };

  const handleSaveChanges = async () => {
    if (!userData || !availableActions?.canEdit) return;
    
    try {
      const updates = {
        firebaseUid: userData.firebaseUid,
        updates: {
          displayName: editForm.displayName,
          department: editForm.department,
          phoneNumber: editForm.phone,
          address: editForm.address,
          bio: editForm.bio,
          ...(availableActions.canChangeRole && editForm.fullRole && { fullRole: editForm.fullRole }),
          ...(availableActions.canChangeStatus && editForm.status && { status: editForm.status })
        }
      };

      const response = await fetch('/api/users/manage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        toast.success('User updated successfully');
        setIsEditing(false);
        setEditForm({});
        fetchUserData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update user');
      }
    } catch (error) {
      toast.error('Error updating user');
    }
  };

  const handleDeleteUser = async () => {
    if (!userData || !availableActions?.canDelete) return;
    
    try {
      const response = await fetch('/api/users/manage', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firebaseUid: userData.firebaseUid })
      });

      if (response.ok) {
        toast.success('User deleted successfully');
        router.push('/dashboard/users');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete user');
      }
    } catch (error) {
      toast.error('Error deleting user');
    } finally {
      setShowDeleteDialog(false);
    }
  };

  const handleResetPassword = async () => {
    if (!userData || !availableActions?.canResetPassword) return;
    
    try {
      // Implement password reset logic here
      toast.success('Password reset email sent');
    } catch (error) {
      toast.error('Error sending password reset');
    } finally {
      setShowResetPasswordDialog(false);
    }
  };

  const handleUnlockUser = async () => {
    if (!userData || !availableActions?.canUnlock) return;
    
    try {
      const response = await fetch('/api/users/manage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firebaseUid: userData.firebaseUid,
          updates: { lockedUntil: null, loginAttempts: 0 }
        })
      });

      if (response.ok) {
        toast.success('User unlocked successfully');
        fetchUserData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to unlock user');
      }
    } catch (error) {
      toast.error('Error unlocking user');
    } finally {
      setShowUnlockDialog(false);
    }
  };

  // Permission management
  const handleEditPermissions = () => {
    if (!availableActions?.canManagePermissions) {
      toast.error('You do not have permission to manage user permissions');
      return;
    }
    
    setEditingPermissions(true);
    setPermissionForm([...userData?.collectionPermissions || []]);
  };

  const addPermission = () => {
    setPermissionForm(prev => [
      ...prev,
      { collection: Collection.PROJECTS, subRole: SubRole.OBSERVER }
    ]);
  };

  const updatePermission = (index: number, field: keyof CollectionPermission, value: any) => {
    setPermissionForm(prev => prev.map((perm, i) =>
      i === index ? { ...perm, [field]: value } : perm
    ));
  };

  const removePermission = (index: number) => {
    setPermissionForm(prev => prev.filter((_, i) => i !== index));
  };

  const savePermissions = async () => {
    if (!userData) return;
    
    try {
      const response = await fetch('/api/users/manage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firebaseUid: userData.firebaseUid,
          updates: { collectionPermissions: permissionForm }
        })
      });

      if (response.ok) {
        toast.success('Permissions updated successfully');
        setEditingPermissions(false);
        fetchUserData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update permissions');
      }
    } catch (error) {
      toast.error('Error updating permissions');
    }
  };

  // Utility functions
  const getStatusBadge = (status: UserStatus) => {
    const variants = {
      [UserStatus.ACTIVE]: { variant: "default" as const, icon: CheckCircle, color: "text-green-600" },
      [UserStatus.INVITED]: { variant: "secondary" as const, icon: Clock, color: "text-blue-600" },
      [UserStatus.SUSPENDED]: { variant: "destructive" as const, icon: XCircle, color: "text-red-600" },
      [UserStatus.DELETED]: { variant: "outline" as const, icon: AlertCircle, color: "text-gray-600" }
    };

    const config = variants[status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className={`h-3 w-3 ${config.color}`} />
        {status}
      </Badge>
    );
  };

  const getRoleBadge = (role: FullRole) => {
    const colors = {
      [FullRole.SUPER_ADMIN]: "bg-purple-100 text-purple-800 border-purple-200",
      [FullRole.ADMIN]: "bg-red-100 text-red-800 border-red-200",
      [FullRole.AGENT]: "bg-blue-100 text-blue-800 border-blue-200",
      [FullRole.MARKETING]: "bg-green-100 text-green-800 border-green-200",
      [FullRole.SALES]: "bg-yellow-100 text-yellow-800 border-yellow-200",
      [FullRole.HR]: "bg-pink-100 text-pink-800 border-pink-200",
      [FullRole.COMMUNITY_MANAGER]: "bg-indigo-100 text-indigo-800 border-indigo-200",
      [FullRole.USER]: "bg-gray-100 text-gray-800 border-gray-200"
    };

    return (
      <Badge variant="outline" className={`${colors[role]} font-semibold`}>
        <Shield className="h-3 w-3 mr-1" />
        {role.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading || isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
            <div className="space-y-4">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">User not found</h3>
          <p className="text-gray-600 mb-4">The requested user could not be found or you don't have permission to view them.</p>
          <Button onClick={() => router.push('/dashboard/users')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Users
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/users')}
            className="flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Users
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{userData.displayName}</h1>
            <p className="text-gray-600">{userData.email}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Keyboard shortcuts info */}
          <div className="text-xs text-gray-500 hidden md:block">
            Ctrl+E: Edit | Ctrl+S: Save | Ctrl+R: Refresh | 1-4: Tabs | Esc: Cancel
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchUserData}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Status and Role Badges */}
      <div className="flex items-center space-x-4 mb-6">
        {getStatusBadge(userData.status)}
        {getRoleBadge(userData.fullRole)}
        {userData.lockedUntil && new Date(userData.lockedUntil) > new Date() && (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            Locked
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Profile (1)
              </TabsTrigger>
              <TabsTrigger value="permissions" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Permissions (2)
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                Security (3)
              </TabsTrigger>
              <TabsTrigger value="audit" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                Audit (4)
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>
                      Basic user information and contact details
                    </CardDescription>
                  </div>
                  {availableActions?.canEdit && (
                    <Button 
                      onClick={handleEditToggle}
                      variant={isEditing ? "outline" : "default"}
                      size="sm"
                    >
                      {isEditing ? (
                        <>
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </>
                      ) : (
                        <>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </>
                      )}
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Display Name */}
                    <div>
                      <Label htmlFor="displayName">Display Name</Label>
                      {isEditing ? (
                        <Input
                          id="displayName"
                          value={editForm.displayName || ''}
                          onChange={(e) => setEditForm(prev => ({ ...prev, displayName: e.target.value }))}
                          placeholder="Enter display name"
                        />
                      ) : (
                        <p className="text-sm text-gray-900 mt-1">{userData.displayName}</p>
                      )}
                    </div>

                    {/* Email (read-only) */}
                    <div>
                      <Label>Email</Label>
                      <p className="text-sm text-gray-900 mt-1">{userData.email}</p>
                    </div>

                    {/* Department */}
                    <div>
                      <Label htmlFor="department">Department</Label>
                      {isEditing ? (
                        <Input
                          id="department"
                          value={editForm.department || ''}
                          onChange={(e) => setEditForm(prev => ({ ...prev, department: e.target.value }))}
                          placeholder="Enter department"
                        />
                      ) : (
                        <p className="text-sm text-gray-900 mt-1">{userData.department || 'Not specified'}</p>
                      )}
                    </div>

                    {/* Phone */}
                    {(availableActions?.canViewSensitiveInfo || isEditing) && (
                      <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        {isEditing ? (
                          <Input
                            id="phone"
                            value={editForm.phone || ''}
                            onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                            placeholder="Enter phone number"
                          />
                        ) : (
                          <p className="text-sm text-gray-900 mt-1">{userData.phone || 'Not provided'}</p>
                        )}
                      </div>
                    )}

                    {/* Role */}
                    <div>
                      <Label htmlFor="role">Role</Label>
                      {isEditing && availableActions?.canChangeRole ? (
                        <Select
                          value={editForm.fullRole}
                          onValueChange={(value) => setEditForm(prev => ({ ...prev, fullRole: value as FullRole }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {roleHierarchy?.availableRoles.map((role) => (
                              <SelectItem key={role} value={role}>
                                {role.replace('_', ' ').toUpperCase()}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="mt-1">{getRoleBadge(userData.fullRole)}</div>
                      )}
                    </div>

                    {/* Status */}
                    <div>
                      <Label htmlFor="status">Status</Label>
                      {isEditing && availableActions?.canChangeStatus ? (
                        <Select
                          value={editForm.status}
                          onValueChange={(value) => setEditForm(prev => ({ ...prev, status: value as UserStatus }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.values(UserStatus).map((status) => (
                              <SelectItem key={status} value={status}>
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="mt-1">{getStatusBadge(userData.status)}</div>
                      )}
                    </div>
                  </div>

                  {/* Address */}
                  {(availableActions?.canViewSensitiveInfo || isEditing) && (
                    <div>
                      <Label htmlFor="address">Address</Label>
                      {isEditing ? (
                        <Textarea
                          id="address"
                          value={editForm.address || ''}
                          onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                          placeholder="Enter address"
                          rows={2}
                        />
                      ) : (
                        <p className="text-sm text-gray-900 mt-1">{userData.address || 'Not provided'}</p>
                      )}
                    </div>
                  )}

                  {/* Bio */}
                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    {isEditing ? (
                      <Textarea
                        id="bio"
                        value={editForm.bio || ''}
                        onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                        placeholder="Enter bio"
                        rows={3}
                      />
                    ) : (
                      <p className="text-sm text-gray-900 mt-1">{userData.bio || 'No bio provided'}</p>
                    )}
                  </div>

                  {/* Save/Cancel buttons for editing */}
                  {isEditing && (
                    <div className="flex justify-end space-x-2 pt-4 border-t">
                      <Button variant="outline" onClick={handleEditToggle}>
                        Cancel
                      </Button>
                      <Button onClick={handleSaveChanges}>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Permissions Tab */}
            <TabsContent value="permissions">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Permissions Management</CardTitle>
                    <CardDescription>
                      Manage user permissions and collection access
                    </CardDescription>
                  </div>
                  {availableActions?.canManagePermissions && !editingPermissions && (
                    <Button onClick={handleEditPermissions} size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Permissions
                    </Button>
                  )}
                  
                  {/* Debug info - remove in production */}
                  {process.env.NODE_ENV === 'development' && (
                    <div className="text-xs text-gray-500 mt-2">
                      Debug: canManagePermissions = {availableActions?.canManagePermissions?.toString()}
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  {editingPermissions ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">Collection Permissions</h4>
                        <Button onClick={addPermission} size="sm" variant="outline">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Permission
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        {permissionForm.map((permission, index) => (
                          <div key={index} className="flex items-center space-x-2 p-3 border rounded-lg">
                            <Select
                              value={permission.collection}
                              onValueChange={(value) => updatePermission(index, 'collection', value)}
                            >
                              <SelectTrigger className="w-48">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.values(Collection).map((collection) => (
                                  <SelectItem key={collection} value={collection}>
                                    {collection.charAt(0).toUpperCase() + collection.slice(1)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            
                            <Select
                              value={permission.subRole}
                              onValueChange={(value) => updatePermission(index, 'subRole', value)}
                            >
                              <SelectTrigger className="w-40">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.values(SubRole).map((subRole) => (
                                  <SelectItem key={subRole} value={subRole}>
                                    {subRole.charAt(0).toUpperCase() + subRole.slice(1)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            
                            <Button
                              onClick={() => removePermission(index)}
                              variant="outline"
                              size="sm"
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex justify-end space-x-2 pt-4 border-t">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setEditingPermissions(false);
                            setPermissionForm([]);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button onClick={savePermissions}>
                          <Save className="h-4 w-4 mr-2" />
                          Save Permissions
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <h4 className="font-medium">Current Permissions</h4>
                      {userData.collectionPermissions.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Collection</TableHead>
                              <TableHead>Sub Role</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {userData.collectionPermissions.map((permission, index) => (
                              <TableRow key={index}>
                                <TableCell className="font-medium">
                                  {permission.collection.charAt(0).toUpperCase() + permission.collection.slice(1)}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">
                                    {permission.subRole.charAt(0).toUpperCase() + permission.subRole.slice(1)}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {/* Show actions that this sub-role allows */}
                                  <div className="flex flex-wrap gap-1">
                                    {['view', 'add', 'edit', 'delete'].map(action => (
                                      <Badge key={action} variant="secondary" className="text-xs">
                                        {action}
                                      </Badge>
                                    ))}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className="text-gray-500 text-center py-4">No permissions assigned</p>
                      )}

                      {/* Permission Overrides */}
                      {userData.permissionOverrides && userData.permissionOverrides.length > 0 && (
                        <div className="pt-4 border-t">
                          <h4 className="font-medium mb-2">Permission Overrides</h4>
                          <div className="text-sm text-amber-600 mb-2">
                            These permissions override the default role permissions
                          </div>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Collection</TableHead>
                                <TableHead>Override Sub Role</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {userData.permissionOverrides.map((override, index) => (
                                <TableRow key={index}>
                                  <TableCell className="font-medium">
                                    {override.collection.charAt(0).toUpperCase() + override.collection.slice(1)}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                      {override.subRole.charAt(0).toUpperCase() + override.subRole.slice(1)}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                      {['view', 'add', 'edit', 'delete'].map(action => (
                                        <Badge key={action} variant="secondary" className="text-xs">
                                          {action}
                                        </Badge>
                                      ))}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle>Security Information</CardTitle>
                  <CardDescription>
                    User authentication status and security details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Security Info Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Last Login */}
                    {availableActions?.canViewSensitiveInfo && (
                      <div>
                        <Label>Last Login</Label>
                        <p className="text-sm text-gray-900 mt-1">
                          {userData.lastLogin ? formatDateTime(userData.lastLogin) : 'Never logged in'}
                        </p>
                      </div>
                    )}

                    {/* Login Attempts */}
                    {availableActions?.canViewSensitiveInfo && (
                      <div>
                        <Label>Failed Login Attempts</Label>
                        <p className="text-sm text-gray-900 mt-1">
                          {userData.loginAttempts || 0}
                        </p>
                      </div>
                    )}

                    {/* Account Status */}
                    <div>
                      <Label>Account Status</Label>
                      <div className="mt-1">
                        {userData.lockedUntil && new Date(userData.lockedUntil) > new Date() ? (
                          <Badge variant="destructive">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Locked until {formatDateTime(userData.lockedUntil)}
                          </Badge>
                        ) : (
                          <Badge variant="default">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Account Created */}
                    <div>
                      <Label>Account Created</Label>
                      <p className="text-sm text-gray-900 mt-1">{formatDateTime(userData.createdAt)}</p>
                      {userData.createdBy && (
                        <p className="text-xs text-gray-500">by {userData.createdBy}</p>
                      )}
                    </div>
                  </div>

                  {/* Role Change History */}
                  {userData.lastRoleChange && (
                    <div className="pt-4 border-t">
                      <Label>Last Role Change</Label>
                      <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm">
                          <span className="font-medium">{userData.lastRoleChange.previousRole}</span>
                          {' → '}
                          <span className="font-medium">{userData.lastRoleChange.newRole}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Changed by {userData.lastRoleChange.changedBy} on {formatDateTime(userData.lastRoleChange.changedAt)}
                        </div>
                        {userData.lastRoleChange.reason && (
                          <div className="text-xs text-gray-600 mt-1">
                            Reason: {userData.lastRoleChange.reason}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Security Actions */}
                  <div className="pt-4 border-t">
                    <Label>Security Actions</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {availableActions?.canResetPassword && (
                        <Button 
                          onClick={() => setShowResetPasswordDialog(true)} 
                          variant="outline" 
                          size="sm"
                        >
                          <Key className="h-4 w-4 mr-2" />
                          Reset Password
                        </Button>
                      )}
                      
                      {availableActions?.canUnlock && userData.lockedUntil && 
                       new Date(userData.lockedUntil) > new Date() && (
                        <Button 
                          onClick={() => setShowUnlockDialog(true)} 
                          variant="outline" 
                          size="sm"
                        >
                          <Unlock className="h-4 w-4 mr-2" />
                          Unlock Account
                        </Button>
                      )}
                      
                      {availableActions?.canViewSensitiveInfo && (
                        <Button 
                          onClick={() => setShowSensitiveInfo(!showSensitiveInfo)} 
                          variant="outline" 
                          size="sm"
                        >
                          {showSensitiveInfo ? (
                            <>
                              <EyeOff className="h-4 w-4 mr-2" />
                              Hide Details
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4 mr-2" />
                              Show Details
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Sensitive Information */}
                  {showSensitiveInfo && availableActions?.canViewSensitiveInfo && (
                    <div className="pt-4 border-t bg-yellow-50 p-4 rounded-lg">
                      <div className="flex items-center mb-2">
                        <AlertCircle className="h-4 w-4 text-yellow-600 mr-2" />
                        <span className="text-sm font-medium text-yellow-800">Sensitive Information</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Firebase UID:</span>
                          <span className="ml-2 font-mono text-xs">{userData.firebaseUid}</span>
                        </div>
                        <div>
                          <span className="font-medium">Database ID:</span>
                          <span className="ml-2 font-mono text-xs">{userData._id}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Audit Tab */}
            <TabsContent value="audit">
              <Card>
                <CardHeader>
                  <CardTitle>Audit Trail</CardTitle>
                  <CardDescription>
                    Recent activities and audit logs for this user
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {auditSummary ? (
                    <div className="space-y-4">
                      {/* Summary Stats */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-2xl font-bold">{auditSummary.totalActions}</div>
                            <p className="text-xs text-muted-foreground">Total Audit Events</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-2xl font-bold">{auditSummary.recentActions.length}</div>
                            <p className="text-xs text-muted-foreground">Recent Activities</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-2xl font-bold">
                              {userData.lastLogin ? 'Active' : 'Inactive'}
                            </div>
                            <p className="text-xs text-muted-foreground">Account Status</p>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Recent Activities */}
                      {auditSummary.recentActions.length > 0 ? (
                        <div>
                          <h4 className="font-medium mb-3">Recent Activities</h4>
                          <div className="space-y-2">
                            {auditSummary.recentActions.map((action, index) => (
                              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex items-center space-x-3">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                  <div>
                                    <p className="text-sm font-medium">{action.action}</p>
                                    <p className="text-xs text-gray-500">by {action.performedBy}</p>
                                  </div>
                                </div>
                                <div className="text-xs text-gray-500">
                                  {formatDateTime(action.timestamp)}
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          <div className="mt-4">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => router.push(`/dashboard/settings/audit-trail?user=${encodeURIComponent(userData.email)}`)}
                            >
                              View Full Audit Trail
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <History className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-500">No recent activities found</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">Audit information not available</p>
                      <p className="text-xs text-gray-400">You may not have permission to view audit details</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {availableActions?.canEdit && (
                <Button 
                  onClick={handleEditToggle} 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              )}
              
              {availableActions?.canManagePermissions && (
                <Button 
                  onClick={handleEditPermissions} 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Manage Permissions
                </Button>
              )}
              
              {availableActions?.canResetPassword && (
                <Button 
                  onClick={() => setShowResetPasswordDialog(true)} 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                >
                  <Key className="h-4 w-4 mr-2" />
                  Reset Password
                </Button>
              )}
              
              {availableActions?.canDelete && (
                <Button 
                  onClick={() => setShowDeleteDialog(true)} 
                  variant="destructive" 
                  size="sm" 
                  className="w-full justify-start"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete User
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Role Hierarchy Info */}
          {roleHierarchy && (
            <Card>
              <CardHeader>
                <CardTitle>Role Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Current User Level</Label>
                  <p className="text-sm text-gray-900 mt-1">Level {roleHierarchy.currentUserLevel}</p>
                </div>
                <div>
                  <Label>Target User Level</Label>
                  <p className="text-sm text-gray-900 mt-1">Level {roleHierarchy.targetUserLevel}</p>
                </div>
                <div>
                  <Label>Permission Status</Label>
                  <div className="mt-1">
                    {roleHierarchy.currentUserLevel > roleHierarchy.targetUserLevel ? (
                      <Badge variant="default">Can Manage</Badge>
                    ) : roleHierarchy.currentUserLevel === roleHierarchy.targetUserLevel ? (
                      <Badge variant="secondary">Same Level</Badge>
                    ) : (
                      <Badge variant="destructive">Higher Level</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* User Stats */}
          <Card>
            <CardHeader>
              <CardTitle>User Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Account Age</Label>
                <p className="text-sm text-gray-900 mt-1">
                  {Math.floor((new Date().getTime() - new Date(userData.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days
                </p>
              </div>
              <div>
                <Label>Permissions Count</Label>
                <p className="text-sm text-gray-900 mt-1">
                  {userData.collectionPermissions.length} collection{userData.collectionPermissions.length !== 1 ? 's' : ''}
                </p>
              </div>
              {availableActions?.canViewSensitiveInfo && (
                <div>
                  <Label>Login Attempts</Label>
                  <p className="text-sm text-gray-900 mt-1">{userData.loginAttempts}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete <strong>{userData.displayName}</strong>? 
              This action cannot be undone and will remove all user data, permissions, and access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteUser}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Password Confirmation Dialog */}
      <Dialog open={showResetPasswordDialog} onOpenChange={setShowResetPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset User Password</DialogTitle>
            <DialogDescription>
              This will send a password reset email to <strong>{userData.email}</strong>. 
              The user will be able to set a new password using the link in the email.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetPasswordDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleResetPassword}>
              Send Reset Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unlock Account Confirmation Dialog */}
      <Dialog open={showUnlockDialog} onOpenChange={setShowUnlockDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unlock User Account</DialogTitle>
            <DialogDescription>
              This will unlock <strong>{userData.displayName}</strong>'s account and reset their failed login attempts. 
              They will be able to log in immediately after this action.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUnlockDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUnlockUser}>
              Unlock Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}