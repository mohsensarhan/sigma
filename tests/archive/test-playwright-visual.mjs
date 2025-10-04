import { chromium } from '@playwright/test';

async function visualTest() {
  console.log('🎬 Playwright Visual Test - Opening Browser\n');
  
  const browser = await chromium.launch({
    headless: false,
    slowMo: 500 // Slow down so we can see what's happening
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  // Listen to console logs
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('🎯') || text.includes('✅') || text.includes('🚀') || text.includes('Rendering')) {
      console.log('🌐 BROWSER:', text);
    }
  });

  try {
    console.log('1️⃣ Loading page...');
    await page.goto('http://localhost:5177');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    console.log('✅ Page loaded\n');
    await page.screenshot({ path: 'test-results/pw-1-initial.png' });
    
    // Check debug counter
    const debugCounter = await page.locator('div:has-text("Waypoints:")').textContent().catch(() => 'Not found');
    console.log('2️⃣ Debug counter shows:', debugCounter);
    
    console.log('\n3️⃣ Opening admin panel...');
    await page.mouse.click(10, 500);
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/pw-2-admin-open.png' });
    
    console.log('4️⃣ Clicking General Donation...');
    await page.click('button:has-text("General Donation")');
    await page.waitForTimeout(2000);
    
    // Check debug counter after donation
    const afterDonation = await page.locator('div:has-text("Waypoints:")').textContent();
    console.log('5️⃣ After donation, debug counter:', afterDonation);
    
    await page.screenshot({ path: 'test-results/pw-3-after-click.png' });
    
    // Check for markers
    const markers = await page.locator('[class*="marker"]').count();
    console.log('6️⃣ Markers found:', markers);
    
    // Check waypoint control card
    const waypointButtons = await page.locator('button:has-text("Stage")').count();
    console.log('7️⃣ Waypoint buttons in control card:', waypointButtons);
    
    // Wait and take screenshots every 5 seconds
    console.log('\n8️⃣ Monitoring for 15 seconds...');
    for (let i = 1; i <= 3; i++) {
      await page.waitForTimeout(5000);
      const currentCounter = await page.locator('div:has-text("Waypoints:")').textContent();
      const currentMarkers = await page.locator('[class*="marker"]').count();
      
      console.log(`   ${i*5}s - Counter: ${currentCounter}, Markers: ${currentMarkers}`);
      await page.screenshot({ path: `test-results/pw-4-progress-${i*5}s.png` });
    }
    
    console.log('\n✅ Test complete! Check screenshots in test-results/');
    console.log('\n📊 Summary:');
    console.log('  - Initial state:', debugCounter);
    console.log('  - After donation:', afterDonation);
    console.log('  - Markers on map:', markers);
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    await page.screenshot({ path: 'test-results/pw-error.png' });
  } finally {
    // Keep browser open for 10 seconds for manual inspection
    console.log('\n⏳ Keeping browser open for 10 seconds for manual inspection...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
}

visualTest();
