import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { EnhancedUser } from '@/models/enhancedUser';
import { AuditLog, AuditAction, AuditLevel } from '@/models/auditLog';
import { FirebaseAdminService } from '@/lib/firebaseAdmin';

export async function PUT(request: NextRequest) {
  const startTime = Date.now();
  console.log('🔄 Profile update request started');
  
  // Get client info for audit logging
  const clientInfo = {
    ip: request.headers.get('x-forwarded-for') || 
         request.headers.get('x-real-ip') || 
         'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
  };
  
  try {
    const { firebaseUid, displayName, phone, address, bio, department } = await request.json();
    
    if (!firebaseUid) {
      return NextResponse.json(
        { error: 'Firebase UID is required' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectToDatabase();
    
    // Find the user
    const user = await EnhancedUser.findOne({ firebaseUid });
    
    if (!user) {
      await logProfileUpdate(firebaseUid, null, 'User not found', clientInfo, false);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Store original values for audit log
    const originalValues = {
      displayName: user.displayName,
      phone: user.phone,
      address: user.address,
      bio: user.bio,
      department: user.department
    };

    // Update allowed fields
    const updates: any = {};
    if (displayName !== undefined) updates.displayName = displayName;
    if (phone !== undefined) updates.phone = phone;
    if (address !== undefined) updates.address = address;
    if (bio !== undefined) updates.bio = bio;
    if (department !== undefined) updates.department = department;
    
    // Add timestamp
    updates.updatedAt = new Date();

    // Update user in database
    Object.assign(user, updates);
    await user.save();

    // Update Firebase display name if changed
    if (displayName && displayName !== originalValues.displayName) {
      try {
        await FirebaseAdminService.updateUser(firebaseUid, {
          displayName: displayName,
        });
      } catch (firebaseError) {
        console.error('Firebase update error:', firebaseError);
        // Continue even if Firebase update fails
      }
    }

    // Create comprehensive audit log
    await logProfileUpdate(
      firebaseUid,
      user.email,
      'Profile updated successfully',
      clientInfo,
      true,
      {
        originalValues,
        newValues: updates,
        changedFields: Object.keys(updates).filter(key => key !== 'updatedAt'),
        processingTime: Date.now() - startTime
      }
    );

    console.log(`✅ Profile updated for ${user.email} in ${Date.now() - startTime}ms`);
    
    // Return updated user data (sanitized)
    const sanitizedUser = {
      firebaseUid: user.firebaseUid,
      email: user.email,
      displayName: user.displayName,
      phone: user.phone,
      address: user.address,
      bio: user.bio,
      department: user.department,
      updatedAt: user.updatedAt
    };

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: sanitizedUser
    });

  } catch (error: any) {
    console.error('❌ Profile update error:', error);
    
    // Log system error
    try {
      await AuditLog.create({
        action: AuditAction.USER_UPDATED,
        success: false,
        level: AuditLevel.ERROR,
        ip: clientInfo.ip,
        userAgent: clientInfo.userAgent,
        resource: 'profile',
        errorMessage: error.message,
        details: {
          error: 'System error during profile update',
          processingTime: Date.now() - startTime
        },
        timestamp: new Date()
      });
    } catch (auditError) {
      console.error('Failed to log profile update error:', auditError);
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Failed to update profile. Please try again.'
      },
      { status: 500 }
    );
  }
}

// Helper function to log profile update attempts
async function logProfileUpdate(
  firebaseUid: string | null,
  email: string | null,
  message: string,
  clientInfo: any,
  success: boolean,
  details?: any
) {
  try {
    await AuditLog.create({
      action: AuditAction.USER_UPDATED,
      success,
      level: success ? AuditLevel.INFO : AuditLevel.WARNING,
      userId: firebaseUid,
      userEmail: email,
      ip: clientInfo.ip,
      userAgent: clientInfo.userAgent,
      resource: 'profile',
      errorMessage: success ? undefined : message,
      details: {
        updateType: 'profile',
        message,
        ...details,
        timestamp: new Date().toISOString()
      },
      timestamp: new Date()
    });
  } catch (auditError) {
    console.error('Failed to log profile update attempt:', auditError);
  }
}