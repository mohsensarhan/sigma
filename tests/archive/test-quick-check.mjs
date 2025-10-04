import puppeteer from 'puppeteer';
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function quickCheck() {
  const browser = await puppeteer.launch({ headless: false, defaultViewport: { width: 1920, height: 1080 } });
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:5177', { waitUntil: 'networkidle2' });
    await sleep(3000);
    
    await page.screenshot({ path: 'test-results/quick-1-initial.png', fullPage: false });
    console.log('📸 Initial state captured');
    
    // Open admin & trigger donation
    await page.mouse.click(10, 500);
    await sleep(1000);
    
    const buttons = await page.$$('button');
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text?.includes('General Donation')) {
        await btn.click();
        console.log('✅ Clicked General Donation');
        break;
      }
    }
    
    await sleep(7000);
    await page.screenshot({ path: 'test-results/quick-2-after-donation.png', fullPage: false });
    console.log('📸 After donation captured');
    
    console.log('✅ Test done - check screenshots');
  } catch (error) {
    console.error('❌', error.message);
  } finally {
    await browser.close();
  }
}

quickCheck();
