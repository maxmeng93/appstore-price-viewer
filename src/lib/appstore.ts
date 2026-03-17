import * as cheerio from "cheerio";
import type { AppInfo, InAppPurchase, RegionPrice, SearchResult } from "./types";
import { REGIONS } from "./regions";
import { setAppInfo, setAppInfoBatch, getAppInfo, searchAppsInCache } from "./cache";

/**
 * 通过爬取 App Store 搜索页面获取搜索结果（降级方案）
 */
async function searchAppsByScraping(
  term: string,
  country: string = "us",
  limit: number = 10
): Promise<SearchResult> {
  const url = `https://apps.apple.com/${country}/iphone/search?term=${encodeURIComponent(term)}`;

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15",
      "Accept-Language": "en-US,en;q=0.9",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });

  if (!res.ok) {
    throw new Error(`App Store 搜索页面请求失败: ${res.status}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  const results: SearchResult["results"] = [];

  $("section[data-test-id='shelf-wrapper'] ul li > a").each((_: any, el: any) => {
    if (results.length >= limit) return false;

    const $el = $(el);
    const href = $el.attr("href") || "";
    const idMatch = href.match(/id(\d+)$/);
    if (!idMatch) return;

    const trackId = Number(idMatch[1]);
    const trackName = $el.find("h3").text().trim();

    // 从 picture source 获取图标 URL，替换尺寸为 512x512
    let artworkUrl512 = "";
    const srcset = $el.find(".app-icon picture source[type='image/webp']").attr("srcset") || "";
    if (srcset) {
      const firstUrl = srcset.split(",")[0].trim().split(" ")[0];
      artworkUrl512 = firstUrl.replace(/\d+x\d+[^.]*\.webp/, "512x512bb-75.webp");
    }

    results.push({
      trackId,
      trackName,
      bundleId: "",
      artworkUrl512,
      sellerName: "",
      primaryGenreName: "",
      price: 0,
      currency: "",
      formattedPrice: "",
    });
  });

  return {
    resultCount: results.length,
    results,
  };
}

/**
 * 通过 iTunes Search API 搜索 App，失败时降级为爬取 App Store 搜索页面
 */
export async function searchApps(
  term: string,
  country: string = "us",
  limit: number = 10
): Promise<SearchResult> {
  try {
    const url = new URL("https://itunes.apple.com/search");
    url.searchParams.set("term", term);
    url.searchParams.set("country", country);
    url.searchParams.set("entity", "software");
    url.searchParams.set("limit", String(limit));

    const res = await fetch(url.toString(), {
      headers: { "User-Agent": "AppStorePriceViewer/1.0" },
    });

    if (!res.ok) {
      console.warn(`iTunes Search API 返回 ${res.status}，降级为缓存/爬虫搜索`);
      // 先查本地缓存
      const cached = searchAppsInCache(term, limit);
      if (cached.length > 0) {
        return { resultCount: cached.length, results: cached };
      }
      // 缓存无结果，降级爬虫
      return searchAppsByScraping(term, country, limit);
    }

    const data = await res.json();

    const result: SearchResult = {
      resultCount: data.resultCount,
      results: data.results.map((r: Record<string, unknown>) => ({
        trackId: r.trackId,
        trackName: r.trackName,
        bundleId: r.bundleId,
        artworkUrl512: (r.artworkUrl512 as string) || (r.artworkUrl100 as string),
        sellerName: r.sellerName,
        primaryGenreName: r.primaryGenreName,
        price: r.price,
        currency: r.currency,
        formattedPrice: r.formattedPrice,
        averageUserRating: r.averageUserRating,
        userRatingCount: r.userRatingCount,
      })),
    };

    // 缓存 API 返回的 App 信息
    setAppInfoBatch(result.results, "api");

    return result;
  } catch (error) {
    console.warn("iTunes Search API 调用失败，降级为缓存/爬虫搜索:", error instanceof Error ? error.message : error);
    // 先查本地缓存
    const cached = searchAppsInCache(term, limit);
    if (cached.length > 0) {
      return { resultCount: cached.length, results: cached };
    }
    // 缓存无结果，降级爬虫
    const scraperResult = await searchAppsByScraping(term, country, limit);
    // 缓存爬虫返回的 App 信息
    setAppInfoBatch(scraperResult.results, "scraper");
    return scraperResult;
  }
}

/**
 * 通过 iTunes Lookup API 获取 App 基本信息（指定地区）
 */
export async function lookupApp(
  trackId: number,
  country: string = "us"
): Promise<AppInfo | null> {
  const url = `https://itunes.apple.com/lookup?id=${trackId}&country=${country}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "AppStorePriceViewer/1.0" },
  });

  if (!res.ok) {
    // API 失败时尝试从缓存读取
    const cached = getAppInfo(trackId);
    if (cached) {
      console.log(`[appstore] lookupApp(${trackId}) API 失败，使用缓存数据`);
      return cached;
    }
    return null;
  }

  const data = await res.json();
  if (data.resultCount === 0) return null;

  const r = data.results[0];
  const app: AppInfo = {
    trackId: r.trackId,
    trackName: r.trackName,
    bundleId: r.bundleId,
    artworkUrl512: r.artworkUrl512 || r.artworkUrl100,
    sellerName: r.sellerName,
    primaryGenreName: r.primaryGenreName,
    price: r.price,
    currency: r.currency,
    formattedPrice: r.formattedPrice,
    averageUserRating: r.averageUserRating,
    userRatingCount: r.userRatingCount,
  };

  // 缓存 API 返回的 App 信息
  setAppInfo(trackId, app, "api");

  return app;
}

/**
 * 抓取 App Store 网页上的内购价格信息
 * URL格式: https://apps.apple.com/{country}/app/{slug}/id{trackId}
 */
export async function fetchAppStorePage(
  trackId: number,
  country: string
): Promise<{ appPrice: string; inAppPurchases: InAppPurchase[] }> {
  const url = `https://apps.apple.com/${country}/app/id${trackId}`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15",
        "Accept-Language": "en-US,en;q=0.9",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      // Cloudflare Workers 中 fetch 自带超时机制
    });

    if (!res.ok) {
      return { appPrice: "N/A", inAppPurchases: [] };
    }

    const html = await res.text();
    return parseAppStorePage(html);
  } catch (error) {
    console.error(`Failed to fetch App Store page for ${country}:`, error instanceof Error ? `${error.name}: ${error.message}\n${error.stack}` : error);
    return { appPrice: "N/A", inAppPurchases: [] };
  }
}

/**
 * 解析 App Store HTML 页面，提取价格和内购信息
 */
function parseAppStorePage(html: string): {
  appPrice: string;
  inAppPurchases: InAppPurchase[];
} {
  const $ = cheerio.load(html);

  // 尝试从页面提取 App 价格
  // App Store 页面结构可能变化，这里提供多种选择器兼容
  let appPrice = "Free";

  // 方法1: 从 JSON-LD 结构化数据中提取
  const jsonLdScripts = $('script[type="application/ld+json"]');
  jsonLdScripts.each((_: any, el: any) => {
    try {
      const data = JSON.parse($(el).text());
      if (data.offers && data.offers.price !== undefined) {
        if (data.offers.price === 0) {
          appPrice = "Free";
        } else {
          const currency = data.offers.priceCurrency || "";
          appPrice = `${currency} ${data.offers.price}`;
        }
      }
    } catch {
      // ignore parse errors
    }
  });

  // 方法2: 从页面元素提取 (备用)
  if (appPrice === "Free") {
    const priceEl = $('[class*="price"]').first();
    if (priceEl.length && priceEl.text().trim()) {
      const text = priceEl.text().trim();
      if (text !== "Get" && text !== "获取" && text !== "入手") {
        appPrice = text;
      }
    }
  }

  // 提取内购项目
  const inAppPurchases: InAppPurchase[] = [];

  // 直接用 div.text-pair 选择器提取内购项
  if (inAppPurchases.length === 0) {
    $("div.text-pair").each((_: any, pair: any) => {
      const spans = $(pair).find("span");
      if (spans.length >= 2) {
        const name = $(spans[0]).text().trim();
        const price = $(spans[1]).text().trim();
        // 用价格正则过滤非内购项
        if (name && price && /[\d$¥€£₩]/.test(price)) {
          inAppPurchases.push({ name, price });
        }
      }
    });
  }

  return { appPrice, inAppPurchases };
}

/**
 * 获取指定 App 在某个地区的价格信息
 */
export async function getRegionPrice(
  trackId: number,
  regionCode: string
): Promise<RegionPrice> {
  const region = REGIONS.find((r) => r.code === regionCode);
  if (!region) {
    return {
      regionCode,
      regionName: regionCode,
      flag: "🏳️",
      currency: "???",
      appPrice: "N/A",
      inAppPurchases: [],
      error: "Unknown region",
    };
  }

  try {
    // 并行请求: iTunes Lookup (获取基础价格) + App Store 页面 (获取内购)
    const [lookupResult, pageResult] = await Promise.all([
      lookupApp(trackId, regionCode),
      fetchAppStorePage(trackId, regionCode),
    ]);

    const appPrice = lookupResult
      ? lookupResult.formattedPrice || (lookupResult.price === 0 ? "Free" : `${lookupResult.currency} ${lookupResult.price}`)
      : pageResult.appPrice;

    return {
      regionCode: region.code,
      regionName: region.name,
      flag: region.flag,
      currency: lookupResult?.currency || region.currency,
      appPrice,
      inAppPurchases: pageResult.inAppPurchases,
    };
  } catch (error) {
    return {
      regionCode: region.code,
      regionName: region.name,
      flag: region.flag,
      currency: region.currency,
      appPrice: "Error",
      inAppPurchases: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
