/**
 * Test Same Tab Journey Progression
 * Tests progression without switching tabs
 */

import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testSameTabProgression() {
  console.log('🧪 Testing Same Tab Journey Progression');
  console.log('=======================================');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Listen to console messages
  page.on('console', msg => {
    if (msg.text().includes('Journey') || msg.text().includes('Stage') || msg.text().includes('COMPLETED') || msg.text().includes('Checking')) {
      console.log(`📝 ${msg.text()}`);
    }
  });

  try {
    // Start on the main map
    console.log('\n1. Starting on main map...');
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');

    // Navigate to admin first, then to donors using Link
    console.log('2. Navigating to admin then donors...');
    await page.goto('http://localhost:5173/admin');
    await page.waitForLoadState('networkidle');
    await page.click('a[href="/donors"]');
    await page.waitForLoadState('networkidle');

    // Trigger donation
    console.log('3. Triggering donation...');
    await page.click('button:has-text("DONATE")');
    await page.waitForTimeout(1000);

    // Navigate back to map using Link
    console.log('4. Navigating back to map using Link...');
    await page.click('a[href="/"]');
    await page.waitForLoadState('networkidle');

    // Wait for progression
    console.log('5. Waiting for journey progression...');
    for (let i = 0; i < 6; i++) {
      await page.waitForTimeout(2500);
      
      // Check active count
      const activeCount = await page.locator('.text-green-400').first().textContent();
      console.log(`   Check ${i + 1}: ${activeCount}`);
      
      // Check for markers
      const markerCount = await page.locator('div[style*="rounded-full"]').count();
      console.log(`   Markers: ${markerCount}`);
    }

    console.log('\n✅ Same tab test completed');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testSameTabProgression().catch(console.error);