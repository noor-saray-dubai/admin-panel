"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Sparkles, Eye, EyeOff, Shield, Zap } from "lucide-react"

interface PremiumSignInProps {
  onSignIn: () => void
}

export function PremiumSignIn({ onSignIn }: PremiumSignInProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Mock authentication with enhanced loading
    setTimeout(() => {
      setIsLoading(false)
      onSignIn()
    }, 2000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative w-full max-w-md space-y-8 z-10">
        {/* Logo and Header */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-xl p-4 rounded-2xl shadow-2xl border border-white/20">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Sparkles className="h-7 w-7 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
                </div>
                <div className="text-left">
                  <span className="text-2xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                    Noorsaray
                  </span>
                  <p className="text-sm text-blue-200">Premium Edition</p>
                </div>
              </div>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Welcome back</h2>
          <p className="text-blue-200">Sign in to your premium admin dashboard</p>
        </div>

        {/* Sign In Form */}
        <Card className="shadow-2xl bg-white/10 backdrop-blur-xl border border-white/20">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl text-white">Sign In</CardTitle>
            <p className="text-blue-200">Access your Noorsaray dashboard</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@noorsaray.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 bg-white/10 border-white/20 text-white placeholder:text-blue-200 focus:bg-white/20 transition-all"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 pr-12 bg-white/10 border-white/20 text-white placeholder:text-blue-200 focus:bg-white/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-200 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    className="border-white/20 data-[state=checked]:bg-blue-500"
                  />
                  <Label htmlFor="remember" className="text-sm text-blue-200">
                    Remember me
                  </Label>
                </div>
                <button type="button" className="text-sm text-blue-300 hover:text-white transition-colors">
                  Forgot password?
                </button>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold shadow-lg transition-all duration-300"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4" />
                    <span>Sign In Securely</span>
                  </div>
                )}
              </Button>
            </form>

            {/* Demo Credentials */}
            <div className="mt-6 p-4 bg-blue-500/20 rounded-xl border border-blue-400/30">
              <div className="flex items-center space-x-2 mb-2">
                <Zap className="h-4 w-4 text-yellow-400" />
                <h4 className="text-sm font-medium text-white">Demo Access:</h4>
              </div>
              <div className="text-xs text-blue-200 space-y-1">
                <p>Email: admin@noorsaray.com</p>
                <p>Password: noorsaray2024</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20">
            <Shield className="h-6 w-6 text-blue-400 mx-auto mb-2" />
            <p className="text-xs text-blue-200">Secure</p>
          </div>
          <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20">
            <Zap className="h-6 w-6 text-purple-400 mx-auto mb-2" />
            <p className="text-xs text-blue-200">Fast</p>
          </div>
          <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20">
            <Sparkles className="h-6 w-6 text-pink-400 mx-auto mb-2" />
            <p className="text-xs text-blue-200">Premium</p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-blue-300">
          <p>© 2024 Noorsaray Premium. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
