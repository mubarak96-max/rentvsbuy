import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { CATEGORIES } from './site';

const faq = z.object({ q: z.string(), a: z.string() });

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    h1: z.string().optional(),
    primaryKeyword: z.string(),
    keywords: z.array(z.string()).default([]),
    category: z.enum(CATEGORIES),
    publishDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tldr: z.string(),
    keyTakeaways: z.array(z.string()).default([]),
    faqs: z.array(faq).default([]),
    relatedTool: z.string().default('/'),
    heroImage: z.string().optional(),
  }),
});

const tools = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/tools' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    h1: z.string(),
    intro: z.string(),
    primaryKeyword: z.string(),
    keywords: z.array(z.string()).default([]),
    market: z.string().default('us'),
    variant: z.enum(['standard', 'shared-ownership']).default('standard'),
    horizonYears: z.number().default(10),
    updatedDate: z.coerce.date(),
    tldr: z.string(),
    faqs: z.array(faq).default([]),
  }),
});

export const collections = { blog, tools };
