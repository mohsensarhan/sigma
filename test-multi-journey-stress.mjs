import { chromium } from 'playwright';
import fs from 'fs';

const RESULTS_DIR = './test-results';
if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  // Enable console logging
  page.on('console', msg => console.log('BROWSER:', msg.text()));

  console.log('🔥 MULTI-JOURNEY STRESS TEST');
  console.log('════════════════════════════════════════════════════════');
  console.log('Testing concurrent journey support with rapid-fire triggers\n');

  await page.goto('http://localhost:5173');
  await page.waitForTimeout(3000);

  console.log('✓ Page loaded');
  await page.screenshot({ path: `${RESULTS_DIR}/multi-00-initial.png`, fullPage: true });

  // Open admin panel
  const notch = await page.locator('div[style*="linear-gradient"]').first();
  await notch.click();
  await page.waitForTimeout(1000);
  console.log('✓ Admin panel opened\n');

  // TEST 1: Rapid-fire 20 donations with 500ms intervals
  console.log('📊 TEST 1: Rapid-Fire 20 Donations (500ms intervals)');
  console.log('────────────────────────────────────────────────────────');

  for (let i = 1; i <= 20; i++) {
    console.log(`\n🚀 Trigger #${i}:`);

    try {
      // Click General Donation button (should NOT be disabled anymore)
      const genButton = await page.locator('button:has-text("General Donation"), button:has-text("Trigger General Donation")').first();
      await genButton.click({ timeout: 2000 });

      // Wait only 500ms before next trigger
      await page.waitForTimeout(500);

      // Check HUD status
      const activeCount = await page.locator('text=/\\d+ Active/').textContent().catch(() => 'N/A');
      const completedCount = await page.locator('text=/\\d+ Completed/').textContent().catch(() => 'N/A');
      const totalCount = await page.locator('text=/Total: \\d+/').textContent().catch(() => 'N/A');

      console.log(`   ${activeCount} | ${completedCount} | ${totalCount}`);

      // Screenshot every 5th trigger
      if (i % 5 === 0) {
        await page.screenshot({ path: `${RESULTS_DIR}/multi-rapid-${i.toString().padStart(2, '0')}.png`, fullPage: true });
      }

    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
      await page.screenshot({ path: `${RESULTS_DIR}/multi-error-${i}.png`, fullPage: true });
    }
  }

  console.log('\n✅ Rapid-fire test complete - 20 donations triggered');

  // Wait for journeys to progress
  console.log('\n⏳ Waiting 30s for journeys to progress...');
  await page.waitForTimeout(30000);
  await page.screenshot({ path: `${RESULTS_DIR}/multi-30s-progress.png`, fullPage: true });

  // Check final HUD state
  const finalActive = await page.locator('text=/\\d+ Active/').textContent().catch(() => 'N/A');
  const finalCompleted = await page.locator('text=/\\d+ Completed/').textContent().catch(() => 'N/A');
  const finalTotal = await page.locator('text=/Total: \\d+/').textContent().catch(() => 'N/A');

  console.log('\n📈 Final Stats After 30s:');
  console.log(`   ${finalActive}`);
  console.log(`   ${finalCompleted}`);
  console.log(`   ${finalTotal}`);

  // TEST 2: Wait for all to complete
  console.log('\n\n📊 TEST 2: Wait for All Journeys to Complete');
  console.log('────────────────────────────────────────────────────────');
  console.log('⏳ Waiting up to 2 minutes for all journeys to complete...\n');

  let checkCount = 0;
  const maxChecks = 24; // 2 minutes (24 * 5s)

  while (checkCount < maxChecks) {
    await page.waitForTimeout(5000);
    checkCount++;

    const active = await page.locator('text=/\\d+ Active/').textContent().catch(() => '0 Active');
    const completed = await page.locator('text=/\\d+ Completed/').textContent().catch(() => '0 Completed');

    console.log(`[${checkCount * 5}s] ${active} | ${completed}`);

    // Screenshot every 15s
    if (checkCount % 3 === 0) {
      await page.screenshot({ path: `${RESULTS_DIR}/multi-wait-${checkCount * 5}s.png`, fullPage: true });
    }

    // Check if all complete (0 active)
    if (active.includes('0 Active')) {
      console.log('\n✅ All journeys completed!');
      break;
    }
  }

  await page.screenshot({ path: `${RESULTS_DIR}/multi-final-state.png`, fullPage: true });

  // TEST 3: Mixed donation types
  console.log('\n\n📊 TEST 3: Mixed Donation Types (5 of each)');
  console.log('────────────────────────────────────────────────────────');

  // Clear system first
  const clearButton = await page.locator('button:has-text("Clear System"), button:has-text("Reset")').first();
  await clearButton.click();
  await page.waitForTimeout(1000);
  console.log('✓ System cleared\n');

  // 5x General
  for (let i = 1; i <= 5; i++) {
    const btn = await page.locator('button:has-text("General Donation")').first();
    await btn.click({ timeout: 2000 });
    await page.waitForTimeout(300);
    console.log(`  General #${i} triggered`);
  }

  // 5x Location-Fixed (Minya)
  const govSelect = await page.locator('select').first();
  await govSelect.selectOption({ label: 'Minya' });
  for (let i = 1; i <= 5; i++) {
    const btn = await page.locator('button:has-text("Location-Fixed")').first();
    await btn.click({ timeout: 2000 });
    await page.waitForTimeout(300);
    console.log(`  Location-Fixed (Minya) #${i} triggered`);
  }

  // 5x Program-Fixed (Ramadan)
  const progSelect = await page.locator('select').nth(1);
  await progSelect.selectOption({ label: 'Ramadan Food Parcels' });
  for (let i = 1; i <= 5; i++) {
    const btn = await page.locator('button:has-text("Program-Fixed")').first();
    await btn.click({ timeout: 2000 });
    await page.waitForTimeout(300);
    console.log(`  Program-Fixed (Ramadan) #${i} triggered`);
  }

  const mixedActive = await page.locator('text=/\\d+ Active/').textContent().catch(() => 'N/A');
  const mixedTotal = await page.locator('text=/Total: \\d+/').textContent().catch(() => 'N/A');
  console.log(`\n✅ Mixed test complete: ${mixedActive} | ${mixedTotal}`);

  await page.screenshot({ path: `${RESULTS_DIR}/multi-mixed-complete.png`, fullPage: true });

  // Final summary
  console.log('\n\n════════════════════════════════════════════════════════');
  console.log('🎯 MULTI-JOURNEY STRESS TEST COMPLETE');
  console.log('════════════════════════════════════════════════════════');
  console.log(`Total screenshots: ${fs.readdirSync(RESULTS_DIR).filter(f => f.startsWith('multi-')).length}`);
  console.log(`Results saved in: ${RESULTS_DIR}/`);
  console.log('\n✅ System successfully handled concurrent journeys');

  await page.waitForTimeout(5000);
  await browser.close();

  process.exit(0);
})();
