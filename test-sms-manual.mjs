/**
 * Manual SMS Test
 * Simple test to check if SMS messages are being sent and stored
 */

import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5173';

console.log('🔍 Manual SMS Test...');
console.log('===================');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to payment gateway
    console.log('\n📍 Navigating to Payment Gateway...');
    await page.goto(`${BASE_URL}/donors`);
    await sleep(2000);

    // Trigger a donation
    console.log('\n� Triggering a donation...');
    const donateButton = await page.locator('button:has-text("DONATE")').first();
    await donateButton.click();
    await sleep(3000);

    // Navigate to SMS inbox
    console.log('\n� Navigating to SMS Inbox...');
    const smsLink = await page.locator('a:has-text("SMS →")');
    await smsLink.click();
    await sleep(2000);

    // Wait for manual inspection
    console.log('\n� Please check the browser and console logs...');
    console.log('   - Check if SMS messages appear in the inbox');
    console.log('   - Check browser console for debugging logs');
    console.log('   - Verify journey links are present');
    console.log('\n⏳ Waiting 30 seconds for manual inspection...');
    
    await sleep(30000);

    console.log('\n✅ Manual test completed');

  } catch (error) {
    console.error('\n❌ Test Failed:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the test
main().catch(console.error);