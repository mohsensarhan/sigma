/**
 * Current State E2E Test
 * Tests the complete flow to identify what's working and what's broken
 */

import puppeteer from 'puppeteer';
import fs from 'fs';

const BASE_URL = 'http://localhost:5173';
const RESULTS_DIR = './test-results/current-state';

if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function screenshot(page, name) {
  await page.screenshot({ path: `${RESULTS_DIR}/${name}.png`, fullPage: true });
  console.log(`📸 ${name}`);
}

async function runTest() {
  console.log('🔍 CURRENT STATE E2E TEST\n');

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--start-maximized']
  });

  const page = await browser.newPage();
  const logs = [];
  const errors = [];

  page.on('console', msg => {
    const text = msg.text();
    logs.push(text);
    if (text.includes('Journey') || text.includes('SMS') || text.includes('ERROR') || text.includes('Donation')) {
      console.log(`  💬 ${text}`);
    }
  });

  page.on('pageerror', err => {
    errors.push(err.message);
    console.error(`  ❌ ${err.message}`);
  });

  const results = {
    timestamp: new Date().toISOString(),
    tests: {},
    issues: [],
    logs: [],
    errors: []
  };

  try {
    // TEST 1: Admin Dashboard - Set step duration
    console.log('\n1️⃣ ADMIN DASHBOARD');
    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle0' });
    await delay(2000);

    const adminCheck = await page.evaluate(() => {
      const h1 = document.querySelector('h1')?.textContent;
      const slider = document.querySelector('input[type="range"]');
      const canScroll = document.body.scrollHeight > document.body.clientHeight;

      if (slider) {
        slider.value = '3'; // Set to 3 seconds
        slider.dispatchEvent(new Event('change', { bubbles: true }));
      }

      return {
        loaded: h1 === 'Admin Dashboard',
        hasSlider: !!slider,
        canScroll,
        sliderValue: slider?.value
      };
    });

    console.log(`   Admin: ${JSON.stringify(adminCheck)}`);
    results.tests.admin = adminCheck;
    await screenshot(page, '01-admin');

    // TEST 2: Payment Gateway - Trigger Donation
    console.log('\n2️⃣ PAYMENT GATEWAY');
    await page.goto(`${BASE_URL}/donors`, { waitUntil: 'networkidle0' });
    await delay(2000);

    const donorsCheck = await page.evaluate(() => {
      const h1 = document.querySelector('h1')?.textContent;
      const donors = document.querySelectorAll('.text-6xl');
      const donateButton = Array.from(document.querySelectorAll('button'))
        .find(b => b.textContent?.includes('DONATE'));

      if (donateButton) {
        donateButton.click();
      }

      return {
        loaded: h1 === 'Mock Payment Gateway',
        donorCount: donors.length,
        buttonClicked: !!donateButton
      };
    });

    console.log(`   Donors: ${JSON.stringify(donorsCheck)}`);
    results.tests.donors = donorsCheck;
    await delay(4000); // Wait for journey creation
    await screenshot(page, '02-donation-triggered');

    // Get tracking ID
    const trackingId = await page.evaluate(() => {
      return document.querySelector('.font-mono.text-sm.text-purple-400')?.textContent;
    });
    console.log(`   📦 Tracking ID: ${trackingId}`);
    results.trackingId = trackingId;

    // TEST 3: Main Map - Check journey display
    console.log('\n3️⃣ MAIN MAP');
    await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
    await delay(3000);

    const mapCheck = await page.evaluate(() => {
      const hud = document.querySelector('.fixed.top-6.right-6');
      const text = hud?.textContent || '';
      const activeMatch = text.match(/(\d+)\s*Active/);
      const markers = document.querySelectorAll('[class*="mapboxgl-marker"]');

      return {
        hasMap: !!document.querySelector('.mapboxgl-map'),
        hudText: text,
        activeCount: activeMatch ? parseInt(activeMatch[1]) : 0,
        markerCount: markers.length
      };
    });

    console.log(`   Map: ${JSON.stringify(mapCheck)}`);
    results.tests.map = mapCheck;

    if (mapCheck.activeCount === 0) {
      results.issues.push('Journey not showing on map - activeCount is 0');
    }

    await screenshot(page, '03-map-initial');

    // TEST 4: Wait and check progression
    console.log('\n4️⃣ JOURNEY PROGRESSION (waiting 10s)');
    await delay(10000);
    await screenshot(page, '04-map-after-10s');

    const mapCheck2 = await page.evaluate(() => {
      const hud = document.querySelector('.fixed.top-6.right-6');
      const text = hud?.textContent || '';
      return { hudText: text };
    });
    console.log(`   Map after 10s: ${JSON.stringify(mapCheck2)}`);

    // TEST 5: SMS Inbox
    console.log('\n5️⃣ SMS INBOX');
    await page.goto(`${BASE_URL}/sms`, { waitUntil: 'networkidle0' });
    await delay(2000);

    const smsCheck = await page.evaluate(() => {
      const messages = document.querySelectorAll('.bg-gray-800\\/50');
      const stats = {
        delivered: document.querySelector('.text-green-400')?.textContent || '0',
        sent: document.querySelector('.text-yellow-400')?.textContent || '0'
      };

      return {
        messageCount: messages.length,
        stats,
        canScroll: document.body.scrollHeight > document.body.clientHeight
      };
    });

    console.log(`   SMS: ${JSON.stringify(smsCheck)}`);
    results.tests.sms = smsCheck;

    if (smsCheck.messageCount === 0) {
      results.issues.push('No SMS messages displayed');
    }

    await screenshot(page, '05-sms-inbox');

    // TEST 6: Journey Viewer
    if (trackingId) {
      console.log('\n6️⃣ JOURNEY VIEWER');
      await page.goto(`${BASE_URL}/journey/${trackingId}`, { waitUntil: 'networkidle0' });
      await delay(2000);

      const journeyCheck = await page.evaluate(() => {
        const h1 = document.querySelector('h1')?.textContent;
        const notFound = h1?.includes('Not Found');
        const progress = document.querySelector('.text-sm.font-semibold')?.textContent;

        return {
          loaded: !!h1,
          notFound,
          h1,
          progress,
          canScroll: document.body.scrollHeight > document.body.clientHeight
        };
      });

      console.log(`   Journey: ${JSON.stringify(journeyCheck)}`);
      results.tests.journeyViewer = journeyCheck;

      if (journeyCheck.notFound) {
        results.issues.push('Journey Viewer shows "Not Found"');
      }

      await screenshot(page, '06-journey-viewer');
    }

    // TEST 7: Return to admin and check stats
    console.log('\n7️⃣ ADMIN FINAL CHECK');
    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle0' });
    await delay(2000);

    const adminFinal = await page.evaluate(() => {
      const stats = document.querySelectorAll('.text-3xl.font-bold');
      const errorLogs = document.querySelectorAll('.p-3.rounded-lg.border');

      return {
        active: stats[0]?.textContent || '0',
        completed: stats[1]?.textContent || '0',
        total: stats[2]?.textContent || '0',
        errorLogCount: errorLogs.length
      };
    });

    console.log(`   Admin Stats: ${JSON.stringify(adminFinal)}`);
    results.tests.adminFinal = adminFinal;
    await screenshot(page, '07-admin-final');

    // Compile results
    results.logs = logs.filter(l =>
      l.includes('Journey') || l.includes('SMS') || l.includes('Donation') || l.includes('Stage')
    );
    results.errors = errors;

    console.log('\n═══════════════════════════════════');
    console.log('📊 TEST SUMMARY');
    console.log('═══════════════════════════════════');
    console.log(`✅ Tests Completed: ${Object.keys(results.tests).length}`);
    console.log(`⚠️  Issues Found: ${results.issues.length}`);
    console.log(`📝 Relevant Logs: ${results.logs.length}`);
    console.log(`❌ Errors: ${results.errors.length}`);

    if (results.issues.length > 0) {
      console.log('\n🔴 ISSUES:');
      results.issues.forEach((issue, i) => {
        console.log(`  ${i+1}. ${issue}`);
      });
    }

    // Save report
    fs.writeFileSync(
      `${RESULTS_DIR}/report.json`,
      JSON.stringify(results, null, 2)
    );

    console.log(`\n📄 Report saved: ${RESULTS_DIR}/report.json`);
    console.log('═══════════════════════════════════\n');

  } catch (error) {
    console.error('💥 TEST FAILED:', error);
    results.criticalError = error.message;
    await screenshot(page, 'ERROR');
  } finally {
    await delay(3000);
    await browser.close();
  }

  return results;
}

runTest().then(results => {
  if (results.issues.length > 0 || results.errors.length > 0) {
    process.exit(1);
  }
}).catch(err => {
  console.error(err);
  process.exit(1);
});
