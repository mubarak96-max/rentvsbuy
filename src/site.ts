// Central site settings. Change SITE_URL to your production domain before deploying.
export const SITE = {
  name: 'RentBuyAtlas',
  url: (import.meta.env.SITE_URL as string | undefined) ?? 'https://rentbuyatlas.com',
  tagline: 'The global rent vs buy calculator',
  description:
    'Free rent vs buy calculator for 27 of the world’s top housing markets. Local taxes, transaction costs and rates, with break-even year, break-even rent and the 5% rule.',
  author: 'RentBuyAtlas Editorial Team',
  locale: 'en',
  ogImage: '/images/og-default.png',
};

export const CATEGORIES = ['Decision Guides', 'Costs & Math', 'Mortgages', 'Markets', 'Alternatives'] as const;
export type Category = (typeof CATEGORIES)[number];

export const categorySlug = (c: string) => c.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
export const categoryImage = (c: string) => `/images/cat-${categorySlug(c).replace('-and-', '-')}.webp`;
