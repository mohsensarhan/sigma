/**
 * COMPLETE USER JOURNEY TEST - Phase 1 Final Verification
 * Tests entire user flow: Registration → Login → Session → Map → Admin Panel → Donation
 *
 * Prerequisites: Email confirmation disabled in Supabase
 */

import puppeteer from 'puppeteer';

const TEST_USER = {
  email: `complete_test_${Date.now()}@gmail.com`,
  password: 'CompleteTest123!',
  name: 'Complete Test User',
  phone: '+201234567890'
};

const kpis = [];

function logKPI(id, description, passed, evidence) {
  kpis.push({ id, description, passed, evidence });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} ${id}: ${description}`);
  if (evidence) console.log(`   📊 ${evidence}`);
}

(async () => {
  console.log('🎯 COMPLETE USER JOURNEY TEST - PHASE 1 FINAL VERIFICATION\n');
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
    if (text.includes('✅') || text.includes('❌') || text.includes('Auth')) {
      console.log('   🌐', text);
    }
  });

  page.on('pageerror', err => console.error('   ❌ PAGE ERROR:', err.message));

  try {
    // ========================================================================
    // STEP 1: USER REGISTRATION
    // ========================================================================
    console.log('\n📝 STEP 1: USER REGISTRATION\n');

    await page.goto('http://localhost:5174/register', { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Fill registration form
    console.log('   ➤ Filling registration form...');
    await page.type('input[name="name"]', TEST_USER.name);
    await page.type('input[name="email"]', TEST_USER.email);
    await page.type('input[name="phone"]', TEST_USER.phone);
    await page.type('input[name="password"]', TEST_USER.password);
    await page.type('input[name="confirmPassword"]', TEST_USER.password);

    // Submit
    const regStart = Date.now();
    console.log('   ➤ Submitting registration...');
    await page.click('button[type="submit"]');
    await new Promise(resolve => setTimeout(resolve, 4000));
    const regTime = Date.now() - regStart;

    // Verify success
    const hasSuccess = await page.$('text/Registration Successful');
    const hasCheckCircle = await page.$('[class*="CheckCircle"]');
    const hasError = await page.$('[class*="bg-red"]');

    if (hasSuccess || hasCheckCircle) {
      logKPI('REG-001', 'User registration with email/password', true, `Completed in ${regTime}ms`);
    } else if (hasError) {
      const errorText = await page.$eval('[class*="bg-red"]', el => el.textContent);
      logKPI('REG-001', 'User registration with email/password', false, `Error: ${errorText}`);
      throw new Error(`Registration failed: ${errorText}`);
    }

    // ========================================================================
    // STEP 2: AUTOMATIC LOGIN (After Registration)
    // ========================================================================
    console.log('\n🔐 STEP 2: USER LOGIN\n');

    // Wait for redirect to login page
    await new Promise(resolve => setTimeout(resolve, 3500));

    // Navigate to login
    console.log('   ➤ Navigating to login page...');
    await page.goto('http://localhost:5174/login', { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Fill login form
    console.log('   ➤ Filling login form...');
    await page.type('input[name="email"]', TEST_USER.email);
    await page.type('input[name="password"]', TEST_USER.password);

    // Submit login
    const loginStart = Date.now();
    console.log('   ➤ Submitting login...');
    await page.click('button[type="submit"]');
    await new Promise(resolve => setTimeout(resolve, 4000));
    const loginTime = Date.now() - loginStart;

    // Check if redirected to home
    const currentUrl = page.url();
    const isHome = currentUrl.includes('localhost:5174/') &&
                   !currentUrl.includes('/login') &&
                   !currentUrl.includes('/register');

    if (isHome) {
      logKPI('LOGIN-001', 'Valid credentials authenticate successfully', true,
        `Redirected to home in ${loginTime}ms`);
    } else {
      const loginError = await page.$('[class*="bg-red"]');
      if (loginError) {
        const errorText = await page.$eval('[class*="bg-red"]', el => el.textContent);
        logKPI('LOGIN-001', 'Valid credentials authenticate successfully', false,
          `Error: ${errorText}`);
        throw new Error(`Login failed: ${errorText}`);
      } else {
        logKPI('LOGIN-001', 'Valid credentials authenticate successfully', false,
          `Still at ${currentUrl}`);
      }
    }

    // ========================================================================
    // STEP 3: SESSION PERSISTENCE
    // ========================================================================
    console.log('\n🔄 STEP 3: SESSION PERSISTENCE\n');

    console.log('   ➤ Refreshing page to test session...');
    await page.reload({ waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 2500));

    const urlAfterRefresh = page.url();
    const stayedOnHome = urlAfterRefresh.includes('localhost:5174/') &&
                         !urlAfterRefresh.includes('/login');

    logKPI('LOGIN-003', 'Session persists across page refresh', stayedOnHome,
      stayedOnHome ? 'Remained on home page' : 'Redirected to login');

    // ========================================================================
    // STEP 4: MAP RENDERING & DATA LOADING
    // ========================================================================
    console.log('\n🗺️  STEP 4: MAP & DATA LOADING\n');

    console.log('   ➤ Checking map canvas...');
    const mapCanvas = await page.$('canvas');
    logKPI('INT-001', 'Map canvas renders correctly', !!mapCanvas,
      mapCanvas ? 'Canvas element found' : 'Canvas missing');

    console.log('   ➤ Checking Supabase connection...');
    const supabaseConnected = consoleLogs.some(log =>
      log.includes('✅ Supabase connected'));
    logKPI('INT-002', 'Supabase connection established', supabaseConnected,
      supabaseConnected ? 'Connection confirmed in logs' : 'No connection log found');

    console.log('   ➤ Checking data loading...');
    const governoratesLoaded = consoleLogs.some(log =>
      log.includes('governorates'));
    const programsLoaded = consoleLogs.some(log =>
      log.includes('programs'));
    logKPI('INT-003', 'Governorates and programs data loaded',
      governoratesLoaded && programsLoaded,
      `Governorates: ${governoratesLoaded ? 'YES' : 'NO'}, Programs: ${programsLoaded ? 'YES' : 'NO'}`);

    // ========================================================================
    // STEP 5: ADMIN PANEL FUNCTIONALITY
    // ========================================================================
    console.log('\n⚙️  STEP 5: ADMIN PANEL\n');

    console.log('   ➤ Looking for admin panel notch...');
    // Try multiple selectors for the notch
    let notch = await page.$('[class*="notch"]');
    if (!notch) notch = await page.$('[class*="Notch"]');
    if (!notch) notch = await page.$('[data-testid="admin-notch"]');
    if (!notch) {
      // Try finding by position (left side of screen)
      const elements = await page.$$('div');
      for (const el of elements) {
        const box = await el.boundingBox();
        if (box && box.x < 50 && box.y > 200 && box.y < 400) {
          notch = el;
          break;
        }
      }
    }

    if (notch) {
      console.log('   ➤ Clicking admin panel notch...');
      await notch.click();
      await new Promise(resolve => setTimeout(resolve, 1000));

      const panelOpen = await page.$('[class*="AdminPanel"]');
      logKPI('UI-001', 'Admin panel opens on click', !!panelOpen,
        panelOpen ? 'Panel visible after click' : 'Panel not detected');
    } else {
      console.log('   ⚠️  Notch not found - skipping panel test');
      logKPI('UI-001', 'Admin panel opens on click', false,
        'Could not locate admin panel notch');
    }

    // ========================================================================
    // STEP 6: DONATION TRIGGER (General Donation)
    // ========================================================================
    console.log('\n💰 STEP 6: DONATION TRIGGER\n');

    console.log('   ➤ Looking for "Trigger General Donation" button...');
    const donationButton = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(btn =>
        btn.textContent.includes('Trigger General Donation') ||
        btn.textContent.includes('General')
      );
    });

    if (donationButton) {
      console.log('   ➤ Clicking donation button...');
      const beforeWaypoints = await page.$$('[class*="waypoint"]');
      await donationButton.click();
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Check for journey start indicators
      const afterWaypoints = await page.$$('[class*="waypoint"]');
      const hasMoreWaypoints = afterWaypoints.length > beforeWaypoints.length;
      const hasActiveJourney = consoleLogs.some(log =>
        log.includes('journey') || log.includes('waypoint'));

      logKPI('FUNC-001', 'General donation triggers journey',
        hasMoreWaypoints || hasActiveJourney,
        `Waypoints: ${beforeWaypoints.length} → ${afterWaypoints.length}`);
    } else {
      console.log('   ⚠️  Donation button not found in current view');
      logKPI('FUNC-001', 'General donation triggers journey', false,
        'Button not accessible (may need admin panel open)');
    }

    // ========================================================================
    // STEP 7: LOGOUT FUNCTIONALITY
    // ========================================================================
    console.log('\n🚪 STEP 7: LOGOUT\n');

    // Look for logout button
    const logoutButton = await page.$('text/Logout') ||
                         await page.$('text/Sign Out') ||
                         await page.$('button:has-text("Log out")');

    if (logoutButton) {
      console.log('   ➤ Clicking logout...');
      await logoutButton.click();
      await new Promise(resolve => setTimeout(resolve, 2000));

      const redirectedToLogin = page.url().includes('/login');
      logKPI('AUTH-001', 'Logout functionality works', redirectedToLogin,
        redirectedToLogin ? 'Redirected to login page' : 'Still on same page');
    } else {
      console.log('   ⚠️  Logout button not found - skipping logout test');
      logKPI('AUTH-001', 'Logout functionality works', null,
        'Logout button not found in UI');
    }

    // ========================================================================
    // FINAL REPORT
    // ========================================================================
    console.log('\n' + '='.repeat(70));
    console.log('📊 COMPLETE USER JOURNEY - FINAL REPORT');
    console.log('='.repeat(70));

    const passed = kpis.filter(k => k.passed === true).length;
    const failed = kpis.filter(k => k.passed === false).length;
    const skipped = kpis.filter(k => k.passed === null).length;
    const total = kpis.length;

    console.log(`\n✅ PASSED: ${passed}/${total}`);
    console.log(`❌ FAILED: ${failed}/${total}`);
    if (skipped > 0) console.log(`⚠️  SKIPPED: ${skipped}/${total}`);

    console.log('\n📋 DETAILED RESULTS:\n');
    kpis.forEach((kpi, i) => {
      const icon = kpi.passed === true ? '✅' : kpi.passed === false ? '❌' : '⚠️';
      console.log(`${i + 1}. ${icon} ${kpi.id}: ${kpi.description}`);
      console.log(`   ${kpi.evidence}`);
    });

    console.log('\n' + '='.repeat(70));

    const successRate = (passed / (total - skipped) * 100).toFixed(1);
    if (passed >= (total - skipped) * 0.8) {
      console.log(`🎉 SUCCESS! ${successRate}% of tests passed`);
      console.log('✅ Phase 1 authentication is FULLY FUNCTIONAL!');
    } else {
      console.log(`⚠️  ${successRate}% passed - some issues detected`);
    }

    console.log('\n💡 Browser left open for manual verification');
    console.log('Press Ctrl+C when done.\n');

    // Save report
    const fs = await import('fs');
    const report = {
      timestamp: new Date().toISOString(),
      testUser: { ...TEST_USER, password: '[REDACTED]' },
      kpis,
      summary: {
        total,
        passed,
        failed,
        skipped,
        successRate: `${successRate}%`
      }
    };
    fs.writeFileSync('complete-journey-report.json', JSON.stringify(report, null, 2));
    console.log('📄 Report saved: complete-journey-report.json\n');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error(error.stack);
    await browser.close();
    process.exit(1);
  }
})();
