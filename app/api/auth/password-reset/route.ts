import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { EnhancedUser } from '@/models/enhancedUser';
import { AuditLog, AuditAction, AuditLevel } from '@/models/auditLog';
import { FirebaseAdminService } from '@/lib/firebaseAdmin';
import EmailService from '@/lib/emailService';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log('🔐 Password reset request started');
  
  // Get client info for audit logging
  const clientInfo = {
    ip: request.headers.get('x-forwarded-for') || 
         request.headers.get('x-real-ip') || 
         'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
  };
  
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectToDatabase();
    
    // Find the user in our database first
    const user = await EnhancedUser.findOne({ 
      email: email.toLowerCase() 
    });
    
    if (!user) {
      // For security, don't reveal if user exists or not
      // Log the attempt but return success message
      await logPasswordResetAttempt(
        null,
        email,
        'Password reset attempted for non-existent user',
        clientInfo,
        false
      );
      
      // Still return success to prevent email enumeration
      return NextResponse.json({
        success: true,
        message: 'If an account with this email exists, a password reset link will be sent.'
      });
    }

    // Check if user account is active
    if (user.status === 'suspended' || user.status === 'deleted') {
      await logPasswordResetAttempt(
        user.firebaseUid,
        email,
        `Password reset attempted for ${user.status} account`,
        clientInfo,
        false
      );
      
      // Return generic message for security
      return NextResponse.json({
        success: true,
        message: 'If an account with this email exists, a password reset link will be sent.'
      });
    }

    // Generate direct password reset link to our custom page
    try {
      // Get the app URL - FORCE production URL for Noorsaray
      const host = request.headers.get('host');
      console.log('🌐 Request host:', host);
      console.log('📝 Environment check:', {
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
        NODE_ENV: process.env.NODE_ENV,
        VERCEL_URL: process.env.VERCEL_URL
      });
      
      let appUrl;
      
      // Priority order for URL detection
      if (process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes('localhost')) {
        appUrl = process.env.NEXT_PUBLIC_APP_URL;
        console.log('✅ Using NEXT_PUBLIC_APP_URL:', appUrl);
      } else if (host && host.includes('noorsaray.com')) {
        appUrl = `https://${host}`;
        console.log('✅ Detected Noorsaray domain:', appUrl);
      } else if (host && host.includes('.vercel.app')) {
        appUrl = `https://${host}`;
        console.log('✅ Detected Vercel domain:', appUrl);
      } else if (process.env.VERCEL_URL) {
        appUrl = `https://${process.env.VERCEL_URL}`;
        console.log('✅ Using VERCEL_URL:', appUrl);
      } else {
        // For local development, use localhost; for production, use your domain
        if (host === 'localhost:3000' || host?.includes('localhost')) {
          appUrl = 'http://localhost:3000'; // Development only
          console.log('🛠️ Using localhost for development:', appUrl);
        } else {
          // Production - always use your configured domain
          appUrl = 'https://admin.noorsaray.com';
          console.log('✅ Using production domain:', appUrl);
        }
      }
      
      // Ensure URL has proper protocol
      if (!appUrl.startsWith('http')) {
        appUrl = `https://${appUrl}`;
      }
      
      console.log('🔗 Final app URL for password reset:', appUrl);
      
      // Generate Firebase reset link that goes DIRECTLY to our reset page
      const actionCodeSettings = {
        url: `${appUrl}/login`, // After successful reset, redirect to login
        handleCodeInApp: true, // This tells Firebase to use YOUR custom page
      };
      
      // Note: You also need to set the Action URL in Firebase Console to:
      // https://admin.noorsaray.com/auth/reset-password
      // This will make the link go directly to your page instead of Firebase's handler
      
      console.log('⚙️ Action code settings:', actionCodeSettings);
      
      const resetLink = await FirebaseAdminService.generatePasswordResetLink(email, actionCodeSettings);
      
      console.log('✅ Generated reset link:', resetLink);

      console.log('✅ Password reset link generated');

      // Send custom password reset email using Nodemailer
      await EmailService.sendPasswordReset(
        email,
        user.displayName || user.firstName || 'User',
        resetLink
      );
      
      console.log('✅ Password reset email sent via Nodemailer');

      // Log successful password reset request
      await logPasswordResetAttempt(
        user.firebaseUid,
        email,
        'Password reset email sent successfully',
        clientInfo,
        true,
        {
          resetLinkGenerated: true,
          emailSent: true,
          emailProvider: 'nodemailer',
          processingTime: Date.now() - startTime
        }
      );
      
      return NextResponse.json({
        success: true,
        message: 'Password reset email sent! Check your inbox and spam folder.',
      });

    } catch (error: any) {
      console.error('Password reset error:', error);
      
      await logPasswordResetAttempt(
        user.firebaseUid,
        email,
        `Password reset failed: ${error.message}`,
        clientInfo,
        false,
        {
          errorType: error.name || 'UnknownError',
          errorMessage: error.message
        }
      );

      // Return generic error
      return NextResponse.json(
        { 
          error: 'Unable to send password reset email. Please try again later.',
          code: 'RESET_FAILED'
        },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('❌ Password reset error:', error);
    
    // Log system error
    try {
      await AuditLog.create({
        action: AuditAction.PASSWORD_RESET_REQUESTED,
        success: false,
        level: AuditLevel.ERROR,
        ip: clientInfo.ip,
        userAgent: clientInfo.userAgent,
        resource: 'auth',
        errorMessage: error.message,
        details: {
          error: 'System error during password reset',
          processingTime: Date.now() - startTime
        },
        timestamp: new Date()
      });
    } catch (auditError) {
      console.error('Failed to log password reset error:', auditError);
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Unable to process password reset request. Please try again.'
      },
      { status: 500 }
    );
  }
}

// Helper function to log password reset attempts
async function logPasswordResetAttempt(
  firebaseUid: string | null,
  email: string,
  message: string,
  clientInfo: any,
  success: boolean,
  details?: any
) {
  try {
    await AuditLog.create({
      action: AuditAction.PASSWORD_RESET_REQUESTED,
      success,
      level: success ? AuditLevel.INFO : AuditLevel.WARNING,
      userId: firebaseUid,
      userEmail: email,
      ip: clientInfo.ip,
      userAgent: clientInfo.userAgent,
      resource: 'auth',
      errorMessage: success ? undefined : message,
      details: {
        resetType: 'email_initiated',
        message,
        ...details,
        timestamp: new Date().toISOString()
      },
      timestamp: new Date()
    });
  } catch (auditError) {
    console.error('Failed to log password reset attempt:', auditError);
  }
}
