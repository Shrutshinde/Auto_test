const { test, expect } = require('@playwright/test');

/**
 * URL Testing Suite
 * Dynamically tests URLs provided via CLI input.
 * Tests: page load, status code, title presence, console errors, performance, links, responsive design.
 */

const urls = (process.env.TEST_URLS && process.env.TEST_URLS.trim()) ? JSON.parse(process.env.TEST_URLS) : [];

for (const url of urls) {
  test.describe(`🌐 URL Test Suite: ${url}`, () => {
    
    test(`Page loads successfully — ${url}`, async ({ page }) => {
      const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      expect(response).not.toBeNull();
      expect(response.status()).toBeLessThan(400);
    });

    test(`HTTP status is 200 OK — ${url}`, async ({ page }) => {
      const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      expect(response.status()).toBe(200);
    });

    test(`Page has a <title> tag — ${url}`, async ({ page }) => {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      const title = await page.title();
      expect(title).toBeTruthy();
      expect(title.length).toBeGreaterThan(0);
    });

    test(`No critical console errors — ${url}`, async ({ page }) => {
      const errors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      // Wait a moment for async errors
      await page.waitForTimeout(2000);
      // Filter out known benign errors
      const criticalErrors = errors.filter(e => 
        !e.includes('favicon') && 
        !e.includes('third-party') &&
        !e.includes('net::ERR_BLOCKED_BY_CLIENT')
      );
      expect(criticalErrors).toHaveLength(0);
    });

    test(`Page loads within 10 seconds — ${url}`, async ({ page }) => {
      const start = Date.now();
      await page.goto(url, { waitUntil: 'load', timeout: 15000 });
      const loadTime = Date.now() - start;
      console.log(`    ⏱  Load time: ${loadTime}ms`);
      expect(loadTime).toBeLessThan(10000);
    });

    test(`Page has visible body content — ${url}`, async ({ page }) => {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      const body = await page.locator('body');
      await expect(body).toBeVisible();
      const text = await body.innerText();
      expect(text.trim().length).toBeGreaterThan(0);
    });

    test(`No broken images on page — ${url}`, async ({ page }) => {
      await page.goto(url, { waitUntil: 'load', timeout: 15000 });
      const images = await page.locator('img').all();
      for (const img of images) {
        const naturalWidth = await img.evaluate(el => el.naturalWidth);
        const src = await img.getAttribute('src');
        if (src && !src.startsWith('data:')) {
          expect(naturalWidth, `Image broken: ${src}`).toBeGreaterThan(0);
        }
      }
    });

    test(`Page is responsive (viewport 375px) — ${url}`, async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      expect(response.status()).toBeLessThan(400);
      const body = await page.locator('body');
      await expect(body).toBeVisible();
    });

    test(`Meta description exists — ${url}`, async ({ page }) => {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      const metaDesc = await page.locator('meta[name="description"]').first();
      const count = await page.locator('meta[name="description"]').count();
      // This is a soft check — many pages may not have it
      if (count > 0) {
        const content = await metaDesc.getAttribute('content');
        expect(content.length).toBeGreaterThan(0);
      }
    });

    test(`HTTPS security check — ${url}`, async ({ page }) => {
      const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      const finalUrl = page.url();
      // Only check if original URL was https
      if (url.startsWith('https://')) {
        expect(finalUrl).toMatch(/^https:\/\//);
      }
    });

  });
}

// Skip message when no URLs provided
if (urls.length === 0) {
  test.skip('No URLs provided — skipping URL tests', async () => {});
}
