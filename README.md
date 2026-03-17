# App Store Price Viewer

[English](./README_EN.md) | 中文

搜索 iOS 应用，查看其在全球 100+ 国家/地区的价格和内购信息，支持 USD 统一换算对比。

## 特性

- 🌍 全球 100+ 地区价格对比
- 💰 应用内购 (IAP) 价格查询
- 💱 USD 统一换算，方便横向对比
- 🌐 5 种语言界面（中文 / English / 日本語 / 한국어 / Русский）
- 🌙 深色主题 UI
- 🔗 URL 分享（选中 App 后可直接分享链接）
- 🔥 热门推荐（基于查看次数动态推荐 App）
- 📦 本地 JSON 文件缓存（价格 7 天，汇率 1 小时），零外部依赖

## 技术栈

- **Next.js 15** (App Router) + React 19 + TypeScript 5
- **Tailwind CSS v4** — CSS-first 配置
- **本地 JSON 文件缓存**（`./data/` 目录）
- **Cheerio** 解析 App Store 页面
- **iTunes Search / Lookup API** 数据源

## 快速开始

### 前置条件

- Node.js 18+
- [pnpm](https://pnpm.io/)

### 安装与启动

```bash
# 克隆仓库
git clone https://github.com/maxmeng93/app-store-price-viewer.git
cd app-store-price-viewer

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

打开 http://localhost:3000 即可使用。

> 缓存数据存储在 `./data/` 目录下，包括 App 信息、价格和查看统计。可通过 `DATA_DIR` 环境变量自定义路径。

## 部署

标准 Next.js 应用，可部署到任何支持 Node.js 的平台（Vercel、Docker、自托管等）。

环境变量（见 `.env.example`）：

- `DATA_DIR` — 缓存数据目录，默认 `./data`

### Docker 部署

```bash
# 构建并启动
docker compose up -d

# 或手动构建运行
docker build -t appstore-price-viewer .
docker run -p 3000:3000 -v ./data:/app/data appstore-price-viewer
```

> Docker 部署时，`./data` 目录映射到容器内 `/app/data`，确保缓存数据持久化。

## 架构

### 数据流

```
用户搜索 App
  → /api/search → iTunes Search API（失败时三级降级：本地缓存匹配 → Cheerio 爬虫）
  → 返回搜索结果
  → 用户选择 App（或点击热门推荐）
  → /api/prices → 记录查看次数 + 并发查询多个地区
    → 本地文件缓存命中（7 天内）→ 直接返回
    → 缓存未命中 → iTunes Lookup API + App Store 页面抓取
      → Cheerio 解析内购价格
      → 写入缓存
      → 返回前端
  → /api/exchange-rates → 获取 USD 汇率（内存缓存 1 小时）
  → 前端展示价格对比表

首页推荐
  → /api/popular → 按查看次数排序返回热门 App
  → 前端展示：top 2 + 随机 3 个
```

### 目录结构

```
src/
├── app/
│   ├── api/
│   │   ├── search/route.ts         # App 搜索接口
│   │   ├── prices/route.ts         # 多地区价格查询接口
│   │   ├── exchange-rates/route.ts # USD 汇率接口
│   │   └── popular/route.ts        # 热门 App 接口
│   ├── globals.css                 # 全局样式 + CSS 变量
│   ├── layout.tsx                  # 根布局
│   └── page.tsx                    # 首页（顶层状态管理）
├── components/
│   ├── SearchBar.tsx               # 搜索栏（即时搜索下拉）
│   ├── PriceTable.tsx              # 价格对比表格
│   └── RegionSelector.tsx          # 地区选择器
└── lib/
    ├── appstore.ts                 # App Store 数据抓取核心逻辑
    ├── cache.ts                    # 本地 JSON 文件缓存
    ├── currency.ts                 # 价格解析与 USD 换算
    ├── i18n.ts                     # 国际化（5 种语言）
    ├── regions.ts                  # 国家/地区配置（100+）
    └── types.ts                    # TypeScript 类型定义
```

## 注意事项

- **API 限制**: iTunes Search API 频率限制约 20 次/分钟/IP
- **页面解析**: App Store 页面结构可能随 Apple 更新而变化，内购解析选择器需定期维护
- **缓存**: 价格缓存 7 天，汇率内存缓存 1 小时，价格变动会有延迟

## 贡献

欢迎贡献！请按以下流程提交：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/your-feature`)
3. 提交更改 (`git commit -m 'Add some feature'`)
4. 推送到分支 (`git push origin feature/your-feature`)
5. 创建 Pull Request

> 项目无 lint/test 脚本，提交前请确保 `pnpm build` 通过。

## License

[MIT](./LICENSE)
