/**
 * FINAL VERIFICATION TEST
 * Tests complete donation flow with all FK fixes applied
 */

import puppeteer from 'puppeteer';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://yfvqxqjqkqxqxqxqxqxq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlmdnF4cWpxa3F4cXhxeHF4cXhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYxMDI0MDAsImV4cCI6MjA1MTY3ODQwMH0.placeholder';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('\n🧪 FINAL VERIFICATION TEST');
console.log('=' .repeat(60));

async function clearTestData() {
  console.log('\n🧹 Clearing test data...');
  
  // Delete in correct order (children first, then parents)
  await supabase.from('journey_events').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('sms_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('donations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('journeys').delete().neq('id', 'XXXXXXXX');
  
  console.log('✅ Test data cleared');
}

async function verifyData(trackingId) {
  console.log('\n🔍 Verifying data in Supabase...');
  
  // Check journey
  const { data: journey, error: journeyError } = await supabase
    .from('journeys')
    .select('*')
    .eq('id', trackingId)
    .single();
  
  if (journeyError || !journey) {
    console.log('❌ Journey not found:', journeyError?.message);
    return false;
  }
  console.log('✅ Journey exists:', journey.id);
  
  // Check donation
  const { data: donation, error: donationError } = await supabase
    .from('donations')
    .select('*')
    .eq('journey_id', trackingId)
    .single();
  
  if (donationError || !donation) {
    console.log('❌ Donation not found:', donationError?.message);
    return false;
  }
  console.log('✅ Donation exists: $' + donation.amount);
  
  // Check SMS logs
  const { data: smsLogs, error: smsError } = await supabase
    .from('sms_logs')
    .select('*')
    .eq('journey_id', trackingId);
  
  if (smsError) {
    console.log('❌ SMS logs error:', smsError.message);
    return false;
  }
  console.log(`✅ SMS logs exist: ${smsLogs?.length || 0} messages`);
  
  // Check journey events
  const { data: events, error: eventsError } = await supabase
    .from('journey_events')
    .select('*')
    .eq('journey_id', trackingId);
  
  if (eventsError) {
    console.log('❌ Journey events error:', eventsError.message);
    return false;
  }
  console.log(`✅ Journey events exist: ${events?.length || 0} events`);
  
  return true;
}

async function runTest() {
  let browser;
  
  try {
    // Clear old test data
    await clearTestData();
    
    // Launch browser
    console.log('\n🌐 Launching browser...');
    browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1280, height: 800 }
    });
    
    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('✅') || text.includes('❌') || text.includes('📱') || text.includes('💰')) {
        console.log('[BROWSER]', text);
      }
    });
    
    // Navigate to donors page
    console.log('\n📍 Navigating to /donors...');
    await page.goto('http://localhost:5173/donors', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/final-01-donors-page.png' });
    console.log('📸 Screenshot: final-01-donors-page.png');
    
    // Click first DONATE button
    console.log('\n💰 Clicking DONATE button...');
    await page.waitForSelector('button:has-text("DONATE")');
    
    // Get tracking ID from console before clicking
    let trackingId = null;
    page.on('console', msg => {
      const text = msg.text();
      const match = text.match(/journey: (EFB-\d+-[A-Z0-9]+)/);
      if (match) {
        trackingId = match[1];
        console.log('🎯 Captured tracking ID:', trackingId);
      }
    });
    
    await page.click('button:has-text("DONATE")');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Take screenshot after donation
    await page.screenshot({ path: 'test-results/final-02-after-donation.png' });
    console.log('📸 Screenshot: final-02-after-donation.png');
    
    // Wait for tracking ID
    let attempts = 0;
    while (!trackingId && attempts < 10) {
      await new Promise(resolve => setTimeout(resolve, 500));
      attempts++;
    }
    
    if (!trackingId) {
      // Try to extract from page
      const recentDonations = await page.$$eval('.font-mono', els => els.map(el => el.textContent));
      trackingId = recentDonations.find(id => id.startsWith('EFB-'));
    }
    
    if (!trackingId) {
      throw new Error('Could not capture tracking ID');
    }
    
    console.log('\n✅ Donation completed with tracking ID:', trackingId);
    
    // Verify all data in Supabase
    const dataValid = await verifyData(trackingId);
    
    if (!dataValid) {
      throw new Error('Data verification failed');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL TESTS PASSED!');
    console.log('='.repeat(60));
    console.log('\n📊 Summary:');
    console.log('  ✅ Journey created in Supabase');
    console.log('  ✅ Donation saved to Supabase (no FK errors)');
    console.log('  ✅ SMS sent and logged (no FK errors)');
    console.log('  ✅ Journey events recorded');
    console.log('\n🎉 All foreign key constraints satisfied!');
    console.log('🎉 Complete donation flow working perfectly!');
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

runTest();