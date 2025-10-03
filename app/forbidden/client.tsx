"use client";

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  AlertTriangle, 
  Shield, 
  ArrowLeft, 
  Home, 
  Lock,
  UserX,
  ServerCrash
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ForbiddenPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason') || 'access_denied';
  
  const getErrorDetails = (reason: string) => {
    switch (reason) {
      case 'insufficient_role':
        return {
          icon: Shield,
          title: 'Insufficient Permissions',
          description: 'You do not have the required administrative privileges to access this page.',
          message: 'This page is restricted to administrators and super administrators only.',
          color: 'text-orange-500',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200'
        };
      case 'user_not_found':
        return {
          icon: UserX,
          title: 'User Profile Not Found',
          description: 'Your user profile could not be found in the system.',
          message: 'Please contact your system administrator for assistance.',
          color: 'text-blue-500',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        };
      case 'auth_error':
        return {
          icon: ServerCrash,
          title: 'Authentication Error',
          description: 'There was an error verifying your authentication.',
          message: 'Please try logging out and logging back in. If the problem persists, contact support.',
          color: 'text-red-500',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        };
      default:
        return {
          icon: Lock,
          title: 'Access Denied',
          description: 'You do not have permission to access this resource.',
          message: 'If you believe this is an error, please contact your administrator.',
          color: 'text-gray-500',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        };
    }
  };

  const errorDetails = getErrorDetails(reason);
  const ErrorIcon = errorDetails.icon;

  const handleGoBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/dashboard');
    }
  };

  const handleGoToDashboard = () => {
    router.push('/dashboard');
  };

  const handleLogout = () => {
    // Clear any client-side storage
    localStorage.removeItem('isAuthenticated');
    // Redirect to logout API which will handle server-side cleanup
    window.location.href = '/api/logout';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Main Error Card */}
        <Card className={`${errorDetails.borderColor} border-2`}>
          <CardHeader className="text-center pb-4">
            <div className={`${errorDetails.bgColor} w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4`}>
              <ErrorIcon className={`h-10 w-10 ${errorDetails.color}`} />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              {errorDetails.title}
            </CardTitle>
            <CardDescription className="text-base text-gray-600">
              {errorDetails.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className={`${errorDetails.bgColor} ${errorDetails.borderColor} border rounded-lg p-4`}>
              <p className="text-sm text-gray-700">
                {errorDetails.message}
              </p>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col gap-3 pt-4">
              <Button 
                onClick={handleGoBack}
                variant="default"
                className="w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
              
              <Button 
                onClick={handleGoToDashboard}
                variant="outline"
                className="w-full"
              >
                <Home className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              
              {reason === 'auth_error' && (
                <Button 
                  onClick={handleLogout}
                  variant="outline"
                  className="w-full text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Logout & Try Again
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Help Card */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-blue-900 mb-1">
                  Need Help?
                </h3>
                <p className="text-xs text-blue-700">
                  If you believe you should have access to this page, contact your system administrator 
                  or check if your account has the required permissions.
                </p>
                <div className="mt-2 text-xs text-blue-600">
                  Error Code: <code className="bg-blue-100 px-1 rounded">{reason}</code>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Noorsaray Admin Panel • Secure Access Control
          </p>
        </div>
      </div>
    </div>
  );
}