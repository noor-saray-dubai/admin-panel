'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEnhancedAuth } from '@/hooks/useEnhancedAuth';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  Filter, 
  Download, 
  RefreshCw, 
  Search, 
  Calendar,
  User,
  Shield,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
  Keyboard
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
import { Badge } from "@/components/ui/badge";

interface AuditLog {
  _id: string;
  action: string;
  success: boolean;
  level: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  userId?: string;
  userEmail?: string;
  targetUserId?: string;
  targetUserEmail?: string;
  ip: string;
  userAgent: string;
  resource: string;
  details: any;
  timestamp: string;
  errorMessage?: string;
}

export default function AuditTrailPage() {
  const { user, loading, isSuperAdmin } = useEnhancedAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter states - initialize from URL parameters
  const [searchTerm, setSearchTerm] = useState(searchParams.get('user') || searchParams.get('search') || '');
  const [selectedLevel, setSelectedLevel] = useState<string>(searchParams.get('level') || 'all');
  const [selectedAction, setSelectedAction] = useState<string>(searchParams.get('action') || 'all');
  const [selectedSuccess, setSelectedSuccess] = useState<string>(searchParams.get('success') || 'all');
  const [dateRange, setDateRange] = useState<string>(searchParams.get('dateRange') || '7d');
  const [userFilter, setUserFilter] = useState<string>(searchParams.get('user') || '');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [logsPerPage, setLogsPerPage] = useState(20);

  // Don't redirect - show forbidden state instead (more secure)
  // The middleware and API will handle the real security

  // Fetch audit logs
  const fetchAuditLogs = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/admin/audit-logs', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch audit logs');
      }

      const data = await response.json();
      setAuditLogs(data.logs || []);
    } catch (error: any) {
      console.error('Error fetching audit logs:', error);
      setError(error.message || 'Failed to fetch audit logs');
    } finally {
      setIsLoading(false);
    }
  };

  // URL synchronization effect
  useEffect(() => {
    const url = new URL(window.location.href);
    
    // Update URL parameters
    if (searchTerm && searchTerm !== '') url.searchParams.set('search', searchTerm);
    else url.searchParams.delete('search');
    
    if (userFilter && userFilter !== '') url.searchParams.set('user', userFilter);
    else url.searchParams.delete('user');
    
    if (selectedLevel && selectedLevel !== 'all') url.searchParams.set('level', selectedLevel);
    else url.searchParams.delete('level');
    
    if (selectedAction && selectedAction !== 'all') url.searchParams.set('action', selectedAction);
    else url.searchParams.delete('action');
    
    if (selectedSuccess && selectedSuccess !== 'all') url.searchParams.set('success', selectedSuccess);
    else url.searchParams.delete('success');
    
    if (dateRange && dateRange !== '7d') url.searchParams.set('dateRange', dateRange);
    else url.searchParams.delete('dateRange');
    
    const newUrl = url.pathname + (url.search ? url.search : '');
    window.history.replaceState({}, '', newUrl);
  }, [searchTerm, userFilter, selectedLevel, selectedAction, selectedSuccess, dateRange]);

  // Filter logs based on current filters
  useEffect(() => {
    let filtered = [...auditLogs];

    // User-specific filter (when coming from individual user view)
    if (userFilter) {
      const filterTerm = userFilter.toLowerCase();
      filtered = filtered.filter(log => 
        log.userId === userFilter ||
        log.userEmail?.toLowerCase().includes(filterTerm) ||
        log.targetUserId === userFilter ||
        log.targetUserEmail?.toLowerCase().includes(filterTerm)
      );
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(log => 
        log.action.toLowerCase().includes(term) ||
        log.userEmail?.toLowerCase().includes(term) ||
        log.resource.toLowerCase().includes(term) ||
        log.ip.includes(term) ||
        log.errorMessage?.toLowerCase().includes(term)
      );
    }

    // Level filter
    if (selectedLevel !== 'all') {
      filtered = filtered.filter(log => log.level === selectedLevel);
    }

    // Action filter
    if (selectedAction !== 'all') {
      filtered = filtered.filter(log => log.action === selectedAction);
    }

    // Success filter
    if (selectedSuccess !== 'all') {
      const isSuccess = selectedSuccess === 'true';
      filtered = filtered.filter(log => log.success === isSuccess);
    }

    // Date range filter
    if (dateRange !== 'all') {
      const now = new Date();
      let startDate = new Date();
      
      switch (dateRange) {
        case '1d':
          startDate.setDate(now.getDate() - 1);
          break;
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(now.getDate() - 90);
          break;
      }
      
      if (dateRange !== 'all') {
        filtered = filtered.filter(log => 
          new Date(log.timestamp) >= startDate
        );
      }
    }

    setFilteredLogs(filtered);
    setCurrentPage(1);
  }, [auditLogs, searchTerm, userFilter, selectedLevel, selectedAction, selectedSuccess, dateRange]);
  
  // Initialize user filter from URL parameter on mount
  useEffect(() => {
    const userParam = searchParams.get('user');
    if (userParam) {
      setUserFilter(userParam);
      // Also set search term to make it visible in the search box
      setSearchTerm(userParam);
    }
  }, [searchParams]);

  // Initial load with default data
  useEffect(() => {
    if (user && isSuperAdmin()) {
      fetchAuditLogs();
    }
  }, [user]);

  // Calculate pagination values first
  const startIndex = (currentPage - 1) * logsPerPage;
  const endIndex = startIndex + logsPerPage;
  const paginatedLogs = filteredLogs.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage) || 1; // Ensure at least 1 page

  // Get unique actions for filter
  const uniqueActions = [...new Set(auditLogs.map(log => log.action))];

  // Keyboard shortcuts for pagination (now after totalPages is defined)
  useEffect(() => {
    if (totalPages <= 1) return; // Don't add shortcuts if only 1 page
    
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
      
      if (e.key === 'ArrowLeft' && currentPage > 1) {
        e.preventDefault();
        setCurrentPage(prev => prev - 1);
      } else if (e.key === 'ArrowRight' && currentPage < totalPages) {
        e.preventDefault();
        setCurrentPage(prev => prev + 1);
      } else if (e.key === 'Home' && currentPage !== 1) {
        e.preventDefault();
        setCurrentPage(1);
      } else if (e.key === 'End' && currentPage !== totalPages) {
        e.preventDefault();
        setCurrentPage(totalPages);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentPage, totalPages]);

  // Get level icon and color
  const getLevelInfo = (level: string) => {
    switch (level) {
      case 'INFO':
        return { icon: Info, color: 'text-blue-500 bg-blue-100' };
      case 'WARNING':
        return { icon: AlertTriangle, color: 'text-yellow-500 bg-yellow-100' };
      case 'ERROR':
        return { icon: XCircle, color: 'text-red-500 bg-red-100' };
      case 'CRITICAL':
        return { icon: Shield, color: 'text-red-600 bg-red-200' };
      default:
        return { icon: Info, color: 'text-gray-500 bg-gray-100' };
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!isSuperAdmin()) {
    // Show toast notification for unauthorized access
    useEffect(() => {
      if (user && !isSuperAdmin()) {
        toast({
          title: "Access Denied",
          description: "You need super administrator privileges to view audit trails.",
          variant: "destructive"
        });
        console.warn('🚨 Unauthorized access attempt to audit trail by:', user.email);
      }
    }, [user, isSuperAdmin, toast]);

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center border border-red-200">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Access Forbidden
            </h2>
            <p className="text-gray-600 mb-6">
              You don't have permission to access the audit trail. This feature requires super administrator privileges.
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700 text-sm">
                <strong>Error 403:</strong> Super Admin access required. This attempt has been logged.
              </p>
            </div>
            <div className="space-y-3">
              <Button
                onClick={() => router.push('/dashboard')}
                className="w-full bg-gray-900 text-white hover:bg-gray-800"
              >
                Go to Dashboard
              </Button>
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="w-full"
              >
                Go Back
              </Button>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Contact your administrator if you believe this is an error.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
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
          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
            <FileText className="w-4 h-4 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Audit Trail</h1>
            <p className="text-gray-600">System activity logs and user actions</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={fetchAuditLogs}
            disabled={isLoading}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
          <Button
            variant="outline"
            className="flex items-center space-x-2"
            onClick={() => {
              // TODO: Implement CSV export
              alert('CSV export feature coming soon');
            }}
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Info className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Logs</p>
                <p className="text-2xl font-bold text-gray-900">{auditLogs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Successful</p>
                <p className="text-2xl font-bold text-green-600">
                  {auditLogs.filter(log => log.success).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Failed</p>
                <p className="text-2xl font-bold text-red-600">
                  {auditLogs.filter(log => !log.success).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-4 h-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Today</p>
                <p className="text-2xl font-bold text-gray-900">
                  {auditLogs.filter(log => {
                    const today = new Date();
                    const logDate = new Date(log.timestamp);
                    return logDate.toDateString() === today.toDateString();
                  }).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Level Filter */}
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">All Levels</option>
              <option value="INFO">Info</option>
              <option value="WARNING">Warning</option>
              <option value="ERROR">Error</option>
              <option value="CRITICAL">Critical</option>
            </select>

            {/* Action Filter */}
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">All Actions</option>
              {uniqueActions.map(action => (
                <option key={action} value={action}>{action}</option>
              ))}
            </select>

            {/* Success Filter */}
            <select
              value={selectedSuccess}
              onChange={(e) => setSelectedSuccess(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">All Results</option>
              <option value="true">Successful</option>
              <option value="false">Failed</option>
            </select>

            {/* Date Range */}
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">All Time</option>
              <option value="1d">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Results Info */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center space-x-4">
          <p>
            Showing {startIndex + 1}-{Math.min(endIndex, filteredLogs.length)} of {filteredLogs.length} logs
          </p>
          <div className="flex items-center space-x-2">
            <span>Show:</span>
            <select
              value={logsPerPage}
              onChange={(e) => {
                setLogsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="flex h-8 rounded-md border border-input bg-background px-2 py-1 text-sm"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>per page</span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <p>
            {totalPages > 1 && `Page ${currentPage} of ${totalPages}`}
          </p>
          {filteredLogs.length > 0 && (
            <div className="flex items-center space-x-2 text-xs">
              <span className="px-2 py-1 bg-gray-100 rounded-md">
                {Math.round((filteredLogs.length / auditLogs.length) * 100)}% of total
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Audit Logs Table */}
      <Card>
        <CardContent className="p-0">
          {error && (
            <div className="p-4 bg-red-50 border-b border-red-200">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {isLoading ? (
            <div className="p-8 text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">Loading audit logs...</p>
            </div>
          ) : paginatedLogs.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">No audit logs found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-4 font-medium text-gray-900">Timestamp</th>
                    <th className="text-left p-4 font-medium text-gray-900">Level</th>
                    <th className="text-left p-4 font-medium text-gray-900">Action</th>
                    <th className="text-left p-4 font-medium text-gray-900">User</th>
                    <th className="text-left p-4 font-medium text-gray-900">Resource</th>
                    <th className="text-left p-4 font-medium text-gray-900">Result</th>
                    <th className="text-left p-4 font-medium text-gray-900">IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedLogs.map((log, index) => {
                    const levelInfo = getLevelInfo(log.level);
                    const LevelIcon = levelInfo.icon;
                    
                    return (
                      <tr key={log._id} className={`border-b hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                        <td className="p-4 text-sm text-gray-900 font-mono">
                          {formatTimestamp(log.timestamp)}
                        </td>
                        <td className="p-4">
                          <div className={`inline-flex items-center space-x-2 px-2 py-1 rounded-full ${levelInfo.color}`}>
                            <LevelIcon className="w-3 h-3" />
                            <span className="text-xs font-medium">{log.level}</span>
                          </div>
                        </td>
                        <td className="p-4 text-sm text-gray-900 font-medium">
                          {log.action.replace(/_/g, ' ')}
                        </td>
                        <td className="p-4 text-sm">
                          {log.userEmail ? (
                            <div className="flex items-center space-x-2">
                              <User className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-900">{log.userEmail}</span>
                            </div>
                          ) : (
                            <span className="text-gray-500">System</span>
                          )}
                        </td>
                        <td className="p-4 text-sm text-gray-600">
                          {log.resource}
                        </td>
                        <td className="p-4">
                          <Badge variant={log.success ? 'default' : 'destructive'}>
                            {log.success ? 'Success' : 'Failed'}
                          </Badge>
                        </td>
                        <td className="p-4 text-sm text-gray-600 font-mono">
                          {log.ip}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Pagination */}
      {totalPages > 1 && (
        <div className="space-y-4">
          {/* Mobile-friendly pagination */}
          <div className="md:hidden flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>

          {/* Desktop pagination */}
          <div className="hidden md:flex items-center justify-center space-x-2">
            {/* First page button */}
            {currentPage > 3 && totalPages > 5 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                >
                  1
                </Button>
                {currentPage > 4 && (
                  <span className="px-2 text-gray-500">...</span>
                )}
              </>
            )}

            {/* Previous button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            
            {/* Page numbers */}
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNumber;
                if (totalPages <= 5) {
                  pageNumber = i + 1;
                } else if (currentPage <= 3) {
                  pageNumber = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNumber = totalPages - 4 + i;
                } else {
                  pageNumber = currentPage - 2 + i;
                }

                return (
                  <Button
                    key={pageNumber}
                    variant={currentPage === pageNumber ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNumber)}
                    className={currentPage === pageNumber ? "bg-gray-900 text-white" : ""}
                  >
                    {pageNumber}
                  </Button>
                );
              })}
            </div>

            {/* Next button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>

            {/* Last page button */}
            {currentPage < totalPages - 2 && totalPages > 5 && (
              <>
                {currentPage < totalPages - 3 && (
                  <span className="px-2 text-gray-500">...</span>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                >
                  {totalPages}
                </Button>
              </>
            )}
          </div>

          {/* Jump to page and keyboard shortcuts */}
          <div className="flex flex-col items-center space-y-3">
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-gray-600">Jump to page:</span>
              <input
                type="number"
                min="1"
                max={totalPages}
                value={currentPage}
                onChange={(e) => {
                  const page = Math.max(1, Math.min(totalPages, parseInt(e.target.value) || 1));
                  setCurrentPage(page);
                }}
                className="w-16 h-8 px-2 border border-gray-300 rounded text-center"
              />
              <span className="text-gray-600">of {totalPages}</span>
            </div>
            
            {/* Keyboard shortcuts info */}
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <Keyboard className="w-3 h-3" />
              <span>Use ← → to navigate pages, Home/End for first/last page</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}