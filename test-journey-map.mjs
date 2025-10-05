import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5173';

async function test() {
  console.log('🗺️  Testing Journey Viewer Map...\n');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Capture console logs
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('MAPBOX') || text.includes('Missing') || text.includes('error')) {
      console.log(`  💬 ${text}`);
    }
  });

  try {
    // Step 1: Make a donation
    console.log('1️⃣  Creating donation...');
    await page.goto(`${BASE_URL}/donors`);
    await page.waitForTimeout(1500);

    await page.evaluate(() => {
      const donateButtons = Array.from(document.querySelectorAll('button'))
        .filter(btn => btn.textContent.includes('DONATE'));
      if (donateButtons[0]) donateButtons[0].click();
    });

    await page.waitForTimeout(2000);

    // Extract tracking ID from localStorage
    const trackingId = await page.evaluate(() => {
      const settings = localStorage.getItem('globalSettings');
      if (settings) {
        const parsed = JSON.parse(settings);
        return parsed.activeJourneys?.[0]?.id;
      }
      return null;
    });

    if (!trackingId) {
      console.log('❌ No tracking ID found!');
      await browser.close();
      return;
    }

    console.log(`✅ Tracking ID: ${trackingId}\n`);

    // Step 2: Navigate to Journey Viewer
    console.log('2️⃣  Opening Journey Viewer...');
    await page.goto(`${BASE_URL}/journey/${trackingId}`);
    await page.waitForTimeout(3000);

    // Step 3: Check for map elements
    const mapCheck = await page.evaluate(() => {
      return {
        hasMapContainer: document.querySelector('.mapboxgl-map') !== null,
        hasMapCanvas: document.querySelector('.mapboxgl-canvas') !== null,
        hasMarkers: document.querySelectorAll('.mapboxgl-marker').length,
        hasJourneyPanel: document.body.textContent.includes('Journey Tracking'),
        hasProgressBar: document.body.textContent.includes('Progress'),
        notFound: document.body.textContent.includes('Journey Not Found')
      };
    });

    console.log('\n📊 Journey Viewer Status:');
    console.log(`  Map Container: ${mapCheck.hasMapContainer ? '✅' : '❌'}`);
    console.log(`  Map Canvas: ${mapCheck.hasMapCanvas ? '✅' : '❌'}`);
    console.log(`  Markers: ${mapCheck.hasMarkers > 0 ? `✅ (${mapCheck.hasMarkers})` : '❌'}`);
    console.log(`  Journey Panel: ${mapCheck.hasJourneyPanel ? '✅' : '❌'}`);
    console.log(`  Progress Bar: ${mapCheck.hasProgressBar ? '✅' : '❌'}`);
    console.log(`  Not Found Error: ${mapCheck.notFound ? '❌' : '✅'}`);

    if (mapCheck.hasMapContainer && mapCheck.hasMapCanvas && mapCheck.hasMarkers > 0) {
      console.log('\n🎉 SUCCESS! Map is rendering with waypoints!\n');
    } else {
      console.log('\n❌ FAILED! Map is not rendering properly.\n');
    }

    await page.screenshot({ path: './journey-map-test.png', fullPage: true });
    console.log('📸 Screenshot saved: journey-map-test.png\n');

    // Keep browser open for 5 seconds so you can see it
    console.log('Keeping browser open for 5 seconds...');
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

test();
