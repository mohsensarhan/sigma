/**
 * Debug Journey Progression
 * Simple test to check console logs
 */

import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function debugJourneyProgression() {
  console.log('🔍 Debugging Journey Progression');
  console.log('================================');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Listen to all console messages
  page.on('console', msg => {
    console.log(`📝 ${msg.type()}: ${msg.text()}`);
  });

  // Listen to page errors
  page.on('pageerror', error => {
    console.log(`❌ Page Error: ${error.message}`);
  });

  try {
    // Navigate to payment gateway
    console.log('\n1. Navigating to payment gateway...');
    await page.goto('http://localhost:5173/donors');
    await page.waitForLoadState('networkidle');

    // Trigger a donation
    console.log('2. Triggering donation...');
    await page.click('button:has-text("DONATE")');
    await page.waitForTimeout(2000);

    // Navigate to map
    console.log('3. Navigating to map...');
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');

    // Wait and watch for progression
    console.log('4. Watching for progression (10 seconds)...');
    await page.waitForTimeout(10000);

    // Check the global settings context state
    const activeJourneysCount = await page.evaluate(() => {
      // Try to access the global context
      return window.__GLOBAL_SETTINGS__?.activeJourneys?.size || 0;
    });
    console.log(`\nActive journeys in context: ${activeJourneysCount}`);

  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the debug
debugJourneyProgression().catch(console.error);