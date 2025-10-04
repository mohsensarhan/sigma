/**
 * SIMPLE LOGIN TEST
 * Just open login page and let user test manually
 */

import puppeteer from 'puppeteer';

(async () => {
  console.log('🔍 SIMPLE LOGIN TEST - MANUAL\n');

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1400, height: 900 },
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();

  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('✅') || text.includes('❌') || text.includes('🔐') || text.includes('Auth')) {
      console.log('   🌐', text);
    }
  });

  console.log('Opening http://localhost:5174/login');
  console.log('Please test manually:');
  console.log('1. Can you see the email and password fields text when typing?');
  console.log('2. Can you scroll down to see the Sign In button?');
  console.log('3. Try logging in with: login_debug_1759611952077@gmail.com / DebugTest123!');
  console.log('4. Or register a new account');
  console.log('\nBrowser will stay open. Press Ctrl+C when done.\n');

  await page.goto('http://localhost:5174/login', { waitUntil: 'networkidle2' });

  // Wait forever
  await new Promise(() => {});
})();
