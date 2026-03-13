/** Apple App Store 支持的国家/地区及其货币 */
export interface Region {
  code: string; // ISO 两位国家代码
  name: string; // 中文名称
  currency: string; // 货币代码
  flag: string; // emoji 旗帜
}

export const REGIONS: Region[] = [
  // 亚太地区
  { code: "cn", name: "中国大陆", currency: "CNY", flag: "🇨🇳" },
  { code: "hk", name: "香港", currency: "HKD", flag: "🇭🇰" },
  { code: "tw", name: "台湾", currency: "TWD", flag: "🇹🇼" },
  { code: "mo", name: "澳门", currency: "MOP", flag: "🇲🇴" },
  { code: "jp", name: "日本", currency: "JPY", flag: "🇯🇵" },
  { code: "kr", name: "韩国", currency: "KRW", flag: "🇰🇷" },
  { code: "sg", name: "新加坡", currency: "SGD", flag: "🇸🇬" },
  { code: "au", name: "澳大利亚", currency: "AUD", flag: "🇦🇺" },
  { code: "nz", name: "新西兰", currency: "NZD", flag: "🇳🇿" },
  { code: "in", name: "印度", currency: "INR", flag: "🇮🇳" },
  { code: "id", name: "印度尼西亚", currency: "IDR", flag: "🇮🇩" },
  { code: "th", name: "泰国", currency: "THB", flag: "🇹🇭" },
  { code: "vn", name: "越南", currency: "VND", flag: "🇻🇳" },
  { code: "my", name: "马来西亚", currency: "MYR", flag: "🇲🇾" },
  { code: "ph", name: "菲律宾", currency: "PHP", flag: "🇵🇭" },
  // 美洲
  { code: "us", name: "美国", currency: "USD", flag: "🇺🇸" },
  { code: "ca", name: "加拿大", currency: "CAD", flag: "🇨🇦" },
  { code: "mx", name: "墨西哥", currency: "MXN", flag: "🇲🇽" },
  { code: "br", name: "巴西", currency: "BRL", flag: "🇧🇷" },
  { code: "cl", name: "智利", currency: "CLP", flag: "🇨🇱" },
  { code: "co", name: "哥伦比亚", currency: "COP", flag: "🇨🇴" },
  { code: "ar", name: "阿根廷", currency: "ARS", flag: "🇦🇷" },
  // 欧洲
  { code: "gb", name: "英国", currency: "GBP", flag: "🇬🇧" },
  { code: "de", name: "德国", currency: "EUR", flag: "🇩🇪" },
  { code: "fr", name: "法国", currency: "EUR", flag: "🇫🇷" },
  { code: "it", name: "意大利", currency: "EUR", flag: "🇮🇹" },
  { code: "es", name: "西班牙", currency: "EUR", flag: "🇪🇸" },
  { code: "nl", name: "荷兰", currency: "EUR", flag: "🇳🇱" },
  { code: "se", name: "瑞典", currency: "SEK", flag: "🇸🇪" },
  { code: "no", name: "挪威", currency: "NOK", flag: "🇳🇴" },
  { code: "dk", name: "丹麦", currency: "DKK", flag: "🇩🇰" },
  { code: "ch", name: "瑞士", currency: "CHF", flag: "🇨🇭" },
  { code: "pl", name: "波兰", currency: "PLN", flag: "🇵🇱" },
  { code: "tr", name: "土耳其", currency: "TRY", flag: "🇹🇷" },
  { code: "ru", name: "俄罗斯", currency: "RUB", flag: "🇷🇺" },
  // 中东 & 非洲
  { code: "sa", name: "沙特阿拉伯", currency: "SAR", flag: "🇸🇦" },
  { code: "ae", name: "阿联酋", currency: "AED", flag: "🇦🇪" },
  { code: "il", name: "以色列", currency: "ILS", flag: "🇮🇱" },
  { code: "eg", name: "埃及", currency: "EGP", flag: "🇪🇬" },
  { code: "ng", name: "尼日利亚", currency: "NGN", flag: "🇳🇬" },
  { code: "za", name: "南非", currency: "ZAR", flag: "🇿🇦" },
];

/** 默认展示的地区（精选常用） */
export const DEFAULT_REGIONS = [
  "cn",
  "us",
  "jp",
  "hk",
  "tw",
  "kr",
  "gb",
  "de",
  "sg",
  "au",
  "in",
  "tr",
];
