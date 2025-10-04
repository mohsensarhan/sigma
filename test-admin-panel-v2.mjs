import puppeteer from 'puppeteer';

async function testAdminPanelV2() {
  console.log('🚀 Starting browser for admin panel test v2...');
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

    // Take initial screenshot
    await page.screenshot({ path: 'test-results/admin-panel-v2-initial.png', fullPage: true });
    console.log('📸 Initial screenshot saved');

    // Look for any elements that might be the admin panel notch
    console.log('🔍 Looking for admin panel elements...');
    
    // Try multiple selectors for the notch
    const notchSelectors = [
      'div[class*="fixed"]',
      'div[class*="left-0"]',
      'div[class*="cursor-pointer"]',
      '[data-testid="admin-notch"]',
      'div[style*="left: 0"]'
    ];

    let notchFound = false;
    for (const selector of notchSelectors) {
      try {
        const elements = await page.$$(selector);
        console.log(`🔍 Found ${elements.length} elements with selector: ${selector}`);
        
        if (elements.length > 0) {
          // Try clicking the first one
          await elements[0].click();
          console.log(`👆 Clicked element with selector: ${selector}`);
          notchFound = true;
          break;
        }
      } catch (error) {
        // Continue to next selector
      }
    }

    if (!notchFound) {
      console.log('⚠️ No admin panel notch found, trying to click on left edge');
      // Try clicking on the left edge of the screen
      await page.mouse.click(10, 540); // Click near left edge, middle of screen
      console.log('👆 Clicked on left edge of screen');
    }

    // Wait for panel to potentially open
    await page.waitForTimeout(2000);

    // Take screenshot after attempting to open panel
    await page.screenshot({ path: 'test-results/admin-panel-v2-after-click.png', fullPage: true });
    console.log('📸 After click screenshot saved');

    // Look for admin panel content by text
    try {
      await page.waitForFunction(() => {
        return document.body.innerText.includes('Admin Panel') || 
               document.body.innerText.includes('General Donation') ||
               document.body.innerText.includes('Location-Fixed');
      }, { timeout: 5000 });
      console.log('✅ Admin panel content found by text');
    } catch (error) {
      console.log('⚠️ Admin panel content not found by text');
    }

    // Look for buttons with relevant text
    const buttonTexts = ['General Donation', 'Location-Fixed', 'Program-Fixed'];
    for (const buttonText of buttonTexts) {
      try {
        const button = await page.$(`button:has-text("${buttonText}")`);
        if (button) {
          console.log(`✅ Found button: ${buttonText}`);
          
          // Click the General Donation button to test
          if (buttonText === 'General Donation') {
            await button.click();
            console.log(`👆 Clicked ${buttonText} button`);
            
            // Wait for donation to start
            await page.waitForTimeout(3000);
            
            // Take screenshot after triggering donation
            await page.screenshot({ path: 'test-results/admin-panel-v2-donation-triggered.png', fullPage: true });
            console.log('📸 Donation triggered screenshot saved');
            
            // Wait for animation to progress
            console.log('⏳ Waiting 12 seconds for journey progression...');
            await page.waitForTimeout(12000);
            
            // Take final screenshot
            await page.screenshot({ path: 'test-results/admin-panel-v2-journey-progress.png', fullPage: true });
            console.log('📸 Journey progress screenshot saved');
          }
        }
      } catch (error) {
        console.log(`⚠️ Button "${buttonText}" not found or not clickable`);
      }
    }

    // Keep browser open for 3 seconds for final inspection
    console.log('⏳ Keeping browser open for 3 seconds...');
    await new Promise(resolve => setTimeout(resolve, 3000));

  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: 'test-results/admin-panel-v2-error.png' });
    console.log('📸 Error screenshot saved');
  } finally {
    await browser.close();
    console.log('🏁 Admin panel test v2 complete');
  }
}

testAdminPanelV2();
