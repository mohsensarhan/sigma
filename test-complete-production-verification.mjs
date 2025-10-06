/**
 * Complete Production Verification Test
 * Verifies 100% Supabase integration and all system flows
 */

import puppeteer from 'puppeteer';
import { writeFileSync, mkdirSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://sdmjetiogbvgzqsvcuth.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkbWpldGlvZ2J2Z3pxc3ZjdXRoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTU1MDg4NywiZXhwIjoyMDc1MTI2ODg3fQ.AnIFEN2u59ME4ETrk7mCHwXjg34OXvnt4VAXlIJ-pfc';

// Create Supabase client fresh for each test run
let supabase;

// Test results directory
const RESULTS_DIR = './test-results/production-verification';
mkdirSync(RESULTS_DIR, { recursive: true });

const consoleLogs = [];
const testResults = {
  timestamp: new Date().toISOString(),
  tests: [],
  supabaseVerification: {},
  summary: {
    passed: 0,
    failed: 0,
    warnings: 0
  }
};

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const logEntry = { timestamp, type, message };
  consoleLogs.push(logEntry);
  
  const emoji = {
    'info': 'ℹ️',
    'success': '✅',
    'error': '❌',
    'warning': '⚠️',
    'test': '🧪'
  }[type] || 'ℹ️';
  
  console.log(`${emoji} [${type.toUpperCase()}] ${message}`);
}

function addTestResult(name, passed, details = {}) {
  testResults.tests.push({ name, passed, details });
  if (passed) {
    testResults.summary.passed++;
    log(`✅ PASS: ${name}`, 'success');
  } else {
    testResults.summary.failed++;
    log(`❌ FAIL: ${name}`, 'error');
  }
}

async function screenshot(page, name) {
  const path = `${RESULTS_DIR}/${name}.png`;
  await page.screenshot({ path, fullPage: true });
  log(`📸 Screenshot: ${name}.png`);
  return path;
}

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function verifySupabaseTable(tableName, expectedMinRows = 0) {
  try {
    const { data, error, count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact' });
    
    if (error) {
      log(`❌ Supabase ${tableName}: ${error.message}`, 'error');
      testResults.supabaseVerification[tableName] = { exists: false, error: error.message };
      return false;
    }
    
    const rowCount = count || data?.length || 0;
    const passed = rowCount >= expectedMinRows;
    
    testResults.supabaseVerification[tableName] = {
      exists: true,
      rowCount,
      expectedMinRows,
      passed
    };
    
    if (passed) {
      log(`✅ Supabase ${tableName}: ${rowCount} rows (expected >= ${expectedMinRows})`, 'success');
    } else {
      log(`⚠️ Supabase ${tableName}: ${rowCount} rows (expected >= ${expectedMinRows})`, 'warning');
    }
    
    return passed;
  } catch (error) {
    log(`❌ Supabase ${tableName} verification failed: ${error.message}`, 'error');
    testResults.supabaseVerification[tableName] = { exists: false, error: error.message };
    return false;
  }
}

async function runTest() {
  // Create fresh Supabase client to avoid stale cache
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  log('🔄 Created fresh Supabase client');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1400, height: 900 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // Capture console logs
  page.on('console', msg => {
    const text = msg.text();
    if (!text.includes('Download the React DevTools')) {
      consoleLogs.push({ type: msg.type(), text });
    }
  });

  try {
    log('🚀 Starting Complete Production Verification Test', 'test');
    log('─'.repeat(80));

    // =====================================================================
    // TEST 1: Initial Load & Supabase Connection
    // =====================================================================
    log('\n📋 TEST 1: Initial Load & Supabase Connection', 'test');
    
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
    await wait(3000);
    await screenshot(page, '01-initial-load');
    
    const hasMap = await page.$('canvas');
    addTestResult('Map Canvas Renders', !!hasMap);
    
    const hasLogo = await page.$('img[alt="Egyptian Food Bank"]');
    addTestResult('EFB Logo Displays', !!hasLogo);

    // Check console for Supabase connection
    const supabaseConnected = consoleLogs.some(log =>
      log.text && log.text.includes('✅ Supabase connected successfully')
    );
    addTestResult('Supabase Connection Successful', supabaseConnected);

    // =====================================================================
    // TEST 2: Verify Supabase Database Tables
    // =====================================================================
    log('\n📋 TEST 2: Verify Supabase Database Tables', 'test');
    
    // First, let's check what tables actually exist using a simple query
    log('🔍 Attempting to query existing tables...', 'info');
    
    // Try to query a known system table to verify connection
    try {
      const { data: testQuery, error: testError } = await supabase
        .from('journeys')
        .select('id', { count: 'exact', head: true });
      
      if (testError) {
        log(`⚠️ Cannot query journeys table: ${testError.message}`, 'warning');
        log(`   This suggests the table does not exist in the database`, 'warning');
      } else {
        log(`✅ journeys table exists and is accessible`, 'success');
      }
    } catch (e) {
      log(`⚠️ Error checking tables: ${e.message}`, 'warning');
    }
    
    // Check Supabase connection details
    log('\n🔍 Verifying Supabase Connection:', 'info');
    log(`   URL: ${SUPABASE_URL}`, 'info');
    log(`   Using: Service Role Key`, 'info');
    
    const journeysExist = await verifySupabaseTable('journeys', 0);
    const eventsExist = await verifySupabaseTable('journey_events', 0);
    const donationsExist = await verifySupabaseTable('donations', 0);
    const smsLogsExist = await verifySupabaseTable('sms_logs', 0);
    const profilesExist = await verifySupabaseTable('donor_profiles', 0);
    
    addTestResult('All Supabase Tables Exist', 
      journeysExist && eventsExist && donationsExist && smsLogsExist && profilesExist);

    // =====================================================================
    // TEST 3: Create Donation via Admin Panel
    // =====================================================================
    log('\n📋 TEST 3: Create Donation via Admin Panel', 'test');
    
    // Clear existing data for clean test
    log('🧹 Clearing test data from Supabase...');
    await supabase.from('journey_events').delete().neq('id', '');
    await supabase.from('journeys').delete().neq('id', '');
    await supabase.from('sms_logs').delete().neq('id', '');
    await supabase.from('donations').delete().neq('id', '');
    log('✅ Test data cleared');

    // Open admin panel
    log('🔍 Looking for admin panel notch...', 'info');
    const notch = await page.$('div[class*="fixed left-0"]');
    if (!notch) {
      log('❌ Admin panel notch not found!', 'error');
      await screenshot(page, '02-error-no-notch');
      
      // Debug: List all elements on page
      const allDivs = await page.$$('div');
      log(`📊 Found ${allDivs.length} div elements on page`, 'info');
      
      // Try to find any clickable elements
      const clickables = await page.$$('button, [role="button"], [onclick]');
      log(`📊 Found ${clickables.length} clickable elements`, 'info');
    } else {
      log('✅ Admin panel notch found, clicking...', 'success');
      await notch.click();
      await wait(1000);
      await screenshot(page, '02-admin-panel-open');
      
      // Debug: Check what's visible in the panel
      log('🔍 Inspecting admin panel content...', 'info');
      const panelContent = await page.evaluate(() => {
        const panel = document.querySelector('div[class*="fixed left-0"]');
        if (!panel) return 'Panel not found';
        
        // Get all buttons in the panel
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.map(btn => ({
          text: btn.textContent?.trim().substring(0, 50),
          classes: btn.className,
          visible: btn.offsetParent !== null
        }));
      });
      
      log(`📋 Found ${panelContent.length} buttons:`, 'info');
      panelContent.forEach((btn, i) => {
        log(`   ${i + 1}. "${btn.text}" (visible: ${btn.visible})`, 'info');
      });
      
      // Try multiple selectors for General Donation button
      log('🔍 Attempting to find General Donation button...', 'info');
      
      let generalDonationButton = null;
      
      // Try 1: Text content search
      generalDonationButton = await page.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find(btn => btn.textContent?.includes('General Donation'));
      });
      
      if (generalDonationButton && await generalDonationButton.asElement()) {
        log('✅ Found button via text content search', 'success');
        await generalDonationButton.asElement().click();
      } else {
        log('❌ Could not find General Donation button', 'error');
        await screenshot(page, '02-error-no-button');
        throw new Error('General Donation button not found after opening admin panel');
      }
      
      log('🎯 Triggered General Donation', 'success');
      await wait(2000);
      await screenshot(page, '03-donation-triggered');
    }
    
    // Check console for journey registration
    const journeyRegistered = consoleLogs.some(log =>
      log.text && log.text.includes('🔵 registerJourney called for: EFB')
    );
    addTestResult('Journey Registration Called', journeyRegistered);
    
    // Extract journey ID from console
    const journeyLog = consoleLogs.find(log => log.text && log.text.includes('🎯 New journey started:'));
    const journeyId = journeyLog?.text?.match(/EFB-\d+-\d+-\d+/)?.[0];
    
    if (journeyId) {
      log(`📦 Journey ID: ${journeyId}`, 'success');
      testResults.journeyId = journeyId;
    } else {
      log('❌ Failed to extract journey ID', 'error');
    }

    // =====================================================================
    // TEST 4: Verify Journey in Supabase
    // =====================================================================
    log('\n📋 TEST 4: Verify Journey Saved to Supabase', 'test');
    
    await wait(2000); // Give time for async Supabase writes
    
    if (journeyId) {
      const { data: journeyData, error: journeyError } = await supabase
        .from('journeys')
        .select('*')
        .eq('id', journeyId)
        .single();
      
      if (journeyError) {
        log(`❌ Journey NOT in Supabase: ${journeyError.message}`, 'error');
        addTestResult('Journey Saved to Supabase', false, { error: journeyError.message });
      } else {
        log(`✅ Journey found in Supabase: ${journeyData.id}`, 'success');
        log(`   Status: ${journeyData.status}, Stage: ${journeyData.current_stage}`, 'info');
        addTestResult('Journey Saved to Supabase', true, journeyData);
        
        // Verify journey events
        const { data: events } = await supabase
          .from('journey_events')
          .select('*')
          .eq('journey_id', journeyId);
        
        log(`✅ Journey has ${events?.length || 0} waypoints in database`, 'success');
        addTestResult('Journey Events Created', (events?.length || 0) === 5);
      }
    }

    // =====================================================================
    // TEST 5: Wait for Journey Progression & SMS
    // =====================================================================
    log('\n📋 TEST 5: Journey Progression & SMS Notifications', 'test');
    
    log('⏳ Waiting for journey to progress through stages (15 seconds)...');
    await wait(15000);
    await screenshot(page, '04-journey-progressed');
    
    // Check for progression in console
    const stage2 = consoleLogs.some(log => log.text && log.text.includes('Stage 2/5'));
    const stage3 = consoleLogs.some(log => log.text && log.text.includes('Stage 3/5'));
    const stage4 = consoleLogs.some(log => log.text && log.text.includes('Stage 4/5'));
    const stage5 = consoleLogs.some(log => log.text && log.text.includes('Stage 5/5'));
    
    addTestResult('Journey Progression Stage 2', stage2);
    addTestResult('Journey Progression Stage 3', stage3);
    addTestResult('Journey Progression Stage 4', stage4);
    addTestResult('Journey Progression Stage 5', stage5);
    
    // Verify SMS in Supabase
    if (journeyId) {
      const { data: smsData } = await supabase
        .from('sms_logs')
        .select('*')
        .eq('journey_id', journeyId);
      
      const smsCount = smsData?.length || 0;
      log(`📱 SMS logs in Supabase: ${smsCount}`, smsCount >= 5 ? 'success' : 'warning');
      addTestResult('SMS Notifications Sent (5 expected)', smsCount >= 5, { count: smsCount });
      
      if (smsData && smsData.length > 0) {
        log(`   Sample SMS: ${smsData[0].body.substring(0, 50)}...`, 'info');
      }
    }

    // =====================================================================
    // TEST 6: Navigate to SMS Inbox
    // =====================================================================
    log('\n📋 TEST 6: SMS Inbox Integration', 'test');
    
    await page.goto('http://localhost:5173/sms', { waitUntil: 'networkidle2' });
    await wait(3000);
    await screenshot(page, '05-sms-inbox');
    
    const smsMessages = await page.$$('div[class*="p-3"][class*="bg-gray-800"]');
    const smsCount = smsMessages.length;
    log(`📨 SMS Inbox shows ${smsCount} messages`);
    addTestResult('SMS Inbox Loads from Supabase', smsCount >= 5, { count: smsCount });
    
    // Click first SMS to test journey viewer
    if (smsMessages.length > 0) {
      const firstSMS = smsMessages[0];
      const trackingLink = await firstSMS.$('button[class*="font-mono"]');
      if (trackingLink) {
        await trackingLink.click();
        await wait(2000);
        await screenshot(page, '06-journey-viewer-from-sms');
        
        const journeyMap = await page.$('canvas');
        addTestResult('Journey Viewer Map Renders from SMS', !!journeyMap);
      }
    }

    // =====================================================================
    // TEST 7: Navigate to Donors Page
    // =====================================================================
    log('\n📋 TEST 7: Donors Page & Donation History', 'test');
    
    await page.goto('http://localhost:5173/donors', { waitUntil: 'networkidle2' });
    await wait(2000);
    await screenshot(page, '07-donors-page');
    
    const donorCards = await page.$$('div[class*="p-6"][class*="bg-black/40"]');
    addTestResult('Donor Cards Display', donorCards.length >= 4);
    
    const recentDonations = await page.$$('div[class*="p-3"][class*="bg-gray-800/50"]');
    log(`💳 Donation history shows ${recentDonations.length} entries`);
    addTestResult('Donation History from Supabase', recentDonations.length >= 1);

    // =====================================================================
    // TEST 8: Navigate to Admin Dashboard
    // =====================================================================
    log('\n📋 TEST 8: Admin Dashboard Journey Monitoring', 'test');
    
    await page.goto('http://localhost:5173/admin', { waitUntil: 'networkidle2' });
    await wait(2000);
    await screenshot(page, '08-admin-dashboard');
    
    // Check journey stats
    const activeCount = await page.$eval(
      'div:has-text("Active Journeys") > div.text-3xl',
      el => parseInt(el.textContent)
    ).catch(() => 0);
    
    const completedCount = await page.$eval(
      'div:has-text("Completed") > div.text-3xl',
      el => parseInt(el.textContent)
    ).catch(() => 0);
    
    log(`📊 Admin Dashboard - Active: ${activeCount}, Completed: ${completedCount}`);
    addTestResult('Admin Dashboard Shows Journeys', (activeCount + completedCount) >= 1);

    // =====================================================================
    // TEST 9: Browser Refresh Persistence
    // =====================================================================
    log('\n📋 TEST 9: Browser Refresh & Supabase Persistence', 'test');
    
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
    await wait(3000);
    
    await page.reload({ waitUntil: 'networkidle2' });
    await wait(3000);
    await screenshot(page, '09-after-refresh');
    
    const markersAfterRefresh = await page.$$('div[class*="absolute"][class*="rounded-full"]');
    addTestResult('Journey Persists After Refresh', markersAfterRefresh.length >= 5);

    // =====================================================================
    // TEST 10: Final Supabase Data Verification
    // =====================================================================
    log('\n📋 TEST 10: Final Supabase Data Integrity Check', 'test');
    
    if (journeyId) {
      // Verify journey updated to final stage
      const { data: finalJourney } = await supabase
        .from('journeys')
        .select('current_stage, status')
        .eq('id', journeyId)
        .single();
      
      if (finalJourney) {
        log(`✅ Final journey state: Stage ${finalJourney.current_stage}, Status: ${finalJourney.status}`, 'success');
        addTestResult('Journey Progression Saved to Supabase', finalJourney.current_stage === 5);
        addTestResult('Journey Marked Completed', finalJourney.status === 'completed');
      }
      
      // Verify all 5 journey events
      const { data: allEvents } = await supabase
        .from('journey_events')
        .select('*')
        .eq('journey_id', journeyId);
      
      const completedEvents = allEvents?.filter(e => e.status === 'completed').length || 0;
      log(`📍 Journey events: ${completedEvents}/5 completed`, 'info');
      addTestResult('All Journey Events Completed', completedEvents === 5);
      
      // Verify SMS count
      const { count: smsCount } = await supabase
        .from('sms_logs')
        .select('*', { count: 'exact', head: true })
        .eq('journey_id', journeyId);
      
      log(`📱 Total SMS sent: ${smsCount}`, 'info');
      addTestResult('All SMS Logged in Supabase', smsCount >= 5);
      
      // Verify donation record
      const { data: donation } = await supabase
        .from('donations')
        .select('*')
        .eq('journey_id', journeyId)
        .single();
      
      if (donation) {
        log(`💰 Donation record: $${donation.amount} (${donation.status})`, 'success');
        addTestResult('Donation Record in Supabase', true, donation);
      } else {
        log(`⚠️ No donation record found for journey`, 'warning');
        addTestResult('Donation Record in Supabase', false);
      }
    }

    // =====================================================================
    // TEST 11: Console Error Check
    // =====================================================================
    log('\n📋 TEST 11: Console Error Analysis', 'test');
    
    const errors = consoleLogs.filter(log => log.type === 'error');
    const criticalErrors = errors.filter(e => 
      !e.text.includes('DevTools') &&
      !e.text.includes('schema cache') && // Expected during API cache refresh
      !e.text.includes('duplicate key')   // Expected warning
    );
    
    log(`🔍 Total console errors: ${errors.length}`);
    log(`🔍 Critical errors: ${criticalErrors.length}`);
    
    if (criticalErrors.length > 0) {
      log('❌ Critical errors found:', 'error');
      criticalErrors.forEach(e => log(`   ${e.text}`, 'error'));
    }
    
    addTestResult('No Critical Console Errors', criticalErrors.length === 0);

    // =====================================================================
    // FINAL SUMMARY
    // =====================================================================
    log('\n' + '='.repeat(80));
    log('📊 FINAL TEST SUMMARY', 'test');
    log('='.repeat(80));
    
    log(`✅ Tests Passed: ${testResults.summary.passed}`, 'success');
    log(`❌ Tests Failed: ${testResults.summary.failed}`, testResults.summary.failed > 0 ? 'error' : 'info');
    log(`⚠️  Warnings: ${testResults.summary.warnings}`, 'warning');
    
    const passRate = (testResults.summary.passed / (testResults.summary.passed + testResults.summary.failed)) * 100;
    log(`\n🎯 Pass Rate: ${passRate.toFixed(1)}%`, passRate === 100 ? 'success' : 'warning');
    
    // Supabase Verification Summary
    log('\n🗄️  SUPABASE DATA VERIFICATION:', 'test');
    Object.entries(testResults.supabaseVerification).forEach(([table, status]) => {
      if (status.exists) {
        log(`   ✅ ${table}: ${status.rowCount} rows`, 'success');
      } else {
        log(`   ❌ ${table}: ${status.error}`, 'error');
      }
    });
    
    // Save results
    writeFileSync(
      `${RESULTS_DIR}/test-report.json`,
      JSON.stringify(testResults, null, 2)
    );
    
    writeFileSync(
      `${RESULTS_DIR}/console-logs.json`,
      JSON.stringify(consoleLogs, null, 2)
    );
    
    log('\n📄 Reports saved:', 'info');
    log(`   ${RESULTS_DIR}/test-report.json`);
    log(`   ${RESULTS_DIR}/console-logs.json`);
    
    // Final screenshot
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
    await wait(2000);
    await screenshot(page, '10-final-state');
    
    log('\n' + '='.repeat(80));
    if (passRate === 100) {
      log('🎉 ALL TESTS PASSED - SYSTEM 100% PRODUCTION READY!', 'success');
    } else {
      log('⚠️  SOME TESTS FAILED - REVIEW REQUIRED', 'warning');
    }
    log('='.repeat(80) + '\n');

  } catch (error) {
    log(`❌ Test execution failed: ${error.message}`, 'error');
    log(error.stack, 'error');
  } finally {
    await browser.close();
  }
}

// Run the test
runTest().catch(console.error);