import { NextRequest } from "next/server";

interface RateLimitResult {
  success: boolean;
  retryAfter?: number;
  remaining?: number;
}

interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Max requests per window
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

// In-memory store for rate limiting (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Clean up expired entries from the rate limit store
 */
function cleanupExpiredEntries() {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now > data.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Basic rate limiter implementation
 */
export async function rateLimit(
  request: NextRequest,
  user?: any,
  config: RateLimitConfig = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,          // 100 requests per 15 minutes
  }
): Promise<RateLimitResult> {
  
  // Create rate limit key
  const key = createRateLimitKey(request, user);
  const now = Date.now();
  
  // Clean up expired entries periodically
  if (Math.random() < 0.01) { // 1% chance to trigger cleanup
    cleanupExpiredEntries();
  }
  
  // Get current rate limit data
  let limitData = rateLimitStore.get(key);
  
  if (!limitData || now > limitData.resetTime) {
    // Initialize or reset the rate limit data
    limitData = {
      count: 0,
      resetTime: now + config.windowMs
    };
  }
  
  // Increment the request count
  limitData.count++;
  
  // Check if limit exceeded
  if (limitData.count > config.maxRequests) {
    const retryAfter = Math.ceil((limitData.resetTime - now) / 1000);
    
    // Don't increment further if already over limit
    limitData.count = config.maxRequests + 1;
    rateLimitStore.set(key, limitData);
    
    return {
      success: false,
      retryAfter
    };
  }
  
  // Update the store
  rateLimitStore.set(key, limitData);
  
  return {
    success: true,
    remaining: Math.max(0, config.maxRequests - limitData.count)
  };
}

/**
 * Create rate limiting key from request and user
 */
function createRateLimitKey(request: NextRequest, user?: any): string {
  if (user?.uid) {
    return `user:${user.uid}`;
  }
  
  // Extract IP address for unauthenticated users
  const xForwardedFor = request.headers.get('x-forwarded-for');
  const xRealIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  const ip = xForwardedFor?.split(',')[0].trim() || 
             xRealIP || 
             cfConnectingIP || 
             'unknown';
  
  return `ip:${ip}`;
}

/**
 * Stricter rate limiting for creation/update operations
 */
export async function strictRateLimit(
  request: NextRequest,
  user?: any
): Promise<RateLimitResult> {
  return rateLimit(request, user, {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,          // 10 requests per hour
  });
}

/**
 * Rate limiting for authentication endpoints
 */
export async function authRateLimit(
  request: NextRequest
): Promise<RateLimitResult> {
  const ip = getClientIP(request);
  
  return rateLimit(request, undefined, {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,           // 5 login attempts per 15 minutes per IP
  });
}

/**
 * Get client IP address from request
 */
function getClientIP(request: NextRequest): string {
  const xForwardedFor = request.headers.get('x-forwarded-for');
  const xRealIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  const forwarded = request.headers.get('forwarded');
  
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }
  
  if (xRealIP) return xRealIP;
  if (cfConnectingIP) return cfConnectingIP;
  
  if (forwarded) {
    const match = forwarded.match(/for=([^;,\s]+)/);
    if (match) return match[1];
  }
  
  return 'unknown';
}