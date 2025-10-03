/**
 * 🚀 SESSION VALIDATION SERVICE
 * 
 * Centralized service for session validation with Redis caching
 * Eliminates duplicate Firebase Admin SDK calls across middleware and API routes
 * 
 * Features:
 * - Redis caching with configurable TTL
 * - Automatic cache invalidation 
 * - Performance metrics tracking
 * - Fallback to Firebase Admin SDK on cache miss
 * - Thread-safe operations
 */

import { adminAuth } from '@/lib/firebaseAdmin';
import { redis, CACHE_KEYS, CACHE_TTL } from '@/lib/redis/redisClient';
import crypto from 'crypto';

export interface ValidatedSession {
  valid: boolean;
  uid?: string;
  email?: string;
  role?: string | null;
  verified_at?: number;
  expires_at?: number;
  cached?: boolean;
}

export interface SessionValidationError {
  valid: false;
  error: string;
  code?: string;
  cached?: boolean;
}

export type SessionValidationResult = ValidatedSession | SessionValidationError;

/**
 * Performance metrics for monitoring
 */
class ValidationMetrics {
  private static metrics = {
    total_requests: 0,
    cache_hits: 0,
    cache_misses: 0,
    firebase_calls: 0,
    avg_response_time: 0,
  };

  static recordCacheHit(responseTime: number) {
    this.metrics.total_requests++;
    this.metrics.cache_hits++;
    this.updateAvgResponseTime(responseTime);
  }

  static recordCacheMiss(responseTime: number) {
    this.metrics.total_requests++;
    this.metrics.cache_misses++;
    this.metrics.firebase_calls++;
    this.updateAvgResponseTime(responseTime);
  }

  private static updateAvgResponseTime(responseTime: number) {
    this.metrics.avg_response_time = 
      (this.metrics.avg_response_time + responseTime) / 2;
  }

  static getStats() {
    const hitRate = this.metrics.total_requests > 0 
      ? (this.metrics.cache_hits / this.metrics.total_requests) * 100 
      : 0;
    
    return {
      ...this.metrics,
      cache_hit_rate: Math.round(hitRate * 100) / 100,
    };
  }

  static reset() {
    this.metrics = {
      total_requests: 0,
      cache_hits: 0,
      cache_misses: 0,
      firebase_calls: 0,
      avg_response_time: 0,
    };
  }
}

/**
 * Main SessionValidationService class
 */
export class SessionValidationService {
  
  // Cache configuration
  private static readonly CACHE_TTL_SECONDS = 3 * 60; // 3 minutes (balance of security vs performance)
  private static readonly MAX_CACHE_ATTEMPTS = 2;
  
  /**
   * Create a hash of the session cookie for cache key
   * This provides some security by not storing raw session tokens in Redis keys
   */
  private static createSessionHash(sessionCookie: string): string {
    return crypto
      .createHash('sha256')
      .update(sessionCookie)
      .digest('hex')
      .substring(0, 16); // First 16 chars for shorter Redis keys
  }

  /**
   * Get cache key for session validation
   */
  private static getCacheKey(sessionCookie: string): string {
    const sessionHash = this.createSessionHash(sessionCookie);
    return `session:verified:${sessionHash}`;
  }

  /**
   * Main method: Validate session with caching
   * Used by both middleware and API routes
   */
  static async validateSession(sessionCookie: string): Promise<SessionValidationResult> {
    const startTime = Date.now();
    
    if (!sessionCookie || sessionCookie.trim().length < 20) {
      return {
        valid: false,
        error: 'Invalid session cookie format',
        cached: false
      };
    }

    try {
      // Step 1: Try cache first
      const cachedResult = await this.getFromCache(sessionCookie);
      if (cachedResult) {
        ValidationMetrics.recordCacheHit(Date.now() - startTime);
        return cachedResult;
      }

      // Step 2: Cache miss - verify with Firebase Admin SDK
      const firebaseResult = await this.verifyWithFirebase(sessionCookie);
      
      // Step 3: Cache the result (both valid and invalid for short period)
      if (firebaseResult.valid) {
        await this.cacheValidSession(sessionCookie, firebaseResult);
      } else {
        await this.cacheInvalidSession(sessionCookie, firebaseResult as SessionValidationError);
      }

      ValidationMetrics.recordCacheMiss(Date.now() - startTime);
      return { ...firebaseResult, cached: false };

    } catch (error) {
      console.error('🚨 SessionValidationService error:', error);
      return {
        valid: false,
        error: 'Session validation failed',
        cached: false
      };
    }
  }

  /**
   * Try to get validated session from cache
   */
  private static async getFromCache(sessionCookie: string): Promise<ValidatedSession | null> {
    try {
      const cacheKey = this.getCacheKey(sessionCookie);
      const cached = await redis.get(cacheKey);
      
      if (!cached) {
        return null;
      }

      const parsedData = typeof cached === 'string' ? JSON.parse(cached) : cached;
      
      // Check if cached data is expired
      if (parsedData.expires_at && Date.now() > parsedData.expires_at) {
        // Remove expired cache entry
        await redis.del(cacheKey).catch(console.error);
        return null;
      }

      // Valid cached session
      return {
        ...parsedData,
        cached: true
      };

    } catch (error) {
      console.error('🚨 Cache read error:', error);
      return null; // Fallback to Firebase verification
    }
  }

  /**
   * Verify session with Firebase Admin SDK
   */
  private static async verifyWithFirebase(sessionCookie: string): Promise<ValidatedSession | SessionValidationError> {
    try {
      const decodedClaims = await adminAuth.verifySessionCookie(
        sessionCookie,
        true // checkRevoked = true (critical for logout functionality)
      );

      return {
        valid: true,
        uid: decodedClaims.uid,
        email: decodedClaims.email,
        role: decodedClaims.role || null,
        verified_at: Date.now(),
        expires_at: Date.now() + (this.CACHE_TTL_SECONDS * 1000)
      };

    } catch (error: any) {
      let errorMessage = "Invalid or expired session";
      let errorCode = error.code;

      if (error.code === 'auth/session-cookie-revoked') {
        errorMessage = "Session has been revoked (logged out)";
      } else if (error.code === 'auth/session-cookie-expired') {
        errorMessage = "Session has expired";
      } else if (error.code === 'auth/invalid-session-cookie') {
        errorMessage = "Invalid session cookie";
      }

      return {
        valid: false,
        error: errorMessage,
        code: errorCode
      };
    }
  }

  /**
   * Cache valid session result
   */
  private static async cacheValidSession(sessionCookie: string, result: ValidatedSession): Promise<void> {
    try {
      const cacheKey = this.getCacheKey(sessionCookie);
      const cacheData = {
        valid: result.valid,
        uid: result.uid,
        email: result.email,
        role: result.role,
        verified_at: result.verified_at,
        expires_at: result.expires_at
      };

      await redis.setex(
        cacheKey,
        this.CACHE_TTL_SECONDS,
        JSON.stringify(cacheData)
      );

    } catch (error) {
      console.error('🚨 Cache write error (valid session):', error);
      // Don't throw - caching failure shouldn't break authentication
    }
  }

  /**
   * Cache invalid session result (short TTL to prevent repeated Firebase calls for bad sessions)
   */
  private static async cacheInvalidSession(sessionCookie: string, result: SessionValidationError): Promise<void> {
    try {
      const cacheKey = this.getCacheKey(sessionCookie);
      const cacheData = {
        valid: false,
        error: result.error,
        code: result.code,
        verified_at: Date.now(),
        expires_at: Date.now() + (30 * 1000) // 30 seconds for invalid sessions
      };

      await redis.setex(
        cacheKey,
        30, // Short TTL for invalid sessions
        JSON.stringify(cacheData)
      );

    } catch (error) {
      console.error('🚨 Cache write error (invalid session):', error);
      // Don't throw - caching failure shouldn't break authentication
    }
  }

  /**
   * Invalidate cached session (for logout, user changes, etc.)
   */
  static async invalidateSession(sessionCookie: string): Promise<boolean> {
    try {
      const cacheKey = this.getCacheKey(sessionCookie);
      await redis.del(cacheKey);
      return true;
    } catch (error) {
      console.error('🚨 Cache invalidation error:', error);
      return false;
    }
  }

  /**
   * Invalidate all sessions for a specific user (for user updates, role changes, etc.)
   */
  static async invalidateUserSessions(uid: string): Promise<boolean> {
    try {
      // This requires scanning for keys with the user's uid
      // For now, we'll implement a simpler approach
      // In production, consider maintaining a user->sessions mapping
      
      // Get all session keys
      const keys = await redis.keys('session:verified:*');
      let invalidatedCount = 0;

      for (const key of keys) {
        try {
          const cached = await redis.get(key);
          if (cached) {
            const data = typeof cached === 'string' ? JSON.parse(cached) : cached;
            if (data.uid === uid) {
              await redis.del(key);
              invalidatedCount++;
            }
          }
        } catch (error) {
          console.error(`Error checking session key ${key}:`, error);
        }
      }

      console.log(`🧹 Invalidated ${invalidatedCount} cached sessions for user ${uid}`);
      return true;
    } catch (error) {
      console.error('🚨 User session invalidation error:', error);
      return false;
    }
  }

  /**
   * Get performance metrics
   */
  static getMetrics() {
    return ValidationMetrics.getStats();
  }

  /**
   * Reset performance metrics (useful for testing)
   */
  static resetMetrics() {
    ValidationMetrics.reset();
  }

  /**
   * Health check for the service
   */
  static async healthCheck(): Promise<{ status: 'healthy' | 'degraded' | 'unhealthy', details: any }> {
    try {
      // Check Redis connectivity
      const redisStart = Date.now();
      const pingResult = await redis.ping();
      const redisTime = Date.now() - redisStart;

      if (pingResult !== 'PONG') {
        return {
          status: 'unhealthy',
          details: { redis: 'unreachable', redis_response_time: redisTime }
        };
      }

      // Check Firebase Admin SDK (this might be overkill for health check)
      const firebaseHealthy = !!adminAuth;

      const metrics = this.getMetrics();

      return {
        status: redisTime < 100 ? 'healthy' : 'degraded',
        details: {
          redis: 'connected',
          redis_response_time: redisTime,
          firebase_admin_sdk: firebaseHealthy ? 'initialized' : 'not_initialized',
          cache_hit_rate: metrics.cache_hit_rate,
          total_requests: metrics.total_requests,
          avg_response_time: Math.round(metrics.avg_response_time)
        }
      };

    } catch (error) {
      return {
        status: 'unhealthy',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }
}

// Export for backward compatibility and convenience
export default SessionValidationService;

/**
 * Convenience wrapper functions for common use cases
 */
export const sessionCache = {
  /**
   * Quick validation with boolean result
   */
  async isValid(sessionCookie: string): Promise<boolean> {
    const result = await SessionValidationService.validateSession(sessionCookie);
    return result.valid;
  },

  /**
   * Get user UID from session (null if invalid)
   */
  async getUserId(sessionCookie: string): Promise<string | null> {
    const result = await SessionValidationService.validateSession(sessionCookie);
    return result.valid ? result.uid || null : null;
  },

  /**
   * Invalidate session
   */
  async invalidate(sessionCookie: string): Promise<boolean> {
    return SessionValidationService.invalidateSession(sessionCookie);
  }
};