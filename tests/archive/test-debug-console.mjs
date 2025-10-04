import { chromium } from '@playwright/test';

(async () => {
  console.log('🔍 DEBUG TEST - Checking console logs\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture all console messages
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    const icon = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : '🌐';
    console.log(`${icon} BROWSER [${type}]: ${text}`);
  });

  // Capture errors
  page.on('pageerror', error => {
    console.log(`❌ PAGE ERROR: ${error.message}`);
  });

  await page.goto('http://localhost:5177');
  console.log('✅ Page loaded');

  await page.waitForTimeout(2000);

  // Open admin panel (click the notch)
  console.log('\n📂 Opening admin panel...');
  const notch = page.locator('.fixed.left-0.top-1\\/2').first();
  await notch.click();
  await page.waitForTimeout(500);

  // Click general donation
  console.log('🎁 Clicking General Donation...\n');
  await page.click('button:has-text("General Donation")');

  // Wait and log state every second for 15 seconds
  for (let i = 1; i <= 15; i++) {
    await page.waitForTimeout(1000);

    const stageText = await page.locator('text=/Stage \\d+\\/5/').first().textContent();
    const activeWaypoints = await page.locator('[style*="rgba(0, 217, 255"]').count();

    console.log(`[${i}s] Stage: ${stageText} | Active elements: ${activeWaypoints}`);
  }

  console.log('\n✅ Test complete - browser will stay open for 10 more seconds');
  await page.waitForTimeout(10000);

  await browser.close();
})();
