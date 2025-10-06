/**
 * Test Correct Production Flow with Fresh Supabase Client
 * This test creates a fresh Supabase client to bypass any schema cache issues
 */

import puppeteer from 'puppeteer';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Create fresh Supabase client with explicit schema
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

// Create client with fresh schema detection
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'x-client-info': 'test-correct-flow',
    },
  },
});

console.log('✅ Created fresh Supabase client with explicit schema');

// Test configuration
const TEST_CONFIG = {
  appUrl: 'http://localhost:5173',
  stepDuration: 3000, // 3 seconds per stage
  screenshotDir: 'test-results/correct-production-flow',
};

// Ensure screenshot directory exists
await fs.mkdir(TEST_CONFIG.screenshotDir, { recursive: true });

async function takeScreenshot(page, name) {
  const filename = path.join(TEST_CONFIG.screenshotDir, `${name}.png`);
  await page.screenshot({ path: filename, fullPage: true });
  console.log(`📸 Screenshot saved: ${name}.png`);
}

async function clearTestData() {
  console.log('🧹 Clearing test data from Supabase...');
  
  try {
    // Clear in reverse dependency order
    await supabase.from('sms_logs').delete().neq('id', '');
    await supabase.from('donations').delete().neq('id', '');
    await supabase.from('journey_events').delete().neq('journey_id', '');
    await supabase.from('journeys').delete().neq('id', '');
    
    console.log('✅ Test data cleared');
  } catch (error) {
    console.error('⚠️ Error clearing test data:', error.message);
  }
}

async function verifySupabaseConnection() {
  console.log('\n🔍 Verifying Supabase tables...');
  
  const tables = ['journeys', 'journey_events', 'donations', 'sms_logs', 'donor_profiles'];
  let allTablesExist = true;
  
  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.error(`❌ ${table}: ${error.message}`);
        allTablesExist = false;
      } else {
        console.log(`✅ ${table}: Accessible (${count || 0} records)`);
      }
    } catch (err) {
      console.error(`❌ ${table}: ${err.message}`);
      allTablesExist = false;
    }
  }
  
  return allTablesExist;
}

async function runTest() {
  console.log('🚀 Starting Correct Production Flow Test');
  console.log('=' .repeat(80));
  
  // Verify Supabase connection first
  const tablesExist = await verifySupabaseConnection();
  if (!tablesExist) {
    console.error('❌ Supabase tables not accessible. Aborting test.');
    process.exit(1);
  }
  
  // Clear test data
  await clearTestData();
  
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--window-size=1200,800'],
    defaultViewport: { width: 1200, height: 800 }
  });
  
  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('✅') || text.includes('📦') || text.includes('🎯')) {
      console.log(`[Browser Console] ${text}`);
    }
  });
  
  let testResults = {
    passed: 0,
    failed: 0,
    journeyId: null,
    errors: []
  };
  
  try {
    // Step 1: Load application
    console.log('\n📋 Step 1: Loading application...');
    await page.goto(TEST_CONFIG.appUrl, { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    await takeScreenshot(page, '01-initial-load');
    
    // Step 2: Open admin panel and configure
    console.log('\n📋 Step 2: Configuring admin panel...');
    const adminNotch = await page.$('.fixed.top-4.right-4');
    if (!adminNotch) throw new Error('Admin panel notch not found');
    
    await adminNotch.click();
    await page.waitForTimeout(500);
    
    // Set step duration to 3 seconds
    const durationInput = await page.$('input[type="number"][value="10"]');
    if (durationInput) {
      await durationInput.click({ clickCount: 3 });
      await durationInput.type('3');
      console.log('✅ Set step duration to 3 seconds');
    }
    
    await takeScreenshot(page, '02-admin-configured');
    
    // Step 3: Trigger donation
    console.log('\n📋 Step 3: Triggering donation...');
    const generalDonationBtn = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(btn => btn.textContent.includes('General Donation'));
    });
    
    if (!generalDonationBtn) throw new Error('General Donation button not found');
    
    await generalDonationBtn.click();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Extract journey ID from console
    const journeyId = await page.evaluate(() => {
      const logs = window.consoleCapture || [];
      const journeyLog = logs.find(log => log.includes('Journey registered:'));
      if (journeyLog) {
        const match = journeyLog.match(/EFB-\d+-\d+-\d+/);
        return match ? match[0] : null;
      }
      return null;
    });
    
    if (journeyId) {
      testResults.journeyId = journeyId;
      console.log(`✅ Journey created: ${journeyId}`);
    } else {
      // Try to extract from page
      const extractedId = await page.evaluate(() => {
        const activeJourney = window.activeJourneys?.[0];
        return activeJourney?.id || null;
      });
      
      if (extractedId) {
        testResults.journeyId = extractedId;
        console.log(`✅ Journey created: ${extractedId}`);
      }
    }
    
    await takeScreenshot(page, '03-donation-triggered');
    
    // Step 4: Verify journey in Supabase
    console.log('\n📋 Step 4: Verifying journey in Supabase...');
    if (testResults.journeyId) {
      const { data: journey, error } = await supabase
        .from('journeys')
        .select('*')
        .eq('id', testResults.journeyId)
        .single();
      
      if (error) {
        console.error(`❌ Journey not found in Supabase: ${error.message}`);
        testResults.errors.push('Journey not persisted to Supabase');
        testResults.failed++;
      } else {
        console.log(`✅ Journey found in Supabase:`, {
          id: journey.id,
          status: journey.status,
          current_stage: journey.current_stage
        });
        testResults.passed++;
      }
    }
    
    // Step 5: Wait for journey progression
    console.log('\n📋 Step 5: Monitoring journey progression...');
    console.log('⏳ Waiting 15 seconds for journey to progress through stages...');
    
    for (let i = 0; i < 5; i++) {
      await page.waitForTimeout(3000);
      await takeScreenshot(page, `04-stage-${i + 1}`);
      
      // Check stage progression
      const currentStage = await page.evaluate(() => {
        const activeJourney = window.activeJourneys?.[0];
        return activeJourney?.currentStage || 0;
      });
      
      console.log(`  Stage ${i + 1}: ${currentStage >= i + 1 ? '✅' : '❌'}`);
    }
    
    // Step 6: Verify SMS logs
    console.log('\n📋 Step 6: Verifying SMS logs...');
    const { data: smsLogs, error: smsError } = await supabase
      .from('sms_logs')
      .select('*')
      .eq('journey_id', testResults.journeyId);
    
    if (smsError) {
      console.error(`❌ Failed to fetch SMS logs: ${smsError.message}`);
      testResults.failed++;
    } else {
      console.log(`✅ SMS logs found: ${smsLogs?.length || 0} messages`);
      if (smsLogs?.length === 5) {
        testResults.passed++;
      } else {
        testResults.failed++;
        testResults.errors.push(`Expected 5 SMS, got ${smsLogs?.length || 0}`);
      }
    }
    
    // Step 7: Check SMS inbox
    console.log('\n📋 Step 7: Checking SMS inbox...');
    await page.goto(`${TEST_CONFIG.appUrl}/sms`, { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    await takeScreenshot(page, '05-sms-inbox');
    
    const smsCount = await page.evaluate(() => {
      const messages = document.querySelectorAll('.bg-white.rounded-lg.shadow');
      return messages.length;
    });
    
    console.log(`📨 SMS Inbox shows ${smsCount} messages`);
    if (smsCount > 0) {
      testResults.passed++;
    } else {
      testResults.failed++;
      testResults.errors.push('No SMS messages in inbox');
    }
    
    // Step 8: Check journey viewer
    console.log('\n📋 Step 8: Checking journey viewer...');
    if (testResults.journeyId) {
      await page.goto(`${TEST_CONFIG.appUrl}/journey/${testResults.journeyId}`, { waitUntil: 'networkidle0' });
      await new Promise(resolve => setTimeout(resolve, 2000));
      await takeScreenshot(page, '06-journey-viewer');
      
      const viewerLoaded = await page.evaluate(() => {
        return document.querySelector('.mapboxgl-canvas') !== null;
      });
      
      if (viewerLoaded) {
        console.log('✅ Journey viewer loaded successfully');
        testResults.passed++;
      } else {
        console.log('❌ Journey viewer failed to load');
        testResults.failed++;
      }
    }
    
    // Step 9: Final data integrity check
    console.log('\n📋 Step 9: Final data integrity check...');
    
    // Check journey events
    const { data: events } = await supabase
      .from('journey_events')
      .select('*')
      .eq('journey_id', testResults.journeyId);
    
    console.log(`📍 Journey events: ${events?.length || 0}/5`);
    
    // Check donation record
    const { data: donations } = await supabase
      .from('donations')
      .select('*')
      .eq('journey_id', testResults.journeyId);
    
    console.log(`💰 Donation records: ${donations?.length || 0}`);
    
    if (events?.length === 5 && donations?.length > 0) {
      testResults.passed++;
    } else {
      testResults.failed++;
      testResults.errors.push('Incomplete data in Supabase');
    }
    
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    testResults.errors.push(error.message);
    testResults.failed++;
  } finally {
    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(80));
    console.log(`✅ Passed: ${testResults.passed}/8`);
    console.log(`❌ Failed: ${testResults.failed}/8`);
    
    if (testResults.errors.length > 0) {
      console.log('\n⚠️ Errors encountered:');
      testResults.errors.forEach(err => console.log(`  - ${err}`));
    }
    
    if (testResults.passed === 8) {
      console.log('\n🎉 ALL TESTS PASSED! Production flow is working correctly.');
    } else {
      console.log('\n⚠️ Some tests failed. Review the errors above.');
    }
    
    // Save results
    await fs.writeFile(
      path.join(TEST_CONFIG.screenshotDir, 'test-results.json'),
      JSON.stringify(testResults, null, 2)
    );
    
    await browser.close();
    process.exit(testResults.failed > 0 ? 1 : 0);
  }
}

// Run the test
runTest().catch(console.error);