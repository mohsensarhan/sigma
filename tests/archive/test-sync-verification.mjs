import { chromium } from '@playwright/test';

(async () => {
  console.log('🔍 STATE SYNCHRONIZATION TEST\n');

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

  // Track state every second for 30 seconds
  for (let i = 1; i <= 30; i++) {
    await page.waitForTimeout(1000);

    // Get admin panel stage
    const adminStage = await page.locator('text=/Stage \\d+\\/5/').first().textContent();

    // Get waypoint card stages (count how many are active/completed)
    const waypointCard = page.locator('.fixed.bottom-0.right-6 button');
    const stages = await waypointCard.evaluateAll((buttons) => {
      return buttons.map(btn => {
        const bgColor = btn.style.background || '';
        if (bgColor.includes('rgba(0, 217, 255')) return 'active';
        if (bgColor.includes('rgba(0, 255, 159')) return 'completed';
        return 'pending';
      });
    });

    const activeIndex = stages.findIndex(s => s === 'active');
    const completedCount = stages.filter(s => s === 'completed').length;

    const mapStage = activeIndex >= 0 ? activeIndex + 1 : (completedCount === 5 ? 5 : 'unknown');

    const match = adminStage.trim() === `Stage ${mapStage}/5` ? '✅' : '❌';

    console.log(`[${i}s] ${match} Admin: ${adminStage.trim()} | Map Active: Stage ${mapStage}/5 | Completed: ${completedCount}`);

    // Stop after journey completes
    if (completedCount === 5) {
      console.log('\n🎉 Journey completed!');
      break;
    }
  }

  console.log('\n✅ Test complete - browser will stay open for 5 more seconds');
  await page.waitForTimeout(5000);

  await browser.close();
})();
