import puppeteer from 'puppeteer';

async function testButtonVisual() {
  console.log('🎬 Testing donation button visual states...\n');

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--window-size=1400,900']
  });

  const page = await browser.newPage();

  try {
    console.log('1️⃣ Loading page...');
    await page.goto('http://localhost:5175/donors', { waitUntil: 'networkidle0' });
    await page.waitForSelector('button:has-text("DONATE")');
    console.log('✅ Page loaded\n');

    console.log('2️⃣ Taking screenshot: BEFORE donation');
    await page.screenshot({ path: 'test-results/button-before.png', fullPage: true });
    console.log('   📸 Saved: test-results/button-before.png\n');

    console.log('3️⃣ Clicking DONATE button...');
    const donateBtn = await page.$('button:has-text("DONATE")');
    await donateBtn.click();
    console.log('✅ Clicked\n');

    console.log('4️⃣ Waiting 500ms for processing state...');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-results/button-processing.png', fullPage: true });
    console.log('   📸 Saved: test-results/button-processing.png\n');

    console.log('5️⃣ Waiting 3s for success state...');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test-results/button-success.png', fullPage: true });
    console.log('   📸 Saved: test-results/button-success.png\n');

    // Check for Track Journey button
    const trackBtn = await page.$('button:has-text("Track Journey")');
    if (trackBtn) {
      console.log('✅ Track Journey button appeared!\n');

      console.log('6️⃣ Clicking Track Journey...');
      await trackBtn.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'test-results/journey-viewer.png', fullPage: true });
      console.log('   📸 Saved: test-results/journey-viewer.png\n');

      const url = page.url();
      console.log(`✅ Navigated to: ${url}\n`);
    } else {
      console.log('❌ Track Journey button NOT found\n');
    }

    console.log('✅ Test complete! Check test-results/ folder for screenshots.');
    console.log('\nScreenshots created:');
    console.log('  - button-before.png (Initial state)');
    console.log('  - button-processing.png (Processing state)');
    console.log('  - button-success.png (Success state with Track Journey button)');
    console.log('  - journey-viewer.png (Journey viewer page)\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

testButtonVisual();
