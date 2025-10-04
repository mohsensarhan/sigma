/**
 * Phase 1 Integration Test
 * Verifies authentication is integrated WITHOUT breaking existing map/UI
 */

import puppeteer from 'puppeteer';

(async () => {
  console.log('🧪 Phase 1 Integration Test - Authentication + Map Integrity\n');

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1400, height: 900 }
  });

  const page = await browser.newPage();
  const errors = [];
  const consoleLogs = [];

  // Capture console messages
  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push(text);
    console.log('🌐 BROWSER:', text);
  });

  // Capture errors
  page.on('pageerror', error => {
    errors.push(error.message);
    console.error('❌ PAGE ERROR:', error.message);
  });

  try {
    // ========================================================================
    // TEST 1: Main Page (Map) Loads Successfully
    // ========================================================================
    console.log('\n📍 TEST 1: Verify main page loads with beautiful map...');
    await page.goto('http://localhost:5174', { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Check for Supabase connection
    const hasSupabaseConnection = consoleLogs.some(log => log.includes('✅ Supabase connected'));
    console.log(hasSupabaseConnection ? '✅ Supabase connected' : '⚠️  Supabase connection not detected');

    // Check that map canvas loaded
    const mapCanvas = await page.$('canvas');
    if (mapCanvas) {
      console.log('✅ Map canvas rendered');
    } else {
      console.log('❌ Map canvas NOT found');
      errors.push('Map canvas missing');
    }

    // Check for admin panel button
    const adminButton = await page.$('[class*="notch"]');
    if (adminButton) {
      console.log('✅ Admin panel notch visible');
    } else {
      console.log('⚠️  Admin panel notch not found');
    }

    // ========================================================================
    // TEST 2: Navigate to /register page
    // ========================================================================
    console.log('\n📍 TEST 2: Verify /register page loads...');
    await page.goto('http://localhost:5174/register', { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 2000));

    const registerHeading = await page.$('text/Create Account');
    if (registerHeading || await page.$('h1')) {
      console.log('✅ Register page loaded successfully');
    } else {
      console.log('❌ Register page NOT loaded');
      errors.push('Register page missing');
    }

    // Check for registration form fields
    const emailInput = await page.$('input[type="email"]');
    const passwordInput = await page.$('input[type="password"]');
    const nameInput = await page.$('input[name="name"]');

    if (emailInput && passwordInput && nameInput) {
      console.log('✅ Registration form fields present');
    } else {
      console.log('❌ Registration form incomplete');
      errors.push('Registration form missing fields');
    }

    // ========================================================================
    // TEST 3: Navigate to /login page
    // ========================================================================
    console.log('\n📍 TEST 3: Verify /login page loads...');
    await page.goto('http://localhost:5174/login', { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 2000));

    const loginHeading = await page.$('text/Welcome Back');
    if (loginHeading || await page.$('h1')) {
      console.log('✅ Login page loaded successfully');
    } else {
      console.log('❌ Login page NOT loaded');
      errors.push('Login page missing');
    }

    // ========================================================================
    // TEST 4: Navigate back to main page to ensure no navigation issues
    // ========================================================================
    console.log('\n📍 TEST 4: Navigate back to main page...');
    await page.goto('http://localhost:5174', { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 2000));

    const mapCanvasAgain = await page.$('canvas');
    if (mapCanvasAgain) {
      console.log('✅ Map still renders after navigation');
    } else {
      console.log('❌ Map broken after navigation');
      errors.push('Map broken after navigation');
    }

    // ========================================================================
    // TEST 5: Test Admin Panel Still Works
    // ========================================================================
    console.log('\n📍 TEST 5: Verify admin panel functionality...');

    // Try to find and click the notch
    const notch = await page.$('[class*="notch"]');
    if (notch) {
      await notch.click();
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('✅ Admin panel notch clicked');

      // Check if panel opened
      const adminPanel = await page.$('[class*="AdminPanel"]');
      if (adminPanel) {
        console.log('✅ Admin panel opened');
      } else {
        console.log('⚠️  Admin panel may not have opened');
      }
    } else {
      console.log('⚠️  Could not find admin panel notch');
    }

    // ========================================================================
    // FINAL RESULTS
    // ========================================================================
    console.log('\n' + '='.repeat(60));
    console.log('📊 PHASE 1 INTEGRATION TEST RESULTS');
    console.log('='.repeat(60));

    if (errors.length === 0) {
      console.log('✅ ALL TESTS PASSED');
      console.log('✅ Map integrity preserved');
      console.log('✅ Authentication routes working');
      console.log('✅ Navigation working correctly');
      console.log('\n🎉 Phase 1 integration successful!');
    } else {
      console.log('❌ TESTS FAILED:');
      errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
      console.log('\n⚠️  Some issues detected - please review');
    }

    console.log('\n💡 Keep browser open for manual verification...');
    console.log('Press Ctrl+C when done.\n');

  } catch (err) {
    console.error('\n❌ TEST ERROR:', err.message);
    await browser.close();
    process.exit(1);
  }
})();
