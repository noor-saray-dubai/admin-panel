//app/dashboard/settings/permission-requests/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useEnhancedAuth } from '@/hooks/useEnhancedAuth';
import { 
  Shield, 
  Plus, 
  Minus, 
  Send, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  User,
  Calendar,
  MessageSquare,
  FileText,
  ArrowLeft,
  Info,
  Loader2
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from 'sonner';

// Import the enums (adjust path as needed)
import { Collection, SubRole, FullRole } from '@/types/user';

interface PermissionRequestForm {
  collection: Collection;
  subRole: SubRole;
}

interface PermissionRequest {
  _id: string;
  requestedPermissions: PermissionRequestForm[];
  message: string;
  businessJustification?: string;
  requestedExpiry?: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  createdAt: string;
}

export default function PermissionRequestPage() {
  const { user, loading, isSuperAdmin, getAccessibleCollections, getUserSubRoleForCollection } = useEnhancedAuth();
  const router = useRouter();
  
  // Form state for new request
  const [requestForm, setRequestForm] = useState<PermissionRequestForm[]>([
    { collection: Collection.PROJECTS, subRole: SubRole.OBSERVER }
  ]);
  const [message, setMessage] = useState('');
  const [businessJustification, setBusinessJustification] = useState('');
  const [requestedExpiry, setRequestedExpiry] = useState('permanent');
  const [priority, setPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal');
  const [customExpiry, setCustomExpiry] = useState('');
  
  // State management
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingRequests, setExistingRequests] = useState<PermissionRequest[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);
  const [activeTab, setActiveTab] = useState('new-request');

  // Redirect super admins (disabled for testing)
  // useEffect(() => {
  //   if (!loading && user && isSuperAdmin()) {
  //     toast.error('Super administrators already have all permissions');
  //     router.push('/dashboard/settings');
  //     return;
  //   }
  // }, [user, loading, isSuperAdmin, router]);

  // Load existing requests
  useEffect(() => {
    if (user && !isSuperAdmin()) {
      fetchExistingRequests();
    }
  }, [user, isSuperAdmin]);

  const fetchExistingRequests = async () => {
    try {
      setIsLoadingRequests(true);
      const response = await fetch('/api/permission-requests');
      const data = await response.json();
      
      if (data.success) {
        setExistingRequests(data.requests);
      } else {
        toast.error('Failed to load existing requests');
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Error loading requests');
    } finally {
      setIsLoadingRequests(false);
    }
  };

  // Check if user already has a specific permission
  const hasPermission = (collection: Collection, subRole: SubRole) => {
    const userSubRole = getUserSubRoleForCollection(collection);
    if (!userSubRole) return false;
    
    // Role hierarchy - if user has higher role, they already have the requested access
    const roleHierarchy = {
      [SubRole.OBSERVER]: 1,
      [SubRole.CONTRIBUTOR]: 2,
      [SubRole.MODERATOR]: 3,
      [SubRole.COLLECTION_ADMIN]: 4
    };
    
    const currentLevel = roleHierarchy[userSubRole as SubRole] || 0;
    const requestedLevel = roleHierarchy[subRole] || 0;
    
    return currentLevel >= requestedLevel;
  };

  // Get available collections that user doesn't have access to
  const getAvailableCollections = () => {
    return Object.values(Collection).filter(collection => 
      !getAccessibleCollections().includes(collection)
    );
  };

  // Validate form and check if submit should be enabled
  const isFormValid = () => {
    // Check if message is provided
    if (!message.trim()) return false;
    
    // Check if at least one permission is selected
    if (requestForm.length === 0) return false;
    
    // Check for duplicates
    const permissionKeys = new Set();
    const hasDuplicates = requestForm.some(perm => {
      const key = `${perm.collection}-${perm.subRole}`;
      if (permissionKeys.has(key)) return true;
      permissionKeys.add(key);
      return false;
    });
    
    if (hasDuplicates) return false;
    
    // Check if user already has any of the requested permissions
    const hasExistingPermissions = requestForm.some(perm => 
      hasPermission(perm.collection, perm.subRole)
    );
    
    if (hasExistingPermissions) return false;
    
    // Check if custom expiry date is valid when selected
    if (requestedExpiry === 'custom') {
      if (!customExpiry) return false;
      const expiry = new Date(customExpiry);
      if (expiry <= new Date()) return false;
    }
    
    return true;
  };

  const addPermission = () => {
    setRequestForm(prev => [...prev, { collection: Collection.PROJECTS, subRole: SubRole.OBSERVER }]);
  };

  const removePermission = (index: number) => {
    if (requestForm.length > 1) {
      setRequestForm(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updatePermission = (index: number, field: keyof PermissionRequestForm, value: any) => {
    setRequestForm(prev => prev.map((perm, i) =>
      i === index ? { ...perm, [field]: value } : perm
    ));
  };

  const handleSubmit = async () => {
    // Validation
    if (!message.trim()) {
      toast.error('Please provide a message explaining why you need these permissions');
      return;
    }

    if (requestForm.length === 0) {
      toast.error('Please select at least one permission');
      return;
    }

    // Check for duplicates
    const permissionKeys = new Set();
    const hasDuplicates = requestForm.some(perm => {
      const key = `${perm.collection}-${perm.subRole}`;
      if (permissionKeys.has(key)) return true;
      permissionKeys.add(key);
      return false;
    });

    if (hasDuplicates) {
      toast.error('Duplicate permissions detected. Please remove duplicates.');
      return;
    }

    // Check if user already has requested permissions
    const existingPermissions = requestForm.filter(perm => 
      hasPermission(perm.collection, perm.subRole)
    );

    if (existingPermissions.length > 0) {
      const permissionNames = existingPermissions.map(p => 
        `${p.collection.replace('_', ' ')} (${p.subRole.replace('_', ' ')})`
      ).join(', ');
      toast.error(`You already have these permissions: ${permissionNames}`);
      return;
    }

    // Prepare expiry date
    let expiry = null;
    if (requestedExpiry === 'custom' && customExpiry) {
      expiry = new Date(customExpiry);
      if (expiry <= new Date()) {
        toast.error('Expiry date must be in the future');
        return;
      }
    } else if (requestedExpiry !== 'permanent') {
      expiry = new Date();
      const days = parseInt(requestedExpiry);
      expiry.setDate(expiry.getDate() + days);
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/permission-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestedPermissions: requestForm,
          message: message.trim(),
          businessJustification: businessJustification.trim(),
          requestedExpiry: expiry?.toISOString() || 'permanent',
          priority
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Permission request submitted successfully!');
        
        // Reset form
        setRequestForm([{ collection: Collection.PROJECTS, subRole: SubRole.OBSERVER }]);
        setMessage('');
        setBusinessJustification('');
        setRequestedExpiry('permanent');
        setPriority('normal');
        setCustomExpiry('');
        
        // Refresh existing requests and switch to history tab
        await fetchExistingRequests();
        setActiveTab('request-history');
      } else {
        toast.error(data.error || 'Failed to submit request');
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { variant: "secondary" as const, icon: Clock, color: "text-yellow-600" },
      approved: { variant: "default" as const, icon: CheckCircle, color: "text-green-600" },
      rejected: { variant: "destructive" as const, icon: XCircle, color: "text-red-600" },
      expired: { variant: "outline" as const, icon: AlertTriangle, color: "text-gray-600" }
    };

    const config = variants[status as keyof typeof variants] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className={`h-3 w-3 ${config.color}`} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      low: "bg-gray-100 text-gray-800",
      normal: "bg-blue-100 text-blue-800", 
      high: "bg-orange-100 text-orange-800",
      urgent: "bg-red-100 text-red-800"
    };

    return (
      <Badge variant="outline" className={colors[priority as keyof typeof colors]}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Show warning for super admins but allow access for testing
  const showSuperAdminWarning = isSuperAdmin();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </Button>
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <Shield className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Permission Requests</h1>
            <p className="text-gray-600">Request additional permissions for your account</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="new-request" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Request
          </TabsTrigger>
          <TabsTrigger value="request-history" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Request History
          </TabsTrigger>
        </TabsList>

        {/* New Request Tab */}
        <TabsContent value="new-request">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Request Additional Permissions</CardTitle>
                  <CardDescription>
                    Select the permissions you need and provide justification for your request
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Permissions Section */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <Label className="text-base font-medium">Requested Permissions</Label>
                      <Button onClick={addPermission} size="sm" variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Permission
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      {requestForm.map((permission, index) => (
                        <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                          <div className="flex-1 grid grid-cols-2 gap-3">
                            <div>
                              <Label>Collection</Label>
                              <Select
                                value={permission.collection}
                                onValueChange={(value) => updatePermission(index, 'collection', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {Object.values(Collection).map((collection) => {
                                    const hasAccess = getAccessibleCollections().includes(collection);
                                    return (
                                      <SelectItem key={collection} value={collection}>
                                        <div className="flex items-center justify-between w-full">
                                          <span>{collection.charAt(0).toUpperCase() + collection.slice(1)}</span>
                                          {hasAccess && (
                                            <Badge variant="outline" className="ml-2 text-xs">
                                              Current
                                            </Badge>
                                          )}
                                        </div>
                                      </SelectItem>
                                    );
                                  })}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div>
                              <Label>Access Level</Label>
                              <Select
                                value={permission.subRole}
                                onValueChange={(value) => updatePermission(index, 'subRole', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {Object.values(SubRole).map((subRole) => {
                                    const alreadyHas = hasPermission(permission.collection, subRole);
                                    return (
                                      <SelectItem key={subRole} value={subRole} disabled={alreadyHas}>
                                        <div className="flex items-center justify-between w-full">
                                          <span className={alreadyHas ? 'text-gray-500' : ''}>
                                            {subRole.charAt(0).toUpperCase() + subRole.slice(1)}
                                          </span>
                                          {alreadyHas && (
                                            <Badge variant="outline" className="ml-2 text-xs text-green-600">
                                              ✓ Have
                                            </Badge>
                                          )}
                                        </div>
                                      </SelectItem>
                                    );
                                  })}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          
                          {requestForm.length > 1 && (
                            <Button
                              onClick={() => removePermission(index)}
                              variant="outline"
                              size="sm"
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Message Section */}
                  <div>
                    <Label htmlFor="message" className="text-base font-medium">
                      Justification Message *
                    </Label>
                    <Textarea
                      id="message"
                      placeholder="Explain why you need these permissions and how they will help you in your role..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={4}
                      maxLength={1000}
                      className="mt-1"
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      {message.length}/1000 characters
                    </div>
                  </div>

                  {/* Business Justification */}
                  <div>
                    <Label htmlFor="businessJustification" className="text-base font-medium">
                      Additional Business Justification
                    </Label>
                    <Textarea
                      id="businessJustification"
                      placeholder="Provide additional context about business needs, project requirements, etc. (optional)"
                      value={businessJustification}
                      onChange={(e) => setBusinessJustification(e.target.value)}
                      rows={3}
                      maxLength={2000}
                      className="mt-1"
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      {businessJustification.length}/2000 characters
                    </div>
                  </div>

                  {/* Expiry and Priority */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-base font-medium">Permission Expiry</Label>
                      <Select value={requestedExpiry} onValueChange={setRequestedExpiry}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="permanent">Permanent</SelectItem>
                          <SelectItem value="30">30 Days</SelectItem>
                          <SelectItem value="90">90 Days</SelectItem>
                          <SelectItem value="180">6 Months</SelectItem>
                          <SelectItem value="365">1 Year</SelectItem>
                          <SelectItem value="custom">Custom Date</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label className="text-base font-medium">Priority</Label>
                      <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Custom Expiry Date */}
                  {requestedExpiry === 'custom' && (
                    <div>
                      <Label htmlFor="customExpiry" className="text-base font-medium">
                        Custom Expiry Date
                      </Label>
                      <Input
                        id="customExpiry"
                        type="date"
                        value={customExpiry}
                        onChange={(e) => setCustomExpiry(e.target.value)}
                        min={new Date(Date.now() + 86400000).toISOString().split('T')[0]} // Tomorrow
                        className="mt-1"
                      />
                    </div>
                  )}

                  {/* Validation Status */}
                  {!isFormValid() && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <div className="flex items-start space-x-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium text-yellow-800 mb-1">Please complete the form:</p>
                          <ul className="text-yellow-700 space-y-1 text-xs">
                            {!message.trim() && <li>• Add a justification message</li>}
                            {requestForm.length === 0 && <li>• Select at least one permission</li>}
                            {requestForm.some(perm => hasPermission(perm.collection, perm.subRole)) && 
                              <li>• Remove permissions you already have</li>}
                            {requestedExpiry === 'custom' && !customExpiry && <li>• Set a custom expiry date</li>}
                            {requestedExpiry === 'custom' && customExpiry && new Date(customExpiry) <= new Date() && 
                              <li>• Expiry date must be in the future</li>}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="flex justify-end pt-4 border-t">
                    <Button 
                      onClick={handleSubmit} 
                      disabled={isSubmitting || !isFormValid()}
                      className={!isFormValid() && !isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      Submit Request
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Info Sidebar */}
            <div className="space-y-4">
              {/* Current Permissions Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Current Permissions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {getAccessibleCollections().length > 0 ? (
                    getAccessibleCollections().map((collection) => {
                      const subRole = getUserSubRoleForCollection(collection);
                      return (
                        <div key={collection} className="flex justify-between items-center py-1">
                          <span className="font-medium capitalize">
                            {collection.replace('_', ' ')}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {subRole?.replace('_', ' ')}
                          </Badge>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-gray-500 text-center py-2">No permissions assigned</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Request Guidelines
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                    <p>Clearly explain why you need each permission</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                    <p>Specify the business context or project requirements</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                    <p>Choose appropriate expiry dates for temporary access</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                    <p>Set priority based on urgency of your needs</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Access Levels</CardTitle>
                  <CardDescription className="text-xs">
                    These are collection-specific permissions only
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="font-medium">Observer</span>
                      <span className="text-gray-600">View only</span>
                    </div>
                    <p className="text-xs text-gray-500">Can browse and read content</p>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="font-medium">Contributor</span>
                      <span className="text-gray-600">Create & edit</span>
                    </div>
                    <p className="text-xs text-gray-500">Can add new content and edit existing items</p>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="font-medium">Moderator</span>
                      <span className="text-gray-600">Approve & manage</span>
                    </div>
                    <p className="text-xs text-gray-500">Can approve/reject content and moderate discussions</p>
                  </div>
                  
                  <div className="space-y-1 border-t pt-2">
                    <div className="flex justify-between">
                      <span className="font-medium text-red-600">Collection Admin</span>
                      <span className="text-red-600">Full collection control</span>
                    </div>
                    <p className="text-xs text-red-500">
                      Complete control over this collection only.
                      <br />For system admin access, contact super admin.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Request History Tab */}
        <TabsContent value="request-history">
          <Card>
            <CardHeader>
              <CardTitle>Your Permission Requests</CardTitle>
              <CardDescription>
                Track the status of your submitted permission requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingRequests ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : existingRequests.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No permission requests found</p>
                  <Button
                    onClick={() => setActiveTab('new-request')}
                    variant="outline"
                    className="mt-4"
                  >
                    Submit Your First Request
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Permissions</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Reviewed By</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {existingRequests.map((request) => (
                        <TableRow key={request._id}>
                          <TableCell>
                            <div className="space-y-1">
                              {request.requestedPermissions.map((perm, i) => (
                                <Badge key={i} variant="outline" className="mr-1">
                                  {perm.collection} - {perm.subRole}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <p className="truncate" title={request.message}>
                              {request.message}
                            </p>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(request.status)}
                          </TableCell>
                          <TableCell>
                            {getPriorityBadge(request.priority)}
                          </TableCell>
                          <TableCell>
                            {new Date(request.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {request.reviewedBy || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}