/* ============================================
   WONGU HEALTH CENTER - Site checks
   Finds broken internal links and images, and wording the clinic has retired.
   Run with `npm run check` (also runs on every push; see .github/workflows).
   ============================================ */

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKIP_DIRS = new Set(['node_modules', 'drafts', 'todo', 'images', 'api', 'data', 'scripts', 'fonts', '.git', '.github']);
const SKIP_FILES = new Set(['es.html']); // Unpublished Spanish draft (not in git).

// Wording corrected with the clinic. A student's blog post may still mention tea she drinks at home.
const RETIRED_WORDING = [
  [/senior (student )?interns?/i, 'interns are "student interns"'],
  [/final year/i, 'interns are at different levels'],
  [/\b\d(st|nd|rd|th)[- ]year\b/i, 'interns are at different levels'],
  [/culinary insurance/i, 'use "Culinary Health Fund"'],
  [/\b(pills|tinctures)\b/i, 'the clinic sells liquid formulas and powders'],
  [/herbal teas?\b/i, 'the clinic sells liquid formulas and powders', new Set(['blog-chinese-herbs.html'])]
];

function htmlFiles(dir = ROOT) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return SKIP_DIRS.has(entry.name) ? [] : htmlFiles(full);
    return entry.name.endsWith('.html') && !SKIP_FILES.has(entry.name) ? [full] : [];
  });
}

/* Follows the site's clean URLs: /about serves about.html, / serves index.html. */
function resolves(urlPath) {
  const clean = decodeURI(urlPath).replace(/\/$/, '');
  const target = path.join(ROOT, clean);
  if (existsSync(target) && statSync(target).isFile()) return true;
  if (existsSync(`${target}.html`)) return true;
  return existsSync(path.join(target, 'index.html'));
}

function internalTargets(html) {
  const found = new Set();
  for (const [, url] of html.matchAll(/(?:href|src)="(\/[^"]*)"/g)) found.add(url);
  for (const [, set] of html.matchAll(/srcset="([^"]+)"/g)) {
    for (const part of set.split(',')) found.add(part.trim().split(/\s+/)[0]);
  }
  return [...found].filter(url => url.startsWith('/') && !url.startsWith('//'));
}

const problems = [];
const files = htmlFiles();

for (const file of files) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  const html = readFileSync(file, 'utf8');

  for (const url of internalTargets(html)) {
    const [urlPath, anchor] = url.split('?')[0].split('#');
    if (!resolves(urlPath)) {
      problems.push(`${rel}: broken link or image: ${url}`);
    } else if (anchor) {
      const page = path.join(ROOT, urlPath === '/' ? 'index' : urlPath);
      const target = urlPath.endsWith('.html') ? page : `${page}.html`;
      if (existsSync(target) && !readFileSync(target, 'utf8').includes(`id="${anchor}"`)) {
        problems.push(`${rel}: link to a missing section: ${url}`);
      }
    }
  }

  for (const [, id] of html.matchAll(/href="#([^"]+)"/g)) {
    if (!html.includes(`id="${id}"`)) problems.push(`${rel}: link to a missing section: #${id}`);
  }

  const visible = html.replace(/<!--[\s\S]*?-->/g, '');
  for (const [pattern, reason, exempt] of RETIRED_WORDING) {
    if (exempt?.has(rel)) continue;
    const match = visible.match(pattern);
    if (match) problems.push(`${rel}: retired wording "${match[0]}" (${reason})`);
  }
}

if (problems.length) {
  console.error(problems.join('\n'));
  console.error(`\n${problems.length} problem(s) in ${files.length} pages.`);
  process.exit(1);
}
console.log(`Checked ${files.length} pages: no broken links, missing images, or retired wording.`);
