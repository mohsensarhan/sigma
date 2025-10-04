import puppeteer from 'puppeteer';
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function debugDonation() {
  console.log('🔍 DEBUG: Testing donation trigger end-to-end\n');
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 }
  });
  const page = await browser.newPage();
  
  // Capture console logs from the page
  page.on('console', msg => {
    console.log('🌐 BROWSER:', msg.text());
  });
  
  // Capture errors
  page.on('pageerror', error => {
    console.error('❌ PAGE ERROR:', error.message);
  });

  try {
    console.log('1️⃣ Loading page...');
    await page.goto('http://localhost:5177', { waitUntil: 'networkidle2' });
    await sleep(3000);
    console.log('✅ Page loaded\n');

    console.log('2️⃣ Checking initial DOM state...');
    const initialHTML = await page.evaluate(() => {
      return {
        waypointCount: document.querySelectorAll('[class*="waypoint"]').length,
        markerCount: document.querySelectorAll('[class*="marker"]').length,
        mapExists: !!document.querySelector('canvas'),
        adminPanelExists: !!document.querySelector('button')
      };
    });
    console.log('DOM State:', initialHTML);
    console.log('');

    console.log('3️⃣ Opening admin panel...');
    await page.mouse.click(10, 500);
    await sleep(1500);
    console.log('✅ Clicked notch\n');

    console.log('4️⃣ Finding General Donation button...');
    const buttons = await page.$$('button');
    console.log(`Found ${buttons.length} buttons total`);
    
    let foundButton = false;
    for (let i = 0; i < buttons.length; i++) {
      const text = await page.evaluate(el => el.textContent, buttons[i]);
      if (text?.includes('General Donation')) {
        console.log(`✅ Found General Donation button at index ${i}`);
        console.log('Text:', text);
        foundButton = true;
        
        console.log('\n5️⃣ Clicking General Donation button...');
        await buttons[i].click();
        console.log('✅ Button clicked\n');
        break;
      }
    }

    if (!foundButton) {
      console.error('❌ Could not find General Donation button!');
      await page.screenshot({ path: 'test-results/debug-no-button.png' });
      await browser.close();
      return;
    }

    console.log('6️⃣ Waiting for response (3 seconds)...');
    await sleep(3000);

    console.log('7️⃣ Checking DOM after donation trigger...');
    const afterClick = await page.evaluate(() => {
      return {
        waypointCount: document.querySelectorAll('[class*="waypoint"]').length,
        markerCount: document.querySelectorAll('[class*="marker"]').length,
        canvasCount: document.querySelectorAll('canvas').length,
        bodyText: document.body.innerText.substring(0, 500)
      };
    });
    console.log('After Click DOM:', afterClick);
    console.log('');

    console.log('8️⃣ Taking screenshots every 5 seconds...');
    for (let i = 1; i <= 6; i++) {
      await sleep(5000);
      await page.screenshot({ path: `test-results/debug-${i*5}s.png` });
      
      const state = await page.evaluate(() => {
        const markers = document.querySelectorAll('[class*="marker"]');
        return {
          markerCount: markers.length,
          markerClasses: Array.from(markers).map(m => m.className)
        };
      });
      
      console.log(`   ${i*5}s: ${state.markerCount} markers`);
      if (state.markerClasses.length > 0) {
        console.log('   Classes:', state.markerClasses.slice(0, 2));
      }
    }

    console.log('\n✅ Debug complete - check screenshots and console output');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
    await page.screenshot({ path: 'test-results/debug-error.png' });
  } finally {
    await browser.close();
  }
}

debugDonation();
