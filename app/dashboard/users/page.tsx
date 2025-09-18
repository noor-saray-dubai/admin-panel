"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEnhancedAuth } from '@/hooks/useEnhancedAuth';
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Badge
} from "@/components/ui/badge";
import {
  Switch
} from "@/components/ui/switch";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Shield, 
  User, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock
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
  department?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  loginAttempts: number;
  createdBy?: string;
}

interface CreateUserForm {
  email: string;
  displayName: string;
  fullRole: FullRole;
  status: UserStatus;
  department: string;
  phoneNumber: string;
  sendInvitation: boolean;
  collectionPermissions: CollectionPermission[];
}

interface FormData {
  fullRoles: FullRole[];
  collections: Collection[];
  subRoles: SubRole[];
  userStatuses: UserStatus[];
}

export default function UserManagementPage() {
  const { 
    user, 
    loading, 
    isAdmin, 
    isSuperAdmin, 
    hasCollectionPermission 
  } = useEnhancedAuth();
  
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State management
  const [users, setUsers] = useState<UserData[]>([]);
  const [formData, setFormData] = useState<FormData | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // URL-synchronized state - initialize from URL params
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [roleFilter, setRoleFilter] = useState(searchParams.get('role') || 'all');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'createdAt');
  const [sortOrder, setSortOrder] = useState(searchParams.get('sortOrder') || 'desc');
  const [pagination, setPagination] = useState({
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '10'),
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });

  // Form state for create/edit
  const [createForm, setCreateForm] = useState<CreateUserForm>({
    email: '',
    displayName: '',
    fullRole: FullRole.USER,
    status: UserStatus.INVITED,
    department: '',
    phoneNumber: '',
    sendInvitation: true,
    collectionPermissions: []
  });

  // Check admin access and redirect if needed
  useEffect(() => {
    if (!loading && user && !isAdmin()) {
      // User is logged in but not an admin - show forbidden page
      router.push('/forbidden?reason=insufficient_role');
    }
  }, [user, loading, isAdmin, router]);
  
  // Enhanced keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle keyboard shortcuts when not in input fields or modals
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || 
          isCreateModalOpen || isEditModalOpen) {
        return;
      }

      switch (e.key) {
        case 'n':
          if (e.ctrlKey) {
            e.preventDefault();
            setIsCreateModalOpen(true);
          }
          break;
        case 'r':
          if (e.ctrlKey) {
            e.preventDefault();
            fetchUsers();
          }
          break;
        case 'f':
          if (e.ctrlKey) {
            e.preventDefault();
            document.getElementById('search-input')?.focus();
          }
          break;
        case 'Escape':
          setSelectedUsers([]);
          updateSearchTerm('');
          updateStatusFilter('all');
          updateRoleFilter('all');
          setShowAdvancedFilters(false);
          break;
        case 'ArrowLeft':
          if (e.ctrlKey && pagination.hasPrev) {
            e.preventDefault();
            updatePagination({ page: pagination.page - 1 });
          }
          break;
        case 'ArrowRight':
          if (e.ctrlKey && pagination.hasNext) {
            e.preventDefault();
            updatePagination({ page: pagination.page + 1 });
          }
          break;
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
          if (e.ctrlKey) {
            e.preventDefault();
            const pageSize = parseInt(e.key) * 10;
            updatePagination({ limit: pageSize, page: 1 });
          }
          break;
        case 'a':
          if (e.ctrlKey) {
            e.preventDefault();
            if (selectedUsers.length === users.length) {
              setSelectedUsers([]);
            } else {
              setSelectedUsers(users.map(u => u.firebaseUid));
            }
          }
          break;
        case 'v':
          if (e.ctrlKey && selectedUsers.length === 1) {
            e.preventDefault();
            router.push(`/dashboard/users/${selectedUsers[0]}`);
          }
          break;
        case 'g':
          if (!e.ctrlKey) {
            setViewMode(viewMode === 'table' ? 'grid' : 'table');
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCreateModalOpen, isEditModalOpen, pagination, users, selectedUsers, viewMode, router]);
  
  // Update URL when filters/pagination change
  const updateURL = (params: Record<string, string | number>) => {
    const url = new URL(window.location.href);
    
    Object.entries(params).forEach(([key, value]) => {
      if (value && value !== 'all' && value !== '' && value !== '1' && value !== 'createdAt' && value !== 'desc' && value !== '10') {
        url.searchParams.set(key, value.toString());
      } else {
        url.searchParams.delete(key);
      }
    });
    
    // Remove default values to keep URL clean
    if (url.searchParams.get('page') === '1') url.searchParams.delete('page');
    if (url.searchParams.get('limit') === '10') url.searchParams.delete('limit');
    if (url.searchParams.get('sortBy') === 'createdAt') url.searchParams.delete('sortBy');
    if (url.searchParams.get('sortOrder') === 'desc') url.searchParams.delete('sortOrder');
    
    const newUrl = url.pathname + (url.search ? url.search : '');
    window.history.replaceState({}, '', newUrl);
  };
  
  // Sync URL whenever state changes
  useEffect(() => {
    updateURL({
      page: pagination.page,
      limit: pagination.limit,
      search: searchTerm,
      status: statusFilter,
      role: roleFilter,
      sortBy,
      sortOrder
    });
  }, [pagination.page, pagination.limit, searchTerm, statusFilter, roleFilter, sortBy, sortOrder]);

  // Fetch form data on mount
  useEffect(() => {
    if (user && isAdmin()) {
      fetchFormData();
      fetchUsers();
    }
  }, [user, isAdmin]);

  // Get available roles based on current user's role
  const getAvailableRoles = (): FullRole[] => {
    if (!formData || !user) return [];
    
    if (isSuperAdmin()) {
      // Super admins can assign all roles except other super admins
      return formData.fullRoles.filter(role => role !== FullRole.SUPER_ADMIN);
    } else {
      // Regular admins cannot assign admin roles
      return formData.fullRoles.filter(role => 
        role !== FullRole.ADMIN && role !== FullRole.SUPER_ADMIN
      );
    }
  };

  const fetchFormData = async () => {
    try {
      const response = await fetch('/api/users/create');
      if (response.ok) {
        const result = await response.json();
        setFormData(result.data);
      } else {
        toast.error('Failed to load form data');
      }
    } catch (error) {
      toast.error('Error loading form data');
    }
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy: sortBy,
        sortOrder: sortOrder,
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(roleFilter !== 'all' && { role: roleFilter })
      });

      const response = await fetch(`/api/users/manage?${params}`);
      if (response.ok) {
        const result = await response.json();
        setUsers(result.data);
        setPagination(prev => ({
          ...prev,
          total: result.pagination.total,
          totalPages: result.pagination.totalPages,
          hasNext: result.pagination.hasNext || false,
          hasPrev: result.pagination.hasPrev || false
        }));
      } else {
        toast.error('Failed to load users');
      }
    } catch (error) {
      toast.error('Error loading users');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Helper functions for URL-aware state updates
  const updateSearchTerm = (value: string) => {
    setSearchTerm(value);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to page 1 when searching
  };
  
  const updateStatusFilter = (value: string) => {
    setStatusFilter(value);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to page 1 when filtering
  };
  
  const updateRoleFilter = (value: string) => {
    setRoleFilter(value);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to page 1 when filtering
  };
  
  const updateSorting = (field: string, order: string) => {
    setSortBy(field);
    setSortOrder(order);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to page 1 when sorting
  };
  
  const updatePagination = (updates: Partial<typeof pagination>) => {
    setPagination(prev => ({ ...prev, ...updates }));
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm)
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(result.message);
        setIsCreateModalOpen(false);
        resetCreateForm();
        fetchUsers();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create user');
      }
    } catch (error) {
      toast.error('Error creating user');
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      const updates = {
        firebaseUid: selectedUser.firebaseUid,
        updates: {
          displayName: createForm.displayName,
          fullRole: createForm.fullRole,
          status: createForm.status,
          department: createForm.department,
          phoneNumber: createForm.phoneNumber,
          collectionPermissions: createForm.collectionPermissions
        }
      };

      const response = await fetch('/api/users/manage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(result.message);
        setIsEditModalOpen(false);
        setSelectedUser(null);
        resetCreateForm();
        fetchUsers();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update user');
      }
    } catch (error) {
      toast.error('Error updating user');
    }
  };

  const handleDeleteUser = async (userData: UserData) => {
    if (!confirm(`Are you sure you want to delete ${userData.displayName}? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch('/api/users/manage', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firebaseUid: userData.firebaseUid })
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(result.message);
        fetchUsers();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete user');
      }
    } catch (error) {
      toast.error('Error deleting user');
    }
  };

  const openEditModal = (userData: UserData) => {
    setSelectedUser(userData);
    setCreateForm({
      email: userData.email,
      displayName: userData.displayName,
      fullRole: userData.fullRole,
      status: userData.status,
      department: userData.department || '',
      phoneNumber: userData.phone || '',
      sendInvitation: false,
      collectionPermissions: userData.collectionPermissions || []
    });
    setIsEditModalOpen(true);
  };

  const resetCreateForm = () => {
    setCreateForm({
      email: '',
      displayName: '',
      fullRole: FullRole.USER,
      status: UserStatus.INVITED,
      department: '',
      phoneNumber: '',
      sendInvitation: true,
      collectionPermissions: []
    });
  };

  const addCollectionPermission = () => {
    setCreateForm(prev => ({
      ...prev,
      collectionPermissions: [
        ...prev.collectionPermissions,
        { collection: Collection.PROJECTS, subRole: SubRole.OBSERVER }
      ]
    }));
  };

  const updateCollectionPermission = (index: number, field: keyof CollectionPermission, value: Collection | SubRole) => {
    setCreateForm(prev => ({
      ...prev,
      collectionPermissions: prev.collectionPermissions.map((perm, i) =>
        i === index ? { ...perm, [field]: value } : perm
      )
    }));
  };

  const removeCollectionPermission = (index: number) => {
    setCreateForm(prev => ({
      ...prev,
      collectionPermissions: prev.collectionPermissions.filter((_, i) => i !== index)
    }));
  };

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
      [FullRole.SUPER_ADMIN]: "bg-purple-100 text-purple-800",
      [FullRole.ADMIN]: "bg-red-100 text-red-800",
      [FullRole.AGENT]: "bg-blue-100 text-blue-800",
      [FullRole.MARKETING]: "bg-green-100 text-green-800",
      [FullRole.SALES]: "bg-yellow-100 text-yellow-800",
      [FullRole.HR]: "bg-pink-100 text-pink-800",
      [FullRole.COMMUNITY_MANAGER]: "bg-indigo-100 text-indigo-800",
      [FullRole.USER]: "bg-gray-100 text-gray-800"
    };

    return (
      <Badge className={colors[role]}>
        <Shield className="h-3 w-3 mr-1" />
        {role.replace('_', ' ')}
      </Badge>
    );
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if user is admin/super admin
  if (!user || !isAdmin()) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900">Admin Access Required</h2>
          <p className="text-sm text-gray-600 mb-4">
            You need administrator privileges to access this page.
          </p>
          <Button onClick={() => router.push('/dashboard')} variant="outline">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-sm text-gray-600">
              Manage users, roles, and permissions • {isSuperAdmin() ? 'Super Admin' : 'Admin'} Access
            </p>
            <div className="text-xs text-gray-500 mt-1 hidden md:block">
              Keyboard: Ctrl+N: New | Ctrl+F: Search | Ctrl+R: Refresh | Ctrl+A: Select All | Ctrl+V: View Selected | G: Toggle View | Esc: Clear
            </div>
          </div>
          
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetCreateForm}>
                <Plus className="h-4 w-4 mr-2" />
                Create User
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
                <DialogDescription>
                  Create a new user account with specified role and permissions.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={createForm.email}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Full Name *</Label>
                    <Input
                      id="displayName"
                      value={createForm.displayName}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, displayName: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullRole">Role *</Label>
                    <Select value={createForm.fullRole} onValueChange={(value: FullRole) => 
                      setCreateForm(prev => ({ ...prev, fullRole: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableRoles().map(role => (
                          <SelectItem key={role} value={role}>
                            {role.replace('_', ' ')}
                            {role === FullRole.ADMIN && (
                              <span className="text-xs text-red-600 ml-2">(Super Admin Only)</span>
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={createForm.status} onValueChange={(value: UserStatus) => 
                      setCreateForm(prev => ({ ...prev, status: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {formData?.userStatuses.map(status => (
                          <SelectItem key={status} value={status}>{status}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      value={createForm.department}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, department: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input
                      id="phoneNumber"
                      value={createForm.phoneNumber}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="sendInvitation"
                    checked={createForm.sendInvitation}
                    onCheckedChange={(checked) => setCreateForm(prev => ({ ...prev, sendInvitation: checked }))}
                  />
                  <Label htmlFor="sendInvitation">Send invitation email</Label>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Collection Permissions</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addCollectionPermission}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Permission
                    </Button>
                  </div>

                  {createForm.collectionPermissions.map((perm, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 border rounded">
                      <Select 
                        value={perm.collection} 
                        onValueChange={(value: Collection) => updateCollectionPermission(index, 'collection', value)}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {formData?.collections.map(collection => (
                            <SelectItem key={collection} value={collection}>{collection}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select 
                        value={perm.subRole} 
                        onValueChange={(value: SubRole) => updateCollectionPermission(index, 'subRole', value)}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {formData?.subRoles.map(subRole => (
                            <SelectItem key={subRole} value={subRole}>{subRole}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => removeCollectionPermission(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create User</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4 items-center">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="search-input"
                    placeholder="Search users by name, email, or department..."
                    value={searchTerm}
                    onChange={(e) => updateSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && fetchUsers()}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={statusFilter} onValueChange={updateStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {formData?.userStatuses.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={roleFilter} onValueChange={updateRoleFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {formData?.fullRoles.map(role => (
                    <SelectItem key={role} value={role}>{role.replace('_', ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button onClick={fetchUsers} variant="outline">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Users ({pagination.total})</CardTitle>
              <CardDescription>
                Manage user accounts, roles, and permissions
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {/* Page Size Selector */}
              <Select value={pagination.limit.toString()} onValueChange={(value) => updatePagination({ limit: parseInt(value), page: 1 })}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-gray-500">per page</span>
            </div>
          </CardHeader>
          <CardContent>
            {/* Selection and Bulk Actions */}
            {selectedUsers.length > 0 && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-800">
                    {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
                  </span>
                  <div className="flex items-center gap-2">
                    {selectedUsers.length === 1 && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => router.push(`/dashboard/users/${selectedUsers[0]}`)}
                      >
                        <User className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => setSelectedUsers([])}>
                      Clear Selection
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={selectedUsers.length === users.length && users.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers(users.map(u => u.firebaseUid));
                          } else {
                            setSelectedUsers([]);
                          }
                        }}
                        className="rounded"
                      />
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => updateSorting('displayName', sortBy === 'displayName' && sortOrder === 'asc' ? 'desc' : 'asc')}
                    >
                      User {sortBy === 'displayName' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => updateSorting('fullRole', sortBy === 'fullRole' && sortOrder === 'asc' ? 'desc' : 'asc')}
                    >
                      Role {sortBy === 'fullRole' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => updateSorting('status', sortBy === 'status' && sortOrder === 'asc' ? 'desc' : 'asc')}
                    >
                      Status {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => updateSorting('lastLogin', sortBy === 'lastLogin' && sortOrder === 'asc' ? 'desc' : 'asc')}
                    >
                      Last Login {sortBy === 'lastLogin' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((userData) => (
                    <TableRow 
                      key={userData._id}
                      className={`${selectedUsers.includes(userData.firebaseUid) ? 'bg-blue-50' : ''} hover:bg-gray-50 cursor-pointer`}
                      onClick={(e) => {
                        // Don't trigger row selection when clicking on buttons
                        if ((e.target as HTMLElement).closest('button')) return;
                        
                        const isSelected = selectedUsers.includes(userData.firebaseUid);
                        if (e.ctrlKey || e.metaKey) {
                          // Multi-select with Ctrl/Cmd
                          if (isSelected) {
                            setSelectedUsers(prev => prev.filter(id => id !== userData.firebaseUid));
                          } else {
                            setSelectedUsers(prev => [...prev, userData.firebaseUid]);
                          }
                        } else {
                          // Single select
                          setSelectedUsers(isSelected ? [] : [userData.firebaseUid]);
                        }
                      }}
                    >
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(userData.firebaseUid)}
                          onChange={(e) => {
                            e.stopPropagation();
                            if (e.target.checked) {
                              setSelectedUsers(prev => [...prev, userData.firebaseUid]);
                            } else {
                              setSelectedUsers(prev => prev.filter(id => id !== userData.firebaseUid));
                            }
                          }}
                          className="rounded"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="bg-gray-100 p-2 rounded-full">
                            <User className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-medium">{userData.displayName}</div>
                            <div className="text-sm text-gray-600">{userData.email}</div>
                            <div className="text-xs text-gray-500">
                              Created {new Date(userData.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(userData.fullRole)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {getStatusBadge(userData.status)}
                          {userData.loginAttempts > 0 && (
                            <span className="text-xs text-amber-600">
                              {userData.loginAttempts} failed login{userData.loginAttempts !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{userData.department || '-'}</TableCell>
                      <TableCell>
                        {userData.lastLogin ? (
                          <div className="text-sm">
                            {new Date(userData.lastLogin).toLocaleDateString()}
                            <div className="text-xs text-gray-500">
                              {new Date(userData.lastLogin).toLocaleTimeString()}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">Never</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-1 justify-end">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/dashboard/users/${userData.firebaseUid}`);
                            }}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <User className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          
                          {isAdmin() && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditModal(userData);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {isSuperAdmin() && userData.firebaseUid !== user?.uid && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteUser(userData);
                              }}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {users.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="text-gray-500">
                          <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No users found matching your criteria</p>
                          <p className="text-sm mt-1">Try adjusting your search or filters</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}

            {/* Enhanced Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <div className="text-sm text-gray-600">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
                  <div className="text-xs text-gray-500 mt-1">
                    Use Ctrl+← → to navigate pages
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updatePagination({ page: 1 })}
                    disabled={pagination.page === 1}
                  >
                    First
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updatePagination({ page: pagination.page - 1 })}
                    disabled={!pagination.hasPrev}
                  >
                    Previous
                  </Button>
                  
                  {/* Page Numbers */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      const pageNum = Math.max(1, pagination.page - 2) + i;
                      if (pageNum > pagination.totalPages) return null;
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={pageNum === pagination.page ? "default" : "outline"}
                          size="sm"
                          onClick={() => updatePagination({ page: pageNum })}
                          className="w-8 h-8 p-0"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updatePagination({ page: pagination.page + 1 })}
                    disabled={!pagination.hasNext}
                  >
                    Next
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updatePagination({ page: pagination.totalPages })}
                    disabled={pagination.page === pagination.totalPages}
                  >
                    Last
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit User Dialog */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user information, role, and permissions.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleEditUser} className="space-y-4">
              {/* Same form fields as create, but email is disabled */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email Address</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={createForm.email}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-displayName">Full Name *</Label>
                  <Input
                    id="edit-displayName"
                    value={createForm.displayName}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, displayName: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-fullRole">Role *</Label>
                  <Select value={createForm.fullRole} onValueChange={(value: FullRole) => 
                    setCreateForm(prev => ({ ...prev, fullRole: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableRoles().map(role => (
                        <SelectItem key={role} value={role}>
                          {role.replace('_', ' ')}
                          {role === FullRole.ADMIN && !isSuperAdmin() && (
                            <span className="text-xs text-red-600 ml-2">(Super Admin Only)</span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select value={createForm.status} onValueChange={(value: UserStatus) => 
                    setCreateForm(prev => ({ ...prev, status: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {formData?.userStatuses.map(status => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-department">Department</Label>
                  <Input
                    id="edit-department"
                    value={createForm.department}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, department: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-phoneNumber">Phone Number</Label>
                  <Input
                    id="edit-phoneNumber"
                    value={createForm.phoneNumber}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Collection Permissions</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addCollectionPermission}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Permission
                  </Button>
                </div>

                {createForm.collectionPermissions.map((perm, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 border rounded">
                    <Select 
                      value={perm.collection} 
                      onValueChange={(value: Collection) => updateCollectionPermission(index, 'collection', value)}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {formData?.collections.map(collection => (
                          <SelectItem key={collection} value={collection}>{collection}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select 
                      value={perm.subRole} 
                      onValueChange={(value: SubRole) => updateCollectionPermission(index, 'subRole', value)}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {formData?.subRoles.map(subRole => (
                          <SelectItem key={subRole} value={subRole}>{subRole}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={() => removeCollectionPermission(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Update User</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    );
}
