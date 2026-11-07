# RentBuyAtlas — global rent vs buy calculator

Astro + React. 62 static pages: homepage calculator, 20 calculator landing pages, 30 guides, hub/category/methodology pages.

## Commands
- `pnpm dev` / `astro dev --background` — dev server
- `pnpm build` — static build to `dist/`
- `node scripts/qa.mjs` — after a build: word counts, meta lengths, broken internal links

## Where things live
- `src/data/markets.ts` — 27 market default assumptions (rates, taxes, fees). Review regularly.
- `src/lib/calc.ts` — rent vs buy engine (monthly simulation, break-even rent, 5% rule)
- `src/components/Calculator.tsx` — the interactive calculator (SSR + hydrated)
- `src/content/tools/` — calculator landing pages (Markdown, rendered below the calculator)
- `src/content/blog/` — guides
- `src/site.ts` — site name and URL. Set `SITE_URL` env var (or edit) to your real domain before deploying.
- SEO endpoints: `/sitemap.xml`, `/robots.txt` (AI crawlers allowed), `/llms.txt`, `/rss.xml`
