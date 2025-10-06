#!/usr/bin/env node

/**
 * Test Donation Flow After Fix
 * Verifies that donations now save to Supabase after journey registration
 */

import puppeteer from 'puppeteer';

async function testDonationFlow() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1400, height: 900 }
  });

  const page = await browser.newPage();
  
  // Capture console logs
  const logs = [];
  page.on('console', msg => {
    const text = msg.text();
    logs.push(text);
    console.log(`[BROWSER] ${text}`);
  });

  try {
    console.log('🚀 Navigating to donors page...');
    await page.goto('http://localhost:5173/donors', { waitUntil: 'networkidle2' });
    await page.waitForTimeout(2000);

    console.log('\n🖱️  Clicking first DONATE button...');
    const donateButton = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(btn => btn.textContent?.includes('DONATE') && !btn.disabled);
    });

    if (!donateButton || !(await donateButton.asElement())) {
      console.log('❌ No DONATE button found!');
      return;
    }

    await donateButton.asElement().click();
    
    console.log('\n⏳ Waiting 5 seconds for donation to process...');
    await page.waitForTimeout(5000);

    console.log('\n📋 Checking for errors...');
    const errors = logs.filter(log => 
      log.includes('Failed to write') || 
      log.includes('violates foreign key') ||
      log.includes('409')
    );

    const successes = logs.filter(log => 
      log.includes('✅ Journey saved to Supabase') ||
      log.includes('✅ Donation saved to Supabase')
    );

    console.log('\n📊 RESULTS:');
    console.log(`   Errors: ${errors.length}`);
    console.log(`   Successes: ${successes.length}`);

    if (errors.length > 0) {
      console.log('\n❌ ERRORS FOUND:');
      errors.forEach(err => console.log(`   ${err}`));
    }

    if (successes.length > 0) {
      console.log('\n✅ SUCCESSES:');
      successes.forEach(suc => console.log(`   ${suc}`));
    }

    if (errors.length === 0 && successes.length >= 2) {
      console.log('\n🎉 TEST PASSED! Donation flow works correctly!');
    } else {
      console.log('\n⚠️  TEST INCOMPLETE - Check logs above');
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  } finally {
    console.log('\n⏳ Keeping browser open for 10 seconds...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
}

testDonationFlow().catch(console.error);