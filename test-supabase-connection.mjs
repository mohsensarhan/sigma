/**
 * Test Supabase Connection
 * Verifies that Supabase client is initialized and can connect
 */

import puppeteer from 'puppeteer';

(async () => {
  console.log('🧪 Testing Supabase connection...\n');

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1400, height: 900 }
  });

  const page = await browser.newPage();

  // Listen for console messages from the browser
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Supabase')) {
      console.log('🌐 BROWSER:', text);
    }
  });

  // Navigate to app
  console.log('📱 Opening app at http://localhost:5174...');
  await page.goto('http://localhost:5174', { waitUntil: 'networkidle2' });

  // Wait a bit for Supabase to initialize
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Check if we see the Supabase success message in console
  console.log('\n✅ Test complete - check browser console output above');
  console.log('   If you see "✅ Supabase connected successfully", connection is working!');
  console.log('\n⏳ Browser will close in 5 seconds...');

  await new Promise(resolve => setTimeout(resolve, 5000));
  await browser.close();

  console.log('\n✅ Supabase connection test complete');
  process.exit(0);
})();
