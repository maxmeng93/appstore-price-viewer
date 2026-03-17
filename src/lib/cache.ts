import * as fs from "fs";
import * as path from "path";
import type {
  AppInfo,
  RegionPrice,
  CachedAppInfo,
  CachedRegionPrice,
  AppsFileData,
  PricesFileData,
  AppViewCount,
  ViewsFileData,
} from "./types";

/** 价格缓存过期时间: 7 天（毫秒） */
const PRICE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
/** 汇率缓存过期时间: 1 小时（毫秒） */
const EXCHANGE_RATE_TTL_MS = 60 * 60 * 1000;
/** 定时刷写间隔: 10 分钟 */
const FLUSH_INTERVAL_MS = 10 * 60 * 1000;

const DATA_DIR = process.env.DATA_DIR || "./data";

// ---- 内存存储 ----
let appsMap: Map<string, CachedAppInfo> | null = null;
let pricesMap: Map<string, CachedRegionPrice> | null = null;
let viewsMap: Map<string, AppViewCount> | null = null;
let appsDirty = false;
let pricesDirty = false;
let viewsDirty = false;
let initialized = false;
let flushTimer: ReturnType<typeof setInterval> | null = null;

// 汇率仅保存在内存中
let exchangeRatesCache: { rates: Record<string, number>; updatedAt: string } | null = null;

// ---- 文件读写工具 ----

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

/** 原子写入：先写 .tmp 再 rename */
function atomicWriteJSON(filePath: string, data: unknown): void {
  const tmp = filePath + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), "utf-8");
  fs.renameSync(tmp, filePath);
}

function readJSONFile<T>(filePath: string): T | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    console.warn(`[cache] 读取 ${filePath} 失败，忽略`);
    return null;
  }
}

// ---- 初始化 ----

function ensureInit(): void {
  if (initialized) return;
  initialized = true;

  ensureDataDir();

  // 加载 apps.json
  const appsData = readJSONFile<AppsFileData>(path.join(DATA_DIR, "apps.json"));
  appsMap = new Map(appsData ? Object.entries(appsData.apps) : []);

  // 加载 prices.json
  const pricesData = readJSONFile<PricesFileData>(path.join(DATA_DIR, "prices.json"));
  pricesMap = new Map(pricesData ? Object.entries(pricesData.prices) : []);

  // 加载 views.json
  const viewsData = readJSONFile<ViewsFileData>(path.join(DATA_DIR, "views.json"));
  viewsMap = new Map(viewsData ? Object.entries(viewsData.views) : []);

  console.log(`[cache] 从文件加载: ${appsMap.size} 个 App, ${pricesMap.size} 条价格, ${viewsMap.size} 条查看记录`);

  // 定时刷写
  flushTimer = setInterval(() => flushToDisk(), FLUSH_INTERVAL_MS);
  // 避免 timer 阻止进程退出
  if (flushTimer.unref) flushTimer.unref();

  // 进程退出时刷写
  const onExit = () => {
    flushToDisk();
  };
  process.on("SIGTERM", onExit);
  process.on("SIGINT", onExit);
  process.on("beforeExit", onExit);
}

/** 将脏数据刷写到磁盘 */
function flushToDisk(): void {
  if (!appsMap || !pricesMap || !viewsMap) return;

  if (appsDirty) {
    const data: AppsFileData = {
      version: 1,
      updatedAt: new Date().toISOString(),
      apps: Object.fromEntries(appsMap),
    };
    try {
      ensureDataDir();
      atomicWriteJSON(path.join(DATA_DIR, "apps.json"), data);
      appsDirty = false;
      console.log(`[cache] 已刷写 apps.json (${appsMap.size} 条)`);
    } catch (e) {
      console.error("[cache] 刷写 apps.json 失败:", e);
    }
  }

  if (pricesDirty) {
    const data: PricesFileData = {
      version: 1,
      updatedAt: new Date().toISOString(),
      prices: Object.fromEntries(pricesMap),
    };
    try {
      ensureDataDir();
      atomicWriteJSON(path.join(DATA_DIR, "prices.json"), data);
      pricesDirty = false;
      console.log(`[cache] 已刷写 prices.json (${pricesMap.size} 条)`);
    } catch (e) {
      console.error("[cache] 刷写 prices.json 失败:", e);
    }
  }

  if (viewsDirty) {
    const data: ViewsFileData = {
      version: 1,
      updatedAt: new Date().toISOString(),
      views: Object.fromEntries(viewsMap),
    };
    try {
      ensureDataDir();
      atomicWriteJSON(path.join(DATA_DIR, "views.json"), data);
      viewsDirty = false;
      console.log(`[cache] 已刷写 views.json (${viewsMap.size} 条)`);
    } catch (e) {
      console.error("[cache] 刷写 views.json 失败:", e);
    }
  }
}

// ---- App 信息缓存 ----

export function getAppInfo(trackId: number): CachedAppInfo | null {
  ensureInit();
  return appsMap!.get(String(trackId)) ?? null;
}

export function setAppInfo(trackId: number, app: AppInfo, source: "api" | "scraper"): void {
  ensureInit();
  const key = String(trackId);
  const existing = appsMap!.get(key);
  // 爬虫数据不能覆盖 API 数据
  if (existing && existing.source === "api" && source === "scraper") return;

  appsMap!.set(key, {
    ...app,
    source,
    updatedAt: new Date().toISOString(),
  });
  appsDirty = true;
}

export function setAppInfoBatch(apps: AppInfo[], source: "api" | "scraper"): void {
  for (const app of apps) {
    setAppInfo(app.trackId, app, source);
  }
}

// ---- 价格缓存 ----

export function getCachedPrice(trackId: number, regionCode: string): CachedRegionPrice | null {
  ensureInit();
  const key = `${trackId}:${regionCode}`;
  const cached = pricesMap!.get(key);
  if (!cached) return null;

  // 检查 7 天过期
  const age = Date.now() - new Date(cached.crawledAt).getTime();
  if (age > PRICE_TTL_MS) {
    pricesMap!.delete(key);
    pricesDirty = true;
    return null;
  }
  return cached;
}

export function setCachedPrice(trackId: number, regionCode: string, price: RegionPrice): void {
  ensureInit();
  const key = `${trackId}:${regionCode}`;
  pricesMap!.set(key, {
    ...price,
    crawledAt: new Date().toISOString(),
  });
  pricesDirty = true;
}

// ---- 汇率缓存（仅内存，1 小时过期） ----

export function getCachedExchangeRates(): { rates: Record<string, number>; updatedAt: string } | null {
  if (!exchangeRatesCache) return null;
  const age = Date.now() - new Date(exchangeRatesCache.updatedAt).getTime();
  if (age > EXCHANGE_RATE_TTL_MS) {
    exchangeRatesCache = null;
    return null;
  }
  return exchangeRatesCache;
}

export function setCachedExchangeRates(rates: Record<string, number>): void {
  exchangeRatesCache = {
    rates,
    updatedAt: new Date().toISOString(),
  };
}

// ---- App 查看次数统计 ----

export function incrementAppView(trackId: number, trackName: string, artworkUrl512: string): void {
  ensureInit();
  const key = String(trackId);
  const existing = viewsMap!.get(key);
  const now = new Date().toISOString();
  if (existing) {
    existing.count += 1;
    existing.lastViewedAt = now;
    // 更新名称和图标（可能随时间变化）
    existing.trackName = trackName;
    existing.artworkUrl512 = artworkUrl512;
  } else {
    viewsMap!.set(key, { trackId, trackName, artworkUrl512, count: 1, lastViewedAt: now });
  }
  viewsDirty = true;
}

export function getTopViewedApps(limit: number = 10): AppViewCount[] {
  ensureInit();
  return Array.from(viewsMap!.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/** 按关键词搜索缓存中的 App（模糊匹配 trackName / bundleId） */
export function searchAppsInCache(keyword: string, limit: number = 10): CachedAppInfo[] {
  ensureInit();
  const lower = keyword.toLowerCase();
  const results: CachedAppInfo[] = [];
  for (const app of appsMap!.values()) {
    if (
      app.trackName.toLowerCase().includes(lower) ||
      app.bundleId.toLowerCase().includes(lower)
    ) {
      results.push(app);
      if (results.length >= limit) break;
    }
  }
  return results;
}
