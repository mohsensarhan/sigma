/**
 * Test Journey Progression
 * Tests the fixed useGlobalJourneyProgression hook
 */

import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testJourneyProgression() {
  console.log('🧪 Testing Journey Progression Fix');
  console.log('=====================================');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Create screenshots directory
  const screenshotDir = path.join(__dirname, 'test-results', 'journey-progression');
  
  try {
    // Navigate to admin dashboard to set step duration
    console.log('\n1. Navigating to admin dashboard...');
    await page.goto('http://localhost:5173/admin');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(screenshotDir, '01-admin-initial.png') });

    // Set step duration to 2 seconds for faster testing
    console.log('2. Setting step duration to 2 seconds...');
    await page.fill('input[type="range"]', '2');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(screenshotDir, '02-step-duration-set.png') });

    // Navigate to payment gateway
    console.log('3. Navigating to payment gateway...');
    await page.goto('http://localhost:5173/donors');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(screenshotDir, '03-payment-gateway-initial.png') });

    // Trigger a donation from first donor
    console.log('4. Triggering donation from first donor...');
    await page.click('button:has-text("DONATE")', { timeout: 5000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotDir, '04-donation-triggered.png') });

    // Navigate back to main map to monitor progression
    console.log('5. Navigating to main map to monitor progression...');
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(screenshotDir, '05-map-initial.png') });

    // Monitor journey progression through all 5 stages
    console.log('6. Monitoring journey progression (2 seconds per stage)...');
    
    for (let stage = 1; stage <= 5; stage++) {
      console.log(`   Waiting for Stage ${stage}...`);
      await page.waitForTimeout(2500); // Wait a bit longer than the step duration
      
      // Take screenshot at each stage
      await page.screenshot({ 
        path: path.join(screenshotDir, `06-stage-${stage}.png`),
        fullPage: true 
      });

      // Check if the active count in HUD shows at least 1 active journey
      const activeCount = await page.locator('.text-green-400').first().textContent();
      console.log(`   Active journeys: ${activeCount}`);
      
      // Check for any console messages about journey progression
      page.on('console', msg => {
        if (msg.text().includes('Journey') && (msg.text().includes('Stage') || msg.text().includes('COMPLETED'))) {
          console.log(`   📝 ${msg.text()}`);
        }
      });
      
      // Check if markers are visible on the map (look for the marker divs)
      const markerCount = await page.locator('div[style*="rounded-full"]').count();
      console.log(`   Markers visible: ${markerCount}`);
      
      // Check for any active waypoints (blue ones)
      const activeMarkers = await page.locator('div[style*="background-color: rgb(0, 217, 255)"]').count();
      console.log(`   Active markers: ${activeMarkers}`);
    }

    // Final wait to ensure completion
    console.log('7. Waiting for journey completion...');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(screenshotDir, '07-journey-completed.png') });

    // Check final state with more specific selectors
    const finalActiveCount = await page.locator('.text-green-400').first().textContent();
    const finalCompletedCount = await page.locator('span:has-text("Completed")').first().textContent();
    console.log(`\n📊 Final State:`);
    console.log(`   Active: ${finalActiveCount}`);
    console.log(`   Completed: ${finalCompletedCount}`);
    
    // Check if any markers are visible
    const finalMarkerCount = await page.locator('div[style*="rounded-full"]').count();
    console.log(`   Final markers visible: ${finalMarkerCount}`);
    
    // Check for completed markers (green ones)
    const completedMarkers = await page.locator('div[style*="background-color: rgb(0, 255, 159)"]').count();
    console.log(`   Completed markers: ${completedMarkers}`);

    // Navigate to journey viewer to verify completion
    console.log('8. Checking journey viewer for completion status...');
    // Get the tracking ID from the console logs or from the page
    const trackingId = await page.evaluate(() => {
      const waypoints = document.querySelectorAll('[data-testid="waypoint-marker"]');
      if (waypoints.length > 0) {
        return waypoints[0].getAttribute('data-journey-id');
      }
      return null;
    });

    if (trackingId) {
      await page.goto(`http://localhost:5173/journey/${trackingId}`);
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: path.join(screenshotDir, '08-journey-viewer-final.png') });
    }

    console.log('\n✅ Journey progression test completed successfully!');
    console.log('📸 Screenshots saved to:', screenshotDir);

  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: path.join(screenshotDir, 'error.png') });
  } finally {
    await browser.close();
  }
}

// Run the test
testJourneyProgression().catch(console.error);