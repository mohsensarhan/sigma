import { chromium } from '@playwright/test';

(async () => {
  console.log('🏁 SIMPLE STAGE 5 TEST\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto('http://localhost:5177');
  await page.waitForTimeout(2000);

  // Open admin panel and click donation
  const notch = page.locator('.fixed.left-0.top-1\\/2').first();
  await notch.click();
  await page.waitForTimeout(500);

  console.log('🎁 Starting donation...\n');
  await page.click('button:has-text("General Donation")');

  // Check every 5 seconds for 30 seconds
  for (let i = 5; i <= 30; i += 5) {
    await page.waitForTimeout(5000);

    try {
      const stageText = await page.locator('text=/Stage \\d+\\/5/').first().textContent({ timeout: 1000 });
      console.log(`[${i}s] ${stageText?.trim()}`);
    } catch (e) {
      console.log(`[${i}s] No active donation displayed`);
    }
  }

  console.log('\n✅ Test complete');
  await page.waitForTimeout(5000);
  await browser.close();
})();
