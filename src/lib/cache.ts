import { Redis } from "@upstash/redis";

/** 价格缓存 TTL: 7 天 */
export const PRICE_CACHE_TTL = 60 * 60 * 24 * 7;
/** 汇率缓存 TTL: 24 小时 */
export const EXCHANGE_RATE_CACHE_TTL = 60 * 60 * 24;

// 内存缓存（降级方案）
const memoryCache = new Map<string, { value: unknown; expiresAt: number }>();

// Upstash Redis 客户端（延迟初始化）
let redis: Redis | null = null;
let redisInitialized = false;

function getRedis(): Redis | null {
  if (redisInitialized) return redis;
  redisInitialized = true;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    redis = new Redis({ url, token });
    console.log("[cache] 使用 Upstash Redis 缓存");
  } else {
    console.log("[cache] 未配置 Upstash 环境变量，降级为内存缓存（重启后清空）");
  }
  return redis;
}

/**
 * 从缓存获取数据
 */
export async function getCached<T>(key: string): Promise<T | null> {
  const client = getRedis();

  if (client) {
    try {
      const value = await client.get<T>(key);
      return value;
    } catch {
      // Redis 不可用时降级到内存缓存
    }
  }

  // 内存缓存
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return entry.value as T;
}

/**
 * 写入缓存
 */
export async function setCache(key: string, value: unknown, ttl: number = PRICE_CACHE_TTL): Promise<void> {
  const client = getRedis();

  if (client) {
    try {
      await client.set(key, value, { ex: ttl });
      return;
    } catch {
      // Redis 不可用时降级到内存缓存
    }
  }

  // 内存缓存
  memoryCache.set(key, {
    value,
    expiresAt: Date.now() + ttl * 1000,
  });
}

/**
 * 生成缓存 key
 */
export function makeCacheKey(trackId: number, regionCode: string): string {
  return `price:${trackId}:${regionCode}`;
}
