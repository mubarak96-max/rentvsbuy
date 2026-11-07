import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { SITE } from '../site';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const GET: APIRoute = async ({ site }) => {
  const posts = (await getCollection('blog')).sort((a, b) => b.data.publishDate.valueOf() - a.data.publishDate.valueOf());
  const items = posts.map((p) => {
    const link = new URL(`/blog/${p.id}/`, site!).href;
    return `<item><title>${esc(p.data.h1 ?? p.data.title)}</title><link>${link}</link><guid>${link}</guid><pubDate>${p.data.publishDate.toUTCString()}</pubDate><category>${esc(p.data.category)}</category><description>${esc(p.data.description)}</description></item>`;
  });
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${esc(SITE.name)} guides</title><link>${site!.href}</link><description>${esc(SITE.description)}</description><language>en</language>${items.join('')}</channel></rss>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
