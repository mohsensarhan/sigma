import puppeteer from 'puppeteer';

async function testAdminTargeted() {
  console.log('🚀 Starting targeted admin test...');
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
    await page.screenshot({ path: 'test-results/admin-targeted-initial.png' });
    console.log('📸 Initial screenshot saved');

    // Look for the admin notch by checking for elements with specific styling
    const notchFound = await page.evaluate(() => {
      // Find elements that might be the notch
      const allDivs = Array.from(document.querySelectorAll('div'));
      
      // Look for divs with left: 0 positioning and small width
      const notchCandidates = allDivs.filter(div => {
        const style = window.getComputedStyle(div);
        return style.position === 'fixed' && 
               style.left === '0px' && 
               parseInt(style.width) < 50 &&
               style.cursor === 'pointer';
      });
      
      console.log(`Found ${notchCandidates.length} notch candidates`);
      
      if (notchCandidates.length > 0) {
        // Click the first candidate
        notchCandidates[0].click();
        return true;
      }
      
      return false;
    });

    if (notchFound) {
      console.log('✅ Admin notch found and clicked');
    } else {
      console.log('⚠️ Admin notch not found, trying alternative approach');
      
      // Try clicking at specific coordinates where the notch should be
      await page.mouse.click(3, 540); // Very close to left edge
      console.log('👆 Clicked near left edge');
    }

    // Wait 2 seconds for panel to open
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Take screenshot after attempting to open panel
    await page.screenshot({ path: 'test-results/admin-targeted-after-click.png' });
    console.log('📸 After click screenshot saved');

    // Check if admin panel is now visible by looking for the content
    const panelVisible = await page.evaluate(() => {
      // Look for admin panel content
      const adminTexts = ['Admin Panel', 'General Donation', 'Location-Fixed', 'Program-Fixed'];
      const bodyText = document.body.innerText;
      
      return adminTexts.some(text => bodyText.includes(text));
    });

    if (panelVisible) {
      console.log('✅ Admin panel content is now visible!');
      
      // Look for and click the General Donation button
      const donationTriggered = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const generalButton = buttons.find(btn => 
          btn.textContent && btn.textContent.includes('General Donation')
        );
        
        if (generalButton && !generalButton.disabled) {
          generalButton.click();
          return true;
        }
        return false;
      });

      if (donationTriggered) {
        console.log('✅ General Donation button clicked!');
        
        // Wait 3 seconds for donation to start
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Take screenshot after triggering donation
        await page.screenshot({ path: 'test-results/admin-targeted-donation-triggered.png' });
        console.log('📸 Donation triggered screenshot saved');
        
        // Wait 12 seconds for journey progression
        console.log('⏳ Waiting 12 seconds for journey progression...');
        await new Promise(resolve => setTimeout(resolve, 12000));
        
        // Take final screenshot
        await page.screenshot({ path: 'test-results/admin-targeted-journey-progress.png' });
        console.log('📸 Journey progress screenshot saved');
        
      } else {
        console.log('❌ General Donation button not found or disabled');
      }
      
    } else {
      console.log('❌ Admin panel content still not visible');
    }

    // Keep browser open for 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));

  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: 'test-results/admin-targeted-error.png' });
  } finally {
    await browser.close();
    console.log('🏁 Targeted admin test complete');
  }
}

testAdminTargeted();
