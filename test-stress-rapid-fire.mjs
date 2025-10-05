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

  console.log('🚀 STRESS TEST: Rapid-Fire Donation Triggering');
  console.log('═══════════════════════════════════════════════\n');

  await page.goto('http://localhost:5173');
  await page.waitForTimeout(2000);

  console.log('✓ Page loaded');
  await page.screenshot({ path: `${RESULTS_DIR}/stress-00-initial.png`, fullPage: true });

  // Open admin panel - look for the gradient notch
  const notch = await page.locator('div[style*="linear-gradient"]').first();
  await notch.click();
  await page.waitForTimeout(1000);
  console.log('✓ Admin panel opened');

  // Test 1: Rapid-fire 10 donations with 1 second intervals
  console.log('\n📊 TEST 1: Rapid-Fire Sequential Donations (10x)');
  console.log('─────────────────────────────────────────────────');

  for (let i = 1; i <= 10; i++) {
    console.log(`\nTrigger #${i}:`);

    // Click General Donation button
    const genButton = await page.locator('button:has-text("General Donation"), button:has-text("Trigger General Donation")').first();
    await genButton.click();

    // Wait 1 second
    await page.waitForTimeout(1000);

    // Check active donation state
    const activeDonation = await page.locator('text=/Stage \\d\\/5/').textContent().catch(() => 'Not found');
    const waypointCount = await page.locator('[data-testid*="waypoint"], .waypoint-marker, circle[r="8"]').count();

    console.log(`  Active donation: ${activeDonation}`);
    console.log(`  Waypoints visible: ${waypointCount}`);

    await page.screenshot({ path: `${RESULTS_DIR}/stress-rapid-${i.toString().padStart(2, '0')}.png`, fullPage: true });
  }

  console.log('\n✓ Rapid-fire test complete');

  // Wait for last journey to complete
  console.log('\n⏳ Waiting for final journey to complete (30s)...');
  await page.waitForTimeout(30000);
  await page.screenshot({ path: `${RESULTS_DIR}/stress-rapid-final.png`, fullPage: true });

  // Test 2: Reset and verify clean state
  console.log('\n🔄 TEST 2: System Reset Verification');
  console.log('─────────────────────────────────────────────────');

  const clearButton = await page.locator('button:has-text("Clear System"), button:has-text("Reset")').first();
  await clearButton.click();
  await page.waitForTimeout(1000);

  const waypointsAfterClear = await page.locator('[data-testid*="waypoint"], .waypoint-marker, circle[r="8"]').count();
  console.log(`Waypoints after clear: ${waypointsAfterClear}`);

  await page.screenshot({ path: `${RESULTS_DIR}/stress-after-clear.png`, fullPage: true });

  // Test 3: Location-Fixed stress test (same governorate, 5x)
  console.log('\n🌍 TEST 3: Location-Fixed Rapid Fire (5x)');
  console.log('─────────────────────────────────────────────────');

  // Select Minya governorate
  const govSelect = await page.locator('select').first();
  await govSelect.selectOption({ label: 'Minya' });

  for (let i = 1; i <= 5; i++) {
    console.log(`\nLocation-Fixed #${i}:`);

    const locButton = await page.locator('button:has-text("Location-Fixed"), button:has-text("Trigger Location-Fixed")').first();
    await locButton.click();
    await page.waitForTimeout(2000);

    const stage = await page.locator('text=/Stage \\d\\/5/').textContent().catch(() => 'N/A');
    console.log(`  Current stage: ${stage}`);

    await page.screenshot({ path: `${RESULTS_DIR}/stress-location-${i}.png`, fullPage: true });
  }

  // Test 4: Program-Fixed stress test (same program, 5x)
  console.log('\n🎁 TEST 4: Program-Fixed Rapid Fire (5x)');
  console.log('─────────────────────────────────────────────────');

  await page.waitForTimeout(2000);

  // Select Ramadan program
  const progSelect = await page.locator('select').nth(1);
  await progSelect.selectOption({ label: 'Ramadan Food Parcels' });

  for (let i = 1; i <= 5; i++) {
    console.log(`\nProgram-Fixed #${i}:`);

    const progButton = await page.locator('button:has-text("Program-Fixed"), button:has-text("Trigger Program-Fixed")').first();
    await progButton.click();
    await page.waitForTimeout(2000);

    const stage = await page.locator('text=/Stage \\d\\/5/').textContent().catch(() => 'N/A');
    console.log(`  Current stage: ${stage}`);

    await page.screenshot({ path: `${RESULTS_DIR}/stress-program-${i}.png`, fullPage: true });
  }

  console.log('\n\n═══════════════════════════════════════════════');
  console.log('🎯 STRESS TEST COMPLETE');
  console.log('═══════════════════════════════════════════════');
  console.log(`Total screenshots: ${fs.readdirSync(RESULTS_DIR).filter(f => f.startsWith('stress-')).length}`);
  console.log(`Results saved in: ${RESULTS_DIR}/`);

  await page.waitForTimeout(5000);
  await browser.close();

  console.log('\n✅ Browser closed - review screenshots for verification');
  process.exit(0);
})();
