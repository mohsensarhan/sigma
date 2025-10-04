/**
 * Test Supabase Integration
 * Verifies that the app can fetch data from Supabase and trigger donations
 */

import puppeteer from 'puppeteer';

(async () => {
  console.log('🧪 Testing Supabase Integration...\n');

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1400, height: 900 }
  });

  const page = await browser.newPage();
  let testsPassed = 0;
  let testsFailed = 0;

  // Listen for console messages
  page.on('console', msg => {
    const text = msg.text();
    console.log('🌐 BROWSER:', text);
  });

  // Listen for errors
  page.on('pageerror', error => {
    console.error('❌ PAGE ERROR:', error.message);
    testsFailed++;
  });

  try {
    // Step 1: Load the app
    console.log('📱 Step 1: Loading app at http://localhost:5174...');
    await page.goto('http://localhost:5174', { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('✅ App loaded successfully\n');
    testsPassed++;

    // Step 2: Open admin panel
    console.log('📋 Step 2: Opening admin panel...');
    await page.click('[data-notch], .fixed.left-0'); // Click the notch
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('✅ Admin panel opened\n');
    testsPassed++;

    // Step 3: Check if governorates dropdown is populated
    console.log('🌍 Step 3: Checking if governorates loaded from Supabase...');
    const governorateOptions = await page.$$eval('select option', options =>
      options.map(opt => opt.textContent).filter(text => text && text !== 'Select Governorate')
    );
    console.log('   Found governorates:', governorateOptions);

    if (governorateOptions.length === 5) {
      console.log('✅ All 5 governorates loaded from Supabase!\n');
      testsPassed++;
    } else {
      console.error(`❌ Expected 5 governorates, found ${governorateOptions.length}\n`);
      testsFailed++;
    }

    // Step 4: Check if programs dropdown is populated
    console.log('📦 Step 4: Checking if programs loaded from Supabase...');
    const programSelects = await page.$$('select');
    if (programSelects.length >= 2) {
      const programOptions = await programSelects[1].$$eval('option', options =>
        options.map(opt => opt.textContent).filter(text => text && text !== 'Select Program')
      );
      console.log('   Found programs:', programOptions);

      if (programOptions.length === 6) {
        console.log('✅ All 6 programs loaded from Supabase!\n');
        testsPassed++;
      } else {
        console.error(`❌ Expected 6 programs, found ${programOptions.length}\n`);
        testsFailed++;
      }
    }

    // Step 5: Trigger general donation
    console.log('🎲 Step 5: Triggering general donation...');
    const generalButton = await page.$('button:has-text("General Donation"), button');
    if (generalButton) {
      await generalButton.click();
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Check if waypoints appeared on map
      const waypointCount = await page.$$eval('[data-waypoint], .w-12.h-12.rounded-full', markers => markers.length);
      console.log(`   Found ${waypointCount} waypoint markers on map`);

      if (waypointCount === 5) {
        console.log('✅ Journey started successfully with 5 waypoints!\n');
        testsPassed++;
      } else {
        console.error(`❌ Expected 5 waypoints, found ${waypointCount}\n`);
        testsFailed++;
      }
    } else {
      console.error('❌ Could not find General Donation button\n');
      testsFailed++;
    }

    // Step 6: Watch journey progression
    console.log('⏱️  Step 6: Watching journey auto-progress (15 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 15000));

    // Check active stage
    const activeStage = await page.evaluate(() => {
      const stageText = document.body.innerText.match(/Stage (\d+)\/5/);
      return stageText ? parseInt(stageText[1]) : 0;
    });

    console.log(`   Current stage: ${activeStage}/5`);
    if (activeStage >= 3) {
      console.log('✅ Journey is progressing correctly!\n');
      testsPassed++;
    } else {
      console.error('❌ Journey did not progress as expected\n');
      testsFailed++;
    }

    // Final summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Tests Passed: ${testsPassed}`);
    console.log(`❌ Tests Failed: ${testsFailed}`);
    console.log('='.repeat(60));

    if (testsFailed === 0) {
      console.log('\n🎉 ALL TESTS PASSED! Supabase integration is working perfectly!');
    } else {
      console.log('\n⚠️  Some tests failed. Review the errors above.');
    }

    // Keep browser open for 5 seconds
    console.log('\n⏳ Browser will close in 5 seconds...');
    await new Promise(resolve => setTimeout(resolve, 5000));

  } catch (error) {
    console.error('\n❌ TEST ERROR:', error.message);
    testsFailed++;
  } finally {
    await browser.close();
    console.log('\n✅ Test complete');
    process.exit(testsFailed === 0 ? 0 : 1);
  }
})();
