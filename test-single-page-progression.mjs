/**
 * Test Single Page Journey Progression
 * Tests progression without page navigation
 */

import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testSinglePageProgression() {
  console.log('🧪 Testing Single Page Journey Progression');
  console.log('==========================================');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Listen to console messages
  page.on('console', msg => {
    if (msg.text().includes('Journey') || msg.text().includes('Stage') || msg.text().includes('COMPLETED')) {
      console.log(`📝 ${msg.text()}`);
    }
  });

  try {
    // Navigate to admin dashboard first to set step duration
    console.log('\n1. Setting step duration to 2 seconds...');
    await page.goto('http://localhost:5173/admin');
    await page.waitForLoadState('networkidle');
    await page.fill('input[type="range"]', '2');
    await page.waitForTimeout(500);

    // Open payment gateway in a new tab
    console.log('2. Opening payment gateway in new tab...');
    const paymentPage = await context.newPage();
    await paymentPage.goto('http://localhost:5173/donors');
    await paymentPage.waitForLoadState('networkidle');

    // Trigger donation
    console.log('3. Triggering donation...');
    await paymentPage.click('button:has-text("DONATE")');
    await paymentPage.waitForTimeout(1000);

    // Go back to main page (not navigating, just switching tabs)
    console.log('4. Switching to main map tab...');
    await page.bringToFront();
    await page.goto('http://localhost:5173/');
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

    console.log('\n✅ Single page test completed');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testSinglePageProgression().catch(console.error);