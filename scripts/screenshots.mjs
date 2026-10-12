#!/usr/bin/env node
/**
 * Regenerate every image in docs/: product screenshots plus social cards
 * sized for LinkedIn and portfolio use.
 *
 *   npm install
 *   npx playwright install chromium   # first time only
 *   npm run screenshots
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { serve } from './serve.mjs';

const OUT = new URL('../docs/', import.meta.url).pathname;
const server = await serve(0);
const BASE = `http://localhost:${server.address().port}`;

const DESKTOP = { width: 1440, height: 900 };
const TALL = { width: 1440, height: 1240 };
const PHONE = { width: 390, height: 844 };

const SHOTS = [
  { file: 'screenshots/01-conversation.png', size: DESKTOP, query: 'stopAt=h3' },
  { file: 'screenshots/02-push-hesitation.png', size: DESKTOP, query: 'stopAt=resume' },
  { file: 'screenshots/03-playback-check.png', size: DESKTOP, query: 'stopAt=recap' },
  { file: 'screenshots/04-team-view.png', size: TALL, query: '' },
  { file: 'screenshots/05-team-view-dark.png', size: TALL, query: '', dark: true },
  { file: 'screenshots/06-mobile-conversation.png', size: PHONE, query: 'stopAt=resume', mobile: true },
  { file: 'screenshots/07-mobile-avatar.png', size: PHONE, query: 'view=avatar', mobile: true }
];

const CARDS = [
  { file: 'social/linkedin-landscape.png', size: { width: 1200, height: 627 }, variant: 'landscape' },
  { file: 'social/linkedin-portrait.png', size: { width: 1080, height: 1350 }, variant: 'portrait' },
  { file: 'social/portfolio-wide.png', size: { width: 1600, height: 1000 }, variant: 'wide' }
];

await mkdir(OUT + 'screenshots', { recursive: true });
await mkdir(OUT + 'social', { recursive: true });

// Prefer Playwright's bundled Chromium; fall back to an installed Google Chrome.
const browser = await chromium.launch().catch(() => chromium.launch({ channel: 'chrome' }));

for (const shot of SHOTS) {
  const page = await browser.newPage({
    viewport: shot.size,
    deviceScaleFactor: 2,
    colorScheme: shot.dark ? 'dark' : 'light',
    isMobile: !!shot.mobile,
    hasTouch: !!shot.mobile
  });
  await page.goto(`${BASE}/?sample&speed=instant${shot.query ? '&' + shot.query : ''}`);
  await page.waitForSelector('html[data-state="ready"]', { timeout: 15000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400); // let entrance animations settle
  await page.screenshot({ path: OUT + shot.file });
  await page.close();
  console.log('✓', shot.file);
}

for (const card of CARDS) {
  const page = await browser.newPage({ viewport: card.size, deviceScaleFactor: 2 });
  await page.goto(`${BASE}/docs/social/card.html?variant=${card.variant}`);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => [...document.images].every((i) => i.complete));
  await page.screenshot({ path: OUT + card.file });
  await page.close();
  console.log('✓', card.file);
}

await browser.close();
server.close();
