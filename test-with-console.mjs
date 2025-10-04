import { chromium } from '@playwright/test';

(async () => {
  console.log('🏁 CONSOLE LOGGING TEST\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Listen to browser console
  page.on('console', msg => {
    console.log(`🌐 BROWSER: ${msg.text()}`);
  });

  await page.goto('http://localhost:5177');
  await page.waitForTimeout(2000);

  // Open admin panel and click donation
  const notch = page.locator('.fixed.left-0.top-1\\/2').first();
  await notch.click();
  await page.waitForTimeout(500);

  console.log('\n🎁 Clicking General Donation...\n');
  await page.click('button:has-text("General Donation")');

  // Wait 30 seconds and let console show what's happening
  await page.waitForTimeout(30000);

  console.log('\n✅ Test complete');
  await page.waitForTimeout(5000);
  await browser.close();
})();
