/**
 * Debug Context Storage
 */

import puppeteer from 'puppeteer';

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function test() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 }
  });

  const page = await browser.newPage();
  page.on('console', msg => console.log(`[BROWSER] ${msg.text()}`));

  try {
    // Go to payment gateway and trigger donation
    console.log('1. Triggering donation...');
    await page.goto('http://localhost:5173/donors', { waitUntil: 'networkidle0' });
    await delay(2000);

    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button'))
        .find(b => b.textContent?.includes('DONATE'));
      if (btn) btn.click();
    });

    await delay(5000);

    // Check what's in global context
    console.log('\n2. Checking GlobalSettingsContext...');
    const contextData = await page.evaluate(() => {
      // Access React internals
      const root = document.getElementById('root');
      const reactRoot = root?._reactRootContainer?._internalRoot || root?._reactRootContainer;

      // Try to find context through window
      return {
        foundWindow: typeof window !== 'undefined',
        foundRoot: !!root,
        keys: Object.keys(window).filter(k => k.includes('React') || k.includes('context'))
      };
    });

    console.log('Context check:', contextData);

    // Now go to map and check
    console.log('\n3. Going to map page...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
    await delay(3000);

    const mapData = await page.evaluate(() => {
      const hud = document.querySelector('.fixed.top-6.right-6');
      return {
        hudText: hud?.textContent,
        markerCount: document.querySelectorAll('[class*="mapboxgl-marker"]').length
      };
    });

    console.log('Map data:', mapData);

    await delay(5000);

  } finally {
    await browser.close();
  }
}

test().catch(console.error);
