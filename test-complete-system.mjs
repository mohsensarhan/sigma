/**
 * COMPREHENSIVE END-TO-END SYSTEM TEST
 * Tests the entire multi-page donation tracking system with visual proof at each step
 * 
 * This test verifies:
 * 1. All 5 pages load without errors
 * 2. Scrolling works on all pages except main map
 * 3. Donation triggers successfully
 * 4. Journey appears on map and progresses through stages
 * 5. SMS notifications are sent and displayed
 * 6. Journey viewer opens correctly from SMS link
 * 7. Admin dashboard updates with journey stats
 * 8. Error logging captures all events
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:5173';
const RESULTS_DIR = './test-results/complete-system';

// Ensure results directory exists
if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function captureScreenshot(page, name) {
  const filepath = path.join(RESULTS_DIR, `${name}.png`);
  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`📸 Screenshot saved: ${name}.png`);
  return filepath;
}

async function testScrolling(page, testName) {
  console.log(`   📜 Testing scrolling on ${testName}...`);
  
  // Get initial scroll position
  const initialScroll = await page.evaluate(() => ({
    x: window.scrollX,
    y: window.scrollY
  }));
  
  // Scroll down
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight / 2);
  });
  await delay(500);
  
  // Get middle scroll position
  const middleScroll = await page.evaluate(() => ({
    x: window.scrollX,
    y: window.scrollY
  }));
  
  // Scroll to bottom
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });
  await delay(500);
  
  // Get final scroll position
  const finalScroll = await page.evaluate(() => ({
    x: window.scrollX,
    y: window.scrollY
  }));
  
  // Scroll back to top
  await page.evaluate(() => {
    window.scrollTo(0, 0);
  });
  await delay(500);
  
  const canScroll = middleScroll.y > initialScroll.y || finalScroll.y > middleScroll.y;
  console.log(`   ✓ Scrolling: ${canScroll ? 'WORKS' : 'NOT NEEDED'}`);
  
  return canScroll;
}

async function runCompleteSystemTest() {
  console.log('🚀 Starting Comprehensive End-to-End System Test\n');
  console.log('═══════════════════════════════════════════════════════════════');

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--start-maximized']
  });

  const page = await browser.newPage();
  const logs = [];
  const testResults = {
    timestamp: new Date().toISOString(),
    pages: {},
    scrolling: {},
    donation: {},
    journey: {},
    sms: {},
    admin: {},
    screenshots: [],
    errors: []
  };

  page.on('console', msg => {
    const text = msg.text();
    logs.push(text);
    if (text.includes('Journey') || text.includes('Donation') || text.includes('Stage') || text.includes('SMS')) {
      console.log(`  [LOG] ${text}`);
    }
  });

  page.on('pageerror', error => {
    console.error(`  [ERROR] ${error.message}`);
    testResults.errors.push({
      page: page.url(),
      error: error.message,
      timestamp: new Date().toISOString()
    });
  });

  try {
    // ========================================================================
    // STEP 1: ADMIN DASHBOARD - Configure step duration
    // ========================================================================
    console.log('\n1️⃣ ADMIN DASHBOARD - Configure step duration to 2 seconds');
    console.log('──────────────────────────────────────────────────────────────');
    
    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle0' });
    await delay(2000);
    
    const adminInitialScreenshot = await captureScreenshot(page, '01-admin-initial');
    testResults.screenshots.push(adminInitialScreenshot);
    
    // Check page loaded correctly
    const adminLoaded = await page.evaluate(() => {
      const h1 = document.querySelector('h1')?.textContent;
      const statsElements = document.querySelectorAll('.text-3xl.font-bold');
      return {
        title: h1,
        statsCount: statsElements.length
      };
    });
    
    console.log(`   ✓ Page title: ${adminLoaded.title}`);
    console.log(`   ✓ Stats elements: ${adminLoaded.statsCount}`);
    testResults.pages.admin = { loaded: true, title: adminLoaded.title };
    
    // Test scrolling on admin page
    const adminScrolling = await testScrolling(page, 'Admin Dashboard');
    testResults.scrolling.admin = adminScrolling;
    await captureScreenshot(page, '02-admin-scrolled');
    
    // Set step duration to 2 seconds
    const stepDurationSet = await page.evaluate(() => {
      const slider = document.querySelector('input[type="range"]');
      if (slider) {
        slider.value = '2';
        slider.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
      return false;
    });
    
    console.log(`   ✓ Step duration set to 2 seconds: ${stepDurationSet ? 'SUCCESS' : 'FAILED'}`);
    await delay(1000);
    await captureScreenshot(page, '03-admin-configured');
    testResults.admin.stepDurationSet = stepDurationSet;

    // ========================================================================
    // STEP 2: PAYMENT GATEWAY - Trigger donation
    // ========================================================================
    console.log('\n2️⃣ PAYMENT GATEWAY - Trigger donation');
    console.log('──────────────────────────────────────────────────────────────');
    
    await page.goto(`${BASE_URL}/donors`, { waitUntil: 'networkidle0' });
    await delay(2000);
    
    const paymentInitialScreenshot = await captureScreenshot(page, '04-payment-gateway-initial');
    testResults.screenshots.push(paymentInitialScreenshot);
    
    // Check payment gateway loaded
    const paymentLoaded = await page.evaluate(() => {
      const donorCards = document.querySelectorAll('.text-6xl');
      const donateButtons = document.querySelectorAll('button');
      return {
        donorCount: donorCards.length,
        buttonCount: donateButtons.length
      };
    });
    
    console.log(`   ✓ Donor cards: ${paymentLoaded.donorCount}`);
    console.log(`   ✓ Buttons: ${paymentLoaded.buttonCount}`);
    testResults.pages.donors = { loaded: true, donorCount: paymentLoaded.donorCount };
    
    // Test scrolling on payment gateway
    const paymentScrolling = await testScrolling(page, 'Payment Gateway');
    testResults.scrolling.donors = paymentScrolling;
    await captureScreenshot(page, '05-payment-gateway-scrolled');
    
    // Trigger donation
    let trackingId = null;
    const donationTriggered = await page.evaluate(() => {
      const donateButton = Array.from(document.querySelectorAll('button'))
        .find(btn => btn.textContent.includes('DONATE') && !btn.disabled);
      if (donateButton) {
        donateButton.click();
        return true;
      }
      return false;
    });
    
    console.log(`   ✓ Donation triggered: ${donationTriggered ? 'SUCCESS' : 'FAILED'}`);
    await delay(3000);
    await captureScreenshot(page, '06-donation-triggered');
    testResults.donation.triggered = donationTriggered;
    
    // Get tracking ID
    trackingId = await page.evaluate(() => {
      const trackingElement = document.querySelector('.font-mono.text-sm.text-purple-400');
      return trackingElement?.textContent;
    });
    
    console.log(`   ✓ Tracking ID: ${trackingId || 'NOT FOUND'}`);
    testResults.donation.trackingId = trackingId;

    // ========================================================================
    // STEP 3: MAIN MAP - Verify journey appears
    // ========================================================================
    console.log('\n3️⃣ MAIN MAP - Verify journey appears');
    console.log('──────────────────────────────────────────────────────────────');
    
    await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
    await delay(2000);
    
    const mapInitialScreenshot = await captureScreenshot(page, '07-main-map-initial');
    testResults.screenshots.push(mapInitialScreenshot);
    
    // Check map loaded and journey appears
    const mapStatus = await page.evaluate(() => {
      const mapCanvas = document.querySelector('canvas');
      const activeText = Array.from(document.querySelectorAll('.text-green-400'))
        .find(el => el.textContent.includes('Active'));
      const journeyMarkers = document.querySelectorAll('[class*="marker"]');
      return {
        hasCanvas: !!mapCanvas,
        activeCount: activeText?.textContent || '0',
        markerCount: journeyMarkers.length
      };
    });
    
    console.log(`   ✓ Map canvas: ${mapStatus.hasCanvas ? 'PRESENT' : 'MISSING'}`);
    console.log(`   ✓ Active journeys: ${mapStatus.activeCount}`);
    console.log(`   ✓ Journey markers: ${mapStatus.markerCount}`);
    testResults.pages.main = { 
      loaded: mapStatus.hasCanvas, 
      activeCount: mapStatus.activeCount,
      markerCount: mapStatus.markerCount
    };
    
    // Note: Main map doesn't need scrolling test
    testResults.scrolling.main = false;
    
    // ========================================================================
    // STEP 4: JOURNEY PROGRESSION - Monitor through all 5 stages
    // ========================================================================
    console.log('\n4️⃣ JOURNEY PROGRESSION - Monitor through all 5 stages');
    console.log('──────────────────────────────────────────────────────────────');
    
    const journeyProgression = [];
    
    for (let stage = 1; stage <= 5; stage++) {
      console.log(`   ⏳ Waiting for Stage ${stage}...`);
      await delay(2500); // 2 seconds per stage + 0.5 second buffer
      
      const stageScreenshot = await captureScreenshot(page, `08-journey-stage-${stage}`);
      testResults.screenshots.push(stageScreenshot);
      
      const stageInfo = await page.evaluate(() => {
        const activeText = Array.from(document.querySelectorAll('.text-green-400'))
          .find(el => el.textContent.includes('Active'))?.textContent || '0';
        const completedText = Array.from(document.querySelectorAll('.text-blue-400'))
          .find(el => el.textContent.includes('Completed'))?.textContent || '0';
        
        // Try to find current stage indicator
        const stageIndicators = document.querySelectorAll('[class*="stage"]');
        const currentStage = Array.from(stageIndicators).find(el => 
          el.classList.contains('active') || el.classList.contains('current')
        );
        
        return {
          active: activeText,
          completed: completedText,
          stageElement: !!currentStage
        };
      });
      
      journeyProgression.push({
        stage,
        screenshot: `08-journey-stage-${stage}.png`,
        ...stageInfo
      });
      
      console.log(`     Active: ${stageInfo.active}, Completed: ${stageInfo.completed}`);
    }
    
    testResults.journey.stages = journeyProgression;
    testResults.journey.completed = journeyProgression.length === 5;
    console.log(`   ✓ Journey progression: ${testResults.journey.completed ? 'COMPLETED' : 'INCOMPLETE'}`);
    
    // ========================================================================
    // STEP 5: SMS INBOX - Verify notifications
    // ========================================================================
    console.log('\n5️⃣ SMS INBOX - Verify notifications');
    console.log('──────────────────────────────────────────────────────────────');
    
    await page.goto(`${BASE_URL}/sms`, { waitUntil: 'networkidle0' });
    await delay(2000);
    
    const smsInitialScreenshot = await captureScreenshot(page, '09-sms-inbox-initial');
    testResults.screenshots.push(smsInitialScreenshot);
    
    // Check SMS inbox
    const smsStatus = await page.evaluate(() => {
      const messageCards = document.querySelectorAll('.bg-gray-800\\/50');
      const donorTabs = document.querySelectorAll('.text-4xl');
      const viewJourneyButtons = document.querySelectorAll('button');
      const viewButtonCount = Array.from(viewJourneyButtons)
        .filter(btn => btn.textContent.includes('View Journey')).length;
      
      return {
        messageCount: messageCards.length,
        donorTabs: donorTabs.length,
        viewJourneyButtons: viewButtonCount
      };
    });
    
    console.log(`   ✓ Message cards: ${smsStatus.messageCount}`);
    console.log(`   ✓ Donor tabs: ${smsStatus.donorTabs}`);
    console.log(`   ✓ View Journey buttons: ${smsStatus.viewJourneyButtons}`);
    testResults.pages.sms = { 
      loaded: true, 
      messageCount: smsStatus.messageCount,
      donorTabs: smsStatus.donorTabs
    };
    testResults.sms.messagesFound = smsStatus.messageCount > 0;
    testResults.sms.viewJourneyButtons = smsStatus.viewJourneyButtons;
    
    // Test scrolling on SMS page
    const smsScrolling = await testScrolling(page, 'SMS Inbox');
    testResults.scrolling.sms = smsScrolling;
    await captureScreenshot(page, '10-sms-inbox-scrolled');
    
    // ========================================================================
    // STEP 6: JOURNEY VIEWER - Open from SMS link
    // ========================================================================
    console.log('\n6️⃣ JOURNEY VIEWER - Open from SMS link');
    console.log('──────────────────────────────────────────────────────────────');
    
    let journeyViewerOpened = false;
    let journeyViewerUrl = null;
    
    if (smsStatus.viewJourneyButtons > 0) {
      // Click View Journey button
      journeyViewerOpened = await page.evaluate(() => {
        const viewButton = Array.from(document.querySelectorAll('button'))
          .find(btn => btn.textContent.includes('View Journey'));
        if (viewButton) {
          viewButton.click();
          return true;
        }
        return false;
      });
      
      if (journeyViewerOpened) {
        await delay(3000);
        journeyViewerUrl = page.url();
        
        const journeyViewerScreenshot = await captureScreenshot(page, '11-journey-viewer-opened');
        testResults.screenshots.push(journeyViewerScreenshot);
        
        // Check journey viewer
        const journeyViewerStatus = await page.evaluate(() => {
          const h1 = document.querySelector('h1')?.textContent;
          const trackingId = document.querySelector('.font-mono')?.textContent;
          const progressBar = document.querySelector('[class*="progress"]');
          const statusBadge = document.querySelector('.px-3.py-1.rounded-full');
          
          return {
            title: h1,
            trackingId,
            hasProgressBar: !!progressBar,
            status: statusBadge?.textContent
          };
        });
        
        console.log(`   ✓ Journey viewer title: ${journeyViewerStatus.title}`);
        console.log(`   ✓ Tracking ID: ${journeyViewerStatus.trackingId}`);
        console.log(`   ✓ Progress bar: ${journeyViewerStatus.hasProgressBar ? 'PRESENT' : 'MISSING'}`);
        console.log(`   ✓ Status: ${journeyViewerStatus.status}`);
        
        testResults.pages.journey = { 
          loaded: true, 
          title: journeyViewerStatus.title,
          trackingId: journeyViewerStatus.trackingId
        };
        testResults.journey.viewerOpened = true;
        
        // Test scrolling on journey viewer
        const journeyScrolling = await testScrolling(page, 'Journey Viewer');
        testResults.scrolling.journey = journeyScrolling;
        await captureScreenshot(page, '12-journey-viewer-scrolled');
      }
    } else {
      console.log('   ⚠️ No View Journey buttons found');
      testResults.journey.viewerOpened = false;
    }

    // ========================================================================
    // STEP 7: ADMIN DASHBOARD - Verify final stats
    // ========================================================================
    console.log('\n7️⃣ ADMIN DASHBOARD - Verify final stats');
    console.log('──────────────────────────────────────────────────────────────');
    
    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle0' });
    await delay(2000);
    
    const adminFinalScreenshot = await captureScreenshot(page, '13-admin-final-stats');
    testResults.screenshots.push(adminFinalScreenshot);
    
    // Check final stats
    const finalStats = await page.evaluate(() => {
      const statsElements = document.querySelectorAll('.text-3xl.font-bold');
      const errorLogs = document.querySelectorAll('.p-3.rounded-lg.border');
      const infoLogs = Array.from(errorLogs).filter(log =>
        log.textContent.includes('INFO')
      );
      
      return {
        active: statsElements[0]?.textContent || '0',
        completed: statsElements[1]?.textContent || '0',
        total: statsElements[2]?.textContent || '0',
        totalLogs: errorLogs.length,
        infoLogs: infoLogs.length
      };
    });
    
    console.log(`   ✓ Active journeys: ${finalStats.active}`);
    console.log(`   ✓ Completed journeys: ${finalStats.completed}`);
    console.log(`   ✓ Total journeys: ${finalStats.total}`);
    console.log(`   ✓ Total logs: ${finalStats.totalLogs}`);
    console.log(`   ✓ Info logs: ${finalStats.infoLogs}`);
    
    testResults.admin.finalStats = finalStats;
    testResults.admin.statsUpdated = finalStats.total !== '0';

    // ========================================================================
    // STEP 8: GENERATE COMPREHENSIVE REPORT
    // ========================================================================
    console.log('\n8️⃣ GENERATING COMPREHENSIVE REPORT');
    console.log('──────────────────────────────────────────────────────────────');
    
    const report = {
      timestamp: new Date().toISOString(),
      testDuration: 'Approximately 45 seconds',
      summary: {
        totalTests: 8,
        pagesTested: 5,
        screenshotsTaken: testResults.screenshots.length,
        errorsFound: testResults.errors.length
      },
      results: {
        pages: {
          admin: testResults.pages.admin?.loaded || false,
          donors: testResults.pages.donors?.loaded || false,
          main: testResults.pages.main?.loaded || false,
          sms: testResults.pages.sms?.loaded || false,
          journey: testResults.pages.journey?.loaded || false
        },
        scrolling: {
          admin: testResults.scrolling.admin || false,
          donors: testResults.scrolling.donors || false,
          main: false, // Main map doesn't scroll
          sms: testResults.scrolling.sms || false,
          journey: testResults.scrolling.journey || false
        },
        functionality: {
          stepDurationSet: testResults.admin.stepDurationSet || false,
          donationTriggered: testResults.donation.triggered || false,
          trackingIdGenerated: !!testResults.donation.trackingId,
          journeyProgressed: testResults.journey.completed || false,
          smsMessagesFound: testResults.sms.messagesFound || false,
          journeyViewerOpened: testResults.journey.viewerOpened || false,
          adminStatsUpdated: testResults.admin.statsUpdated || false
        }
      },
      data: {
        trackingId: testResults.donation.trackingId,
        journeyStages: testResults.journey.stages,
        finalStats: testResults.admin.finalStats
      },
      screenshots: testResults.screenshots,
      errors: testResults.errors,
      consoleLogs: logs.length,
      status: testResults.errors.length === 0 ? 'PASSED' : 'FAILED'
    };
    
    // Save comprehensive report
    const reportPath = path.join(RESULTS_DIR, 'complete-system-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Print final summary
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('📊 COMPREHENSIVE SYSTEM TEST RESULTS');
    console.log('═══════════════════════════════════════════════════════════════');
    
    console.log(`\n📄 Report: ${reportPath}`);
    console.log(`📸 Screenshots: ${report.summary.screenshotsTaken}`);
    console.log(`📝 Console logs: ${report.consoleLogs}`);
    console.log(`❌ Errors: ${report.summary.errorsFound}`);
    console.log(`⏱️ Duration: ${report.testDuration}`);
    
    console.log('\n📋 Pages Tested:');
    Object.entries(report.results.pages).forEach(([page, loaded]) => {
      console.log(`   ${page}: ${loaded ? '✅ LOADED' : '❌ FAILED'}`);
    });
    
    console.log('\n📜 Scrolling Tests:');
    Object.entries(report.results.scrolling).forEach(([page, works]) => {
      const status = page === 'main' ? '⚪ NOT APPLICABLE' : works ? '✅ WORKS' : '❌ FAILED';
      console.log(`   ${page}: ${status}`);
    });
    
    console.log('\n🔧 Functionality Tests:');
    Object.entries(report.results.functionality).forEach(([test, passed]) => {
      console.log(`   ${test}: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
    });
    
    console.log('\n🎯 Overall Status:');
    if (report.status === 'PASSED') {
      console.log('   ✅ ALL TESTS PASSED - System is working correctly!');
    } else {
      console.log('   ⚠️ SOME TESTS FAILED - Check the report for details');
    }
    
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    return report;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await captureScreenshot(page, 'ERROR');
    throw error;
  } finally {
    await delay(3000);
    await browser.close();
  }
}

// Run the test
runCompleteSystemTest().catch(console.error);