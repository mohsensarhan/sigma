import puppeteer from 'puppeteer';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function finalDemo() {
  console.log('🎬 Creating final demo screenshots...');
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1920, height: 1080 }
  });

  const page = await browser.newPage();

  try {
    await page.goto('http://localhost:5177', { waitUntil: 'networkidle2' });
    console.log('✅ Page loaded');

    // Initial state
    await sleep(2000);
    await page.screenshot({ path: 'test-results/DEMO-1-initial-map.png', fullPage: false });
    console.log('📸 Screenshot 1: Initial map');

    // Open admin panel
    await page.mouse.click(10, 500);
    await sleep(1000);
    await page.screenshot({ path: 'test-results/DEMO-2-admin-panel.png', fullPage: false });
    console.log('📸 Screenshot 2: Admin panel open');

    // Click General Donation
    const buttons = await page.$$('button');
    for (const button of buttons) {
      const text = await page.evaluate(el => el.textContent, button);
      if (text && text.includes('General Donation')) {
        await button.click();
        break;
      }
    }

    await sleep(2000);
    await page.screenshot({ path: 'test-results/DEMO-3-journey-stage1.png', fullPage: false });
    console.log('📸 Screenshot 3: Stage 1 active');

    await sleep(5000);
    await page.screenshot({ path: 'test-results/DEMO-4-journey-stage2.png', fullPage: false });
    console.log('📸 Screenshot 4: Stage 2 active');

    await sleep(5000);
    await page.screenshot({ path: 'test-results/DEMO-5-journey-stage3.png', fullPage: false });
    console.log('📸 Screenshot 5: Stage 3 active');

    await sleep(10000);
    await page.screenshot({ path: 'test-results/DEMO-6-journey-complete.png', fullPage: false });
    console.log('📸 Screenshot 6: Journey complete!');

    console.log('\n✅ Demo complete! Check test-results/DEMO-*.png files');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

finalDemo();
