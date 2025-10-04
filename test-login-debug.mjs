/**
 * LOGIN DEBUG TEST
 * Focused test to debug login redirect issue
 */

import puppeteer from 'puppeteer';

const TEST_USER = {
  email: `login_debug_${Date.now()}@gmail.com`,
  password: 'DebugTest123!',
  name: 'Login Debug User',
  phone: '+201234567890'
};

(async () => {
  console.log('🔍 LOGIN DEBUG TEST\n');
  console.log('=' .repeat(70));
  console.log(`📧 Test User: ${TEST_USER.email}`);
  console.log(`🔐 Password: ${TEST_USER.password}`);
  console.log('=' .repeat(70) + '\n');

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1400, height: 900 },
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();
  const consoleLogs = [];

  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push(text);
    console.log('   🌐', text);
  });

  page.on('pageerror', err => console.error('   ❌ PAGE ERROR:', err.message));

  try {
    // ========================================================================
    // STEP 1: REGISTER USER
    // ========================================================================
    console.log('\n📝 STEP 1: REGISTER USER\n');

    await page.goto('http://localhost:5174/register', { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 1500));

    console.log('   ➤ Filling registration form...');
    await page.type('input[name="name"]', TEST_USER.name);
    await page.type('input[name="email"]', TEST_USER.email);
    await page.type('input[name="phone"]', TEST_USER.phone);
    await page.type('input[name="password"]', TEST_USER.password);
    await page.type('input[name="confirmPassword"]', TEST_USER.password);

    console.log('   ➤ Submitting registration...');
    await page.click('button[type="submit"]');
    await new Promise(resolve => setTimeout(resolve, 4000));

    console.log('   ✅ Registration complete\n');

    // ========================================================================
    // STEP 2: LOGIN
    // ========================================================================
    console.log('🔐 STEP 2: LOGIN TEST\n');

    await page.goto('http://localhost:5174/login', { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('   ➤ Filling login form...');
    await page.type('input[name="email"]', TEST_USER.email);
    await page.type('input[name="password"]', TEST_USER.password);

    console.log('   ➤ Current URL before submit:', page.url());
    console.log('   ➤ Submitting login form...\n');

    // Click submit and wait
    await page.click('button[type="submit"]');

    // Wait for auth processing
    console.log('   ⏳ Waiting for authentication...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('\n   📊 RESULTS:');
    console.log('   ➤ URL after login:', page.url());

    // Check if we're still on login page
    const isStillOnLogin = page.url().includes('/login');
    const isOnHome = page.url() === 'http://localhost:5174/' || page.url() === 'http://localhost:5174';

    console.log('   ➤ Still on login page?', isStillOnLogin);
    console.log('   ➤ On home page?', isOnHome);

    // Check for error messages
    const errorElement = await page.$('[class*="bg-red"]');
    if (errorElement) {
      const errorText = await page.$eval('[class*="bg-red"]', el => el.textContent);
      console.log('   ❌ Error message visible:', errorText);
    } else {
      console.log('   ✅ No error message visible');
    }

    // Wait for user to examine
    console.log('\n💡 Browser left open for examination. Check the console logs above.');
    console.log('   Press Ctrl+C when done.\n');

    // Filter relevant console logs
    console.log('\n📋 FILTERED CONSOLE LOGS (Login related):\n');
    consoleLogs
      .filter(log =>
        log.includes('Login:') ||
        log.includes('AuthContext:') ||
        log.includes('Auth state') ||
        log.includes('navigate')
      )
      .forEach((log, i) => console.log(`   ${i + 1}. ${log}`));

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error(error.stack);
    await browser.close();
    process.exit(1);
  }
})();
