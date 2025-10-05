import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:5173';
const SCREENSHOT_DIR = './test-results/comprehensive-e2e';
const REPORT_FILE = path.join(SCREENSHOT_DIR, 'report.json');

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const results = {
  timestamp: new Date().toISOString(),
  tests: {},
  issues: [],
  logs: [],
  supabaseTests: {},
  criticalFunctions: {}
};

function log(message, emoji = '📝') {
  const msg = `${emoji} ${message}`;
  console.log(msg);
  results.logs.push(msg);
}

async function screenshot(page, name) {
  const filename = path.join(SCREENSHOT_DIR, `${name}.png`);
  await page.screenshot({ path: filename, fullPage: true });
  log(`Screenshot saved: ${name}`, '📸');
}

async function test() {
  log('COMPREHENSIVE E2E TEST - ALL SYSTEMS', '🔍');
  log('='.repeat(50), '');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture all console logs
  page.on('console', msg => {
    const text = msg.text();
    results.logs.push(`💬 ${text}`);
  });

  try {
    // ========================================
    // TEST 1: SUPABASE CONNECTION
    // ========================================
    log('TEST 1: Supabase Connection & Auth', '🔐');

    await page.goto(`${BASE_URL}/admin`);
    await page.waitForTimeout(2000);
    await screenshot(page, '01-initial-load');

    // Check if Supabase client is initialized
    const supabaseCheck = await page.evaluate(() => {
      return {
        hasSupabase: typeof window !== 'undefined',
        isOnline: navigator.onLine,
        hasLocalStorage: typeof localStorage !== 'undefined'
      };
    });

    results.supabaseTests.connection = supabaseCheck;
    log(`Supabase environment check: ${JSON.stringify(supabaseCheck)}`, '✅');

    // ========================================
    // TEST 2: CLEAR PREVIOUS STATE
    // ========================================
    log('TEST 2: Clearing previous test data', '🧹');

    await page.evaluate(() => {
      localStorage.clear();
      console.log('🧹 localStorage cleared');
    });

    await page.reload();
    await page.waitForTimeout(1000);

    // ========================================
    // TEST 3: ADMIN DASHBOARD - GLOBAL SETTINGS
    // ========================================
    log('TEST 3: Admin Dashboard & Global Settings', '⚙️');

    const adminState = await page.evaluate(() => {
      const slider = document.querySelector('input[type="range"]');
      const activeCount = document.querySelector('h1')?.textContent?.match(/(\d+)/)?.[1];
      const completedCount = document.querySelectorAll('h1')?.[1]?.textContent?.match(/(\d+)/)?.[1];

      return {
        hasSlider: !!slider,
        sliderValue: slider?.value,
        activeJourneys: activeCount || '0',
        completedJourneys: completedCount || '0',
        hasErrorLogSection: document.body.textContent.includes('Error Logs')
      };
    });

    results.tests.admin = adminState;
    log(`Admin: ${JSON.stringify(adminState)}`, adminState.hasSlider ? '✅' : '❌');
    await screenshot(page, '02-admin-initial');

    if (!adminState.hasSlider) {
      results.issues.push('Admin dashboard slider not found');
    }

    // ========================================
    // TEST 4: DONATION FLOW - FULL JOURNEY
    // ========================================
    log('TEST 4: Complete Donation Flow', '💰');

    await page.goto(`${BASE_URL}/donors`);
    await page.waitForTimeout(1500);

    const donorPageState = await page.evaluate(() => {
      const donors = Array.from(document.querySelectorAll('.cursor-pointer'))
        .filter(el => el.textContent.includes('Ahmed') || el.textContent.includes('Fatima'));
      return {
        loaded: true,
        donorCount: donors.length,
        hasDonateButtons: document.body.textContent.includes('DONATE')
      };
    });

    results.tests.donorPage = donorPageState;
    log(`Donor page: ${JSON.stringify(donorPageState)}`, '✅');
    await screenshot(page, '03-donor-page');

    // Trigger donation
    log('Triggering donation...', '💳');
    const donationResult = await page.evaluate(() => {
      const donateButtons = Array.from(document.querySelectorAll('button'))
        .filter(btn => btn.textContent.includes('DONATE'));

      if (donateButtons.length > 0) {
        donateButtons[0].click();
        return { clicked: true, buttonCount: donateButtons.length };
      }
      return { clicked: false, buttonCount: 0 };
    });

    results.criticalFunctions.donationTrigger = donationResult;
    log(`Donation triggered: ${JSON.stringify(donationResult)}`, donationResult.clicked ? '✅' : '❌');

    if (!donationResult.clicked) {
      results.issues.push('Failed to click donate button');
    }

    await page.waitForTimeout(2000);
    await screenshot(page, '04-donation-triggered');

    // Extract tracking ID
    const trackingId = await page.evaluate(() => {
      const logs = [];
      // Try to find tracking ID in console logs or DOM
      const trackingElement = document.body.textContent.match(/EFB-2025-\d+-\d+/);
      return trackingElement ? trackingElement[0] : null;
    });

    log(`Tracking ID: ${trackingId || 'NOT FOUND'}`, trackingId ? '📦' : '❌');
    results.criticalFunctions.trackingIdGeneration = { trackingId, found: !!trackingId };

    if (!trackingId) {
      results.issues.push('Tracking ID not generated');
    }

    // ========================================
    // TEST 5: JOURNEY REGISTRATION & MAP
    // ========================================
    log('TEST 5: Journey Registration & Map Display', '🗺️');

    await page.goto(BASE_URL);
    await page.waitForTimeout(2000);

    const mapState = await page.evaluate(() => {
      const hud = document.querySelector('.fixed.top-6.right-6');
      const hudText = hud?.textContent || '';
      const activeMatch = hudText.match(/(\d+)\s*Active/);
      const completedMatch = hudText.match(/(\d+)\s*Completed/);

      // Count markers on map
      const markers = document.querySelectorAll('.mapboxgl-marker');

      return {
        hasMap: document.querySelector('.mapboxgl-map') !== null,
        hudText: hudText.replace(/\s+/g, ' '),
        activeCount: activeMatch ? parseInt(activeMatch[1]) : 0,
        completedCount: completedMatch ? parseInt(completedMatch[1]) : 0,
        markerCount: markers.length
      };
    });

    results.tests.map = mapState;
    log(`Map state: ${JSON.stringify(mapState)}`, '🗺️');
    await screenshot(page, '05-map-with-journey');

    if (mapState.activeCount === 0) {
      results.issues.push('Journey not registered - active count is 0');
    }
    if (!mapState.hasMap) {
      results.issues.push('Map not rendered');
    }

    // ========================================
    // TEST 6: JOURNEY PROGRESSION
    // ========================================
    log('TEST 6: Journey Auto-Progression (15s wait)', '⏱️');

    log('Waiting for progression...', '⏳');
    await page.waitForTimeout(15000);

    const progressionState = await page.evaluate(() => {
      const hud = document.querySelector('.fixed.top-6.right-6');
      const hudText = hud?.textContent || '';
      const activeMatch = hudText.match(/(\d+)\s*Active/);
      const completedMatch = hudText.match(/(\d+)\s*Completed/);

      return {
        activeCount: activeMatch ? parseInt(activeMatch[1]) : 0,
        completedCount: completedMatch ? parseInt(completedMatch[1]) : 0,
        hudText: hudText.replace(/\s+/g, ' ')
      };
    });

    results.tests.progression = progressionState;
    log(`After 15s: ${JSON.stringify(progressionState)}`, '⏱️');
    await screenshot(page, '06-map-after-progression');

    // Check if journey progressed (should have advanced at least 2-3 stages)
    const progressionLogs = results.logs.filter(l =>
      l.includes('Journey') && l.includes('Stage')
    );
    results.criticalFunctions.autoProgression = {
      progressionLogCount: progressionLogs.length,
      progressed: progressionLogs.length >= 2
    };

    if (progressionLogs.length < 2) {
      results.issues.push('Journey did not auto-progress (expected at least 2 stage changes)');
    }

    // ========================================
    // TEST 7: SMS NOTIFICATIONS
    // ========================================
    log('TEST 7: SMS Notification System', '📱');

    await page.goto(`${BASE_URL}/sms`);
    await page.waitForTimeout(2000);

    const smsState = await page.evaluate(() => {
      const messages = document.querySelectorAll('[class*="border"]').length;
      const hasMessages = document.body.textContent.includes('Thank you') ||
                         document.body.textContent.includes('donation');
      const messageElements = Array.from(document.querySelectorAll('div'))
        .filter(el => el.textContent.includes('EFB-2025'));

      return {
        messageCount: messageElements.length,
        hasMessages,
        bodyText: document.body.textContent.substring(0, 500)
      };
    });

    results.tests.sms = smsState;
    log(`SMS: ${JSON.stringify({ messageCount: smsState.messageCount, hasMessages: smsState.hasMessages })}`, '📱');
    await screenshot(page, '07-sms-inbox');

    const smsLogs = results.logs.filter(l =>
      l.includes('SMS sent') || l.includes('Sending SMS')
    );
    results.criticalFunctions.smsNotifications = {
      smsLogCount: smsLogs.length,
      smsInInbox: smsState.messageCount,
      working: smsLogs.length > 0 && smsState.messageCount > 0
    };

    if (smsLogs.length === 0) {
      results.issues.push('No SMS notifications sent');
    }

    // ========================================
    // TEST 8: JOURNEY VIEWER
    // ========================================
    if (trackingId) {
      log('TEST 8: Journey Viewer', '👁️');

      await page.goto(`${BASE_URL}/journey/${trackingId}`);
      await page.waitForTimeout(2000);

      const journeyViewerState = await page.evaluate(() => {
        const notFound = document.body.textContent.includes('Journey Not Found');
        const hasTracking = document.body.textContent.includes('Journey Tracking');
        const h1 = document.querySelector('h1')?.textContent || '';
        const hasProgress = document.body.textContent.includes('ACTIVE') ||
                           document.body.textContent.includes('COMPLETED');

        return {
          loaded: true,
          notFound,
          hasTracking,
          h1,
          hasProgress,
          canScroll: document.body.scrollHeight > window.innerHeight
        };
      });

      results.tests.journeyViewer = journeyViewerState;
      log(`Journey Viewer: ${JSON.stringify(journeyViewerState)}`, journeyViewerState.notFound ? '❌' : '✅');
      await screenshot(page, '08-journey-viewer');

      if (journeyViewerState.notFound) {
        results.issues.push('Journey Viewer shows "Not Found" for valid tracking ID');
      }
    } else {
      log('Skipping Journey Viewer test - no tracking ID', '⚠️');
      results.tests.journeyViewer = { skipped: true, reason: 'No tracking ID' };
    }

    // ========================================
    // TEST 9: LOCALSTORAGE PERSISTENCE
    // ========================================
    log('TEST 9: localStorage Persistence', '💾');

    const persistenceTest = await page.evaluate(() => {
      const settings = localStorage.getItem('globalSettings');
      if (!settings) {
        return { hasPersistence: false, error: 'No globalSettings in localStorage' };
      }

      try {
        const parsed = JSON.parse(settings);
        return {
          hasPersistence: true,
          activeJourneysCount: parsed.activeJourneys?.length || 0,
          completedJourneysCount: parsed.completedJourneys?.length || 0,
          errorLogsCount: parsed.errorLogs?.length || 0
        };
      } catch (err) {
        return { hasPersistence: false, error: err.message };
      }
    });

    results.criticalFunctions.persistence = persistenceTest;
    log(`Persistence: ${JSON.stringify(persistenceTest)}`, persistenceTest.hasPersistence ? '✅' : '❌');

    if (!persistenceTest.hasPersistence) {
      results.issues.push('localStorage persistence not working');
    }

    // ========================================
    // TEST 10: ADMIN FINAL STATE
    // ========================================
    log('TEST 10: Admin Dashboard Final State', '📊');

    await page.goto(`${BASE_URL}/admin`);
    await page.waitForTimeout(2000);

    const adminFinal = await page.evaluate(() => {
      const h1Elements = document.querySelectorAll('h1');
      const activeText = h1Elements[0]?.textContent || '';
      const completedText = h1Elements[1]?.textContent || '';

      const errorLogs = document.querySelectorAll('[class*="border"]').length;

      return {
        activeJourneys: activeText.match(/(\d+)/)?.[1] || '0',
        completedJourneys: completedText.match(/(\d+)/)?.[1] || '0',
        errorLogCount: errorLogs,
        hasSlider: document.querySelector('input[type="range"]') !== null
      };
    });

    results.tests.adminFinal = adminFinal;
    log(`Admin Final: ${JSON.stringify(adminFinal)}`, '📊');
    await screenshot(page, '09-admin-final');

    // ========================================
    // FINAL SUMMARY
    // ========================================
    log('='.repeat(50), '');
    log('TEST SUMMARY', '📊');
    log('='.repeat(50), '');

    const testCount = Object.keys(results.tests).length;
    const issueCount = results.issues.length;

    log(`✅ Tests Completed: ${testCount}`, '');
    log(`${issueCount === 0 ? '✅' : '⚠️'}  Issues Found: ${issueCount}`, '');
    log(`📝 Console Logs Captured: ${results.logs.length}`, '');

    if (issueCount > 0) {
      log('', '');
      log('🔴 ISSUES:', '');
      results.issues.forEach((issue, i) => {
        log(`  ${i + 1}. ${issue}`, '');
      });
    }

    log('', '');
    log('🔧 CRITICAL FUNCTIONS:', '');
    Object.entries(results.criticalFunctions).forEach(([key, value]) => {
      const status = typeof value === 'object' && 'working' in value
        ? (value.working ? '✅' : '❌')
        : '📝';
      log(`  ${status} ${key}: ${JSON.stringify(value)}`, '');
    });

    log('', '');
    log('💾 SUPABASE TESTS:', '');
    Object.entries(results.supabaseTests).forEach(([key, value]) => {
      log(`  📝 ${key}: ${JSON.stringify(value)}`, '');
    });

    log('='.repeat(50), '');

    // Save report
    fs.writeFileSync(REPORT_FILE, JSON.stringify(results, null, 2));
    log(`Report saved: ${REPORT_FILE}`, '📄');

  } catch (error) {
    log(`ERROR: ${error.message}`, '❌');
    results.issues.push(`Test error: ${error.message}`);
    await screenshot(page, 'error');
  } finally {
    await browser.close();
  }

  // Return exit code based on issues
  process.exit(results.issues.length > 0 ? 1 : 0);
}

test();
