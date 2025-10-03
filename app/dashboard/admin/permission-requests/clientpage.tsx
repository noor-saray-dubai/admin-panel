

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/toast-system';
import { 
  Shield, 
  Search,
  Filter,
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  User,
  Calendar,
  MessageSquare,
  FileText,
  ArrowLeft,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  RefreshCw,
  Users,
  TrendingUp
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Collection, SubRole, FullRole } from '@/types/user';

interface PermissionRequest {
  _id: string;
  requestedBy: string;
  requestedByName: string;
  requestedByEmail: string;
  requestedPermissions: {
    collection: Collection;
    subRole: SubRole;
  }[];
  message: string;
  businessJustification?: string;
  requestedExpiry?: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  grantedPermissions?: {
    collection: Collection;
    subRole: SubRole;
  }[];
  createdAt: string;
  updatedAt: string;
}

interface RequestStats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

export default function AdminPermissionRequestsPage() {
  const { user, loading, isSystemAdmin, isSuperAdmin } = useAuth();
  const { success, error: showError, info } = useToast();
  const router = useRouter();
  
  // States
  const [requests, setRequests] = useState<PermissionRequest[]>([]);
  const [stats, setStats] = useState<RequestStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<PermissionRequest | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  
  // Review form states
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [reviewNotes, setReviewNotes] = useState('');
  const [grantedExpiry, setGrantedExpiry] = useState('');
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('pending');

  // Check admin access
  useEffect(() => {
    if (!loading && user && !isSystemAdmin() && !isSuperAdmin()) {
      showError('Access Denied', 'System admin privileges required to access this page.');
      router.push('/dashboard');
      return;
    }
  }, [user, loading, isSystemAdmin, isSuperAdmin, router, showError]);

  // Load requests
  useEffect(() => {
    if (user && (isSystemAdmin() || isSuperAdmin())) {
      fetchRequests();
    }
  }, [user, isSystemAdmin, isSuperAdmin, statusFilter]);

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      
      const response = await fetch(`/api/permission-requests?${params.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        setRequests(data.requests || []);
        setStats(data.stats);
      } else {
        showError('Load Failed', data.error || 'Failed to load permission requests');
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      showError('Network Error', 'Failed to load permission requests');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReviewRequest = async () => {
    if (!selectedRequest) return;
    
    if (reviewAction === 'reject' && !reviewNotes.trim()) {
      showError('Review Notes Required', 'Please provide a reason for rejection');
      return;
    }
    
    setIsReviewing(true);
    
    try {
      const requestData = {
        requestId: selectedRequest._id,
        action: reviewAction,
        reviewNotes: reviewNotes.trim(),
        ...(grantedExpiry && { grantedExpiry: new Date(grantedExpiry).toISOString() })
      };
      
      const response = await fetch('/api/permission-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        const actionText = reviewAction === 'approve' ? 'approved' : 'rejected';
        success(
          `Request ${actionText.charAt(0).toUpperCase() + actionText.slice(1)}`,
          `Permission request has been ${actionText} successfully.`
        );
        
        // Refresh requests list
        await fetchRequests();
        
        // Close dialog and reset form
        setReviewDialogOpen(false);
        setSelectedRequest(null);
        setReviewNotes('');
        setGrantedExpiry('');
      } else {
        showError('Review Failed', data.error || 'Failed to review request');
      }
    } catch (error) {
      console.error('Error reviewing request:', error);
      showError('Network Error', 'Failed to submit review');
    } finally {
      setIsReviewing(false);
    }
  };

  const openReviewDialog = (request: PermissionRequest, action: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setReviewAction(action);
    setReviewNotes('');
    setGrantedExpiry('');
    setReviewDialogOpen(true);
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

  // Filter requests based on search and filters
  const filteredRequests = requests.filter(request => {
    if (activeTab !== 'all' && request.status !== activeTab) return false;
    if (priorityFilter !== 'all' && request.priority !== priorityFilter) return false;
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        request.requestedByName.toLowerCase().includes(searchLower) ||
        request.requestedByEmail.toLowerCase().includes(searchLower) ||
        request.message.toLowerCase().includes(searchLower) ||
        request.requestedPermissions.some(p => 
          p.collection.toLowerCase().includes(searchLower) ||
          p.subRole.toLowerCase().includes(searchLower)
        )
      );
    }
    
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user || (!isSystemAdmin() && !isSuperAdmin())) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/settings')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Settings</span>
          </Button>
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <Shield className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Permission Request Management</h1>
            <p className="text-gray-600">Review and manage user permission requests</p>
          </div>
        </div>
        <Button onClick={fetchRequests} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by user, email, message, or permissions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requests Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pending ({stats?.pending || 0})
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Approved
          </TabsTrigger>
          <TabsTrigger value="rejected" className="flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            Rejected
          </TabsTrigger>
          <TabsTrigger value="all" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            All Requests
          </TabsTrigger>
        </TabsList>

        {/* Requests List */}
        <TabsContent value={activeTab}>
          <Card>
            <CardHeader>
              <CardTitle>Permission Requests</CardTitle>
              <CardDescription>
                {filteredRequests.length} request{filteredRequests.length !== 1 ? 's' : ''} found
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : filteredRequests.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No permission requests found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Permissions</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRequests.map((request) => (
                        <TableRow key={request._id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{request.requestedByName}</p>
                              <p className="text-sm text-gray-500">{request.requestedByEmail}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {request.requestedPermissions.map((perm, i) => (
                                <Badge key={i} variant="outline" className="mr-1">
                                  {perm.collection.replace('_', ' ')} - {perm.subRole.replace('_', ' ')}
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
                            <div>
                              <p className="text-sm">
                                {new Date(request.createdAt).toLocaleDateString()}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(request.createdAt).toLocaleTimeString()}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              {request.status === 'pending' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openReviewDialog(request, 'approve')}
                                    className="text-green-600 border-green-300 hover:bg-green-50"
                                  >
                                    <ThumbsUp className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openReviewDialog(request, 'reject')}
                                    className="text-red-600 border-red-300 hover:bg-red-50"
                                  >
                                    <ThumbsDown className="h-3 w-3" />
                                  </Button>
                                </>
                              )}
                            </div>
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

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {reviewAction === 'approve' ? 'Approve' : 'Reject'} Permission Request
            </DialogTitle>
            <DialogDescription>
              Review the permission request and provide your decision.
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4">
              {/* Request Details */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div>
                  <Label className="font-medium">Requested by:</Label>
                  <p className="text-sm">{selectedRequest.requestedByName} ({selectedRequest.requestedByEmail})</p>
                </div>
                
                <div>
                  <Label className="font-medium">Requested Permissions:</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedRequest.requestedPermissions.map((perm, i) => (
                      <Badge key={i} variant="outline">
                        {perm.collection.replace('_', ' ')} - {perm.subRole.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <Label className="font-medium">Message:</Label>
                  <p className="text-sm bg-white p-2 rounded border">{selectedRequest.message}</p>
                </div>
                
                {selectedRequest.businessJustification && (
                  <div>
                    <Label className="font-medium">Business Justification:</Label>
                    <p className="text-sm bg-white p-2 rounded border">{selectedRequest.businessJustification}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="font-medium">Priority:</Label>
                    <div className="mt-1">{getPriorityBadge(selectedRequest.priority)}</div>
                  </div>
                  <div>
                    <Label className="font-medium">Requested:</Label>
                    <p className="text-sm">{new Date(selectedRequest.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                
                {selectedRequest.requestedExpiry && (
                  <div>
                    <Label className="font-medium">Requested Expiry:</Label>
                    <p className="text-sm">{new Date(selectedRequest.requestedExpiry).toLocaleDateString()}</p>
                  </div>
                )}
              </div>

              {/* Review Form */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="reviewNotes" className="font-medium">
                    Review Notes {reviewAction === 'reject' && <span className="text-red-500">*</span>}
                  </Label>
                  <Textarea
                    id="reviewNotes"
                    placeholder={
                      reviewAction === 'approve' 
                        ? "Optional notes about the approval..." 
                        : "Please provide a reason for rejection..."
                    }
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    rows={3}
                    maxLength={1000}
                    className="mt-1"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {reviewNotes.length}/1000 characters
                  </div>
                </div>

                {reviewAction === 'approve' && selectedRequest.requestedExpiry && (
                  <div>
                    <Label htmlFor="grantedExpiry" className="font-medium">
                      Granted Expiry Date (Optional)
                    </Label>
                    <Input
                      id="grantedExpiry"
                      type="date"
                      value={grantedExpiry}
                      onChange={(e) => setGrantedExpiry(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Leave empty to use the requested expiry date
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setReviewDialogOpen(false)}
                  disabled={isReviewing}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleReviewRequest}
                  disabled={isReviewing || (reviewAction === 'reject' && !reviewNotes.trim())}
                  className={
                    reviewAction === 'approve' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  }
                >
                  {isReviewing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : reviewAction === 'approve' ? (
                    <ThumbsUp className="h-4 w-4 mr-2" />
                  ) : (
                    <ThumbsDown className="h-4 w-4 mr-2" />
                  )}
                  {reviewAction === 'approve' ? 'Approve Request' : 'Reject Request'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}