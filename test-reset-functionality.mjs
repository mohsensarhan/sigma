import puppeteer from 'puppeteer';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testResetFunctionality() {
  console.log('🧪 Testing reset functionality...');
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox'],
    defaultViewport: { width: 1920, height: 1080 }
  });

  const page = await browser.newPage();

  try {
    await page.goto('http://localhost:5177', { waitUntil: 'networkidle2' });
    console.log('✅ Page loaded');

    // Check initial state - should be empty
    await sleep(2000);
    const initialMarkers = await page.$$('[class*="marker"]');
    console.log(`📍 Initial markers count: ${initialMarkers.length} (should be 0)`);
    
    if (initialMarkers.length === 0) {
      console.log('✅ Initial state is clean (no waypoints)');
    } else {
      console.warn(`⚠️  Expected 0 markers, found ${initialMarkers.length}`);
    }

    await page.screenshot({ path: 'test-results/reset-1-initial-empty.png' });

    // Open admin panel
    await page.mouse.click(10, 500);
    await sleep(1000);
    console.log('🎛️  Admin panel opened');

    // Trigger a donation
    const buttons = await page.$$('button');
    for (const button of buttons) {
      const text = await page.evaluate(el => el.textContent, button);
      if (text && text.includes('General Donation')) {
        await button.click();
        console.log('✅ General Donation triggered');
        break;
      }
    }

    await sleep(3000);
    const markersAfterDonation = await page.$$('[class*="marker"]');
    console.log(`📍 After donation: ${markersAfterDonation.length} markers (should be 5)`);
    
    await page.screenshot({ path: 'test-results/reset-2-donation-active.png' });

    // Wait for a few stages
    await sleep(10000);
    await page.screenshot({ path: 'test-results/reset-3-mid-journey.png' });
    console.log('⏱️  Mid-journey screenshot taken');

    // Now test the reset button
    console.log('🔍 Looking for Clear System button...');
    
    // Re-get buttons (DOM might have changed)
    const buttonsForReset = await page.$$('button');
    let foundClearButton = false;
    
    for (const button of buttonsForReset) {
      const text = await page.evaluate(el => el.textContent, button);
      if (text && text.includes('Clear System')) {
        console.log('✅ Found Clear System button');
        foundClearButton = true;
        
        // Click it
        await button.click();
        console.log('🖱️  Clicked Clear System button');
        await sleep(500);
        
        // Handle confirmation dialog
        page.on('dialog', async dialog => {
          console.log(`📝 Confirm dialog: "${dialog.message()}"`);
          await dialog.accept();
        });
        
        // Click again to trigger confirmation
        await button.click();
        await sleep(1000);
        
        break;
      }
    }

    if (!foundClearButton) {
      console.warn('⚠️  Clear System button not found');
    }

    // Check if system was cleared
    await sleep(2000);
    const markersAfterClear = await page.$$('[class*="marker"]');
    console.log(`📍 After clear: ${markersAfterClear.length} markers (should be 0)`);
    
    if (markersAfterClear.length === 0) {
      console.log('✅ System successfully cleared!');
    } else {
      console.warn(`⚠️  Expected 0 markers after clear, found ${markersAfterClear.length}`);
    }
    
    await page.screenshot({ path: 'test-results/reset-4-after-clear.png' });

    console.log('\n✅ Reset functionality test complete!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: 'test-results/reset-error.png' });
  } finally {
    await browser.close();
  }
}

testResetFunctionality();
