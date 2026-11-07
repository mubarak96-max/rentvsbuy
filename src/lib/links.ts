import { getCollection } from 'astro:content';

export const toolUrl = (id: string) => `/${id}/`;
export const blogUrl = (id: string) => `/blog/${id}/`;

export async function toolLinks() {
  const tools = await getCollection('tools');
  return tools
    .map((t) => ({ id: t.id, href: toolUrl(t.id), title: t.data.h1, desc: t.data.intro, market: t.data.market, isCountry: t.id.startsWith('rent-vs-buy-calculator/') }))
    .sort((a, b) => a.title.localeCompare(b.title));
}

export async function sortedPosts() {
  const posts = await getCollection('blog');
  return posts.sort((a, b) => b.data.publishDate.valueOf() - a.data.publishDate.valueOf());
}

export const wordCount = (body?: string) => (body ?? '').split(/\s+/).filter(Boolean).length;
export const readingTime = (body?: string) => Math.max(1, Math.round(wordCount(body) / 230));
