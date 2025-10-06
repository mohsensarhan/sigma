import puppeteer from 'puppeteer';

async function debugDonationButton() {
  console.log('🔍 Debugging donation button issue...\n');

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--window-size=1400,900'],
    devtools: true
  });

  const page = await browser.newPage();

  // Capture all console messages
  const consoleLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push(text);
    console.log(`[Browser Console] ${text}`);
  });

  // Capture errors
  page.on('pageerror', error => {
    console.error(`❌ [Page Error] ${error.message}`);
  });

  // Capture failed requests
  page.on('requestfailed', request => {
    console.error(`❌ [Request Failed] ${request.url()}`);
  });

  try {
    console.log('1️⃣ Navigating to http://localhost:5175/donors\n');
    await page.goto('http://localhost:5175/donors', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    console.log('✅ Page loaded successfully\n');

    // Take screenshot
    await page.screenshot({ path: 'test-results/donors-page.png' });
    console.log('📸 Screenshot saved: test-results/donors-page.png\n');

    // Wait for donor cards to load
    console.log('2️⃣ Waiting for donor cards to appear...\n');
    await page.waitForSelector('button', { timeout: 10000 });

    // Count buttons
    const buttonCount = await page.$$eval('button', btns => btns.length);
    console.log(`✅ Found ${buttonCount} buttons on page\n`);

    // Find donate buttons
    const donateButtons = await page.$$('button');
    const buttonTexts = await Promise.all(
      donateButtons.map(btn => btn.evaluate(el => el.textContent))
    );

    console.log('📋 Button texts found:');
    buttonTexts.forEach((text, i) => console.log(`   ${i + 1}. ${text.trim()}`));
    console.log();

    // Find first DONATE button
    const donateButtonIndex = buttonTexts.findIndex(text => text.includes('DONATE'));

    if (donateButtonIndex === -1) {
      console.error('❌ No DONATE button found!');
      console.log('\n🔍 Current page HTML (first 1000 chars):');
      const html = await page.content();
      console.log(html.substring(0, 1000));
      return;
    }

    console.log(`3️⃣ Found DONATE button at index ${donateButtonIndex}\n`);
    console.log('4️⃣ Clicking DONATE button...\n');

    const donateButton = donateButtons[donateButtonIndex];

    // Check if button is enabled
    const isDisabled = await donateButton.evaluate(el => el.disabled);
    console.log(`   Button disabled: ${isDisabled}`);

    if (isDisabled) {
      console.log('⚠️  Button is disabled! Checking why...');
      const className = await donateButton.evaluate(el => el.className);
      console.log(`   Button classes: ${className}`);
    }

    // Click button
    await donateButton.click();
    console.log('✅ Button clicked!\n');

    // Wait for processing
    console.log('5️⃣ Waiting for donation to process...\n');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Check button state after click
    const buttonTextAfter = await donateButton.evaluate(el => el.textContent);
    console.log(`   Button text after click: "${buttonTextAfter.trim()}"\n`);

    // Take screenshot after donation
    await page.screenshot({ path: 'test-results/after-donation.png' });
    console.log('📸 Screenshot saved: test-results/after-donation.png\n');

    // Check for Track Journey button
    const hasTrackButton = await page.evaluate(() => {
      return !!Array.from(document.querySelectorAll('button'))
        .find(btn => btn.textContent.includes('Track Journey'));
    });

    if (hasTrackButton) {
      console.log('✅ Track Journey button appeared!\n');
    } else {
      console.log('⚠️  No Track Journey button found\n');
    }

    // Wait to see final state
    console.log('⏱️  Waiting 5 seconds to observe final state...\n');
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('\n📊 Summary of console logs:');
    const relevantLogs = consoleLogs.filter(log =>
      log.includes('Supabase') ||
      log.includes('Donation') ||
      log.includes('Journey') ||
      log.includes('error') ||
      log.includes('Error')
    );

    if (relevantLogs.length === 0) {
      console.log('   No relevant logs found');
    } else {
      relevantLogs.slice(-10).forEach(log => console.log(`   - ${log}`));
    }

    console.log('\n✅ Test complete! Browser will stay open for manual inspection.');
    console.log('Press Ctrl+C to close when done.\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    await page.screenshot({ path: 'test-results/error-state.png' });
    console.log('📸 Error screenshot saved\n');
  }
}

debugDonationButton();
