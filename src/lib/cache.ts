import { getCloudflareContext } from "@opennextjs/cloudflare";

const CACHE_TTL = 60 * 60 * 24; // 24 小时

/**
 * 从 KV 缓存获取数据
 */
export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const kv = env.PRICE_CACHE;
    if (!kv) return null;

    const value = await kv.get(key, "json");
    return value as T | null;
  } catch {
    // KV 不可用时（如本地开发没有绑定），静默降级
    return null;
  }
}

/**
 * 写入 KV 缓存
 */
export async function setCache(key: string, value: unknown): Promise<void> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const kv = env.PRICE_CACHE;
    if (!kv) return;

    await kv.put(key, JSON.stringify(value), {
      expirationTtl: CACHE_TTL,
    });
  } catch {
    // 静默降级
  }
}

/**
 * 生成缓存 key
 */
export function makeCacheKey(trackId: number, regionCode: string): string {
  return `price:${trackId}:${regionCode}`;
}
