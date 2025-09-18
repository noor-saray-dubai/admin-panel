import { NextRequest, NextResponse } from 'next/server';
import EmailService from '@/lib/emailService';

export async function GET(request: NextRequest) {
  try {
    // Test email service connection
    const isConnected = await EmailService.testConnection();
    
    if (!isConnected) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Email service connection failed',
          status: 'disconnected'
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Email service is properly configured and connected',
      status: 'connected',
      config: {
        emailUser: process.env.EMAIL_USER ? '✅ Set' : '❌ Missing',
        emailPassword: process.env.EMAIL_APP_PASSWORD ? '✅ Set' : '❌ Missing',
      }
    });
    
  } catch (error: any) {
    console.error('❌ Email test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Email service test failed',
        error: error.message,
        status: 'error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json();
    
    if (!email || !name) {
      return NextResponse.json(
        { error: 'Email and name are required' },
        { status: 400 }
      );
    }
    
    // Send test password reset email
    const testResetLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-complete?token=TEST_TOKEN_123`;
    
    await EmailService.sendPasswordReset(email, name, testResetLink);
    
    return NextResponse.json({
      success: true,
      message: 'Test password reset email sent successfully!',
      sentTo: email
    });
    
  } catch (error: any) {
    console.error('❌ Test email send error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to send test email',
        error: error.message 
      },
      { status: 500 }
    );
  }
}