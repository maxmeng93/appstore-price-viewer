# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

App Store 全球价格对比工具 — 搜索 iOS 应用，查看其在不同国家/地区的价格和内购信息。

## 常用命令

```bash
pnpm install        # 安装依赖
pnpm dev            # 启动 Next.js 开发服务器
pnpm build          # 生产构建（也是唯一的类型检查方式）
pnpm start          # 启动生产服务器
```

项目无 test/lint 脚本。包管理器为 **pnpm**。验证改动正确性请用 `pnpm build`。

## 技术栈

- **Next.js 15** (App Router) + **React 19** + **TypeScript 5**
- **Tailwind CSS v4** — CSS-first 配置，无 `tailwind.config` 文件，通过 `globals.css` 中 `@import "tailwindcss"` 引入
- **本地 JSON 文件缓存**（App 信息 + 价格 + 查看统计持久化到 `./data/`，汇率仅内存缓存 1 小时）
- **Cheerio** 解析 App Store HTML 页面提取内购价格

## 环境变量

见 `.env.example`。`DATA_DIR` 可配置缓存数据目录，默认 `./data`。

## 架构要点

### 数据流

搜索词 → `/api/search` → iTunes Search API（失败三级降级: 本地缓存匹配 → Cheerio 爬虫） → 前端下拉选择 → `/api/prices` → 对每个地区并发: 本地文件/内存缓存 → iTunes Lookup API + App Store 页面抓取(Cheerio) → 返回价格对比数据

### API 路由

- `GET /api/search?term=xxx&country=us` — 搜索 App，最多 8 条结果；iTunes API 失败时先查本地缓存（`searchAppsInCache` 按 trackName/bundleId 模糊匹配），缓存无结果再降级为爬取 `apps.apple.com` 搜索页
- `GET /api/prices?trackId=xxx&regions=cn,us,...` — 查询多地区价格，最多 15 个地区；可选参数 `trackName`、`artworkUrl512` 作为备份；自动调用 `incrementAppView()` 计入查看次数
- `GET /api/exchange-rates` — 获取 USD 汇率（来源 open.er-api.com），内存缓存 1 小时
- `GET /api/popular?limit=20` — 返回按查看次数排序的热门 App 列表（默认 20 条，上限 50），数据来源 `views.json`

### 缓存策略 (`src/lib/cache.ts`)

三层缓存文件（`data/` 目录下）：
- `apps.json` — App 基本信息，永不过期；爬虫数据不覆盖 API 数据（质量控制）
- `prices.json` — 地区价格，7 天过期；key 格式 `${trackId}:${regionCode}`
- `views.json` — App 查看次数统计，永不过期

启动时加载文件到内存 Map，定时 10 分钟 + 进程退出时 flush 到磁盘（原子写入：先 `.tmp` 再 `rename`）。

`searchAppsInCache()` 提供基于 `trackName`/`bundleId` 的模糊搜索，用于搜索 API 失败时的快速降级。

### URL 分享机制

选中 App 后 URL 写入 `?id=<trackId>`（`replaceState`），同时将 AppInfo 缓存到 `sessionStorage`。页面加载时读取 URL 参数自动恢复数据，支持链接分享。

### App Store 页面解析策略 (`src/lib/appstore.ts`)

1. 优先从 JSON-LD (`<script type="application/ld+json">`) 提取价格
2. 备用: 匹配 `[class*="price"]` 元素
3. 内购: 匹配 `div.text-pair` 下的 `span` 对，通过价格正则过滤

Apple 可能随时更新页面结构，解析选择器需定期维护。

### 热门推荐系统

- `/api/prices` 每次请求自动 `incrementAppView()` 累计查看次数
- 首页 empty state 调用 `/api/popular` 获取热门列表
- 展示逻辑（`getSuggestedApps()`）：≥5 条热门数据时取 top 2 + 随机 3；不足时用语言相关的 `fallbackApps` 硬编码列表补齐
- 热门 App 点击直接调用 `handleSelectApp()` 加载价格（不走搜索），fallback 则填入搜索框触发搜索

### i18n 国际化 (`src/lib/i18n.ts`)

- 支持 5 种语言: zh / en / ja / ko / ru
- 硬编码翻译字典 `messages`，每语言 19 个 key
- `detectLocale()` 依据 `navigator.language` 检测，语言选择存 `sessionStorage`
- `LocaleContext` + `useLocale()` Hook 向组件传递 locale 和 `t()` 翻译函数
- **新增语言时需同步修改**: `Locale` 类型、`messages` 字典、`LOCALE_LABELS`、`detectLocale()`、`regions.ts` 的 `getRegionName()` switch、`page.tsx` 的 `fallbackApps`

### 货币解析 (`src/lib/currency.ts`)

- `parsePriceString()` 支持多种国际价格格式（$20.00 / ¥3,400 / €22,00），智能判断千位符 vs 小数点
- `convertToUSD()` 解析价格后除以汇率返回 USD 字符串

### 客户端持久化

- 地区选择 → `localStorage` (key: `selectedRegions`)
- 语言选择 → `sessionStorage` (key: `appLocale`)
- 选中 App → URL search param `?id=<trackId>` + `sessionStorage` (key: `appInfo_<trackId>`)

### 关键约束

- iTunes Search API 频率限制约 20 次/分钟/IP
- 路径别名: `@/*` → `./src/*`
- 地区配置在 `src/lib/regions.ts`，含 100+ 地区，按亚太/美洲/欧洲/中东非洲分组
- 状态管理: `page.tsx` 管理顶层状态，初始化 `useEffect` 中需注意时序——先恢复 regions 再读取 URL 参数
- 样式使用 CSS 变量（`--color-accent` / `--color-surface` 等），定义在 `globals.css`，深色主题
- 组件内联 `style` 属性引用 CSS 变量实现主题，而非纯 Tailwind class
