/**
 * Debug Test for SMS and Journey Viewer Issues
 * 
 * This test will:
 * 1. Trigger a donation
 * 2. Monitor SMS sending for all 5 stages
 * 3. Verify journey IDs in SMS links
 * 4. Test journey viewer navigation
 * 5. Take screenshots at each step
 * 6. Log all relevant data for debugging
 */

import { chromium } from 'playwright';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const TEST_RESULTS_DIR = 'test-results/debug-issues';
const SMS_URL = 'http://localhost:5173/sms';
const PAYMENT_URL = 'http://localhost:5173/donors';

// Ensure test results directory exists
if (!fs.existsSync(TEST_RESULTS_DIR)) {
  fs.mkdirSync(TEST_RESULTS_DIR, { recursive: true });
}

// Helper function to take screenshots
async function takeScreenshot(page, name) {
  const screenshotPath = path.join(TEST_RESULTS_DIR, `${name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`📸 Screenshot saved: ${screenshotPath}`);
  return screenshotPath;
}

// Helper function to wait for a bit
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Main test function
async function runDebugTest() {
  console.log('🚀 Starting Debug Test for SMS and Journey Viewer Issues\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const results = {
    donations: [],
    smsMessages: [],
    journeyViewerTests: [],
    errors: []
  };
  
  try {
    // Test 1: Check initial state of SMS inbox
    console.log('📱 Test 1: Checking initial SMS inbox state...');
    const smsPage = await context.newPage();
    await smsPage.goto(SMS_URL);
    await wait(2000);
    await takeScreenshot(smsPage, '01-sms-inbox-initial');
    
    // Get initial SMS count
    const initialSMSCount = await smsPage.locator('[data-testid="sms-message"]').count();
    console.log(`Initial SMS count: ${initialSMSCount}`);
    
    // Test 2: Trigger a donation
    console.log('\n💰 Test 2: Triggering a donation...');
    const paymentPage = await context.newPage();
    await paymentPage.goto(PAYMENT_URL);
    await wait(2000);
    await takeScreenshot(paymentPage, '02-payment-gateway-initial');
    
    // Get Ahmed Hassan's donor card
    const ahmedCard = paymentPage.locator('text=Ahmed Hassan').locator('xpath=ancestor::div[contains(@class, "bg-black")]');
    await ahmedCard.isVisible();
    console.log('Found Ahmed Hassan donor card');
    
    // Click the donate button
    const donateButton = ahmedCard.locator('button:has-text("DONATE")');
    await donateButton.click();
    console.log('Clicked donate button for Ahmed Hassan');
    
    // Wait for donation to process
    await wait(3000);
    await takeScreenshot(paymentPage, '03-donation-processed');
    
    // Check for donation confirmation in browser console
    const consoleMessages = [];
    paymentPage.on('console', msg => {
      consoleMessages.push(msg.text());
      if (msg.text().includes('SMS sent') || msg.text().includes('journey')) {
        console.log(`📝 Console: ${msg.text()}`);
      }
    });
    
    // Test 3: Check SMS after donation
    console.log('\n📱 Test 3: Checking SMS after donation...');
    await smsPage.goto(SMS_URL);
    await wait(2000);
    await takeScreenshot(smsPage, '04-sms-after-donation');
    
    // Count SMS messages
    const newSMSCount = await smsPage.locator('[data-testid="sms-message"]').count();
    console.log(`SMS count after donation: ${newSMSCount}`);
    console.log(`Expected: 5 SMS messages (for 5 stages)`);
    console.log(`Actual: ${newSMSCount - initialSMSCount} new SMS messages`);
    
    // Extract SMS details
    const smsMessages = [];
    const messageElements = await smsPage.locator('[data-testid="sms-message"]').all();
    
    for (let i = 0; i < messageElements.length; i++) {
      const messageElement = messageElements[i];
      try {
        const body = await messageElement.locator('.message-body').textContent();
        const timestamp = await messageElement.locator('.message-timestamp').textContent();
        const status = await messageElement.locator('.message-status').textContent();
        
        smsMessages.push({
          index: i,
          body,
          timestamp,
          status,
          hasJourneyLink: body.includes('trupath.eg') || body.includes('/journey/'),
          journeyId: extractJourneyId(body)
        });
      } catch (error) {
        console.error(`Error extracting SMS ${i}:`, error.message);
      }
    }
    
    results.smsMessages = smsMessages;
    
    // Log SMS analysis
    console.log('\n📊 SMS Analysis:');
    smsMessages.forEach((msg, i) => {
      console.log(`SMS ${i + 1}:`);
      console.log(`  Status: ${msg.status}`);
      console.log(`  Has Journey Link: ${msg.hasJourneyLink}`);
      console.log(`  Journey ID: ${msg.journeyId || 'None'}`);
      console.log(`  Body: ${msg.body.substring(0, 100)}...`);
      console.log('');
    });
    
    // Test 4: Test journey viewer with journey ID from SMS
    console.log('\n🗺️ Test 4: Testing Journey Viewer...');
    if (smsMessages.length > 0 && smsMessages[0].journeyId) {
      const journeyId = smsMessages[0].journeyId;
      console.log(`Testing journey ID: ${journeyId}`);
      
      const journeyPage = await context.newPage();
      
      // Try different URL formats
      const urlFormats = [
        `http://localhost:5173/journey/${journeyId}`,
        `http://localhost:5173/journey/${journeyId.toLowerCase()}`,
        `http://localhost:5173/journey/${journeyId.replace(/-/g, '')}`
      ];
      
      for (const url of urlFormats) {
        console.log(`Trying URL: ${url}`);
        try {
          await journeyPage.goto(url);
          await wait(2000);
          
          const pageContent = await journeyPage.textContent('body');
          const isJourneyFound = !pageContent.includes('Journey Not Found');
          const isLoading = pageContent.includes('Loading journey');
          
          results.journeyViewerTests.push({
            url,
            journeyId,
            isJourneyFound,
            isLoading,
            screenshot: await takeScreenshot(journeyPage, `journey-${journeyId.substring(0, 8)}`)
          });
          
          console.log(`  Journey Found: ${isJourneyFound}`);
          console.log(`  Is Loading: ${isLoading}`);
          
          if (isJourneyFound) {
            break; // Found a working URL
          }
        } catch (error) {
          console.error(`  Error accessing ${url}: ${error.message}`);
          results.journeyViewerTests.push({
            url,
            journeyId,
            error: error.message
          });
        }
      }
      
      await journeyPage.close();
    } else {
      console.log('No journey ID found in SMS messages');
      results.errors.push('No journey ID found in SMS messages');
    }
    
    // Test 5: Wait for journey progression and check for additional SMS
    console.log('\n⏱️ Test 5: Waiting for journey progression (30 seconds)...');
    console.log('This will test if SMS are sent for each journey stage');
    
    for (let i = 0; i < 6; i++) { // Check every 5 seconds for 30 seconds
      await wait(5000);
      await smsPage.goto(SMS_URL);
      await wait(1000);
      
      const currentSMSCount = await smsPage.locator('[data-testid="sms-message"]').count();
      console.log(`Check ${i + 1}/6: SMS count: ${currentSMSCount}`);
      
      if (i === 5) { // Final check
        await takeScreenshot(smsPage, '05-sms-final');
        const totalNewSMS = currentSMSCount - initialSMSCount;
        console.log(`\n📊 Final SMS Analysis:`);
        console.log(`Expected: 10 SMS messages (5 stages × 2 donations)`);
        console.log(`Actual: ${totalNewSMS} SMS messages`);
        console.log(`Issue: ${totalNewSMS < 10 ? 'SMS NOT sent for all stages' : 'All SMS sent correctly'}`);
      }
    }
    
    // Test 6: Check browser console for journey progression logs
    console.log('\n📝 Test 6: Analyzing console logs...');
    const journeyLogs = consoleMessages.filter(msg => 
      msg.includes('journey') || msg.includes('Stage') || msg.includes('progressed')
    );
    
    console.log(`Found ${journeyLogs.length} journey-related console logs:`);
    journeyLogs.forEach((log, i) => {
      console.log(`  ${i + 1}. ${log}`);
    });
    
    results.consoleLogs = journeyLogs;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    results.errors.push(error.message);
  } finally {
    await browser.close();
  }
  
  // Save results
  const resultsPath = path.join(TEST_RESULTS_DIR, 'debug-results.json');
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  console.log(`\n📊 Results saved to: ${resultsPath}`);
  
  // Print summary
  console.log('\n📋 DEBUG TEST SUMMARY:');
  console.log('='.repeat(50));
  console.log(`SMS Messages Found: ${results.smsMessages.length}`);
  console.log(`Journey Viewer Tests: ${results.journeyViewerTests.length}`);
  console.log(`Console Logs Analyzed: ${results.consoleLogs.length}`);
  console.log(`Errors: ${results.errors.length}`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ ERRORS:');
    results.errors.forEach((error, i) => {
      console.log(`  ${i + 1}. ${error}`);
    });
  }
  
  // Identify issues
  console.log('\n🔍 ISSUES IDENTIFIED:');
  
  // SMS Issue
  if (results.smsMessages.length < 5) {
    console.log('❌ SMS Issue: Only ' + results.smsMessages.length + ' SMS messages found instead of 5');
    console.log('   Expected: 5 SMS messages (one for each journey stage)');
    console.log('   Actual: ' + results.smsMessages.length + ' SMS messages');
  } else {
    console.log('✅ SMS: All 5 messages found');
  }
  
  // Journey Viewer Issue
  const journeyTestsPassed = results.journeyViewerTests.filter(test => test.isJourneyFound).length;
  if (journeyTestsPassed === 0) {
    console.log('❌ Journey Viewer Issue: No working journey URLs found');
    console.log('   All tested URLs resulted in "Journey Not Found"');
  } else {
    console.log('✅ Journey Viewer: Working URL found');
  }
  
  console.log('\n🏁 Debug test completed!');
  return results;
}

// Helper function to extract journey ID from SMS body
function extractJourneyId(messageBody) {
  if (!messageBody) return null;
  
  // Try different patterns
  const patterns = [
    /trupath\.eg\/([A-Z0-9-]+)/,
    /journey\/([A-Z0-9-]+)/,
    /track:.*?([A-Z]{2}-\d{4}-[A-Z]{3})/,
    /ID:.*?([A-Z]{2}-\d{4}-[A-Z]{3})/
  ];
  
  for (const pattern of patterns) {
    const match = messageBody.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  return null;
}

// Run the test
runDebugTest().catch(console.error);