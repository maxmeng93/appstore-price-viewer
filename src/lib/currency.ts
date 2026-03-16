// 免费/无效价格关键词
const FREE_KEYWORDS = ["free", "免费", "無料", "무료", "n/a", "error", "—", "-"];

// 货币符号正则
const CURRENCY_SYMBOLS = /[$¥€£₩₹₽₫₺₸₮₱₲₵₡₴₿﷼]/g;
// 前缀/后缀货币代码（3 位大写字母）
const CURRENCY_CODE_PREFIX = /^[A-Z]{3}\s*/;
const CURRENCY_CODE_SUFFIX = /\s*[A-Z]{3}$/;

/**
 * 解析价格字符串为数字
 * 支持格式: $20.00, ¥3,400, ₩30,000, 22,00 €, CNY 6.00 等
 */
export function parsePriceString(priceStr: string): number | null {
  if (!priceStr) return null;

  const trimmed = priceStr.trim();

  // 检查是否为免费/无效
  if (FREE_KEYWORDS.some((kw) => trimmed.toLowerCase() === kw)) return null;

  // 去除货币符号
  let cleaned = trimmed.replace(CURRENCY_SYMBOLS, "").trim();

  // 去除前缀或后缀货币代码
  cleaned = cleaned.replace(CURRENCY_CODE_PREFIX, "").replace(CURRENCY_CODE_SUFFIX, "").trim();

  if (!cleaned) return null;

  // 判断千位符 vs 小数点
  // 规则: 如果最后一个 `,` 后面恰好 2 位数字且没有 `.`，视为欧洲格式（逗号=小数点）
  const hasComma = cleaned.includes(",");
  const hasDot = cleaned.includes(".");

  let normalized: string;

  if (hasComma && !hasDot) {
    // 检查最后一个逗号后面是否恰好 2 位数字（欧洲小数格式）
    const lastCommaIdx = cleaned.lastIndexOf(",");
    const afterComma = cleaned.substring(lastCommaIdx + 1);
    if (afterComma.length === 2 && /^\d{2}$/.test(afterComma)) {
      // 欧洲格式: 22,00 → 22.00 或 1.234,56 → 1234.56
      // 先去掉逗号前面可能的点（千位符），再把逗号换成点
      const beforeComma = cleaned.substring(0, lastCommaIdx).replace(/\./g, "");
      normalized = beforeComma + "." + afterComma;
    } else {
      // 逗号是千位符: 3,400 → 3400
      normalized = cleaned.replace(/,/g, "");
    }
  } else if (hasComma && hasDot) {
    // 两者都有：判断哪个在后面
    const lastComma = cleaned.lastIndexOf(",");
    const lastDot = cleaned.lastIndexOf(".");
    if (lastComma > lastDot) {
      // 逗号在后 → 逗号是小数点: 1.234,56
      normalized = cleaned.replace(/\./g, "").replace(",", ".");
    } else {
      // 点在后 → 逗号是千位符: 1,234.56
      normalized = cleaned.replace(/,/g, "");
    }
  } else {
    // 只有点或都没有
    normalized = cleaned;
  }

  // 去除剩余非数字字符（除了小数点）
  normalized = normalized.replace(/[^\d.]/g, "");

  const value = parseFloat(normalized);
  return isNaN(value) ? null : value;
}

/**
 * 将价格字符串转换为 USD 格式
 * 返回 "$xx.xx" 或 null（无法转换时）
 */
export function convertToUSD(
  priceStr: string,
  currency: string,
  rates: Record<string, number>
): string | null {
  const numericPrice = parsePriceString(priceStr);
  if (numericPrice === null) return null;
  if (numericPrice === 0) return null;

  if (currency === "USD") {
    return `$${numericPrice.toFixed(2)}`;
  }

  const rate = rates[currency];
  if (!rate) return null;

  const usdValue = numericPrice / rate;
  return `$${usdValue.toFixed(2)}`;
}
