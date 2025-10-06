#!/usr/bin/env node

/**
 * Simple Donation Test
 * Tests if clicking DONATE button triggers the donation flow
 */

import puppeteer from 'puppeteer';

async function testDonation() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1400, height: 900 }
  });

  const page = await browser.newPage();
  
  // Capture all console logs
  const logs = [];
  page.on('console', msg => {
    const text = msg.text();
    logs.push(text);
    console.log(`[BROWSER] ${text}`);
  });

  // Capture errors
  page.on('pageerror', error => {
    console.log(`[ERROR] ${error.message}`);
  });

  try {
    console.log('🚀 Navigating to donors page...');
    await page.goto('http://localhost:5173/donors', { waitUntil: 'networkidle2' });
    await page.waitForTimeout(3000);

    console.log('\n📸 Taking screenshot...');
    await page.screenshot({ path: './test-results/donation-before.png', fullPage: true });

    console.log('\n🔍 Looking for DONATE button...');
    const donateButton = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(btn => btn.textContent?.includes('DONATE') && !btn.disabled);
    });

    if (!donateButton || !(await donateButton.asElement())) {
      console.log('❌ No DONATE button found!');
      console.log('\n📋 Available buttons:');
      const buttonTexts = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('button')).map(btn => ({
          text: btn.textContent?.trim(),
          disabled: btn.disabled,
          classes: btn.className
        }));
      });
      console.log(buttonTexts);
      return;
    }

    console.log('✅ DONATE button found!');
    console.log('\n🖱️  Clicking DONATE button...');
    await donateButton.asElement().click();
    
    console.log('\n⏳ Waiting 5 seconds for donation to process...');
    await page.waitForTimeout(5000);

    console.log('\n📸 Taking screenshot after click...');
    await page.screenshot({ path: './test-results/donation-after.png', fullPage: true });

    console.log('\n📋 Console logs captured:');
    const relevantLogs = logs.filter(log => 
      log.includes('donation') || 
      log.includes('journey') || 
      log.includes('SMS') ||
      log.includes('Supabase') ||
      log.includes('error') ||
      log.includes('Error')
    );
    
    if (relevantLogs.length === 0) {
      console.log('   ⚠️  No relevant logs found!');
      console.log('\n   All logs:');
      logs.forEach(log => console.log(`   ${log}`));
    } else {
      relevantLogs.forEach(log => console.log(`   ${log}`));
    }

    console.log('\n✅ Test complete! Check screenshots in test-results/');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  } finally {
    console.log('\n⏳ Keeping browser open for 10 seconds for inspection...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
}

testDonation().catch(console.error);