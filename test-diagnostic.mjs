/**
 * Diagnostic Test - Check actual browser behavior
 */

import puppeteer from 'puppeteer';

const BASE_URL = 'http://localhost:5173';

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runDiagnostic() {
  console.log('🔍 Running Diagnostic Test\n');

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--start-maximized']
  });

  const page = await browser.newPage();

  // Capture all console messages
  page.on('console', msg => {
    console.log(`[BROWSER] ${msg.type()}: ${msg.text()}`);
  });

  // Capture all errors
  page.on('pageerror', error => {
    console.error(`[PAGE ERROR] ${error.message}`);
  });

  page.on('requestfailed', request => {
    console.error(`[REQUEST FAILED] ${request.url()}: ${request.failure().errorText}`);
  });

  try {
    console.log('=== TEST 1: Admin Dashboard ===');
    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle0' });
    await delay(3000);

    const adminCheck = await page.evaluate(() => {
      const h1 = document.querySelector('h1')?.textContent;
      const body = document.body;
      const hasScroll = body.scrollHeight > body.clientHeight;
      const overflow = window.getComputedStyle(body).overflow;
      const overflowY = window.getComputedStyle(body).overflowY;

      return {
        h1,
        hasScroll,
        overflow,
        overflowY,
        scrollHeight: body.scrollHeight,
        clientHeight: body.clientHeight,
        canScroll: body.scrollHeight > body.clientHeight
      };
    });

    console.log('Admin Page Check:', adminCheck);

    console.log('\n=== TEST 2: Payment Gateway ===');
    await page.goto(`${BASE_URL}/donors`, { waitUntil: 'networkidle0' });
    await delay(3000);

    const donorsCheck = await page.evaluate(() => {
      const h1 = document.querySelector('h1')?.textContent;
      const donateButtons = document.querySelectorAll('button');
      const donors = document.querySelectorAll('.text-6xl');

      return {
        h1,
        donateButtonCount: donateButtons.length,
        donorCount: donors.length,
        firstButton: Array.from(donateButtons).find(b => b.textContent.includes('DONATE'))?.textContent
      };
    });

    console.log('Donors Page Check:', donorsCheck);

    // Try to trigger a donation
    console.log('\n=== TEST 3: Trigger Donation ===');
    const donationResult = await page.evaluate(() => {
      const donateButton = Array.from(document.querySelectorAll('button'))
        .find(btn => btn.textContent.includes('DONATE'));

      if (!donateButton) {
        return { error: 'No DONATE button found' };
      }

      donateButton.click();
      return { clicked: true };
    });

    console.log('Donation Result:', donationResult);
    await delay(5000); // Wait for journey creation

    // Check if journey was registered
    const journeyCheck = await page.evaluate(() => {
      const recentDonations = document.querySelectorAll('.font-mono.text-sm');
      return {
        recentDonationsCount: recentDonations.length,
        firstTracking: recentDonations[0]?.textContent
      };
    });

    console.log('Journey Check:', journeyCheck);

    console.log('\n=== TEST 4: Check Map ===');
    await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
    await delay(3000);

    const mapCheck = await page.evaluate(() => {
      const mapElement = document.querySelector('.mapboxgl-map');
      const hudElement = document.querySelector('.fixed.top-6.right-6');
      const activeCount = hudElement?.textContent;

      return {
        hasMap: !!mapElement,
        hudText: activeCount,
        mapClass: mapElement?.className
      };
    });

    console.log('Map Check:', mapCheck);

    console.log('\n=== TEST 5: Check SMS Inbox ===');
    await page.goto(`${BASE_URL}/sms`, { waitUntil: 'networkidle0' });
    await delay(3000);

    const smsCheck = await page.evaluate(() => {
      const h1 = document.querySelector('h1')?.textContent;
      const tabs = document.querySelectorAll('.text-4xl');
      const messages = document.querySelectorAll('.bg-gray-800\\/50');

      return {
        h1,
        tabCount: tabs.length,
        messageCount: messages.length
      };
    });

    console.log('SMS Check:', smsCheck);

    console.log('\n=== Keeping browser open for 10 seconds for manual inspection ===');
    await delay(10000);

  } catch (error) {
    console.error('❌ Diagnostic failed:', error);
  } finally {
    await browser.close();
  }
}

runDiagnostic().catch(console.error);
