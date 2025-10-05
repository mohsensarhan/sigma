/**
 * Simple SMS Test
 * Test if SMS messages are being sent and stored
 */

import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5173';

console.log('🔍 Simple SMS Test...');
console.log('====================');

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

    // Open browser console to see logs
    page.on('console', msg => {
      console.log('BROWSER:', msg.type(), msg.text());
    });

    // Trigger a donation
    console.log('\n💰 Triggering a donation...');
    const donateButton = await page.locator('button:has-text("DONATE")').first();
    await donateButton.click();
    await sleep(5000); // Wait longer for SMS processing

    // Check localStorage directly
    console.log('\n📱 Checking localStorage for SMS messages...');
    const smsMessages = await page.evaluate(() => {
      return localStorage.getItem('mockSMSMessages');
    });
    
    if (smsMessages) {
      const messages = JSON.parse(smsMessages);
      console.log(`✅ Found ${messages.length} SMS messages in localStorage`);
      messages.forEach((msg, i) => {
        console.log(`  ${i + 1}. ${msg.to} - ${msg.status} - ${msg.body.substring(0, 50)}...`);
      });
    } else {
      console.log('❌ No SMS messages found in localStorage');
    }

    // Navigate to SMS inbox
    console.log('\n📱 Navigating to SMS Inbox...');
    await page.goto(`${BASE_URL}/sms`);
    await sleep(3000);

    // Check if messages are displayed
    const messageElements = await page.locator('text=Thank you').count();
    console.log(`📊 Found ${messageElements} message elements with "Thank you" text`);

    // Wait for manual inspection
    console.log('\n👀 Manual inspection time...');
    await sleep(10000);

  } catch (error) {
    console.error('\n❌ Test Failed:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the test
main().catch(console.error);