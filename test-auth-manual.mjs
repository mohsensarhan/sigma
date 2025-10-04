/**
 * Manual Auth Flow Test
 * Simple test to manually verify registration and login work
 */

import puppeteer from 'puppeteer';

const TEST_EMAIL = `manual_test_${Date.now()}@trupath.test`;
const TEST_PASSWORD = 'TestPass123!';
const TEST_NAME = 'Manual Test User';
const TEST_PHONE = '+201234567890';

(async () => {
  console.log('🧪 Manual Auth Flow Test\n');
  console.log(`Test User: ${TEST_EMAIL}\n`);

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1400, height: 900 }
  });

  const page = await browser.newPage();

  // Capture all console messages
  page.on('console', msg => console.log('   🌐', msg.text()));
  page.on('pageerror', err => console.error('   ❌', err.message));

  try {
    // ========================================================================
    // STEP 1: REGISTRATION
    // ========================================================================
    console.log('📝 STEP 1: Testing Registration...\n');

    await page.goto('http://localhost:5174/register', { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 1500));

    console.log('   Filling registration form...');
    await page.type('input[name="name"]', TEST_NAME, { delay: 50 });
    await page.type('input[name="email"]', TEST_EMAIL, { delay: 50 });
    await page.type('input[name="phone"]', TEST_PHONE, { delay: 50 });
    await page.type('input[name="password"]', TEST_PASSWORD, { delay: 50 });
    await page.type('input[name="confirmPassword"]', TEST_PASSWORD, { delay: 50 });

    console.log('   Submitting registration...');
    await page.click('button[type="submit"]');

    // Wait and check result
    await new Promise(resolve => setTimeout(resolve, 4000));

    const currentUrl1 = page.url();
    const hasSuccess = await page.$('text/Registration Successful');
    const hasCheckCircle = await page.$('[class*="CheckCircle"]');

    console.log(`   Current URL: ${currentUrl1}`);
    console.log(`   Success message: ${hasSuccess ? 'YES' : 'NO'}`);
    console.log(`   Check circle: ${hasCheckCircle ? 'YES' : 'NO'}`);

    if (hasSuccess || hasCheckCircle) {
      console.log('   ✅ Registration appears successful!\n');
    } else {
      const errorMsg = await page.$('[class*="bg-red"]');
      if (errorMsg) {
        const errorText = await page.$eval('[class*="bg-red"]', el => el.textContent);
        console.log(`   ❌ Registration error: ${errorText}\n`);
      } else {
        console.log('   ⚠️  Registration status unclear\n');
      }
    }

    // ========================================================================
    // STEP 2: LOGIN
    // ========================================================================
    console.log('🔐 STEP 2: Testing Login...\n');

    // Navigate to login (or it might auto-redirect)
    await new Promise(resolve => setTimeout(resolve, 2000));

    if (!currentUrl1.includes('/login')) {
      console.log('   Navigating to login page...');
      await page.goto('http://localhost:5174/login', { waitUntil: 'networkidle2' });
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('   Filling login form...');
    await page.type('input[name="email"]', TEST_EMAIL, { delay: 50 });
    await page.type('input[name="password"]', TEST_PASSWORD, { delay: 50 });

    console.log('   Submitting login...');
    await page.click('button[type="submit"]');

    // Wait and check result
    await new Promise(resolve => setTimeout(resolve, 4000));

    const currentUrl2 = page.url();
    console.log(`   Current URL after login: ${currentUrl2}`);

    if (currentUrl2.includes('localhost:5174/') && !currentUrl2.includes('/login')) {
      console.log('   ✅ Login successful - redirected to home!\n');
    } else {
      const loginError = await page.$('[class*="bg-red"]');
      if (loginError) {
        const errorText = await page.$eval('[class*="bg-red"]', el => el.textContent);
        console.log(`   ❌ Login error: ${errorText}\n`);
      } else {
        console.log('   ⚠️  Still on login page - checking why...\n');
      }
    }

    // ========================================================================
    // STEP 3: VERIFY SESSION
    // ========================================================================
    console.log('🔄 STEP 3: Testing Session Persistence...\n');

    console.log('   Refreshing page...');
    await page.reload({ waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 2000));

    const currentUrl3 = page.url();
    console.log(`   URL after refresh: ${currentUrl3}`);

    if (currentUrl3.includes('localhost:5174/') && !currentUrl3.includes('/login')) {
      console.log('   ✅ Session persisted - still on home page!\n');
    } else {
      console.log('   ❌ Session lost - redirected to login\n');
    }

    // ========================================================================
    // FINAL SUMMARY
    // ========================================================================
    console.log('='.repeat(60));
    console.log('📊 MANUAL TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Test Email: ${TEST_EMAIL}`);
    console.log(`Test Password: ${TEST_PASSWORD}`);
    console.log('\n💡 Please manually verify in the browser:');
    console.log('   1. Can you see the map?');
    console.log('   2. Can you open admin panel?');
    console.log('   3. Can you trigger a donation?');
    console.log('\n⏸️  Browser left open for manual verification');
    console.log('Press Ctrl+C when done.\n');

  } catch (error) {
    console.error('\n❌ TEST ERROR:', error.message);
    await browser.close();
    process.exit(1);
  }
})();
