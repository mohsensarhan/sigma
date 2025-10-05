import puppeteer from 'puppeteer';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  page.on('console', msg => console.log('BROWSER:', msg.text()));
  page.on('pageerror', error => console.log('ERROR:', error.message));

  console.log('🔍 Simple Debug Check\n');

  await page.goto('http://localhost:5173');
  await sleep(3000);

  console.log('✅ Page loaded\n');

  // Open admin panel
  const notch = await page.$('div[style*="linear-gradient"]');
  if (notch) {
    await notch.click();
    await sleep(1000);
    console.log('✅ Admin panel opened\n');

    // List all buttons
    const buttonTexts = await page.$$eval('button', buttons =>
      buttons.map(b => ({
        text: b.textContent.trim(),
        disabled: b.disabled,
        classes: b.className
      }))
    );

    console.log('📋 All Buttons in Admin Panel:');
    buttonTexts.forEach((btn, i) => {
      console.log(`  ${i + 1}. "${btn.text}"`);
      console.log(`     Disabled: ${btn.disabled}`);
      console.log(`     Classes: ${btn.classes || 'none'}\n`);
    });

    // Try clicking first General Donation button by evaluating all buttons
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
      console.log('🚀 Successfully clicked General Donation button!');
      await sleep(3000);

      // Check for journey logs
      console.log('\n📊 Checking for journey activity...');
    } else {
      console.log('❌ Could not click General Donation button (not found or disabled)');
    }
  }

  await page.screenshot({ path: './debug-simple.png', fullPage: true });
  console.log('\n📸 Screenshot: debug-simple.png');

  await sleep(5000);
  await browser.close();
})();
