import { chromium } from '@playwright/test';

async function finalVerification() {
  console.log('🏁 FINAL VERIFICATION TEST\n');
  
  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000
  });
  
  const page = await (await browser.newContext({ viewport: { width: 1920, height: 1080 } })).newPage();

  try {
    console.log('✅ Opening http://localhost:5177');
    await page.goto('http://localhost:5177');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    console.log('✅ Opening admin panel...');
    await page.mouse.click(10, 500);
    await page.waitForTimeout(1500);
    
    console.log('✅ Clicking General Donation...');
    await page.click('button:has-text("General Donation")');
    await page.waitForTimeout(3000);
    
    console.log('✅ Taking screenshot after 3 seconds...');
    await page.screenshot({ path: 'test-results/FINAL-after-3s.png', fullPage: false });
    
    console.log('✅ Waiting 5 more seconds...');
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'test-results/FINAL-after-8s.png', fullPage: false });
    
    console.log('✅ Waiting 5 more seconds...');
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'test-results/FINAL-after-13s.png', fullPage: false });
    
    console.log('\n🎉 TEST COMPLETE!');
    console.log('Check these screenshots:');
    console.log('  - test-results/FINAL-after-3s.png');
    console.log('  - test-results/FINAL-after-8s.png');
    console.log('  - test-results/FINAL-after-13s.png');
    console.log('\nYou should see:');
    console.log('  - 5 markers on the map');
    console.log('  - Waypoint control card on the right with 5 stages');
    console.log('  - Active donation info panel on the left');
    console.log('  - Path drawing between markers');
    
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  } finally {
    await browser.close();
  }
}

finalVerification();
