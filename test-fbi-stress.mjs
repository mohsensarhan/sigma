/**
 * FBI-LEVEL STRESS TEST FOR DONATION TRACKING SYSTEM
 * 
 * This is a comprehensive stress test that thoroughly tests the entire donation tracking system
 * with adequate time to see the complete journey progression. It implements constant iteration
 * with best coding and debugging practices.
 * 
 * Features:
 * - Multiple concurrent donations (all 4 donors)
 * - Monitor all journeys progressing simultaneously
 * - Verify SMS messages for all donations
 * - Test journey viewer navigation for multiple journeys
 * - Check admin dashboard stats with multiple active journeys
 * - Run for full journey duration (25 seconds for 5 stages)
 * - Detective mode with detailed logging and screenshots
 * - Performance metrics tracking
 * - Error detection and reporting
 * - State verification at each step
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:5173';
const RESULTS_DIR = './test-results/fbi-stress';
const STEP_DURATION = 5000; // 5 seconds per step for adequate viewing time
const JOURNEY_STAGES = 5;
const TOTAL_JOURNEY_TIME = STEP_DURATION * JOURNEY_STAGES; // 25 seconds total

// Ensure results directory exists
if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

// Test configuration
const TEST_CONFIG = {
  concurrentDonations: 4, // All 4 donors
  stepDuration: 5, // seconds
  totalStages: 5,
  monitoringInterval: 2000, // Check status every 2 seconds
  screenshotInterval: 5000, // Screenshot every 5 seconds
  maxTestDuration: 60000, // 60 seconds max test duration
  performanceMonitoring: true,
  networkMonitoring: true,
  consoleLogging: true
};

// Performance metrics collector
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      pageLoad: [],
      networkRequests: [],
      consoleErrors: [],
      memoryUsage: [],
      timingEvents: [],
      stateChanges: []
    };
    this.startTime = Date.now();
  }

  recordPageLoad(url, loadTime) {
    this.metrics.pageLoad.push({ url, loadTime, timestamp: Date.now() });
  }

  recordNetworkRequest(method, url, status, responseTime) {
    this.metrics.networkRequests.push({ method, url, status, responseTime, timestamp: Date.now() });
  }

  recordConsoleError(error) {
    this.metrics.consoleErrors.push({ error, timestamp: Date.now() });
  }

  recordMemoryUsage(used, total) {
    this.metrics.memoryUsage.push({ used, total, timestamp: Date.now() });
  }

  recordTimingEvent(event, details = {}) {
    this.metrics.timingEvents.push({ event, details, timestamp: Date.now() });
  }

  recordStateChange(component, oldState, newState) {
    this.metrics.stateChanges.push({ component, oldState, newState, timestamp: Date.now() });
  }

  getReport() {
    const duration = Date.now() - this.startTime;
    return {
      testDuration: duration,
      pageLoadTimes: this.metrics.pageLoad,
      networkRequests: this.metrics.networkRequests,
      consoleErrors: this.metrics.consoleErrors,
      memoryUsage: this.metrics.memoryUsage,
      timingEvents: this.metrics.timingEvents,
      stateChanges: this.metrics.stateChanges,
      summary: {
        totalPageLoads: this.metrics.pageLoad.length,
        totalNetworkRequests: this.metrics.networkRequests.length,
        totalErrors: this.metrics.consoleErrors.length,
        totalStateChanges: this.metrics.stateChanges.length,
        averageMemoryUsage: this.metrics.memoryUsage.length > 0 
          ? this.metrics.memoryUsage.reduce((sum, m) => sum + m.used, 0) / this.metrics.memoryUsage.length 
          : 0
      }
    };
  }
}

// Detective mode logger
class DetectiveLogger {
  constructor() {
    this.logs = [];
    this.screenshots = [];
    this.events = [];
  }

  log(level, message, details = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      details
    };
    this.logs.push(entry);
    console.log(`[${level}] ${message}`, details);
  }

  logEvent(event, data) {
    const entry = {
      timestamp: new Date().toISOString(),
      event,
      data
    };
    this.events.push(entry);
    this.log('EVENT', event, data);
  }

  logScreenshot(path, description) {
    const entry = {
      timestamp: new Date().toISOString(),
      path,
      description
    };
    this.screenshots.push(entry);
    this.log('SCREENSHOT', `Captured: ${description}`, { path });
  }

  logError(error, context) {
    this.log('ERROR', error.message, { context, stack: error.stack });
  }

  logPerformance(metric, value) {
    this.log('PERFORMANCE', `${metric}: ${value}`, { metric, value });
  }

  getReport() {
    return {
      logs: this.logs,
      screenshots: this.screenshots,
      events: this.events,
      summary: {
        totalLogs: this.logs.length,
        totalScreenshots: this.screenshots.length,
        totalEvents: this.events.length,
        errorCount: this.logs.filter(l => l.level === 'ERROR').length,
        warningCount: this.logs.filter(l => l.level === 'WARNING').length
      }
    };
  }
}

// State verification utility
class StateVerifier {
  constructor(page) {
    this.page = page;
    this.previousStates = {};
  }

  async verifyJourneyState(expectedActive, expectedCompleted) {
    const currentState = await this.page.evaluate(() => {
      const activeText = Array.from(document.querySelectorAll('.text-green-400'))
        .find(el => el.textContent.includes('Active'))?.textContent || '0';
      const completedText = Array.from(document.querySelectorAll('.text-blue-400'))
        .find(el => el.textContent.includes('Completed'))?.textContent || '0';
      
      return {
        active: parseInt(activeText) || 0,
        completed: parseInt(completedText) || 0
      };
    });

    const stateChanged = JSON.stringify(currentState) !== JSON.stringify(this.previousStates.journey || {});
    this.previousStates.journey = currentState;

    return {
      currentState,
      stateChanged,
      matchesExpected: currentState.active === expectedActive && currentState.completed === expectedCompleted
    };
  }

  async verifySMSMessages(expectedCount) {
    const messageCount = await this.page.evaluate(() => {
      const messageCards = document.querySelectorAll('.bg-gray-800\\/50');
      return messageCards.length;
    });

    return {
      messageCount,
      matchesExpected: messageCount >= expectedCount
    };
  }

  async verifyAdminStats(expectedActive, expectedCompleted, expectedTotal) {
    const stats = await this.page.evaluate(() => {
      const statsElements = document.querySelectorAll('.text-3xl.font-bold');
      return {
        active: statsElements[0]?.textContent || '0',
        completed: statsElements[1]?.textContent || '0',
        total: statsElements[2]?.textContent || '0'
      };
    });

    return {
      stats,
      matchesExpected: stats.active === expectedActive.toString() && 
                      stats.completed === expectedCompleted.toString() && 
                      stats.total === expectedTotal.toString()
    };
  }
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function captureScreenshot(page, name, description) {
  const filepath = path.join(RESULTS_DIR, `${name}.png`);
  await page.screenshot({ path: filepath, fullPage: true });
  return filepath;
}

async function setupMonitoring(page, performanceMonitor, detectiveLogger) {
  // Console logging
  page.on('console', msg => {
    const text = msg.text();
    if (TEST_CONFIG.consoleLogging) {
      detectiveLogger.log('CONSOLE', text);
    }
    
    if (msg.type() === 'error') {
      performanceMonitor.recordConsoleError(text);
    }
  });

  // Network monitoring
  if (TEST_CONFIG.networkMonitoring) {
    page.on('request', request => {
      const startTime = Date.now();
      request._startTime = startTime;
    });

    page.on('response', response => {
      const request = response.request();
      const responseTime = Date.now() - request._startTime;
      performanceMonitor.recordNetworkRequest(
        request.method(),
        request.url(),
        response.status(),
        responseTime
      );
    });
  }

  // Error handling
  page.on('pageerror', error => {
    detectiveLogger.logError(error, 'Page Error');
    performanceMonitor.recordConsoleError(error.message);
  });

  // Performance monitoring
  if (TEST_CONFIG.performanceMonitoring) {
    setInterval(async () => {
      try {
        const memoryInfo = await page.metrics();
        performanceMonitor.recordMemoryUsage(
          memoryInfo.JSHeapUsedSize,
          memoryInfo.JSHeapTotalSize
        );
      } catch (error) {
        detectiveLogger.logError(error, 'Memory monitoring');
      }
    }, 5000);
  }
}

async function configureAdminPanel(page, detectiveLogger, performanceMonitor) {
  detectiveLogger.logEvent('CONFIGURE_ADMIN_PANEL', { stepDuration: TEST_CONFIG.stepDuration });
  
  await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle0' });
  const startTime = Date.now();
  
  // Set step duration to 5 seconds
  const stepDurationSet = await page.evaluate((duration) => {
    const slider = document.querySelector('input[type="range"]');
    if (slider) {
      slider.value = duration.toString();
      slider.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }
    return false;
  }, TEST_CONFIG.stepDuration);
  
  const loadTime = Date.now() - startTime;
  performanceMonitor.recordPageLoad('/admin', loadTime);
  
  detectiveLogger.logScreenshot(
    await captureScreenshot(page, '01-admin-configured', 'Admin panel configured'),
    'Admin panel configured with 5-second step duration'
  );
  
  detectiveLogger.logPerformance('Admin configuration time', loadTime);
  
  return stepDurationSet;
}

async function triggerConcurrentDonations(page, detectiveLogger, performanceMonitor) {
  detectiveLogger.logEvent('TRIGGER_CONCURRENT_DONATIONS', { count: TEST_CONFIG.concurrentDonations });
  
  await page.goto(`${BASE_URL}/donors`, { waitUntil: 'networkidle0' });
  const startTime = Date.now();
  
  const trackingIds = [];
  
  // Trigger donations from all 4 donors
  for (let i = 1; i <= TEST_CONFIG.concurrentDonations; i++) {
    detectiveLogger.log('DONATION', `Triggering donation from donor ${i}`);
    
    const donationTriggered = await page.evaluate((donorIndex) => {
      const donorCards = document.querySelectorAll('.text-6xl');
      if (donorCards.length >= donorIndex) {
        const donorCard = donorCards[donorIndex - 1];
        const donateButton = donorCard.parentElement.querySelector('button');
        if (donateButton && !donateButton.disabled) {
          donateButton.click();
          return true;
        }
      }
      return false;
    }, i);
    
    if (donationTriggered) {
      await delay(1000); // Small delay between donations
      
      // Get tracking ID if available
      const trackingId = await page.evaluate(() => {
        const trackingElement = document.querySelector('.font-mono.text-sm.text-purple-400');
        return trackingElement?.textContent;
      });
      
      if (trackingId) {
        trackingIds.push(trackingId);
        detectiveLogger.log('DONATION', `Donation ${i} triggered with tracking ID: ${trackingId}`);
      }
    } else {
      detectiveLogger.log('ERROR', `Failed to trigger donation from donor ${i}`);
    }
  }
  
  const loadTime = Date.now() - startTime;
  performanceMonitor.recordPageLoad('/donors', loadTime);
  
  detectiveLogger.logScreenshot(
    await captureScreenshot(page, '02-donations-triggered', 'All donations triggered'),
    'All concurrent donations triggered'
  );
  
  detectiveLogger.logPerformance('Donation triggering time', loadTime);
  
  return trackingIds;
}

async function monitorJourneyProgression(page, detectiveLogger, performanceMonitor, stateVerifier) {
  detectiveLogger.logEvent('MONITOR_JOURNEY_PROGRESSION', { 
    duration: TOTAL_JOURNEY_TIME,
    stages: JOURNEY_STAGES
  });
  
  await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
  
  const monitoringData = {
    startTime: Date.now(),
    checkpoints: [],
    stageProgression: [],
    errors: []
  };
  
  let screenshotCounter = 3;
  const monitoringInterval = setInterval(async () => {
    try {
      const elapsed = Date.now() - monitoringData.startTime;
      const currentStage = Math.ceil(elapsed / STEP_DURATION);
      
      // Verify journey state
      const journeyState = await stateVerifier.verifyJourneyState(
        TEST_CONFIG.concurrentDonations,
        0
      );
      
      const checkpoint = {
        timestamp: Date.now(),
        elapsed,
        currentStage,
        journeyState
      };
      
      monitoringData.checkpoints.push(checkpoint);
      
      detectiveLogger.log('MONITOR', `Stage ${currentStage}/5 - Active: ${journeyState.currentState.active}, Completed: ${journeyState.currentState.completed}`);
      
      // Take screenshot at intervals
      if (elapsed % TEST_CONFIG.screenshotInterval < 1000) {
        const screenshotPath = await captureScreenshot(
          page, 
          `${String(screenshotCounter).padStart(2, '0')}-journey-progress`,
          `Journey progression at ${elapsed/1000}s`
        );
        detectiveLogger.logScreenshot(screenshotPath, `Journey progression at ${elapsed/1000}s`);
        screenshotCounter++;
      }
      
      // Check for stage completion
      if (journeyState.stateChanged) {
        detectiveLogger.logEvent('JOURNEY_STATE_CHANGED', journeyState.currentState);
        performanceMonitor.recordStateChange('journey', monitoringData.previousState, journeyState.currentState);
        monitoringData.previousState = journeyState.currentState;
      }
      
      // Check if all journeys completed
      if (journeyState.currentState.completed === TEST_CONFIG.concurrentDonations) {
        detectiveLogger.log('SUCCESS', 'All journeys completed successfully!');
        clearInterval(monitoringInterval);
        return;
      }
      
    } catch (error) {
      detectiveLogger.logError(error, 'Journey monitoring');
      monitoringData.errors.push({ error: error.message, timestamp: Date.now() });
    }
  }, TEST_CONFIG.monitoringInterval);
  
  // Wait for total journey time
  await delay(TOTAL_JOURNEY_TIME + 5000); // Extra 5 seconds buffer
  
  clearInterval(monitoringInterval);
  
  // Final screenshot
  detectiveLogger.logScreenshot(
    await captureScreenshot(page, '99-journey-complete', 'All journeys completed'),
    'Final state after journey completion'
  );
  
  return monitoringData;
}

async function verifySMSInbox(page, trackingIds, detectiveLogger, performanceMonitor, stateVerifier) {
  detectiveLogger.logEvent('VERIFY_SMS_INBOX', { expectedMessages: trackingIds.length * JOURNEY_STAGES });
  
  await page.goto(`${BASE_URL}/sms`, { waitUntil: 'networkidle0' });
  const startTime = Date.now();
  
  // Check SMS messages
  const smsState = await stateVerifier.verifySMSMessages(trackingIds.length * JOURNEY_STAGES);
  
  detectiveLogger.log('SMS', `Found ${smsState.messageCount} messages (expected ~${trackingIds.length * JOURNEY_STAGES})`);
  
  // Get detailed SMS information
  const smsDetails = await page.evaluate(() => {
    const messageCards = document.querySelectorAll('.bg-gray-800\\/50');
    const donorTabs = document.querySelectorAll('.text-4xl');
    const viewJourneyButtons = document.querySelectorAll('button');
    
    return {
      messageCards: messageCards.length,
      donorTabs: donorTabs.length,
      viewJourneyButtons: Array.from(viewJourneyButtons).filter(btn => 
        btn.textContent.includes('View Journey')
      ).length
    };
  });
  
  const loadTime = Date.now() - startTime;
  performanceMonitor.recordPageLoad('/sms', loadTime);
  
  detectiveLogger.logScreenshot(
    await captureScreenshot(page, '10-sms-inbox', 'SMS inbox with all messages'),
    'SMS inbox showing all journey messages'
  );
  
  detectiveLogger.logPerformance('SMS verification time', loadTime);
  
  return smsDetails;
}

async function verifyJourneyViewers(page, trackingIds, detectiveLogger, performanceMonitor) {
  detectiveLogger.logEvent('VERIFY_JOURNEY_VIEWERS', { trackingIds });
  
  const journeyViewerResults = [];
  
  for (let i = 0; i < Math.min(trackingIds.length, 2); i++) { // Test first 2 journeys
    const trackingId = trackingIds[i];
    
    await page.goto(`${BASE_URL}/journey/${trackingId}`, { waitUntil: 'networkidle0' });
    const startTime = Date.now();
    
    const viewerState = await page.evaluate(() => {
      const h1 = document.querySelector('h1')?.textContent;
      const trackingIdElement = document.querySelector('.font-mono')?.textContent;
      const progressBar = document.querySelector('[class*="progress"]');
      const statusBadge = document.querySelector('.px-3.py-1.rounded-full');
      
      return {
        title: h1,
        trackingId: trackingIdElement,
        hasProgressBar: !!progressBar,
        status: statusBadge?.textContent
      };
    });
    
    const loadTime = Date.now() - startTime;
    performanceMonitor.recordPageLoad(`/journey/${trackingId}`, loadTime);
    
    detectiveLogger.logScreenshot(
      await captureScreenshot(page, `11-journey-viewer-${i+1}`, `Journey viewer for ${trackingId}`),
      `Journey viewer for tracking ID: ${trackingId}`
    );
    
    journeyViewerResults.push({
      trackingId,
      viewerState,
      loadTime
    });
  }
  
  return journeyViewerResults;
}

async function verifyFinalAdminStats(page, detectiveLogger, performanceMonitor, stateVerifier) {
  detectiveLogger.logEvent('VERIFY_FINAL_ADMIN_STATS');
  
  await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle0' });
  const startTime = Date.now();
  
  const finalStats = await stateVerifier.verifyAdminStats(
    0, // Should be 0 active
    TEST_CONFIG.concurrentDonations, // Should be all completed
    TEST_CONFIG.concurrentDonations // Should be total donations
  );
  
  const loadTime = Date.now() - startTime;
  performanceMonitor.recordPageLoad('/admin-final', loadTime);
  
  // Get error logs
  const errorLogs = await page.evaluate(() => {
    const logElements = document.querySelectorAll('.p-3.rounded-lg.border');
    return Array.from(logElements).map(log => ({
      type: log.textContent.includes('ERROR') ? 'ERROR' : 
            log.textContent.includes('WARNING') ? 'WARNING' : 'INFO',
      content: log.textContent.substring(0, 100) + '...'
    }));
  });
  
  detectiveLogger.logScreenshot(
    await captureScreenshot(page, '12-final-admin-stats', 'Final admin statistics'),
    'Final admin dashboard with complete statistics'
  );
  
  detectiveLogger.logPerformance('Final admin verification time', loadTime);
  
  return {
    stats: finalStats,
    errorLogs,
    matchesExpected: finalStats.matchesExpected
  };
}

async function generateComprehensiveReport(testResults, performanceMonitor, detectiveLogger) {
  detectiveLogger.logEvent('GENERATING_COMPREHENSIVE_REPORT');
  
  const report = {
    timestamp: new Date().toISOString(),
    testConfig: TEST_CONFIG,
    duration: Date.now() - testResults.startTime,
    summary: {
      totalTests: 6,
      screenshotsTaken: detectiveLogger.screenshots.length,
      errorsFound: detectiveLogger.getReport().errorCount,
      performanceIssues: performanceMonitor.getReport().consoleErrors.length
    },
    testResults,
    performanceReport: performanceMonitor.getReport(),
    detectiveReport: detectiveLogger.getReport(),
    status: detectiveLogger.getReport().errorCount === 0 ? 'PASSED' : 'FAILED',
    recommendations: generateRecommendations(performanceMonitor, detectiveLogger)
  };
  
  const reportPath = path.join(RESULTS_DIR, 'fbi-stress-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  return report;
}

function generateRecommendations(performanceMonitor, detectiveLogger) {
  const recommendations = [];
  const perfReport = performanceMonitor.getReport();
  const detectiveReport = detectiveLogger.getReport();
  
  if (perfReport.summary.totalErrors > 0) {
    recommendations.push('Address console errors - system stability issues detected');
  }
  
  if (perfReport.summary.averageMemoryUsage > 100 * 1024 * 1024) { // 100MB
    recommendations.push('Monitor memory usage - potential memory leaks detected');
  }
  
  if (detectiveReport.errorCount > 0) {
    recommendations.push('Fix critical errors before production deployment');
  }
  
  if (perfReport.totalNetworkRequests > 100) {
    recommendations.push('Optimize network requests - high traffic detected');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('System performing well - ready for production');
  }
  
  return recommendations;
}

async function runFBIStressTest() {
  const startTime = Date.now();
  const detectiveLogger = new DetectiveLogger();
  const performanceMonitor = new PerformanceMonitor();
  
  detectiveLogger.log('START', 'FBI Stress Test Started', {
    config: TEST_CONFIG,
    timestamp: new Date().toISOString()
  });
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--start-maximized']
  });
  
  const page = await browser.newPage();
  const stateVerifier = new StateVerifier(page);
  
  // Setup monitoring
  await setupMonitoring(page, performanceMonitor, detectiveLogger);
  
  const testResults = {
    startTime,
    config: TEST_CONFIG,
    results: {}
  };
  
  try {
    // Test 1: Configure Admin Panel
    detectiveLogger.log('TEST', 'Starting Test 1: Configure Admin Panel');
    testResults.results.adminConfigured = await configureAdminPanel(page, detectiveLogger, performanceMonitor);
    
    // Test 2: Trigger Concurrent Donations
    detectiveLogger.log('TEST', 'Starting Test 2: Trigger Concurrent Donations');
    const trackingIds = await triggerConcurrentDonations(page, detectiveLogger, performanceMonitor);
    testResults.results.trackingIds = trackingIds;
    
    // Test 3: Monitor Journey Progression
    detectiveLogger.log('TEST', 'Starting Test 3: Monitor Journey Progression');
    testResults.results.journeyMonitoring = await monitorJourneyProgression(page, detectiveLogger, performanceMonitor, stateVerifier);
    
    // Test 4: Verify SMS Inbox
    detectiveLogger.log('TEST', 'Starting Test 4: Verify SMS Inbox');
    testResults.results.smsVerification = await verifySMSInbox(page, trackingIds, detectiveLogger, performanceMonitor, stateVerifier);
    
    // Test 5: Verify Journey Viewers
    detectiveLogger.log('TEST', 'Starting Test 5: Verify Journey Viewers');
    testResults.results.journeyViewers = await verifyJourneyViewers(page, trackingIds, detectiveLogger, performanceMonitor);
    
    // Test 6: Verify Final Admin Stats
    detectiveLogger.log('TEST', 'Starting Test 6: Verify Final Admin Stats');
    testResults.results.finalAdminStats = await verifyFinalAdminStats(page, detectiveLogger, performanceMonitor, stateVerifier);
    
    // Generate comprehensive report
    const report = await generateComprehensiveReport(testResults, performanceMonitor, detectiveLogger);
    
    // Print final summary
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('🔥 FBI STRESS TEST RESULTS');
    console.log('═══════════════════════════════════════════════════════════════');
    
    console.log(`\n📊 Test Duration: ${(report.duration / 1000).toFixed(2)} seconds`);
    console.log(`📸 Screenshots: ${report.summary.screenshotsTaken}`);
    console.log(`📝 Console Logs: ${report.detectiveReport.totalLogs}`);
    console.log(`❌ Errors: ${report.summary.errorsFound}`);
    console.log(`⚡ Performance Issues: ${report.summary.performanceIssues}`);
    
    console.log('\n🎯 Test Results:');
    Object.entries(testResults.results).forEach(([test, result]) => {
      const status = result ? '✅ PASSED' : '❌ FAILED';
      console.log(`   ${test}: ${status}`);
    });
    
    console.log('\n📈 Performance Summary:');
    console.log(`   Page Loads: ${report.performanceReport.summary.totalPageLoads}`);
    console.log(`   Network Requests: ${report.performanceReport.summary.totalNetworkRequests}`);
    console.log(`   State Changes: ${report.performanceReport.summary.totalStateChanges}`);
    console.log(`   Avg Memory Usage: ${(report.performanceReport.summary.averageMemoryUsage / 1024 / 1024).toFixed(2)} MB`);
    
    console.log('\n🔍 Recommendations:');
    report.recommendations.forEach(rec => {
      console.log(`   • ${rec}`);
    });
    
    console.log('\n🎯 Overall Status:');
    if (report.status === 'PASSED') {
      console.log('   ✅ STRESS TEST PASSED - System is robust and ready for production!');
    } else {
      console.log('   ⚠️ STRESS TEST FAILED - Issues need to be addressed before production');
    }
    
    console.log('\n═══════════════════════════════════════════════════════════════\n');
    
    detectiveLogger.log('COMPLETE', 'FBI Stress Test Completed', {
      status: report.status,
      duration: report.duration,
      reportPath: path.join(RESULTS_DIR, 'fbi-stress-report.json')
    });
    
    return report;
    
  } catch (error) {
    detectiveLogger.logError(error, 'FBI Stress Test Failed');
    console.error('❌ FBI Stress Test failed:', error);
    
    // Capture error screenshot
    const errorScreenshot = await captureScreenshot(page, 'ERROR', 'Test failure screenshot');
    detectiveLogger.logScreenshot(errorScreenshot, 'Error state screenshot');
    
    throw error;
  } finally {
    await delay(3000);
    await browser.close();
  }
}

// Run the FBI stress test
runFBIStressTest().catch(console.error);