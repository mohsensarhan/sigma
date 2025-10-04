import puppeteer from 'puppeteer';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testAdminPanel() {
  console.log('🚀 Starting comprehensive admin panel test...');
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1920, height: 1080 }
  });

  const page = await browser.newPage();

  try {
    console.log('📱 Navigating to http://localhost:5177...');
    await page.goto('http://localhost:5177', {
      waitUntil: 'networkidle2',
      timeout: 10000
    });

    console.log('✅ Page loaded successfully');

    // Wait for map to load
    await page.waitForSelector('canvas', { timeout: 10000 });
    console.log('✅ Map canvas found');

    // Take initial screenshot
    await page.screenshot({ path: 'test-results/step1-initial.png' });
    console.log('📸 Initial state captured');

    // Look for admin panel notch
    console.log('🔍 Looking for admin panel notch...');
    await sleep(2000);

    // Click on the left edge to open admin panel
    await page.mouse.click(10, 500);
    await sleep(1000);

    console.log('📸 Admin panel should be open now');
    await page.screenshot({ path: 'test-results/step2-admin-open.png' });

    // Look for the General Donation button
    console.log('🔍 Looking for General Donation button...');
    const buttons = await page.$$('button');
    console.log(`Found ${buttons.length} buttons on page`);

    // Find and click General Donation button
    let foundGeneralButton = false;
    for (const button of buttons) {
      const text = await page.evaluate(el => el.textContent, button);
      if (text && text.includes('General Donation')) {
        console.log('✅ Found General Donation button');
        foundGeneralButton = true;

        // Click the button
        await button.click();
        console.log('🎯 Clicked General Donation button');
        await sleep(1000);

        await page.screenshot({ path: 'test-results/step3-donation-triggered.png' });
        break;
      }
    }

    if (!foundGeneralButton) {
      console.warn('⚠️  General Donation button not found');
    }

    // Watch the journey progress for 30 seconds
    console.log('⏱️  Watching journey progression for 30 seconds...');

    for (let i = 1; i <= 6; i++) {
      await sleep(5000);
      await page.screenshot({ path: `test-results/step4-progress-${i*5}s.png` });
      console.log(`📸 Screenshot at ${i*5}s`);
    }

    console.log('✅ All tests completed successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: 'test-results/error-state.png' });
    console.log('📸 Error screenshot saved');
  } finally {
    console.log('🏁 Closing browser...');
    await browser.close();
  }
}

testAdminPanel();
