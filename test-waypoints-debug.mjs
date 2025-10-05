/**
 * Debug Waypoints Rendering
 * Check if waypoints are being created correctly
 */

import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function debugWaypoints() {
  console.log('🔍 Debugging Waypoints Rendering');
  console.log('=================================');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to donors and trigger donation
    console.log('\n1. Triggering donation...');
    await page.goto('http://localhost:5173/donors');
    await page.waitForLoadState('networkidle');
    await page.click('button:has-text("DONATE")');
    await page.waitForTimeout(1000);

    // Navigate to map
    console.log('2. Navigating to map...');
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');

    // Check waypoints data in the component
    const waypointsData = await page.evaluate(() => {
      // Try to access waypoints from the React component
      const waypoints = window.__REACT_DEVTOOLS_GLOBAL_HOOK__?.renderers?.[0]?.currentFiber?.memoizedState?.[0]?.memoizedState?.waypoints;
      return waypoints;
    });

    console.log('Waypoints data:', waypointsData);

    // Wait a bit for progression
    await page.waitForTimeout(3000);

    // Check for any elements with coordinates
    const mapElements = await page.evaluate(() => {
      const all = document.querySelectorAll('*');
      const withStyle = [];
      for (const el of all) {
        const style = window.getComputedStyle(el);
        if (style.position === 'absolute' || style.position === 'fixed') {
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            withStyle.push({
              tag: el.tagName,
              className: el.className,
              left: rect.left,
              top: rect.top,
              width: rect.width,
              height: rect.height
            });
          }
        }
      }
      return withStyle.slice(0, 10); // First 10 elements
    });

    console.log('Positioned elements on map:', mapElements);

    // Take a screenshot
    await page.screenshot({ path: path.join(__dirname, 'test-results', 'waypoints-debug.png') });

  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the debug
debugWaypoints().catch(console.error);