// lib/redis/redisClient.ts
import { Redis } from 'ioredis'

// Extend global type for Redis client
declare global {
  // eslint-disable-next-line no-var
  var redisClient: Redis | undefined
}

// Singleton pattern with global variable to survive hot reloads
function getRedisClient(): Redis {
  // Return existing connection if available
  if (global.redisClient) {
    return global.redisClient;
  }

  // Get Redis URL from environment
  const redisUrl = process.env.UPSTASH_REDIS_URL;
  
  if (!redisUrl) {
    console.error('❌ UPSTASH_REDIS_URL environment variable is not set');
    throw new Error('UPSTASH_REDIS_URL is required');
  }

  console.log('🔌 Creating new Redis connection...');

  try {
    // Parse URL to handle authentication properly
    const url = new URL(redisUrl);
    
    // Create Redis client with ioredis
    const client = new Redis({
      host: url.hostname,
      port: parseInt(url.port) || 6379,
      username: url.username || 'default',
      password: decodeURIComponent(url.password || ''),
      tls: url.protocol === 'rediss:' ? {
        rejectUnauthorized: true,
      } : undefined,
      
      // Connection pool settings
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) {
          console.error('❌ Redis retry limit exceeded');
          return null; // Stop retrying
        }
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      
      // Timeout settings
      connectTimeout: 10000,
      commandTimeout: 5000,
      
      // Connection settings
      lazyConnect: false,
      enableReadyCheck: true,
      enableOfflineQueue: true,
      
      // Keep-alive
      keepAlive: 30000,
      
      // Reconnection
      reconnectOnError(err) {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
          return true; // Reconnect on READONLY errors
        }
        return false;
      },
      
      // Auto-pipelining for better performance
      enableAutoPipelining: true,
    });

    // Connection event handlers
    client.on('connect', () => {
      console.log('✅ Redis connected successfully');
    });

    client.on('ready', () => {
      console.log('✅ Redis ready to accept commands');
    });

    client.on('error', (err) => {
      console.error('❌ Redis error:', err.message);
      // Don't clear global connection on error - let reconnect handle it
    });

    client.on('close', () => {
      console.log('🔌 Redis connection closed - will attempt reconnect');
    });

    client.on('reconnecting', (delay: number) => {
      console.log(`🔄 Redis reconnecting in ${delay}ms...`);
    });

    client.on('end', () => {
      console.log('🛑 Redis connection ended');
      // Clear global reference when connection truly ends
      if (global.redisClient === client) {
        global.redisClient = undefined;
      }
    });

    // Store in global to survive hot reloads
    global.redisClient = client;
    
    return client;
  } catch (error) {
    console.error('❌ Failed to create Redis client:', error);
    throw error;
  }
}

// Export the singleton client
export const redis = getRedisClient();

// Backward compatibility
export const upstashRedis = redis;

// Cache keys
type CacheKeyType = {
  user: (firebaseUid: string) => string;
  session: (sessionId: string) => string;
};

export const CACHE_KEYS: CacheKeyType = {
  user: (firebaseUid: string) => `user:${firebaseUid}`,
  session: (sessionId: string) => `session:${sessionId}`,
}

// Cache TTL (Time To Live)
export const CACHE_TTL = {
  // User data includes permissions - cache for 6 hours
  USER_DATA: 60 * 60 * 6, // 6 hours (21600 seconds)
  
  // Session validation
  SESSION: 60 * 60 * 6, // 6 hours
}

// Helper functions with better error handling and connection checks
export const redisHelper = {
  async get(key: string): Promise<string | null> {
    try {
      // Check connection status
      if (redis.status !== 'ready' && redis.status !== 'connect') {
        console.warn('⚠️ Redis not ready, status:', redis.status);
        return null;
      }
      return await redis.get(key);
    } catch (error) {
      console.error('❌ Redis GET error:', error instanceof Error ? error.message : error);
      return null;
    }
  },

  async setex(key: string, seconds: number, value: string): Promise<boolean> {
    try {
      // Check connection status
      if (redis.status !== 'ready' && redis.status !== 'connect') {
        console.warn('⚠️ Redis not ready, status:', redis.status);
        return false;
      }
      await redis.setex(key, seconds, value);
      return true;
    } catch (error) {
      console.error('❌ Redis SETEX error:', error instanceof Error ? error.message : error);
      return false;
    }
  },

  async del(key: string): Promise<boolean> {
    try {
      // Check connection status
      if (redis.status !== 'ready' && redis.status !== 'connect') {
        console.warn('⚠️ Redis not ready, status:', redis.status);
        return false;
      }
      await redis.del(key);
      return true;
    } catch (error) {
      console.error('❌ Redis DEL error:', error instanceof Error ? error.message : error);
      return false;
    }
  },

  async ping(): Promise<boolean> {
    try {
      if (redis.status !== 'ready' && redis.status !== 'connect') {
        console.warn('⚠️ Redis not ready, status:', redis.status);
        return false;
      }
      const result = await redis.ping();
      return result === 'PONG';
    } catch (error) {
      console.error('❌ Redis PING error:', error instanceof Error ? error.message : error);
      return false;
    }
  }
};

// Graceful shutdown
if (process.env.NODE_ENV !== 'production') {
  process.on('SIGINT', async () => {
    console.log('🛑 Shutting down Redis connection...');
    if (global.redisClient) {
      await global.redisClient.quit();
      global.redisClient = undefined;
    }
  });
}

// Default export
export default redis;