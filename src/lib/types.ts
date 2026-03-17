/** iTunes Search API 返回的 App 信息 */
export interface AppInfo {
  trackId: number;
  trackName: string;
  bundleId: string;
  artworkUrl512: string;
  sellerName: string;
  primaryGenreName: string;
  price: number;
  currency: string;
  formattedPrice: string;
  averageUserRating?: number;
  userRatingCount?: number;
}

/** 从 App Store 页面解析到的内购项 */
export interface InAppPurchase {
  name: string;
  price: string; // 带货币符号的原始价格文本
}

/** 单个地区的价格查询结果 */
export interface RegionPrice {
  regionCode: string;
  regionName: string;
  flag: string;
  currency: string;
  appPrice: string;
  inAppPurchases: InAppPurchase[];
  error?: string;
}

/** 搜索结果 */
export interface SearchResult {
  resultCount: number;
  results: AppInfo[];
}

/** 价格查询完整响应 */
export interface PriceResponse {
  app: AppInfo;
  prices: RegionPrice[];
}

/** 缓存的 App 信息 */
export interface CachedAppInfo extends AppInfo {
  source: "api" | "scraper"; // 数据来源
  updatedAt: string;          // ISO 时间戳
}

/** 缓存的地区价格 */
export interface CachedRegionPrice extends RegionPrice {
  crawledAt: string; // 爬取时间 ISO 时间戳
}

/** apps.json 文件结构 */
export interface AppsFileData {
  version: 1;
  updatedAt: string;
  apps: Record<string, CachedAppInfo>;
}

/** prices.json 文件结构 */
export interface PricesFileData {
  version: 1;
  updatedAt: string;
  prices: Record<string, CachedRegionPrice>;
}

/** exchange-rates.json 文件结构 */
export interface ExchangeRatesFileData {
  version: 1;
  rates: Record<string, number>;
  updatedAt: string;
}

/** App 查看次数统计 */
export interface AppViewCount {
  trackId: number;
  trackName: string;
  artworkUrl512: string;
  count: number;        // 查看次数
  lastViewedAt: string; // 最后查看时间 ISO
}

/** views.json 文件结构 */
export interface ViewsFileData {
  version: 1;
  updatedAt: string;
  views: Record<string, AppViewCount>; // key 为 trackId
}
