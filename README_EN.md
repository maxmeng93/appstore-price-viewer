# App Store Price Viewer

English | [中文](./README.md)

Search iOS apps and compare prices across 100+ countries/regions worldwide, with USD conversion for easy comparison.

## Features

- 🌍 Price comparison across 100+ regions
- 💰 In-App Purchase (IAP) price lookup
- 💱 Unified USD conversion for side-by-side comparison
- 🌐 5 language UI (中文 / English / 日本語 / 한국어 / Русский)
- 🌙 Dark theme UI
- 🔗 URL sharing (share a direct link to any app's price comparison)
- ⚡ Upstash Redis caching (prices 7d, exchange rates 24h), falls back to in-memory cache when unconfigured

## Tech Stack

- **Next.js 15** (App Router) + React 19 + TypeScript 5
- **Tailwind CSS v4** — CSS-first configuration
- **Upstash Redis** caching (optional)
- **Cheerio** for App Store page parsing
- **iTunes Search / Lookup API** as data source

## Getting Started

### Prerequisites

- Node.js 18+
- [pnpm](https://pnpm.io/)

### Installation

```bash
# Clone the repository
git clone https://github.com/yogo/appstore-price-viewer.git
cd appstore-price-viewer

# Install dependencies
pnpm install

# Start the development server
pnpm dev
```

Open http://localhost:3000 to use the app.

> When Upstash Redis environment variables are not configured, caching falls back to in-memory mode (cleared on process restart).

## Deployment

Standard Next.js application — deploy to any Node.js-compatible platform (Vercel, Docker, self-hosted, etc.).

To enable Redis caching, set the following environment variables (see `.env.example`):

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

### Docker Deployment

```bash
# Build and start
docker compose up -d

# Or build and run manually
docker build -t appstore-price-viewer .
docker run -p 3000:3000 --env-file .env appstore-price-viewer
```

> When using `docker compose`, environment variables are read from the `.env` file in the project root.

## Architecture

### Data Flow

```
User searches for an app
  → /api/search → iTunes Search API → Returns search results
  → User selects an app
  → /api/prices → Concurrent queries across multiple regions
    → Redis/memory cache hit → Return directly
    → Cache miss → iTunes Lookup API + App Store page scraping
      → Cheerio parses IAP prices
      → Write to cache (price TTL 7d)
      → Return to frontend
  → /api/exchange-rates → Fetch USD exchange rates
  → Frontend displays price comparison table
```

### Directory Structure

```
src/
├── app/
│   ├── api/
│   │   ├── search/route.ts         # App search endpoint
│   │   ├── prices/route.ts         # Multi-region price query endpoint
│   │   └── exchange-rates/route.ts # USD exchange rate endpoint
│   ├── globals.css                 # Global styles + CSS variables
│   ├── layout.tsx                  # Root layout
│   └── page.tsx                    # Home page (top-level state management)
├── components/
│   ├── SearchBar.tsx               # Search bar (instant search dropdown)
│   ├── PriceTable.tsx              # Price comparison table
│   └── RegionSelector.tsx          # Region selector
└── lib/
    ├── appstore.ts                 # App Store data scraping core logic
    ├── cache.ts                    # Redis / in-memory cache utilities
    ├── currency.ts                 # Price parsing & USD conversion
    ├── i18n.ts                     # Internationalization (5 languages)
    ├── regions.ts                  # Country/region config (100+)
    └── types.ts                    # TypeScript type definitions
```

## Notes

- **API Rate Limits**: iTunes Search API is limited to ~20 requests/minute/IP
- **Page Parsing**: App Store page structure may change with Apple updates; IAP parsing selectors need periodic maintenance
- **Caching**: Prices cached for 7 days, exchange rates for 24 hours; price changes may be delayed

## Contributing

Contributions are welcome! Please follow this workflow:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add some feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

> This project has no lint/test scripts. Please ensure `pnpm build` passes before submitting.

## License

[MIT](./LICENSE)
