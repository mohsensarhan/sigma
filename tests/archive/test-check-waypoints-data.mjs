import puppeteer from 'puppeteer';
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function checkWaypointsData() {
  console.log('🔍 Checking waypoints data structure\n');
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 }
  });
  const page = await browser.newPage();

  try {
    await page.goto('http://localhost:5177', { waitUntil: 'networkidle2' });
    await sleep(2000);

    // Open admin
    await page.mouse.click(10, 500);
    await sleep(1000);

    // Click donation
    const buttons = await page.$$('button');
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text?.includes('General Donation')) {
        await btn.click();
        break;
      }
    }

    await sleep(3000);

    // Check React state by inspecting the rendered components
    const waypointsData = await page.evaluate(() => {
      // Try to find waypoint data in the DOM
      const controlCard = document.querySelector('[class*="Journey Progress"]') || 
                         document.querySelector('[class*="waypoint"]');
      
      // Get all text that might contain waypoint info
      const allText = document.body.innerText;
      
      return {
        bodyIncludes_Stage1: allText.includes('Stage 1'),
        bodyIncludes_Stage2: allText.includes('Stage 2'),
        bodyIncludes_EFB: allText.includes('EFB'),
        bodyIncludes_Badr: allText.includes('Badr'),
        entireControlCardSection: allText.substring(0, 1000)
      };
    });

    console.log('Waypoints Data Check:');
    console.log(JSON.stringify(waypointsData, null, 2));

    await page.screenshot({ path: 'test-results/check-waypoints.png', fullPage: true });

  } catch (error) {
    console.error('ERROR:', error.message);
  } finally {
    await browser.close();
  }
}

checkWaypointsData();
