import puppeteer from 'puppeteer';

async function testApp() {
  console.log('🚀 Starting browser...');
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  console.log('📱 Navigating to http://localhost:5178...');

  try {
    await page.goto('http://localhost:5178', {
      waitUntil: 'networkidle2',
      timeout: 10000
    });

    console.log('✅ Page loaded successfully');

    // Wait for map to load
    await page.waitForSelector('canvas', { timeout: 10000 });
    console.log('✅ Map canvas found');

    // Check for waypoint markers
    const markers = await page.$$('[class*="marker"]');
    console.log(`✅ Found ${markers.length} markers on map`);

    // Take screenshot
    await page.screenshot({ path: 'test-results/current-state.png', fullPage: true });
    console.log('📸 Screenshot saved to test-results/current-state.png');

    // Keep browser open for 10 seconds for visual inspection
    console.log('⏳ Keeping browser open for 10 seconds...');
    await new Promise(resolve => setTimeout(resolve, 10000));

  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: 'test-results/error-state.png' });
    console.log('📸 Error screenshot saved');
  } finally {
    await browser.close();
    console.log('🏁 Test complete');
  }
}

testApp();
