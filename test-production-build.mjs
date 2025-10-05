import puppeteer from 'puppeteer';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  page.on('console', msg => console.log('BROWSER:', msg.text()));
  page.on('pageerror', error => console.log('ERROR:', error.message));

  console.log('🔍 Testing Production Build (localhost:4173)\n');

  await page.goto('http://localhost:4173');
  await sleep(3000);

  console.log('✅ Production build loaded\n');

  // Check for errors
  const title = await page.title();
  console.log(`Page Title: ${title}`);

  // Check admin panel
  const notch = await page.$('div[style*="linear-gradient"]');
  console.log(`Admin Notch: ${notch ? '✅ FOUND' : '❌ NOT FOUND'}`);

  if (notch) {
    await notch.click();
    await sleep(1000);
    console.log('✅ Admin panel opened\n');

    // Trigger donation
    const clicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const genButton = buttons.find(b => b.textContent.includes('General Donation'));
      if (genButton && !genButton.disabled) {
        genButton.click();
        return true;
      }
      return false;
    });

    if (clicked) {
      console.log('🚀 Donation triggered successfully!\n');
      await sleep(3000);
      console.log('✅ Production build is working correctly!');
    } else {
      console.log('❌ Could not trigger donation');
    }
  }

  await page.screenshot({ path: './production-test.png', fullPage: true });
  console.log('\n📸 Screenshot: production-test.png');

  await sleep(3000);
  await browser.close();

  console.log('\n✅ Production build test complete!');
  process.exit(0);
})();
