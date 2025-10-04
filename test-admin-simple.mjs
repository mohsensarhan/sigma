import puppeteer from 'puppeteer';

async function testAdminSimple() {
  console.log('🚀 Starting simple admin test...');
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  try {
    await page.goto('http://localhost:5178', {
      waitUntil: 'networkidle2',
      timeout: 10000
    });

    console.log('✅ Page loaded successfully');

    // Wait for map to load
    await page.waitForSelector('canvas', { timeout: 10000 });
    console.log('✅ Map canvas found');

    // Take initial screenshot
    await page.screenshot({ path: 'test-results/admin-simple-initial.png' });
    console.log('📸 Initial screenshot saved');

    // Click on left edge to try to open admin panel
    await page.mouse.click(10, 540);
    console.log('👆 Clicked on left edge');
    
    // Wait 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Take screenshot after click
    await page.screenshot({ path: 'test-results/admin-simple-after-click.png' });
    console.log('📸 After click screenshot saved');

    // Look for General Donation button by text content
    const generalButton = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(btn => btn.textContent.includes('General Donation'));
    });

    if (generalButton) {
      console.log('✅ General Donation button found');
      
      // Click it
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const generalBtn = buttons.find(btn => btn.textContent.includes('General Donation'));
        if (generalBtn) generalBtn.click();
      });
      console.log('👆 Clicked General Donation button');
      
      // Wait 3 seconds for donation to start
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Take screenshot after triggering donation
      await page.screenshot({ path: 'test-results/admin-simple-donation-started.png' });
      console.log('📸 Donation started screenshot saved');
      
      // Wait 12 seconds for journey progression
      console.log('⏳ Waiting 12 seconds for journey progression...');
      await new Promise(resolve => setTimeout(resolve, 12000));
      
      // Take final screenshot
      await page.screenshot({ path: 'test-results/admin-simple-journey-progress.png' });
      console.log('📸 Journey progress screenshot saved');
      
    } else {
      console.log('❌ General Donation button not found');
    }

    // Keep browser open for 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));

  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: 'test-results/admin-simple-error.png' });
  } finally {
    await browser.close();
    console.log('🏁 Simple admin test complete');
  }
}

testAdminSimple();
