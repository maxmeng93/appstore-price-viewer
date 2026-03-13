# App Store Price Viewer

查询 App Store 应用在全球各地区的价格和内购信息。

## 技术栈

- **前端/后端**: Next.js 15 (App Router)
- **部署**: Cloudflare Workers (via @opennextjs/cloudflare)
- **缓存**: Cloudflare KV (24 小时 TTL)
- **数据源**: iTunes Search/Lookup API + App Store 页面解析 (Cheerio)
- **样式**: Tailwind CSS v4

## 架构

```
用户搜索 App
  → /api/search → iTunes Search API → 返回搜索结果
  → 用户选择 App
  → /api/prices → 并发查询多个地区
    → KV 缓存命中 → 直接返回
    → 缓存未命中 → iTunes Lookup API + App Store 页面抓取
      → Cheerio 解析内购价格
      → 写入 KV 缓存 (TTL 24h)
      → 返回前端
  → 前端展示价格对比表
```

## 本地开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 在 Workers 运行时预览
pnpm preview
```

## 部署到 Cloudflare

### 1. 创建 KV Namespace

```bash
npx wrangler kv namespace create PRICE_CACHE
```

将返回的 `id` 填入 `wrangler.jsonc` 中的 `kv_namespaces` 配置。

### 2. 部署

```bash
pnpm deploy
```

## 目录结构

```
src/
├── app/
│   ├── api/
│   │   ├── search/route.ts    # App 搜索接口
│   │   └── prices/route.ts    # 价格查询接口
│   ├── globals.css            # 全局样式
│   ├── layout.tsx             # 根布局
│   └── page.tsx               # 首页
├── components/
│   ├── SearchBar.tsx          # 搜索栏（带即时搜索下拉）
│   └── PriceTable.tsx         # 价格对比表格
└── lib/
    ├── appstore.ts            # App Store 数据抓取核心逻辑
    ├── cache.ts               # Cloudflare KV 缓存工具
    ├── regions.ts             # 国家/地区配置数据
    └── types.ts               # TypeScript 类型定义
```

## 支持的地区

默认展示 12 个常用地区 (中国大陆、美国、日本、香港、台湾、韩国、英国、德国、新加坡、澳大利亚、印度、土耳其)，共支持 40+ 个地区。

## 注意事项

- App Store 页面结构可能随 Apple 更新而变化，内购解析选择器可能需要定期维护
- iTunes Search API 有频率限制 (约 20 次/分钟/IP)
- Cloudflare Workers 免费计划: 每天 10 万次请求，KV 每天 10 万次读 + 1000 次写
- 缓存 TTL 为 24 小时，价格变动会有延迟

## License

MIT
