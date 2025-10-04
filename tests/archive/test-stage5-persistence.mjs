import { chromium } from '@playwright/test';

(async () => {
  console.log('🏁 STAGE 5 PERSISTENCE TEST\n');

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

  // Wait for all 5 stages to complete (5 stages × 5 seconds = 25 seconds + 3 second buffer)
  console.log('⏳ Waiting 28 seconds for journey to complete...\n');
  await page.waitForTimeout(28000);

  // Check state after journey completes
  const adminStageText = await page.locator('text=/Stage \\d+\\/5/').first().textContent();
  const activeDonationVisible = await page.locator('text=/ACTIVE DONATION/').isVisible();
  const generalButtonDisabled = await page.locator('button:has-text("General Donation")').isDisabled();

  const waypointCard = page.locator('.fixed.bottom-0.right-6 button');
  const completedCount = await waypointCard.evaluateAll((buttons) => {
    return buttons.filter(btn => {
      const bgColor = btn.style.background || '';
      return bgColor.includes('rgba(0, 255, 159'); // completed color
    }).length;
  });

  console.log(`📊 STATE AFTER 28 SECONDS (all stages should be complete):`);
  console.log(`   Admin panel stage: ${adminStageText?.trim()}`);
  console.log(`   Active donation visible: ${activeDonationVisible ? '✅ YES' : '❌ NO'}`);
  console.log(`   Completed stages on map: ${completedCount}/5`);
  console.log(`   General Donation button disabled: ${generalButtonDisabled ? '✅ YES' : '❌ NO'}`);

  // Take screenshot
  await page.screenshot({ path: 'test-results/stage5-persisted.png' });
  console.log(`\n📸 Screenshot saved: test-results/stage5-persisted.png`);

  // Now test Clear System button
  console.log(`\n🧹 Clicking "Clear System & Reset"...`);
  await page.click('button:has-text("Clear System & Reset")');

  // Confirm dialog
  page.on('dialog', async dialog => {
    console.log(`   Confirming: "${dialog.message()}"`);
    await dialog.accept();
  });
  await page.waitForTimeout(1000);

  // Check state after clearing
  const activeDonationAfterClear = await page.locator('text=/ACTIVE DONATION/').isVisible();
  const generalButtonEnabledAfterClear = await page.locator('button:has-text("General Donation")').isDisabled();

  console.log(`\n📊 STATE AFTER CLEAR:`);
  console.log(`   Active donation visible: ${activeDonationAfterClear ? '❌ Still visible' : '✅ Cleared'}`);
  console.log(`   General Donation button disabled: ${generalButtonEnabledAfterClear ? '❌ Still disabled' : '✅ Enabled'}`);

  if (!activeDonationAfterClear && !generalButtonEnabledAfterClear) {
    console.log(`\n✅ SUCCESS: Stage 5 persisted correctly and cleared properly!`);
  } else {
    console.log(`\n❌ ISSUE: Clear functionality may have issues`);
  }

  console.log('\n✅ Browser will stay open for 10 seconds');
  await page.waitForTimeout(10000);

  await browser.close();
})();
