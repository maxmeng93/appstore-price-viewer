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
