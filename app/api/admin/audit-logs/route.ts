import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { AuditLog } from '@/models/auditLog';
import { adminAuth } from '@/lib/firebaseAdmin';
import { EnhancedUser } from '@/models/enhancedUser';
import { ZeroTrustChecker, SystemCapability } from '@/lib/auth/zeroTrust';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const sessionCookie = request.cookies.get('__session');
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Unauthorized - No session found' },
        { status: 401 }
      );
    }

    let currentUser;
    try {
      currentUser = await adminAuth.verifySessionCookie(sessionCookie.value, true);
    } catch (error) {
      console.error('Session verification failed:', error);
      return NextResponse.json(
        { error: 'Unauthorized - Invalid session' },
        { status: 401 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // 🛡️ ZERO TRUST: Check if user has VIEW_AUDIT_TRAIL capability
    const enhancedUser = await EnhancedUser.findOne({ firebaseUid: currentUser.uid });
    if (!enhancedUser) {
      return NextResponse.json(
        { error: 'Unauthorized - User not found' },
        { status: 401 }
      );
    }

    // Use Zero Trust system to check audit trail access
    const canViewAuditTrail = ZeroTrustChecker.hasSystemCapability(
      enhancedUser, 
      SystemCapability.VIEW_AUDIT_TRAIL
    );
    
    if (!canViewAuditTrail) {
      // Log unauthorized access attempt with Zero Trust details
      try {
        await AuditLog.create({
          action: 'AUDIT_TRAIL_ACCESS_DENIED',
          success: false,
          level: 'WARNING',
          userId: currentUser.uid,
          userEmail: enhancedUser.email || currentUser.email || 'unknown',
          ip: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
          resource: 'audit-logs',
          errorMessage: `Zero Trust: Unauthorized audit trail access attempt by ${enhancedUser.fullRole}`,
          details: {
            attemptedPath: '/dashboard/settings/audit-trail',
            userRole: enhancedUser.fullRole,
            requiredCapability: SystemCapability.VIEW_AUDIT_TRAIL,
            isSystemAdmin: ZeroTrustChecker.isSystemAdmin(enhancedUser),
            isSuperAdmin: ZeroTrustChecker.isSuperAdmin(enhancedUser),
            securitySystem: 'ZeroTrust',
            timestamp: new Date().toISOString()
          },
          timestamp: new Date()
        });
        console.log(`🚨 Zero Trust: Unauthorized audit trail access attempt by ${enhancedUser.email} (Role: ${enhancedUser.fullRole})`);
      } catch (auditError) {
        console.error('Failed to log unauthorized access attempt:', auditError);
      }
      
      return NextResponse.json(
        { error: 'Forbidden - Audit trail access requires system admin privileges' },
        { status: 403 }
      );
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const skip = parseInt(searchParams.get('skip') || '0');
    const level = searchParams.get('level');
    const action = searchParams.get('action');
    const success = searchParams.get('success');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build query filter
    const filter: any = {};
    
    if (level && level !== 'all') {
      filter.level = level;
    }
    
    if (action && action !== 'all') {
      filter.action = action;
    }
    
    if (success && success !== 'all') {
      filter.success = success === 'true';
    }
    
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) {
        filter.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.timestamp.$lte = new Date(endDate);
      }
    }

    // Fetch audit logs with filtering and pagination
    const auditLogs = await AuditLog.find(filter)
      .sort({ timestamp: -1 }) // Most recent first
      .limit(Math.min(limit, 1000)) // Cap at 1000 for performance
      .skip(skip)
      .lean(); // For better performance

    // Get total count for pagination
    const totalCount = await AuditLog.countDocuments(filter);

    // Get summary statistics
    const stats = await AuditLog.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalLogs: { $sum: 1 },
          successfulLogs: {
            $sum: { $cond: [{ $eq: ['$success', true] }, 1, 0] }
          },
          failedLogs: {
            $sum: { $cond: [{ $eq: ['$success', false] }, 1, 0] }
          },
          infoLogs: {
            $sum: { $cond: [{ $eq: ['$level', 'INFO'] }, 1, 0] }
          },
          warningLogs: {
            $sum: { $cond: [{ $eq: ['$level', 'WARNING'] }, 1, 0] }
          },
          errorLogs: {
            $sum: { $cond: [{ $eq: ['$level', 'ERROR'] }, 1, 0] }
          },
          criticalLogs: {
            $sum: { $cond: [{ $eq: ['$level', 'CRITICAL'] }, 1, 0] }
          }
        }
      }
    ]);

    // Get recent activity summary (last 24 hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const recentActivity = await AuditLog.countDocuments({
      ...filter,
      timestamp: { $gte: yesterday }
    });

    // Get unique actions for filter options
    const uniqueActions = await AuditLog.distinct('action', filter);

    console.log(`✅ Zero Trust: Fetched ${auditLogs.length} audit logs for system admin: ${enhancedUser.email} (Role: ${enhancedUser.fullRole})`);

    return NextResponse.json({
      success: true,
      logs: auditLogs,
      pagination: {
        total: totalCount,
        limit,
        skip,
        hasMore: totalCount > skip + limit
      },
      stats: stats[0] || {
        totalLogs: 0,
        successfulLogs: 0,
        failedLogs: 0,
        infoLogs: 0,
        warningLogs: 0,
        errorLogs: 0,
        criticalLogs: 0
      },
      recentActivity,
      uniqueActions: uniqueActions.sort(),
      message: 'Audit logs retrieved successfully'
    });

  } catch (error: any) {
    console.error('❌ Error fetching audit logs:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Failed to fetch audit logs',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// Optional: Export logs as CSV
export async function POST(request: NextRequest) {
  try {
    // Verify authentication and super admin status
    const sessionCookie = request.cookies.get('__session');
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    let currentUser;
    try {
      currentUser = await adminAuth.verifySessionCookie(sessionCookie.value, true);
    } catch (error) {
      console.error('Session verification failed:', error);
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const enhancedUser = await EnhancedUser.findOne({ firebaseUid: currentUser.uid });
    if (!enhancedUser) {
      return NextResponse.json(
        { error: 'Unauthorized - User not found' },
        { status: 401 }
      );
    }

    // 🛡️ ZERO TRUST: Check audit trail access for CSV export
    const canViewAuditTrail = ZeroTrustChecker.hasSystemCapability(
      enhancedUser, 
      SystemCapability.VIEW_AUDIT_TRAIL
    );
    
    if (!canViewAuditTrail) {
      // Log unauthorized export attempt
      try {
        await AuditLog.create({
          action: 'AUDIT_LOGS_EXPORT_DENIED',
          success: false,
          level: 'WARNING',
          userId: currentUser.uid,
          userEmail: enhancedUser.email,
          ip: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
          resource: 'audit-logs',
          errorMessage: `Zero Trust: Unauthorized audit trail export attempt by ${enhancedUser.fullRole}`,
          details: {
            attemptedAction: 'CSV_export',
            userRole: enhancedUser.fullRole,
            requiredCapability: SystemCapability.VIEW_AUDIT_TRAIL,
            securitySystem: 'ZeroTrust',
            timestamp: new Date().toISOString()
          },
          timestamp: new Date()
        });
      } catch (auditError) {
        console.error('Failed to log unauthorized export attempt:', auditError);
      }
      
      return NextResponse.json(
        { error: 'Forbidden - Audit trail export requires system admin privileges' },
        { status: 403 }
      );
    }

    const { filters } = await request.json();

    // Build the same filter as GET request
    const filter: any = {};
    if (filters.level && filters.level !== 'all') {
      filter.level = filters.level;
    }
    if (filters.action && filters.action !== 'all') {
      filter.action = filters.action;
    }
    if (filters.success && filters.success !== 'all') {
      filter.success = filters.success === 'true';
    }
    if (filters.startDate || filters.endDate) {
      filter.timestamp = {};
      if (filters.startDate) {
        filter.timestamp.$gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        filter.timestamp.$lte = new Date(filters.endDate);
      }
    }

    // Fetch all matching logs (limit to 10000 for export)
    const auditLogs = await AuditLog.find(filter)
      .sort({ timestamp: -1 })
      .limit(10000)
      .lean();

    // Convert to CSV format
    const headers = [
      'Timestamp',
      'Level', 
      'Action',
      'Success',
      'User Email',
      'User ID',
      'IP Address',
      'Resource',
      'User Agent',
      'Error Message',
      'Details'
    ];

    const csvRows = [
      headers.join(','),
      ...auditLogs.map(log => [
        `"${new Date(log.timestamp).toISOString()}"`,
        `"${log.level}"`,
        `"${log.action}"`,
        `"${log.success}"`,
        `"${log.userEmail || 'N/A'}"`,
        `"${log.userId || 'N/A'}"`,
        `"${log.ip}"`,
        `"${log.resource}"`,
        `"${(log.userAgent || '').replace(/"/g, '""')}"`,
        `"${(log.errorMessage || '').replace(/"/g, '""')}"`,
        `"${JSON.stringify(log.details || {}).replace(/"/g, '""')}"`
      ].join(','))
    ];

    const csvContent = csvRows.join('\\n');
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `audit-logs-${timestamp}.csv`;

    // Log the export action
    await AuditLog.create({
      action: 'AUDIT_LOGS_EXPORTED',
      success: true,
      level: 'INFO',
      userId: currentUser.uid,
      userEmail: enhancedUser.email,
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      resource: 'audit-logs',
      details: {
        exportedCount: auditLogs.length,
        filters: filters,
        timestamp: new Date().toISOString()
      },
      timestamp: new Date()
    });

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error: any) {
    console.error('❌ Error exporting audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to export audit logs' },
      { status: 500 }
    );
  }
}