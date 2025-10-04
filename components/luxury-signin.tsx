//components/luxury-signin.tsx
"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "@/firebase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/toast-system"
import { cn } from "@/lib/utils"

// Types for form validation
interface FormErrors {
  email?: string
  password?: string
  general?: string
}

// Rate limiting configuration
const MAX_LOGIN_ATTEMPTS = 3
const RATE_LIMIT_WINDOW = 5 * 60 * 1000 // 5 minutes

export function LuxurySignIn() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [errors, setErrors] = useState<FormErrors>({})
  const [loginAttempts, setLoginAttempts] = useState(0)
  const [lastAttemptTime, setLastAttemptTime] = useState<number>(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const emailInputRef = useRef<HTMLInputElement>(null)
  const passwordInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { success, error: showError } = useToast()

  // Form validation functions
  const validateEmail = (email: string): string | undefined => {
    if (!email) return "Email is required"
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) return "Please enter a valid email address"
    return undefined
  }

  const validatePassword = (password: string): string | undefined => {
    if (!password) return "Password is required"
    if (password.length < 6) return "Password must be at least 6 characters"
    return undefined
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}
    
    const emailError = validateEmail(email)
    if (emailError) newErrors.email = emailError
    
    const passwordError = validatePassword(password)
    if (passwordError) newErrors.password = passwordError
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Rate limiting check
  const checkRateLimit = (): boolean => {
    const now = Date.now()
    if (loginAttempts >= MAX_LOGIN_ATTEMPTS) {
      const timeLeft = RATE_LIMIT_WINDOW - (now - lastAttemptTime)
      if (timeLeft > 0) {
        const minutesLeft = Math.ceil(timeLeft / (60 * 1000))
        showError(
          "Too many attempts",
          `Please try again in ${minutesLeft} minute${minutesLeft > 1 ? 's' : ''}`,
          8000
        )
        return false
      } else {
        // Reset attempts after rate limit window
        setLoginAttempts(0)
        setLastAttemptTime(0)
      }
    }
    return true
  }

  useEffect(() => {
    const message = searchParams.get('message')
    if (message === 'password-reset-success') {
      setSuccessMessage('Password reset successful! You can now sign in with your new password.')
      success(
        "Password Reset Successful",
        "You can now sign in with your new password.",
        6000
      )
      // Clear the message after 10 seconds
      setTimeout(() => setSuccessMessage(''), 10000)
    }
  }, [searchParams, success])

  // Auto-focus email input on mount
  useEffect(() => {
    emailInputRef.current?.focus()
  }, [])

  // Clear field-specific errors when user types
  useEffect(() => {
    if (errors.email && email) {
      setErrors(prev => ({ ...prev, email: undefined }))
    }
  }, [email, errors.email])

  useEffect(() => {
    if (errors.password && password) {
      setErrors(prev => ({ ...prev, password: undefined }))
    }
  }, [password, errors.password])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Clear any existing general errors
    setErrors(prev => ({ ...prev, general: undefined }))
    
    // Validate form
    if (!validateForm()) {
      return
    }
    
    // Check rate limiting
    if (!checkRateLimit()) {
      return
    }
    
    setIsLoading(true)
    setIsSubmitting(true)
    
    try {
      // Step 1: Authenticate with Firebase (client-side)
      console.log('🔐 Starting Firebase client authentication...')
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const firebaseUser = userCredential.user
      
      console.log('✅ Firebase authentication successful:', firebaseUser.uid)
      
      // Step 2: Get ID token and send to server for session creation
      console.log('🎫 Getting ID token for server validation...')
      const idToken = await firebaseUser.getIdToken()
      
      // Step 3: Create server session (more secure than the previous approach)
      console.log('🍪 Creating server session...')
      
      // Add longer timeout for production
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const res = await fetch("/api/sessionLogin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}` // Send token securely
        },
        body: JSON.stringify({
          firebaseUid: firebaseUser.uid,
          email: firebaseUser.email,
          rememberMe,
        }),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error("Session creation failed")
      }
      
      console.log('🎉 Login successful! Redirecting...')
      
      // Reset login attempts on successful login
      setLoginAttempts(0)
      setLastAttemptTime(0)
      
      // Keep loading state active until redirect completes
      // No toast needed - redirect itself indicates success
      router.push("/dashboard")
      // Don't set loading to false on success - let the page navigation handle it
      
    } catch (error: any) {
      console.error("Login error:", error)
      
      // Increment login attempts
      const newAttempts = loginAttempts + 1
      setLoginAttempts(newAttempts)
      setLastAttemptTime(Date.now())
      
      // Provide user-friendly error messages
      let errorTitle = "Login Failed"
      let errorMessage = "Invalid credentials or server error"
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = "No account found with this email address"
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = "Incorrect password. Please try again"
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Please enter a valid email address"
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = "This account has been disabled. Contact support"
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Too many failed attempts. Please try again later"
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = "Network error. Please check your connection"
      } else if (error.message === "Session creation failed") {
        errorMessage = "Server error. Please try again"
      } else if (error.name === 'AbortError') {
        errorMessage = "Login is taking too long. Please check your connection and try again"
      } else if (error.message?.includes('timeout') || error.message?.includes('TIMEOUT')) {
        errorMessage = "Login timeout. Please try again with a stable connection"
      }
      
      // Show error toast
      showError(
        errorTitle,
        errorMessage,
        6000
      )
      
      // Set form error for additional UI feedback
      setErrors({ general: errorMessage })
      
      // Focus appropriate field based on error
      if (error.code === 'auth/invalid-email') {
        emailInputRef.current?.focus()
      } else if (error.code === 'auth/wrong-password') {
        passwordInputRef.current?.focus()
      }
      
      // Only turn off loading state on error
      setIsLoading(false)
      setIsSubmitting(false)
    }
  }

  // Handle Enter key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading && !isSubmitting) {
      handleSubmit(e as any)
    }
  }


  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Header */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">N</span>
            </div>
          </div>
          <h2 className="text-3xl font-semibold text-gray-900">Welcome to Noorsaray</h2>
          <p className="mt-2 text-gray-600">Sign in to your admin account</p>
        </div>

        {/* Sign In Form */}
        <Card className="shadow-lg border-gray-100">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-medium text-gray-900">Sign In</CardTitle>
          </CardHeader>
          <CardContent>
            {successMessage && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  <p className="text-green-700 text-sm">{successMessage}</p>
                </div>
              </div>
            )}
            {/* General Error Display */}
            {errors.general && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                  <p className="text-red-700 text-sm">{errors.general}</p>
                </div>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700">
                  Email <span className="text-red-500" aria-label="required">*</span>
                </Label>
                <Input
                  ref={emailInputRef}
                  id="email"
                  type="email"
                  placeholder="admin@noorsaray.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={handleKeyDown}
                  required
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  className={cn(
                    "h-11 border-gray-200 focus:border-gray-300 focus:ring-0",
                    errors.email && "border-red-300 focus:border-red-400"
                  )}
                  disabled={isLoading}
                />
                {errors.email && (
                  <p id="email-error" className="text-sm text-red-600 flex items-center mt-1">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700">
                  Password <span className="text-red-500" aria-label="required">*</span>
                </Label>
                <div className="relative">
                  <Input
                    ref={passwordInputRef}
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                    required
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? "password-error" : undefined}
                    className={cn(
                      "h-11 pr-10 border-gray-200 focus:border-gray-300 focus:ring-0",
                      errors.password && "border-red-300 focus:border-red-400"
                    )}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    disabled={isLoading}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p id="password-error" className="text-sm text-red-600 flex items-center mt-1">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.password}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  />
                  <Label htmlFor="remember" className="text-sm text-gray-600">
                    Remember me
                  </Label>
                </div>
                
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-gray-900 hover:bg-gray-800 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                disabled={isLoading || isSubmitting}
                aria-describedby="login-button-status"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
              <div id="login-button-status" className="sr-only" aria-live="polite">
                {isLoading ? "Signing in, please wait" : ""}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>© 2024 Noorsaray. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
