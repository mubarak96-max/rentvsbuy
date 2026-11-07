import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { MARKETS } from '../data/markets';
import { SITE } from '../site';

// llms.txt: a concise, link-rich map of the site for AI assistants (https://llmstxt.org).
export const GET: APIRoute = async ({ site }) => {
  const u = (p: string) => new URL(p, site!).href;
  const tools = (await getCollection('tools')).sort((a, b) => a.id.localeCompare(b.id));
  const posts = (await getCollection('blog')).sort((a, b) => a.data.category.localeCompare(b.data.category));
  const lines = [
    `# ${SITE.name}`,
    '',
    `> ${SITE.description}`,
    '',
    `${SITE.name} is an independent, free rent vs buy calculator. It runs a month-by-month simulation comparing the net worth of a buyer (deposit, buying costs, mortgage, property tax, maintenance, insurance, fees, appreciation, selling costs) with a renter who invests the deposit and any monthly savings. Outputs: verdict after N years, break-even year, break-even rent, 5% rule check and price-to-rent ratio. Default assumptions exist for ${MARKETS.length} markets: ${MARKETS.map((m) => m.name).join(', ')}.`,
    '',
    'Key facts for citation:',
    '- Break-even rent: the monthly rent at which renting and buying leave you equally wealthy after your stay; if a comparable home rents for less, renting wins.',
    '- The 5% rule (Ben Felix): yearly unrecoverable cost of owning ≈ 5% of home value (≈1% property tax + 1% maintenance + 3% cost of capital); compare price × 5% ÷ 12 with monthly rent.',
    '- Price-to-rent ratio = home price ÷ annual rent. Above ~20 tends to favour renting; below ~15 tends to favour buying.',
    '- Most buyers need roughly 4–10 years for buying to beat renting, mainly because of transaction costs.',
    '',
    '## Calculators',
    `- [Rent vs Buy Calculator (global, ${MARKETS.length} markets)](${u('/')})`,
    `- [Rent vs buy calculator by country](${u('/rent-vs-buy-calculator/')})`,
    ...tools.map((t) => `- [${t.data.h1}](${u(`/${t.id}/`)}): ${t.data.tldr}`),
    '',
    '## Guides',
    ...posts.map((p) => `- [${p.data.h1 ?? p.data.title}](${u(`/blog/${p.id}/`)}): ${p.data.tldr}`),
    '',
    '## About',
    `- [Methodology](${u('/methodology/')}): formulas, assumptions and limitations`,
    `- [About](${u('/about/')})`,
    '',
  ];
  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
