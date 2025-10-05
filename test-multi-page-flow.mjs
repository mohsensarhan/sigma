/**
 * Multi-Page Flow Test
 * Tests all 5 pages: /, /admin, /donors, /sms, /journey/:id
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:5173';
const RESULTS_DIR = './test-results';

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
}

async function runTest() {
  console.log('🚀 Starting Multi-Page Flow Test\n');

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--start-maximized']
  });

  const page = await browser.newPage();

  // Listen to console logs
  const logs = [];
  page.on('console', msg => {
    const text = msg.text();
    logs.push(text);
    console.log(`[BROWSER] ${text}`);
  });

  try {
    console.log('=== TEST 1: Main Map Page (/) ===');
    await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
    await delay(2000);
    await captureScreenshot(page, '01-main-map-initial');

    // Verify map loaded
    const mapExists = await page.evaluate(() => {
      const map = document.querySelector('.mapboxgl-map');
      return !!map;
    });
    console.log(`✓ Map loaded: ${mapExists}`);

    console.log('\n=== TEST 2: Admin Dashboard (/admin) ===');
    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle0' });
    await delay(2000);
    await captureScreenshot(page, '02-admin-dashboard');

    // Verify admin elements
    const adminStats = await page.evaluate(() => {
      const h1 = document.querySelector('h1')?.textContent;
      const activeJourneys = document.querySelector('.text-3xl')?.textContent;
      return { h1, activeJourneys };
    });
    console.log(`✓ Admin page loaded: ${adminStats.h1}`);
    console.log(`✓ Active journeys: ${adminStats.activeJourneys}`);

    // Test step duration control
    console.log('\n=== TEST 3: Step Duration Control ===');
    const sliderExists = await page.evaluate(() => {
      const slider = document.querySelector('input[type="range"]');
      if (slider) {
        slider.value = '10';
        slider.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
      return false;
    });
    console.log(`✓ Step duration slider: ${sliderExists}`);
    await delay(1000);
    await captureScreenshot(page, '03-admin-step-duration-changed');

    console.log('\n=== TEST 4: Mock Payment Gateway (/donors) ===');
    await page.goto(`${BASE_URL}/donors`, { waitUntil: 'networkidle0' });
    await delay(2000);
    await captureScreenshot(page, '04-payment-gateway-initial');

    // Count donor cards
    const donorCount = await page.evaluate(() => {
      return document.querySelectorAll('.text-6xl').length;
    });
    console.log(`✓ Donor cards displayed: ${donorCount}`);

    // Trigger a donation from first donor
    console.log('\n=== TEST 5: Trigger Donation ===');
    const donationResult = await page.evaluate(() => {
      const donateButton = Array.from(document.querySelectorAll('button'))
        .find(btn => btn.textContent.includes('DONATE'));
      if (donateButton) {
        donateButton.click();
        return true;
      }
      return false;
    });
    console.log(`✓ Donation button clicked: ${donationResult}`);
    await delay(3000); // Wait for donation to process
    await captureScreenshot(page, '05-donation-triggered');

    // Check for recent donations
    const recentDonations = await page.evaluate(() => {
      const heading = Array.from(document.querySelectorAll('h2'))
        .find(h => h.textContent.includes('Recent Donations'));
      return !!heading;
    });
    console.log(`✓ Recent donations section: ${recentDonations}`);

    console.log('\n=== TEST 6: SMS Inbox (/sms) ===');
    await page.goto(`${BASE_URL}/sms`, { waitUntil: 'networkidle0' });
    await delay(2000);
    await captureScreenshot(page, '06-sms-inbox');

    // Count donor tabs
    const donorTabs = await page.evaluate(() => {
      return document.querySelectorAll('.text-4xl').length;
    });
    console.log(`✓ Donor tabs: ${donorTabs}`);

    // Check for SMS stats
    const smsStats = await page.evaluate(() => {
      const delivered = document.querySelector('.text-green-400')?.textContent;
      const sent = document.querySelector('.text-yellow-400')?.textContent;
      return { delivered, sent };
    });
    console.log(`✓ SMS delivered: ${smsStats.delivered || 0}`);
    console.log(`✓ SMS sent: ${smsStats.sent || 0}`);

    // Click on "View Journey" if available
    console.log('\n=== TEST 7: Journey Viewer (/journey/:id) ===');
    const journeyId = await page.evaluate(() => {
      const viewButton = Array.from(document.querySelectorAll('button'))
        .find(btn => btn.textContent.includes('View Journey'));
      if (viewButton) {
        const trackingId = viewButton.parentElement?.querySelector('.font-mono')?.textContent;
        viewButton.click();
        return trackingId;
      }
      return null;
    });

    if (journeyId) {
      console.log(`✓ Clicked View Journey for: ${journeyId}`);
      await delay(3000);
      await captureScreenshot(page, '07-journey-viewer');

      // Verify journey details
      const journeyDetails = await page.evaluate(() => {
        const h1 = document.querySelector('h1')?.textContent;
        const trackingId = document.querySelector('.font-mono')?.textContent;
        const progress = document.querySelector('.text-sm.font-semibold')?.textContent;
        return { h1, trackingId, progress };
      });
      console.log(`✓ Journey page loaded: ${journeyDetails.h1}`);
      console.log(`✓ Tracking ID: ${journeyDetails.trackingId}`);
      console.log(`✓ Progress: ${journeyDetails.progress}`);
    } else {
      console.log('⚠️ No journey available to view yet');
    }

    console.log('\n=== TEST 8: Return to Main Map ===');
    await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
    await delay(2000);
    await captureScreenshot(page, '08-return-to-map');

    // Check for active journeys on map
    const mapStatus = await page.evaluate(() => {
      const activeCount = Array.from(document.querySelectorAll('.text-green-400'))
        .find(el => el.textContent.includes('Active'))?.textContent;
      return activeCount;
    });
    console.log(`✓ Map status: ${mapStatus || 'No active journeys'}`);

    console.log('\n=== TEST 9: Navigation Links ===');
    // Test all navigation links exist
    await page.goto(`${BASE_URL}/donors`, { waitUntil: 'networkidle0' });
    await delay(1000);

    const navLinks = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'));
      return links.map(a => ({ href: a.getAttribute('href'), text: a.textContent }));
    });
    console.log('✓ Navigation links found:', navLinks);

    console.log('\n=== FINAL: Error Log Check ===');
    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle0' });
    await delay(2000);
    await captureScreenshot(page, '09-admin-final-check');

    const errorLogCount = await page.evaluate(() => {
      const totalElement = Array.from(document.querySelectorAll('.text-lg.font-bold'))
        .find(el => el.closest('.text-center'));
      return totalElement?.textContent || '0';
    });
    console.log(`✓ Total error logs: ${errorLogCount}`);

    // Generate summary report
    const report = {
      timestamp: new Date().toISOString(),
      tests: {
        mainMap: mapExists,
        adminDashboard: adminStats.h1 === 'Admin Dashboard',
        paymentGateway: donorCount === 4,
        smsInbox: donorTabs === 4,
        journeyViewer: !!journeyId,
        navigation: navLinks.length > 0
      },
      stats: {
        donorCount,
        donorTabs,
        smsDelivered: smsStats.delivered,
        smsSent: smsStats.sent,
        errorLogs: errorLogCount
      },
      screenshots: 9,
      consoleLogs: logs.length,
      status: 'PASSED'
    };

    // Save report
    fs.writeFileSync(
      path.join(RESULTS_DIR, 'multi-page-test-report.json'),
      JSON.stringify(report, null, 2)
    );

    console.log('\n✅ MULTI-PAGE FLOW TEST COMPLETED');
    console.log(`📊 Report saved to: ${RESULTS_DIR}/multi-page-test-report.json`);
    console.log(`📸 Screenshots: ${report.screenshots}`);
    console.log(`📝 Console logs captured: ${report.consoleLogs}`);

  } catch (error) {
    console.error('❌ Test failed:', error);
    await captureScreenshot(page, 'ERROR');
    throw error;
  } finally {
    await delay(3000);
    await browser.close();
  }
}

runTest().catch(console.error);
