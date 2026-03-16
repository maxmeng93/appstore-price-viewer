"use client";

import { createContext, useContext } from "react";

export type Locale = "zh" | "en" | "ja" | "ko" | "ru";

/** 翻译字典 */
const messages: Record<Locale, Record<string, string>> = {
  zh: {
    "subtitle": "查询 App Store 应用在全球各地区的价格和内购信息",
    "search.placeholder": "搜索 App 名称或 ID...",
    "region.selected": "已选 {count} 个地区",
    "region.search_placeholder": "搜索国家/地区...",
    "region.clear_all": "全部清除",
    "region.reset_default": "恢复默认",
    "table.region": "地区",
    "table.currency": "货币",
    "table.app_price": "App 价格",
    "table.iap": "内购项目",
    "table.no_iap": "—",
    "table.footer": "价格数据来源于 Apple iTunes API 和 App Store 公开页面，缓存 7 天",
    "table.view_in_appstore": "在 App Store 中查看",
    "table.show_usd": "USD 计价",
    "empty.hint": "搜索任意 App，查看全球各地区的价格对比",
    "group.asia-pacific": "亚太地区",
    "group.europe": "欧洲",
    "group.americas": "美洲",
    "group.middle-east-africa": "中东与非洲",
    "number.wan": "万",
  },
  en: {
    "subtitle": "Compare App Store prices across regions worldwide",
    "search.placeholder": "Search app name or ID...",
    "region.selected": "{count} regions selected",
    "region.search_placeholder": "Search country/region...",
    "region.clear_all": "Clear all",
    "region.reset_default": "Reset default",
    "table.region": "Region",
    "table.currency": "Currency",
    "table.app_price": "App Price",
    "table.iap": "In-App Purchases",
    "table.no_iap": "—",
    "table.footer": "Price data from Apple iTunes API and App Store public pages, cached for 7 days",
    "table.view_in_appstore": "View in App Store",
    "table.show_usd": "Show in USD",
    "empty.hint": "Search any app to compare prices across regions",
    "group.asia-pacific": "Asia Pacific",
    "group.europe": "Europe",
    "group.americas": "Americas",
    "group.middle-east-africa": "Middle East & Africa",
    "number.wan": "k",
  },
  ja: {
    "subtitle": "App Store アプリの各地域での価格と課金情報を確認",
    "search.placeholder": "アプリ名または ID を検索...",
    "region.selected": "{count} 地域を選択中",
    "region.search_placeholder": "国/地域を検索...",
    "region.clear_all": "すべてクリア",
    "region.reset_default": "デフォルトに戻す",
    "table.region": "地域",
    "table.currency": "通貨",
    "table.app_price": "アプリ価格",
    "table.iap": "アプリ内課金",
    "table.no_iap": "—",
    "table.footer": "価格データは Apple iTunes API と App Store の公開ページから取得、7日間キャッシュ",
    "table.view_in_appstore": "App Store で表示",
    "table.show_usd": "USD 表示",
    "empty.hint": "アプリを検索して、各地域の価格を比較しましょう",
    "group.asia-pacific": "アジア太平洋",
    "group.europe": "ヨーロッパ",
    "group.americas": "アメリカ",
    "group.middle-east-africa": "中東・アフリカ",
    "number.wan": "万",
  },
  ko: {
    "subtitle": "App Store 앱의 전 세계 지역별 가격 및 인앱 구매 정보 조회",
    "search.placeholder": "앱 이름 또는 ID 검색...",
    "region.selected": "{count}개 지역 선택됨",
    "region.search_placeholder": "국가/지역 검색...",
    "region.clear_all": "모두 지우기",
    "region.reset_default": "기본값 복원",
    "table.region": "지역",
    "table.currency": "통화",
    "table.app_price": "앱 가격",
    "table.iap": "인앱 구매",
    "table.no_iap": "—",
    "table.footer": "가격 데이터는 Apple iTunes API 및 App Store 공개 페이지에서 제공되며, 7일간 캐시됩니다",
    "table.view_in_appstore": "App Store에서 보기",
    "table.show_usd": "USD 표시",
    "empty.hint": "앱을 검색하여 전 세계 지역별 가격을 비교하세요",
    "group.asia-pacific": "아시아 태평양",
    "group.europe": "유럽",
    "group.americas": "아메리카",
    "group.middle-east-africa": "중동 및 아프리카",
    "number.wan": "만",
  },
  ru: {
    "subtitle": "Сравнение цен App Store по регионам мира",
    "search.placeholder": "Поиск по названию или ID...",
    "region.selected": "Выбрано регионов: {count}",
    "region.search_placeholder": "Поиск страны/региона...",
    "region.clear_all": "Очистить все",
    "region.reset_default": "Сбросить",
    "table.region": "Регион",
    "table.currency": "Валюта",
    "table.app_price": "Цена приложения",
    "table.iap": "Встроенные покупки",
    "table.no_iap": "—",
    "table.footer": "Данные о ценах из Apple iTunes API и публичных страниц App Store, кэш 7 дней",
    "table.view_in_appstore": "Открыть в App Store",
    "table.show_usd": "Показать в USD",
    "empty.hint": "Найдите приложение, чтобы сравнить цены по регионам",
    "group.asia-pacific": "Азиатско-Тихоокеанский регион",
    "group.europe": "Европа",
    "group.americas": "Америка",
    "group.middle-east-africa": "Ближний Восток и Африка",
    "number.wan": "тыс.",
  },
};

/** 语言标签，供切换控件使用 */
export const LOCALE_LABELS: Record<Locale, string> = {
  zh: "中", en: "EN", ja: "日", ko: "한", ru: "RU",
};

/** 检测浏览器语言 */
export function detectLocale(): Locale {
  if (typeof navigator === "undefined") return "en";
  const lang = navigator.language.toLowerCase();
  if (lang.startsWith("zh")) return "zh";
  if (lang.startsWith("ja")) return "ja";
  if (lang.startsWith("ko")) return "ko";
  if (lang.startsWith("ru")) return "ru";
  return "en";
}

/** 翻译函数，支持 {key} 插值 */
export function t(locale: Locale, key: string, params?: Record<string, string | number>): string {
  let text = messages[locale]?.[key] ?? messages["en"][key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(`{${k}}`, String(v));
    }
  }
  return text;
}

/** Locale Context */
export const LocaleContext = createContext<Locale>("en");

/** 在组件中获取 locale 和 t 函数 */
export function useLocale() {
  const locale = useContext(LocaleContext);
  return {
    locale,
    t: (key: string, params?: Record<string, string | number>) => t(locale, key, params),
  };
}
