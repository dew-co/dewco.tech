'use strict';

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const defaultBaseUrl = 'https://dewco.tech';

const baseUrlInput = process.env.SITE_URL || process.env.BASE_URL || defaultBaseUrl;
const baseUrl = normalizeBaseUrl(baseUrlInput);
const baseUrlNoTrailing = baseUrl.replace(/\/$/, '');

const staticPaths = ['/', '/about', '/contact', '/portfolio', '/stories'];
const urls = [];
const seen = new Set();

function normalizeBaseUrl(value) {
  const trimmed = String(value || '').trim();
  if (!trimmed) {
    return `${defaultBaseUrl}/`;
  }
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return withProtocol.endsWith('/') ? withProtocol : `${withProtocol}/`;
}

function resolveUrl(value) {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) {
    return value;
  }
  const cleaned = value.startsWith('/') ? value.slice(1) : value;
  try {
    return new URL(cleaned, baseUrl).toString();
  } catch (error) {
    return null;
  }
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function addUrl(loc, lastmod) {
  const resolved = resolveUrl(loc);
  if (!resolved) return;
  if (seen.has(resolved)) return;
  seen.add(resolved);
  urls.push({ loc: resolved, lastmod });
}

function readJson(relativePath) {
  const fullPath = path.join(rootDir, relativePath);
  if (!fs.existsSync(fullPath)) {
    return null;
  }
  try {
    const raw = fs.readFileSync(fullPath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    console.warn(`[sitemap] Could not parse ${relativePath}: ${error.message}`);
    return null;
  }
}

staticPaths.forEach((item) => addUrl(item));

const portfolios = readJson('src/assets/json/portfolios.json');
if (Array.isArray(portfolios)) {
  portfolios.forEach((item) => {
    const link = item && typeof item.link === 'string' ? item.link : '';
    if (link) {
      addUrl(link);
    }
  });
}

const stories = readJson('src/assets/json/stories.json');
if (Array.isArray(stories)) {
  stories.forEach((item) => {
    const id = item && typeof item.id === 'string' ? item.id : '';
    if (!id) return;
    const lastmod = item && typeof item.date === 'string' ? item.date : undefined;
    addUrl(`/stories/${id}`, lastmod);
  });
}

const sitemapLines = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
];

urls.forEach((entry) => {
  sitemapLines.push('  <url>');
  sitemapLines.push(`    <loc>${escapeXml(entry.loc)}</loc>`);
  if (entry.lastmod) {
    sitemapLines.push(`    <lastmod>${escapeXml(entry.lastmod)}</lastmod>`);
  }
  sitemapLines.push('  </url>');
});

sitemapLines.push('</urlset>');

const publicDir = path.join(rootDir, 'public');
fs.mkdirSync(publicDir, { recursive: true });

const sitemapPath = path.join(publicDir, 'sitemap.xml');
fs.writeFileSync(sitemapPath, `${sitemapLines.join('\n')}\n`, 'utf8');

const robotsPath = path.join(publicDir, 'robots.txt');
const robotsContent = `User-agent: *\nAllow: /\n\nSitemap: ${baseUrlNoTrailing}/sitemap.xml\n`;
fs.writeFileSync(robotsPath, robotsContent, 'utf8');

console.log(`[sitemap] Wrote ${urls.length} urls to ${path.relative(rootDir, sitemapPath)}`);
