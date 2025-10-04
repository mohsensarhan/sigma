/**
 * Phase 0 Playwright Verification Test
 * Verifies all Phase 0 KPIs are met using Playwright
 */

import { chromium } from '@playwright/test';

async function runPhase0Verification() {
  console.log('🧪 Phase 0 Playwright Verification Test');
  console.log('=====================================');

  const browser = await chromium.launch({ 
    headless: false, // Keep visible for debugging
    slowMo: 1000 // Slow down for better observation
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Step 1: Load application and check basic functionality
    console.log('\n📱 Step 1: Loading application...');
    await page.goto('http://localhost:5175');
    
    // Wait for app to load
    await page.waitForTimeout(3000);
    
    // Check if map is loaded (key V1 feature)
    const mapElement = await page.locator('.mapboxgl-map').first();
    const mapExists = await mapElement.isVisible().catch(() => false);
    console.log(`🗺️  Map loaded: ${mapExists ? '✅' : '❌'}`);
    
    // Step 2: Check admin panel functionality
    console.log('\n📋 Step 2: Testing admin panel...');
    
    // Look for admin panel notch (should be visible on left edge)
    const adminNotch = await page.locator('div.fixed.left-0.top-1\\/2').first();
    const notchExists = await adminNotch.isVisible().catch(() => false);
    console.log(`🎛️  Admin panel notch visible: ${notchExists ? '✅' : '❌'}`);
    
    let panelOpen = false;
    let hasDonationButton = false;
    let markers = [];
    let hasActiveWaypoint = false;
    
    if (notchExists) {
      // Click to open admin panel
      await adminNotch.click();
      await page.waitForTimeout(1000);
      
      // Check if admin panel opened (look for the panel content)
      const adminPanel = await page.locator('div.fixed.left-0.top-0.bottom-0.w-96').first();
      panelOpen = await adminPanel.isVisible().catch(() => false);
      console.log(`📊 Admin panel opened: ${panelOpen ? '✅' : '❌'}`);
      
      if (panelOpen) {
        // Check for donation buttons
        const generalDonation = await page.locator('button:has-text("General Donation")').first();
        hasDonationButton = await generalDonation.isVisible().catch(() => false);
        console.log(`🎲 Donation buttons visible: ${hasDonationButton ? '✅' : '❌'}`);
        
        // Test donation trigger
        if (hasDonationButton) {
          console.log('\n🚀 Step 3: Testing donation journey...');
          console.log('⏱️  Starting 25-second journey test (5 stages × 5 seconds each)...');
          await generalDonation.click();
          
          // Wait for initial waypoints to appear
          await page.waitForTimeout(2000);
          
          // Check for waypoints on map
          markers = await page.locator('[class*="marker"], [class*="waypoint"]').all();
          console.log(`📍 Waypoints rendered: ${markers.length} (expected: 5) ${markers.length === 5 ? '✅' : '❌'}`);
          
          // Wait for complete journey (25 seconds total)
          console.log('⏳ Waiting for complete journey progression...');
          await page.waitForTimeout(25000);
          
          // Check for final stage completion
          const completedWaypoints = await page.locator('[class*="completed"], [class*="green"]').all();
          const hasCompletedJourney = completedWaypoints.length === 5;
          console.log(`🏁 Journey completed: ${hasCompletedJourney ? '✅' : '❌'} (${completedWaypoints.length}/5 stages)`);
          
          // Check for active waypoint (should be stage 5 completed)
          const finalWaypoint = await page.locator('[class*="active"], [class*="cyan"]').first();
          hasActiveWaypoint = await finalWaypoint.isVisible().catch(() => false);
          console.log(`⚡ Final waypoint active: ${hasActiveWaypoint ? '✅' : '❌'}`);
        }
      }
    }
    
    // Step 4: Check console for security and logging
    console.log('\n🔍 Step 4: Checking console logs...');
    
    const pageErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        pageErrors.push(msg.text());
      }
    });
    
    // Wait a bit to collect any console errors
    await page.waitForTimeout(2000);
    
    console.log(`🚫 Console errors: ${pageErrors.length} (expected: 0) ${pageErrors.length === 0 ? '✅' : '❌'}`);
    if (pageErrors.length > 0) {
      pageErrors.forEach(error => console.log(`   Error: ${error}`));
    }
    
    // Step 5: Verify environment variables are properly loaded
    console.log('\n🔐 Step 5: Security verification...');
    
    // Check that Mapbox is working (means token is loaded)
    const mapboxCanvas = await page.locator('canvas').first();
    const mapboxWorking = await mapboxCanvas.isVisible().catch(() => false);
    console.log(`🗺️  Mapbox token loaded: ${mapboxWorking ? '✅' : '❌'}`);
    
    // Step 6: Final verification summary
    console.log('\n📊 PHASE 0 VERIFICATION SUMMARY:');
    console.log('==================================');
    
    const results = {
      mapLoaded: mapExists,
      adminNotchExists: notchExists,
      adminPanelOpens: panelOpen,
      donationButtonsWork: hasDonationButton,
      journeyProgression: markers.length === 5 && hasActiveWaypoint,
      noConsoleErrors: pageErrors.length === 0,
      mapboxTokenLoaded: mapboxWorking
    };
    
    const passedTests = Object.values(results).filter(Boolean).length;
    const totalTests = Object.keys(results).length;
    
    console.log(`\n✅ Tests Passed: ${passedTests}/${totalTests}`);
    
    if (passedTests === totalTests) {
      console.log('🎉 ALL PHASE 0 KPIS MET - READY FOR PHASE 1!');
    } else {
      console.log('⚠️  Some Phase 0 KPIs not met - needs attention');
      Object.entries(results).forEach(([test, passed]) => {
        console.log(`   ${test}: ${passed ? '✅' : '❌'}`);
      });
    }
    
    // Take final screenshot
    await page.screenshot({ 
      path: 'test-results/phase0-verification-final.png',
      fullPage: true 
    });
    console.log('\n📸 Final screenshot saved to test-results/phase0-verification-final.png');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

runPhase0Verification().catch(console.error);
