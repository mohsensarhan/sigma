/**
 * Simple Production Verification Test
 * Tests the complete flow with proper wait times and clear explanations
 */

import puppeteer from 'puppeteer';
import { writeFileSync, mkdirSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://sdmjetiogbvgzqsvcuth.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkbWpldGlvZ2J2Z3pxc3ZjdXRoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTU1MDg4NywiZXhwIjoyMDc1MTI2ODg3fQ.AnIFEN2u59ME4ETrk7mCHwXjg34OXvnt4VAXlIJ-pfc';

const RESULTS_DIR = './test-results/simple-verification';
mkdirSync(RESULTS_DIR, { recursive: true });

const testResults = {
  timestamp: new Date().toISOString(),
  tests: [],
  summary: { passed: 0, failed: 0 }
};

function log(message, type = 'info') {
  const emoji = { 'info': 'ℹ️', 'success': '✅', 'error': '❌', 'test': '🧪' }[type] || 'ℹ️';
  console.log(`${emoji} [${type.toUpperCase()}] ${message}`);
}

function addTest(name, passed, details = {}) {
  testResults.tests.push({ name, passed, details });
  testResults.summary[passed ? 'passed' : 'failed']++;
  log(`${passed ? '✅ PASS' : '❌ FAIL'}: ${name}`, passed ? 'success' : 'error');
}

async function screenshot(page, name) {
  const path = `${RESULTS_DIR}/${name}.png`;
  await page.screenshot({ path, fullPage: true });
  log(`📸 Screenshot: ${name}.png`);
}

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTest() {
  // Create fresh Supabase client
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  log('🔄 Created fresh Supabase client');

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1400, height: 900 },
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();
  const consoleLogs = [];
  
  page.on('console', msg => {
    const text = msg.text();
    if (!text.includes('DevTools')) {
      consoleLogs.push({ type: msg.type(), text });
    }
  });

  try {
    log('🚀 Starting Simple Production Verification Test', 'test');
    log('='.repeat(80));

    // TEST 1: Initial Load
    log('\n📋 TEST 1: Initial Load', 'test');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
    await wait(3000);
    await screenshot(page, '01-initial-load');
    
    const hasMap = await page.$('canvas');
    addTest('Map Canvas Renders', !!hasMap);

    // TEST 2: Verify Supabase Tables
    log('\n📋 TEST 2: Verify Supabase Tables', 'test');
    const tables = ['journeys', 'journey_events', 'donations', 'sms_logs', 'donor_profiles'];
    let allTablesExist = true;
    
    for (const table of tables) {
      const { error } = await supabase.from(table).select('id', { count: 'exact', head: true });
      if (error) {
        log(`❌ ${table}: ${error.message}`, 'error');
        allTablesExist = false;
      } else {
        log(`✅ ${table}: Accessible`, 'success');
      }
    }
    addTest('All Supabase Tables Accessible', allTablesExist);

    // TEST 3: Create Donation
    log('\n📋 TEST 3: Create Donation via Admin Panel', 'test');
    log('   Purpose: Trigger a donation and verify it registers');
    
    // Clear old data
    await supabase.from('journey_events').delete().neq('id', '');
    await supabase.from('journeys').delete().neq('id', '');
    await supabase.from('sms_logs').delete().neq('id', '');
    await supabase.from('donations').delete().neq('id', '');
    
    // Open admin panel
    const notch = await page.$('div[class*="fixed left-0"]');
    if (notch) {
      await notch.click();
      await wait(2000);
      await screenshot(page, '02-admin-panel-open');
      
      // Find and click General Donation button
      const button = await page.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find(btn => btn.textContent?.includes('General Donation'));
      });
      
      if (button && await button.asElement()) {
        await button.asElement().click();
        log('🎯 Triggered General Donation', 'success');
        await wait(3000);
        await screenshot(page, '03-donation-triggered');
        
        // Extract journey ID
        const journeyLog = consoleLogs.find(log => log.text && log.text.includes('🎯 New journey started:'));
        const journeyId = journeyLog?.text?.match(/EFB-\d+-\d+-\d+/)?.[0];
        
        if (journeyId) {
          log(`📦 Journey ID: ${journeyId}`, 'success');
          addTest('Journey Created', true, { journeyId });
          
          // TEST 4: Wait for Full Journey Progression
          log('\n📋 TEST 4: Journey Progression (30 seconds)', 'test');
          log('   Purpose: Wait for all 5 stages to complete (5 sec per stage = 25 sec)');
          log('   What happens: Journey progresses HQ → Warehouse → Transport → Distribution → Beneficiary');
          
          for (let i = 5; i <= 30; i += 5) {
            await wait(5000);
            log(`   ⏳ ${i} seconds elapsed...`);
          }
          
          await screenshot(page, '04-journey-completed');
          
          // Check console for all stages
          const stage2 = consoleLogs.some(log => log.text && log.text.includes('Stage 2/5'));
          const stage3 = consoleLogs.some(log => log.text && log.text.includes('Stage 3/5'));
          const stage4 = consoleLogs.some(log => log.text && log.text.includes('Stage 4/5'));
          const stage5 = consoleLogs.some(log => log.text && log.text.includes('Stage 5/5'));
          
          addTest('Journey Reached Stage 2', stage2);
          addTest('Journey Reached Stage 3', stage3);
          addTest('Journey Reached Stage 4', stage4);
          addTest('Journey Reached Stage 5', stage5);
          
          // TEST 5: Verify Data in Supabase
          log('\n📋 TEST 5: Verify Data Saved to Supabase', 'test');
          log('   Purpose: Check if journey, events, and SMS were saved to database');
          
          await wait(3000); // Extra time for async writes
          
          // Check journey
          const { data: journeyData, error: journeyError } = await supabase
            .from('journeys')
            .select('*')
            .eq('id', journeyId)
            .single();
          
          if (!journeyError && journeyData) {
            log(`✅ Journey in Supabase: ${journeyData.id} (Stage ${journeyData.current_stage})`, 'success');
            addTest('Journey Saved to Supabase', true);
          } else {
            log(`❌ Journey NOT in Supabase: ${journeyError?.message}`, 'error');
            addTest('Journey Saved to Supabase', false);
          }
          
          // Check events
          const { data: events } = await supabase
            .from('journey_events')
            .select('*')
            .eq('journey_id', journeyId);
          
          log(`📍 Journey Events: ${events?.length || 0}/5`, events?.length === 5 ? 'success' : 'error');
          addTest('All 5 Journey Events Created', (events?.length || 0) === 5);
          
          // Check SMS
          const { data: smsData } = await supabase
            .from('sms_logs')
            .select('*')
            .eq('journey_id', journeyId);
          
          log(`📱 SMS Logs: ${smsData?.length || 0}/5`, smsData?.length >= 5 ? 'success' : 'error');
          addTest('SMS Notifications Sent', (smsData?.length || 0) >= 5);
          
          // TEST 6: Check SMS Inbox Page
          log('\n📋 TEST 6: SMS Inbox Page', 'test');
          log('   Purpose: Verify SMS messages display correctly from Supabase');
          
          await page.goto('http://localhost:5173/sms', { waitUntil: 'networkidle2' });
          await wait(5000); // Wait for Supabase data to load
          await screenshot(page, '05-sms-inbox');
          
          const smsMessages = await page.$$('div[class*="p-3"][class*="bg-gray-800"]');
          log(`📨 SMS Inbox shows ${smsMessages.length} messages`);
          addTest('SMS Inbox Displays Messages', smsMessages.length >= 5);
          
          // TEST 7: Check Donors Page
          log('\n📋 TEST 7: Donors Page', 'test');
          log('   Purpose: Verify donation history displays from Supabase');
          
          await page.goto('http://localhost:5173/donors', { waitUntil: 'networkidle2' });
          await wait(5000);
          await screenshot(page, '06-donors-page');
          
          const donorCards = await page.$$('div[class*="p-6"][class*="bg-black/40"]');
          addTest('Donor Cards Display', donorCards.length >= 4);
          
          // TEST 8: Browser Refresh Persistence
          log('\n📋 TEST 8: Browser Refresh Test', 'test');
          log('   Purpose: Verify data persists after page reload');
          
          await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
          await wait(3000);
          await page.reload({ waitUntil: 'networkidle2' });
          await wait(5000);
          await screenshot(page, '07-after-refresh');
          
          const markersAfterRefresh = await page.$$('div[class*="absolute"][class*="rounded-full"]');
          addTest('Journey Persists After Refresh', markersAfterRefresh.length >= 5);
          
        } else {
          addTest('Journey Created', false, { error: 'Could not extract journey ID' });
        }
      } else {
        addTest('General Donation Button Found', false);
      }
    } else {
      addTest('Admin Panel Opens', false);
    }

    // FINAL SUMMARY
    log('\n' + '='.repeat(80));
    log('📊 FINAL TEST SUMMARY', 'test');
    log('='.repeat(80));
    log(`✅ Tests Passed: ${testResults.summary.passed}`, 'success');
    log(`❌ Tests Failed: ${testResults.summary.failed}`, testResults.summary.failed > 0 ? 'error' : 'info');
    
    const passRate = (testResults.summary.passed / (testResults.summary.passed + testResults.summary.failed)) * 100;
    log(`\n🎯 Pass Rate: ${passRate.toFixed(1)}%`, passRate === 100 ? 'success' : 'error');
    
    // Save results
    writeFileSync(`${RESULTS_DIR}/test-report.json`, JSON.stringify(testResults, null, 2));
    log('\n📄 Report saved: test-report.json');
    
    if (passRate === 100) {
      log('\n🎉 ALL TESTS PASSED - SYSTEM 100% PRODUCTION READY!', 'success');
    } else {
      log('\n⚠️  SOME TESTS FAILED - REVIEW REQUIRED', 'error');
    }
    log('='.repeat(80) + '\n');

  } catch (error) {
    log(`❌ Test execution failed: ${error.message}`, 'error');
    console.error(error.stack);
  } finally {
    await browser.close();
  }
}

runTest().catch(console.error);