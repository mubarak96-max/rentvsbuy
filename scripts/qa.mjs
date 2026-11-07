// Content & link QA: run after `astro build`.  node scripts/qa.mjs
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
let problems = 0;
const warn = (m) => { problems++; console.log('  ✗ ' + m); };

console.log('Content files');
for (const dir of ['src/content/blog', 'src/content/tools']) {
  for (const file of walk(join(root, dir)).filter((f) => f.endsWith('.md'))) {
    const raw = readFileSync(file, 'utf8');
    const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
    const name = file.slice(root.length);
    if (!m) { warn(`${name}: no frontmatter`); continue; }
    const body = m[2];
    const words = body.replace(/[#*|>`\-]/g, ' ').split(/\s+/).filter(Boolean).length;
    const title = (m[1].match(/^title:\s*"?(.*?)"?\s*$/m) || [])[1] || '';
    const desc = (m[1].match(/^description:\s*"?(.*?)"?\s*$/m) || [])[1] || '';
    const flags = [];
    if (words < 1000) flags.push(`only ${words} words`);
    if (title.length > 65) flags.push(`title ${title.length} chars`);
    if (desc.length > 165 || desc.length < 110) flags.push(`description ${desc.length} chars`);
    if (/^# /m.test(body)) flags.push('has H1 in body');
    console.log(`  ${flags.length ? '✗' : '✓'} ${name} — ${words} words${flags.length ? ' — ' + flags.join(', ') : ''}`);
    problems += flags.length;
  }
}

console.log('\nInternal links (dist)');
const dist = join(root, 'dist');
const pages = walk(dist).filter((f) => f.endsWith('.html'));
const bad = new Map();
for (const p of pages) {
  const html = readFileSync(p, 'utf8');
  for (const [, href] of html.matchAll(/href="(\/[^"#?]*)/g)) {
    if (href.startsWith('//')) continue;
    const target = join(dist, href);
    const ok = existsSync(target) && (statSync(target).isFile() || existsSync(join(target, 'index.html')));
    if (!ok) bad.set(href, (bad.get(href) || []).concat(p.slice(dist.length)));
  }
}
for (const [href, from] of bad) warn(`${href} ← ${[...new Set(from)].slice(0, 3).join(', ')}`);
console.log(`\n${pages.length} pages checked. ${problems} problem(s).`);
process.exit(problems ? 1 : 0);
