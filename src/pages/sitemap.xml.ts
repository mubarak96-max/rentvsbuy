import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { CATEGORIES, categorySlug } from '../site';

export const GET: APIRoute = async ({ site }) => {
  const base = site!;
  const today = new Date().toISOString().slice(0, 10);
  const tools = await getCollection('tools');
  const posts = await getCollection('blog');
  const entries: { loc: string; lastmod: string; priority: string }[] = [
    { loc: '/', lastmod: today, priority: '1.0' },
    { loc: '/rent-vs-buy-calculator/', lastmod: today, priority: '0.9' },
    ...tools.map((t) => ({ loc: `/${t.id}/`, lastmod: t.data.updatedDate.toISOString().slice(0, 10), priority: '0.9' })),
    { loc: '/blog/', lastmod: today, priority: '0.7' },
    ...CATEGORIES.map((c) => ({ loc: `/blog/category/${categorySlug(c)}/`, lastmod: today, priority: '0.5' })),
    ...posts.map((p) => ({ loc: `/blog/${p.id}/`, lastmod: (p.data.updatedDate ?? p.data.publishDate).toISOString().slice(0, 10), priority: '0.8' })),
    { loc: '/methodology/', lastmod: today, priority: '0.6' },
    { loc: '/about/', lastmod: today, priority: '0.4' },
    { loc: '/privacy/', lastmod: today, priority: '0.2' },
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map((e) => `  <url><loc>${new URL(e.loc, base).href}</loc><lastmod>${e.lastmod}</lastmod><priority>${e.priority}</priority></url>`).join('\n')}
</urlset>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
