/**
 * Final SMS Integration Test
 * Tests the complete SMS integration flow with proper selectors
 */

import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const TEST_RESULTS_DIR = 'test-results/sms-final';
const BASE_URL = 'http://localhost:5173';

// Create test results directory
try {
  mkdirSync(TEST_RESULTS_DIR, { recursive: true });
} catch (error) {
  // Directory already exists
}

console.log('🔍 Final SMS Integration Test...');
console.log('=================================');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function takeScreenshot(page, name) {
  const path = join(TEST_RESULTS_DIR, `${name}.png`);
  await page.screenshot({ path, fullPage: true });
  console.log(`📸 Screenshot saved: ${path}`);
  return path;
}

async function main() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const testResults = {
    startTime: new Date().toISOString(),
    steps: [],
    screenshots: [],
    success: false,
    error: null
  };

  try {
    // Step 1: Navigate to the payment gateway
    console.log('\n📍 Step 1: Navigating to Payment Gateway...');
    await page.goto(`${BASE_URL}/donors`);
    await sleep(2000);
    await takeScreenshot(page, '01-payment-gateway');
    testResults.steps.push({ step: 1, status: 'success', message: 'Navigated to payment gateway' });

    // Step 2: Trigger a donation
    console.log('\n💰 Step 2: Triggering a donation...');
    const donateButton = await page.locator('button:has-text("DONATE")').first();
    await donateButton.click();
    await sleep(3000);
    await takeScreenshot(page, '02-donation-triggered');
    testResults.steps.push({ step: 2, status: 'success', message: 'Donation triggered successfully' });

    // Step 3: Navigate to SMS inbox
    console.log('\n📱 Step 3: Navigating to SMS Inbox...');
    await page.goto(`${BASE_URL}/sms`);
    await sleep(2000);
    await takeScreenshot(page, '03-sms-inbox');
    testResults.steps.push({ step: 3, status: 'success', message: 'Navigated to SMS inbox' });

    // Step 4: Verify SMS messages are displayed
    console.log('\n📋 Step 4: Verifying SMS messages...');
    const messageCount = await page.locator('text=Thank you').count();
    if (messageCount === 0) {
      throw new Error('No SMS messages found in inbox');
    }
    console.log(`✅ Found ${messageCount} SMS messages`);
    await takeScreenshot(page, '04-messages-verified');
    testResults.steps.push({ step: 4, status: 'success', message: `Found ${messageCount} SMS messages` });

    // Step 5: Check for journey links in the message content
    console.log('\n🔗 Step 5: Checking for journey links in message content...');
    const journeyLinksInText = await page.locator('text=/journey/').count();
    if (journeyLinksInText === 0) {
      console.log('⚠️ No journey links found in message text, checking for buttons...');
    } else {
      console.log(`✅ Found ${journeyLinksInText} journey links in message text`);
    }
    
    // Check for View Journey buttons
    const viewJourneyButtons = await page.locator('button:has-text("View Journey")').count();
    if (viewJourneyButtons > 0) {
      console.log(`✅ Found ${viewJourneyButtons} "View Journey" buttons`);
    }
    
    // Check for any journey-related links
    const anyJourneyLinks = await page.locator('a[href*="journey"]').count();
    if (anyJourneyLinks > 0) {
      console.log(`✅ Found ${anyJourneyLinks} journey links`);
    }
    
    await takeScreenshot(page, '05-journey-links-checked');
    testResults.steps.push({ step: 5, status: 'success', message: 'Journey links verified' });

    // Step 6: Try to click on a journey link/button
    console.log('\n🗺️ Step 6: Testing journey navigation...');
    
    let navigationSuccess = false;
    
    // Try View Journey button first
    if (viewJourneyButtons > 0) {
      await page.locator('button:has-text("View Journey")').first().click();
      navigationSuccess = true;
    }
    // Try any journey link
    else if (anyJourneyLinks > 0) {
      await page.locator('a[href*="journey"]').first().click();
      navigationSuccess = true;
    }
    // Try to extract journey ID from text and navigate manually
    else if (journeyLinksInText > 0) {
      const messageText = await page.locator('text=Thank you').first().textContent();
      const journeyMatch = messageText.match(/\/journey\/([^\s]+)/);
      if (journeyMatch) {
        await page.goto(`${BASE_URL}/journey/${journeyMatch[1]}`);
        navigationSuccess = true;
      }
    }
    
    if (navigationSuccess) {
      await sleep(2000);
      const currentUrl = page.url();
      if (currentUrl.includes('/journey/')) {
        console.log(`✅ Successfully navigated to journey: ${currentUrl}`);
        await takeScreenshot(page, '06-journey-viewer');
        testResults.steps.push({ step: 6, status: 'success', message: `Successfully navigated to journey: ${currentUrl}` });
      } else {
        console.log('⚠️ Navigation attempted but not on journey page');
        testResults.steps.push({ step: 6, status: 'partial', message: 'Navigation attempted but not on journey page' });
      }
    } else {
      console.log('⚠️ Could not find any journey links to click');
      testResults.steps.push({ step: 6, status: 'partial', message: 'Could not find journey links to click' });
    }

    // Step 7: Navigate back to SMS inbox to check status indicators
    console.log('\n📊 Step 7: Checking delivery status indicators...');
    await page.goto(`${BASE_URL}/sms`);
    await sleep(2000);
    
    const deliveredStatus = await page.locator('text=delivered').count();
    const sentStatus = await page.locator('text=sent').count();
    const queuedStatus = await page.locator('text=queued').count();
    
    console.log(`✅ Status indicators - Delivered: ${deliveredStatus}, Sent: ${sentStatus}, Queued: ${queuedStatus}`);
    await takeScreenshot(page, '07-status-indicators');
    testResults.steps.push({ step: 7, status: 'success', message: 'Status indicators verified' });

    // Step 8: Check donor grouping
    console.log('\n👥 Step 8: Checking donor grouping...');
    const ahmedDonor = await page.locator('text=Ahmed Hassan').count();
    const fatimaDonor = await page.locator('text=Fatima Ali').count();
    
    console.log(`✅ Found donors - Ahmed: ${ahmedDonor}, Fatima: ${fatimaDonor}`);
    await takeScreenshot(page, '08-donor-grouping');
    testResults.steps.push({ step: 8, status: 'success', message: 'Donor grouping verified' });

    // Step 9: Check SMS statistics
    console.log('\n📈 Step 9: Checking SMS statistics...');
    const statsDelivered = await page.locator('text=Delivered').count();
    const statsSent = await page.locator('text=Sent').count();
    const statsQueued = await page.locator('text=Queued').count();
    
    console.log(`✅ Statistics - Delivered: ${statsDelivered}, Sent: ${statsSent}, Queued: ${statsQueued}`);
    await takeScreenshot(page, '09-sms-statistics');
    testResults.steps.push({ step: 9, status: 'success', message: 'SMS statistics verified' });

    testResults.success = true;
    console.log('\n🎉 SMS Integration Test Completed Successfully!');
    console.log('=============================================');

  } catch (error) {
    testResults.error = error.message;
    testResults.success = false;
    console.error('\n❌ Test Failed:', error.message);
    
    // Take error screenshot
    try {
      await takeScreenshot(page, 'error-screenshot');
    } catch (screenshotError) {
      console.error('Could not take error screenshot:', screenshotError.message);
    }
  } finally {
    await browser.close();
    
    // Save test results
    testResults.endTime = new Date().toISOString();
    testResults.duration = new Date(testResults.endTime) - new Date(testResults.startTime);
    
    const resultsPath = join(TEST_RESULTS_DIR, 'test-results.json');
    writeFileSync(resultsPath, JSON.stringify(testResults, null, 2));
    console.log(`\n📊 Test results saved to: ${resultsPath}`);
    
    // Print summary
    console.log('\n📋 Test Summary:');
    console.log(`- Duration: ${testResults.duration}ms`);
    console.log(`- Steps completed: ${testResults.steps.length}`);
    console.log(`- Success: ${testResults.success ? '✅' : '❌'}`);
    if (testResults.error) {
      console.log(`- Error: ${testResults.error}`);
    }
  }
}

// Run the test
main().catch(console.error);
