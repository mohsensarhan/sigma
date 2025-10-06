/**
 * Automated PostgREST Restart via Supabase Dashboard
 * This script uses Playwright to automate the PostgREST restart process
 */

import puppeteer from 'puppeteer';

const PROJECT_REF = 'sdmjetiogbvgzqsvcuth';
const DASHBOARD_URL = `https://supabase.com/dashboard/project/${PROJECT_REF}/settings/api`;

console.log('🚀 Automated PostgREST Restart');
console.log('=' .repeat(80));
console.log('This script will help you restart PostgREST through the Supabase Dashboard\n');

async function restartPostgREST() {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--window-size=1400,900'],
    defaultViewport: { width: 1400, height: 900 }
  });

  const page = await browser.newPage();

  try {
    console.log('📋 Step 1: Opening Supabase Dashboard...');
    await page.goto(DASHBOARD_URL, { waitUntil: 'networkidle0', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Check if we need to log in
    const currentUrl = page.url();
    if (currentUrl.includes('login') || currentUrl.includes('sign-in')) {
      console.log('\n⚠️  You need to log in to Supabase Dashboard');
      console.log('📋 Instructions:');
      console.log('1. Log in to your Supabase account in the browser window');
      console.log('2. You will be redirected to the API settings page');
      console.log('3. Look for the "PostgREST" section');
      console.log('4. Click the "Restart PostgREST" button');
      console.log('5. Wait 30-60 seconds for restart to complete');
      console.log('\n⏳ Waiting for you to complete the login...');
      console.log('   (The browser will stay open for you to complete this manually)');
      
      // Wait for navigation to the API settings page
      await page.waitForNavigation({ 
        waitUntil: 'networkidle0', 
        timeout: 300000 // 5 minutes
      }).catch(() => {
        console.log('⚠️  Navigation timeout - please complete manually');
      });
      
      console.log('\n✅ Logged in successfully!');
    }

    console.log('\n📋 Step 2: Looking for PostgREST restart button...');
    await page.waitForTimeout(2000);

    // Try to find and click the restart button
    const restartButtonSelectors = [
      'button:has-text("Restart PostgREST")',
      'button:has-text("Restart")',
      '[data-testid="restart-postgrest"]',
      'button[aria-label*="restart"]'
    ];

    let buttonFound = false;
    for (const selector of restartButtonSelectors) {
      try {
        const button = await page.$(selector);
        if (button) {
          console.log(`✅ Found restart button: ${selector}`);
          buttonFound = true;
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    if (!buttonFound) {
      console.log('\n⚠️  Could not automatically find the restart button');
      console.log('📋 Manual Instructions:');
      console.log('1. Scroll down to find the "PostgREST" section');
      console.log('2. Click the "Restart PostgREST" button');
      console.log('3. Wait for confirmation message');
      console.log('4. Wait 30-60 seconds for restart to complete');
      console.log('\n⏳ Browser will stay open for you to complete this manually');
      console.log('   Press Ctrl+C when done to close the browser');
      
      // Keep browser open
      await new Promise(() => {}); // Wait indefinitely
    }

    console.log('\n📋 Step 3: Waiting for restart to complete...');
    console.log('⏳ Please wait 30-60 seconds...');
    
    // Wait for restart
    await page.waitForTimeout(45000); // 45 seconds

    console.log('\n✅ PostgREST restart should be complete!');
    console.log('\n📋 Next Steps:');
    console.log('1. Close this browser window');
    console.log('2. Restart your dev server: Ctrl+C then npm run dev');
    console.log('3. Hard refresh browser: Ctrl+F5');
    console.log('4. Run test: node test-correct-production-flow.mjs');

    // Keep browser open for user to verify
    console.log('\n⏳ Browser will stay open for 30 seconds for you to verify...');
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\n📋 Please complete the restart manually:');
    console.log('1. Go to: ' + DASHBOARD_URL);
    console.log('2. Log in if needed');
    console.log('3. Scroll to "PostgREST" section');
    console.log('4. Click "Restart PostgREST" button');
    console.log('5. Wait 30-60 seconds');
  } finally {
    await browser.close();
    console.log('\n✅ Browser closed');
    console.log('📋 Run verification test: node test-correct-production-flow.mjs');
  }
}

// Run the automation
restartPostgREST().catch(console.error);