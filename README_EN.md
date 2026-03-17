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
- 🔥 Popular recommendations (dynamically recommended based on view count)
- 📦 Local JSON file caching (prices 7d, exchange rates 1h), zero external dependencies

## Tech Stack

- **Next.js 15** (App Router) + React 19 + TypeScript 5
- **Tailwind CSS v4** — CSS-first configuration
- **Local JSON file caching** (`./data/` directory)
- **Cheerio** for App Store page parsing
- **iTunes Search / Lookup API** as data source

## Getting Started

### Prerequisites

- Node.js 18+
- [pnpm](https://pnpm.io/)

### Installation

```bash
# Clone the repository
git clone https://github.com/maxmeng93/app-store-price-viewer.git
cd app-store-price-viewer

# Install dependencies
pnpm install

# Start the development server
pnpm dev
```

Open http://localhost:3000 to use the app.

> Cache data is stored in the `./data/` directory, including app info, prices, and view statistics. Customize the path via the `DATA_DIR` environment variable.

## Deployment

Standard Next.js application — deploy to any Node.js-compatible platform (Vercel, Docker, self-hosted, etc.).

Environment variables (see `.env.example`):

- `DATA_DIR` — Cache data directory, defaults to `./data`

### Docker Deployment

```bash
# Build and start
docker compose up -d

# Or build and run manually
docker build -t appstore-price-viewer .
docker run -p 3000:3000 -v ./data:/app/data appstore-price-viewer
```

> When using Docker, the `./data` directory is mapped to `/app/data` inside the container to persist cache data.

## Architecture

### Data Flow

```
User searches for an app
  → /api/search → iTunes Search API (falls back to local cache search → Cheerio scraper on failure)
  → Returns search results
  → User selects an app (or clicks a popular recommendation)
  → /api/prices → Records view count + concurrent queries across multiple regions
    → Local file cache hit (within 7 days) → Return directly
    → Cache miss → iTunes Lookup API + App Store page scraping
      → Cheerio parses IAP prices
      → Write to cache
      → Return to frontend
  → /api/exchange-rates → Fetch USD exchange rates (in-memory cache, 1h)
  → Frontend displays price comparison table

Homepage recommendations
  → /api/popular → Returns apps sorted by view count
  → Frontend displays: top 2 + 3 random picks
```

### Directory Structure

```
src/
├── app/
│   ├── api/
│   │   ├── search/route.ts         # App search endpoint
│   │   ├── prices/route.ts         # Multi-region price query endpoint
│   │   ├── exchange-rates/route.ts # USD exchange rate endpoint
│   │   └── popular/route.ts        # Popular apps endpoint
│   ├── globals.css                 # Global styles + CSS variables
│   ├── layout.tsx                  # Root layout
│   └── page.tsx                    # Home page (top-level state management)
├── components/
│   ├── SearchBar.tsx               # Search bar (instant search dropdown)
│   ├── PriceTable.tsx              # Price comparison table
│   └── RegionSelector.tsx          # Region selector
└── lib/
    ├── appstore.ts                 # App Store data scraping core logic
    ├── cache.ts                    # Local JSON file caching
    ├── currency.ts                 # Price parsing & USD conversion
    ├── i18n.ts                     # Internationalization (5 languages)
    ├── regions.ts                  # Country/region config (100+)
    └── types.ts                    # TypeScript type definitions
```

## Notes

- **API Rate Limits**: iTunes Search API is limited to ~20 requests/minute/IP
- **Page Parsing**: App Store page structure may change with Apple updates; IAP parsing selectors need periodic maintenance
- **Caching**: Prices cached for 7 days, exchange rates cached in memory for 1 hour; price changes may be delayed

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
