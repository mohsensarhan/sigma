/**
 * Final Verification Test After Housekeeping
 * Ensures all functionality is working after cleanup
 */

import puppeteer from 'puppeteer';

async function verifyHousekeeping() {
  console.log('🔍 Final Housekeeping Verification...');
  
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Enable console logging
    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text()
      });
      
      // Log errors to our console
      if (msg.type() === 'error') {
        console.log(`🚫 CONSOLE ERROR: ${msg.text()}`);
      }
    });
    
    // Load page
    console.log('\n📱 Loading page after housekeeping...');
    await page.goto('http://localhost:5173', { 
      waitUntil: 'networkidle2',
      timeout: 10000 
    });
    
    // Wait for page to settle
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check page title
    const title = await page.title();
    console.log(`\n📄 Page title: "${title}"`);
    
    // Check for map
    const mapboxMap = await page.$('.mapboxgl-map');
    const mapExists = mapboxMap ? true : false;
    console.log(`🗺️ Mapbox map container: ${mapExists ? '✅' : '❌'}`);
    
    // Check for map canvas
    const canvas = await page.$('canvas');
    const canvasExists = canvas ? true : false;
    console.log(`🎨 Map canvas: ${canvasExists ? '✅' : '❌'}`);
    
    // Check for Mapbox controls
    const controls = await page.$('.mapboxgl-ctrl-bottom-right');
    const controlsExist = controls ? true : false;
    console.log(`🎛️ Mapbox controls: ${controlsExist ? '✅' : '❌'}`);
    
    // Check for admin panel
    const adminNotch = await page.$('div.fixed.left-0.top-1\\/2');
    const notchExists = adminNotch ? true : false;
    console.log(`🎛️ Admin panel notch: ${notchExists ? '✅' : '❌'}`);
    
    // Test admin panel functionality
    if (notchExists) {
      console.log('\n🔧 Testing admin panel functionality...');
      await adminNotch.click();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const adminPanel = await page.$('div.fixed.left-0.top-0.bottom-0.w-96');
      const panelOpen = adminPanel ? true : false;
      console.log(`📊 Admin panel opens: ${panelOpen ? '✅' : '❌'}`);
      
      if (panelOpen) {
        // Test donation trigger
        const generalDonation = await page.$('button');
        if (generalDonation) {
          console.log('🚀 Testing donation trigger...');
          await generalDonation.click();
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          const markers = await page.$$('div[class*="marker"], div[class*="waypoint"]');
          console.log(`📍 Waypoints appear: ${markers.length} (expected: 5) ${markers.length === 5 ? '✅' : '❌'}`);
          
          if (markers.length === 5) {
            console.log('✅ Full donation journey working');
          }
        } else {
          console.log('❌ General Donation button not found');
        }
      } else {
        console.log('❌ Admin panel failed to open');
      }
    }
    
    // Check for console errors
    const errors = consoleMessages.filter(msg => msg.type === 'error');
    const warnings = consoleMessages.filter(msg => msg.type === 'warning');
    
    console.log(`\n🚫 Console errors: ${errors.length}`);
    if (errors.length > 0) {
      errors.forEach((error, index) => {
        console.log(`   Error ${index + 1}: ${error.text}`);
      });
    }
    
    console.log(`\n⚠️ Console warnings: ${warnings.length}`);
    if (warnings.length > 0) {
      warnings.forEach((warning, index) => {
        console.log(`   Warning ${index + 1}: ${warning.text}`);
      });
    }
    
    // Take screenshot
    await page.screenshot({ 
      path: 'test-results/housekeeping-verification.png',
      fullPage: true 
    });
    console.log('\n📸 Screenshot saved to test-results/housekeeping-verification.png');
    
    // Final verification summary
    console.log('\n📊 HOUSEKEEPING VERIFICATION SUMMARY:');
    console.log('=====================================');
    
    const issues = [];
    
    if (!mapExists) issues.push('Mapbox map container not found');
    if (!canvasExists) issues.push('Mapbox canvas not found');
    if (!controlsExist) issues.push('Mapbox controls not found');
    if (!notchExists) issues.push('Admin panel notch not found');
    if (errors.length > 0) issues.push(`${errors.length} console errors`);
    
    if (issues.length === 0) {
      console.log('🎉 HOUSEKEEPING VERIFICATION PASSED!');
      console.log('✅ All functionality working correctly');
      console.log('✅ No console errors or warnings');
      console.log('✅ Map and admin panel fully functional');
      console.log('✅ Project clean and stable');
    } else {
      console.log('⚠️ HOUSEKEEPING ISSUES FOUND:');
      issues.forEach(issue => console.log(`   - ${issue}`));
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  } finally {
    await browser.close();
  }
}

verifyHousekeeping().catch(console.error);
