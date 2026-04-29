/**
 * RedisService.js
 * Provides a Redis client with graceful fallback to in-memory cache
 * if Redis is not available (e.g., local dev without Redis installed).
 */

let client = null;
let isConnected = false;

// In-memory fallback cache when Redis is unavailable
const memoryCache = new Map();
const memoryCacheExpiry = new Map();

const connectRedis = async () => {
  try {
    const Redis = require('ioredis');
    client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      lazyConnect: true,
      connectTimeout: 3000,
      retryStrategy: () => null // Don't retry – fall back gracefully
    });

    client.on('error', () => {
      if (isConnected) {
        console.warn('[Redis] Connection lost. Falling back to in-memory cache.');
        isConnected = false;
      }
    });

    await client.connect();
    isConnected = true;
    console.log('[Redis] Connected successfully');
  } catch (err) {
    console.warn('[Redis] Not available. Using in-memory cache fallback.');
    isConnected = false;
    client = null;
  }
};

const get = async (key) => {
  try {
    if (isConnected && client) {
      return await client.get(key);
    }
    // Memory cache fallback
    const expiry = memoryCacheExpiry.get(key);
    if (expiry && Date.now() > expiry) {
      memoryCache.delete(key);
      memoryCacheExpiry.delete(key);
      return null;
    }
    return memoryCache.get(key) || null;
  } catch {
    return null;
  }
};

const set = async (key, value, ttlSeconds = 300) => {
  try {
    if (isConnected && client) {
      await client.set(key, value, 'EX', ttlSeconds);
    } else {
      memoryCache.set(key, value);
      memoryCacheExpiry.set(key, Date.now() + ttlSeconds * 1000);
    }
  } catch {
    // Silently fail caching – it's non-critical
  }
};

const del = async (key) => {
  try {
    if (isConnected && client) {
      await client.del(key);
    } else {
      memoryCache.delete(key);
      memoryCacheExpiry.delete(key);
    }
  } catch { /* silent */ }
};

module.exports = { connectRedis, get, set, del };
