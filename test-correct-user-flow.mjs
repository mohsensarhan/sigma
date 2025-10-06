#!/usr/bin/env node

/**
 * CORRECT User Flow Test
 * Tests the actual production flow: Donors Page → Donation → SMS → Journey Viewer
 */

import puppeteer from 'puppeteer';
import { writeFileSync, mkdirSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://sdmjetiogbvgzqsvcuth.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkbWpldGlvZ2J2Z3pxc3ZjdXRoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTU1MDg4NywiZXhwIjoyMDc1MTI2ODg3fQ.AnIFEN2u59ME4ETrk7mCHwXjg34OXvnt4VAXlIJ-pfc';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const RESULTS_DIR = './test-results/correct-flow';
mkdirSync(RESULTS_DIR, { recursive: true });

const consoleLogs = [];
const testResults = {
  timestamp: new Date().toISOString(),
  tests: [],
  summary: { passed: 0, failed: 0 }
};

function log(message, type = 'info') {
  const emoji = { 'info': 'ℹ️', 'success': '✅', 'error': '❌', 'test': '🧪' }[type] || 'ℹ️';
  console.log(`${emoji} [${type.toUpperCase()}] ${message}`);
  consoleLogs.push({ timestamp: new Date().toISOString(), type, message });
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

async function runCorrectFlow() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1400, height: 900 },
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();
  
  page.on('console', msg => {
    const text = msg.text();
    if (!text.includes('DevTools')) {
      consoleLogs.push({ type: msg.type(), text });
    }
  });

  try {
    log('🚀 Starting CORRECT User Flow Test', 'test');
    log('='.repeat(80));

    // Clear test data
    log('\n🧹 Clearing test data...');
    await supabase.from('journey_events').delete().neq('id', '');
    await supabase.from('journeys').delete().neq('id', '');
    await supabase.from('sms_logs').delete().neq('id', '');
    await supabase.from('donations').delete().neq('id', '');
    log('✅ Test data cleared');

    // =====================================================================
    // TEST 1: Navigate to Donors Page (CORRECT ENTRY POINT)
    // =====================================================================
    log('\n📋 TEST 1: Navigate to Donors Page', 'test');
    
    await page.goto('http://localhost:5173/donors', { waitUntil: 'networkidle2' });
    await wait(3000);
    await screenshot(page, '01-donors-page');
    
    const hasDonorCards = await page.$$('div[class*="p-6"]');
    addTest('Donors Page Loads', hasDonorCards.length >= 4);

    // =====================================================================
    // TEST 2: Click Donate Button (CORRECT ACTION)
    // =====================================================================
    log('\n📋 TEST 2: Trigger Donation from Donors Page', 'test');
    
    // Find and click a donate button using evaluate
    const donateButton = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(btn => btn.textContent?.includes('DONATE'));
    });
    
    if (donateButton && await donateButton.asElement()) {
      log('🎯 Clicking first DONATE button...');
      await donateButton.asElement().click();
      await wait(2000);
      await screenshot(page, '02-donation-triggered');
      addTest('Donate Button Clicked', true);
    } else {
      log('❌ No Donate buttons found!', 'error');
      addTest('Donate Button Clicked', false);
    }

    // Wait for journey to be created
    await wait(3000);

    // Extract journey ID from console
    const journeyLog = consoleLogs.find(log => log.text && log.text.includes('🎯 New journey started:'));
    const journeyId = journeyLog?.text?.match(/EFB-\d+-\d+-\d+/)?.[0];
    
    if (journeyId) {
      log(`📦 Journey ID: ${journeyId}`, 'success');
      testResults.journeyId = journeyId;
      addTest('Journey Created', true, { journeyId });
    } else {
      log('❌ Failed to extract journey ID', 'error');
      addTest('Journey Created', false);
    }

    // =====================================================================
    // TEST 3: Verify Journey in Supabase
    // =====================================================================
    log('\n📋 TEST 3: Verify Journey Saved to Supabase', 'test');
    
    await wait(2000);
    
    if (journeyId) {
      const { data: journeyData, error } = await supabase
        .from('journeys')
        .select('*')
        .eq('id', journeyId)
        .single();
      
      if (error) {
        log(`❌ Journey NOT in Supabase: ${error.message}`, 'error');
        addTest('Journey Persisted to Supabase', false);
      } else {
        log(`✅ Journey in Supabase: ${journeyData.id}`, 'success');
        log(`   Status: ${journeyData.status}, Stage: ${journeyData.current_stage}`, 'info');
        addTest('Journey Persisted to Supabase', true, journeyData);
      }
    }

    // =====================================================================
    // TEST 4: Navigate to SMS Inbox (CORRECT NEXT STEP)
    // =====================================================================
    log('\n📋 TEST 4: Check SMS Inbox for Notification', 'test');
    
    await page.goto('http://localhost:5173/sms', { waitUntil: 'networkidle2' });
    await wait(3000);
    await screenshot(page, '03-sms-inbox');
    
    const smsMessages = await page.$$('div[class*="p-3"][class*="bg-gray-800"]');
    log(`📨 SMS Inbox shows ${smsMessages.length} messages`);
    addTest('SMS Notification Sent', smsMessages.length >= 1, { count: smsMessages.length });

    // =====================================================================
    // TEST 5: Click SMS Link to Journey Viewer (CORRECT FLOW)
    // =====================================================================
    log('\n📋 TEST 5: Navigate to Journey Viewer via SMS Link', 'test');
    
    if (smsMessages.length > 0) {
      const firstSMS = smsMessages[0];
      const trackingLink = await firstSMS.$('button[class*="font-mono"]');
      
      if (trackingLink) {
        log('🔗 Clicking tracking link in SMS...');
        await trackingLink.click();
        await wait(3000);
        await screenshot(page, '04-journey-viewer');
        
        const journeyMap = await page.$('canvas');
        addTest('Journey Viewer Loads from SMS', !!journeyMap);
        
        // Check for journey markers
        const markers = await page.$$('div[class*="absolute"][class*="rounded-full"]');
        log(`📍 Journey has ${markers.length} waypoint markers`);
        addTest('Journey Waypoints Display', markers.length === 5);
      } else {
        log('❌ No tracking link found in SMS', 'error');
        addTest('Journey Viewer Loads from SMS', false);
      }
    }

    // =====================================================================
    // TEST 6: Wait for Journey Progression
    // =====================================================================
    log('\n📋 TEST 6: Journey Progression Through Stages', 'test');
    
    log('⏳ Waiting for journey to progress (15 seconds)...');
    await wait(15000);
    await screenshot(page, '05-journey-progressed');
    
    // Check progression in Supabase
    if (journeyId) {
      const { data: finalJourney } = await supabase
        .from('journeys')
        .select('current_stage, status')
        .eq('id', journeyId)
        .single();
      
      if (finalJourney) {
        log(`✅ Final state: Stage ${finalJourney.current_stage}, Status: ${finalJourney.status}`, 'success');
        addTest('Journey Progressed', finalJourney.current_stage >= 2);
        
        // Check SMS logs
        const { data: smsLogs } = await supabase
          .from('sms_logs')
          .select('*')
          .eq('journey_id', journeyId);
        
        log(`📱 Total SMS sent: ${smsLogs?.length || 0}`, 'info');
        addTest('Multiple SMS Notifications', (smsLogs?.length || 0) >= 2);
      }
    }

    // =====================================================================
    // TEST 7: Return to Main Map
    // =====================================================================
    log('\n📋 TEST 7: Return to Main Map View', 'test');
    
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
    await wait(3000);
    await screenshot(page, '06-main-map-final');
    
    const mapCanvas = await page.$('canvas');
    addTest('Main Map Displays', !!mapCanvas);

    // =====================================================================
    // FINAL SUMMARY
    // =====================================================================
    log('\n' + '='.repeat(80));
    log('📊 FINAL TEST SUMMARY', 'test');
    log('='.repeat(80));
    
    log(`✅ Tests Passed: ${testResults.summary.passed}`, 'success');
    log(`❌ Tests Failed: ${testResults.summary.failed}`, testResults.summary.failed > 0 ? 'error' : 'info');
    
    const passRate = (testResults.summary.passed / (testResults.summary.passed + testResults.summary.failed)) * 100;
    log(`\n🎯 Pass Rate: ${passRate.toFixed(1)}%`, passRate === 100 ? 'success' : 'info');
    
    // Save results
    writeFileSync(`${RESULTS_DIR}/test-report.json`, JSON.stringify(testResults, null, 2));
    writeFileSync(`${RESULTS_DIR}/console-logs.json`, JSON.stringify(consoleLogs, null, 2));
    
    log('\n📄 Reports saved:', 'info');
    log(`   ${RESULTS_DIR}/test-report.json`);
    log(`   ${RESULTS_DIR}/console-logs.json`);
    
    log('\n' + '='.repeat(80));
    if (passRate === 100) {
      log('🎉 ALL TESTS PASSED - CORRECT FLOW VERIFIED!', 'success');
    } else {
      log('⚠️  SOME TESTS FAILED - REVIEW REQUIRED', 'info');
    }
    log('='.repeat(80) + '\n');

  } catch (error) {
    log(`❌ Test execution failed: ${error.message}`, 'error');
    console.error(error.stack);
  } finally {
    await browser.close();
  }
}

runCorrectFlow().catch(console.error);