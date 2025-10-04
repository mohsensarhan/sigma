import { chromium } from '@playwright/test';

(async () => {
  console.log('🏁 COMPLETE JOURNEY TEST\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto('http://localhost:5177');
  console.log('✅ Page loaded\n');

  await page.waitForTimeout(2000);

  // Open admin panel
  const notch = page.locator('.fixed.left-0.top-1\\/2').first();
  await notch.click();
  await page.waitForTimeout(500);

  console.log('🎁 Clicking General Donation...\n');
  await page.click('button:has-text("General Donation")');

  // Wait for journey to complete (5 stages × 5 seconds = 25 seconds + buffer)
  await page.waitForTimeout(27000);

  // Check if all 5 stages completed
  const waypointCard = page.locator('.fixed.bottom-0.right-6 button');
  const completedCount = await waypointCard.evaluateAll((buttons) => {
    return buttons.filter(btn => {
      const bgColor = btn.style.background || '';
      return bgColor.includes('rgba(0, 255, 159'); // completed color
    }).length;
  });

  // Check if admin panel shows no active donation
  const activeDonationVisible = await page.locator('text=/ACTIVE DONATION/').isVisible();

  console.log(`\n📊 FINAL STATE:`);
  console.log(`   Completed stages: ${completedCount}/5`);
  console.log(`   Admin panel active donation: ${activeDonationVisible ? 'Still visible' : 'Cleared ✅'}`);

  if (completedCount === 5 && !activeDonationVisible) {
    console.log(`\n✅ SUCCESS: Journey completed correctly!`);
  } else {
    console.log(`\n❌ ISSUE: Journey did not complete as expected`);
  }

  await page.screenshot({ path: 'test-results/journey-complete.png' });
  console.log(`\n📸 Screenshot saved: test-results/journey-complete.png`);

  console.log('\n✅ Browser will stay open for 10 seconds');
  await page.waitForTimeout(10000);

  await browser.close();
})();
