import puppeteer from 'puppeteer';

async function checkButtonCode() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto('http://localhost:5174/donors', { waitUntil: 'networkidle0' });

  // Check button text and state
  const buttonInfo = await page.evaluate(() => {
    const donateBtn = Array.from(document.querySelectorAll('button'))
      .find(btn => btn.textContent.includes('DONATE'));

    if (!donateBtn) return { error: 'No DONATE button found' };

    const trackBtn = Array.from(document.querySelectorAll('button'))
      .find(btn => btn.textContent.includes('Track Journey'));

    return {
      text: donateBtn.textContent.trim(),
      disabled: donateBtn.disabled,
      className: donateBtn.className,
      hasTrackButton: !!trackBtn
    };
  });

  console.log('Button Info:', JSON.stringify(buttonInfo, null, 2));

  // Click and check response
  const donateBtn = await page.$('button:has-text("DONATE")');
  if (donateBtn) {
    console.log('\nClicking button...');
    await donateBtn.click();

    await page.waitForTimeout(2000);

    const afterClick = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return {
        buttonTexts: btns.map(b => b.textContent.trim()).filter(t => t.includes('DONATE') || t.includes('Track')),
        hasGreenButton: !!document.querySelector('button.bg-green-600'),
        hasTrackButton: btns.some(b => b.textContent.includes('Track Journey'))
      };
    });

    console.log('\nAfter Click:', JSON.stringify(afterClick, null, 2));
  }

  setTimeout(() => browser.close(), 10000);
}

checkButtonCode();
