import puppeteer from 'puppeteer';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // Capture all console messages
  page.on('console', msg => console.log('BROWSER:', msg.text()));

  // Capture errors
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

  console.log('🔍 Debugging Current State\n');

  await page.goto('http://localhost:5173');
  await sleep(3000);

  console.log('✅ Page loaded\n');

  // Check what's visible
  console.log('📋 Checking UI Elements:');

  const adminNotch = await page.$('div[style*="linear-gradient"]');
  console.log(`  Admin Notch: ${adminNotch ? '✅ FOUND' : '❌ NOT FOUND'}`);

  const smsPanel = await page.$('text=SMS Logs');
  console.log(`  SMS Panel: ${smsPanel ? '✅ FOUND' : '❌ NOT FOUND'}`);

  const hud = await page.$('text=/\\d+ Active/');
  console.log(`  Multi-Journey HUD: ${hud ? '✅ FOUND' : '❌ NOT FOUND'}`);

  // Try to open admin panel
  console.log('\n🖱️ Attempting to open admin panel...');

  if (adminNotch) {
    await adminNotch.click();
    await sleep(1000);
    console.log('  ✅ Clicked admin notch');

    // Check if panel opened
    const panel = await page.$('text=Admin Panel');
    console.log(`  Admin Panel Content: ${panel ? '✅ VISIBLE' : '❌ NOT VISIBLE'}`);

    // Check for dropdowns
    const selects = await page.$$('select');
    console.log(`  Dropdowns found: ${selects.length}`);

    // Check for buttons
    const buttons = await page.$$('button');
    console.log(`  Buttons found: ${buttons.length}`);

    // Try to find General Donation button using XPath
    const [genButton] = await page.$x("//button[contains(text(), 'General Donation')]");
    if (genButton) {
      console.log('  ✅ Found General Donation button');

      const isDisabled = await genButton.evaluate(el => el.disabled);
      console.log(`  Button disabled: ${isDisabled ? '❌ YES' : '✅ NO'}`);

      if (!isDisabled) {
        console.log('\n🚀 Triggering donation...');
        await genButton.click();
        await sleep(2000);
        console.log('  ✅ Donation triggered');

        // Check HUD using XPath
        const [hudEl] = await page.$x("//*[contains(text(), 'Active')]");
        const hudText = hudEl ? await page.evaluate(el => el.textContent, hudEl) : 'Not found';
        console.log(`  HUD Status: ${hudText}`);
      } else {
        console.log('  ⚠️ Button is disabled - cannot trigger');
      }
    } else {
      console.log('  ❌ General Donation button NOT FOUND');

      // List all button text
      const buttonTexts = await page.$$eval('button', buttons =>
        buttons.map(b => b.textContent).filter(t => t.trim())
      );
      console.log('  Available buttons:', buttonTexts);
    }
  } else {
    console.log('  ❌ Cannot proceed - admin notch not found');
  }

  // Take screenshot
  await page.screenshot({ path: './debug-current-state.png', fullPage: true });
  console.log('\n📸 Screenshot saved: debug-current-state.png');

  await sleep(5000);
  await browser.close();
})();
