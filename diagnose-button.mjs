import puppeteer from 'puppeteer';

async function diagnose() {
  const browser = await puppeteer.launch({
    headless: false,
    devtools: true
  });
  const page = await browser.newPage();

  // Capture console
  const logs = [];
  page.on('console', msg => {
    const text = msg.text();
    logs.push(text);
    if (text.includes('DONATE') || text.includes('Donation') || text.includes('Journey')) {
      console.log(`[Console] ${text}`);
    }
  });

  await page.goto('http://localhost:5174/donors', { waitUntil: 'networkidle0' });
  console.log('✅ Page loaded\n');

  // Find and click button using evaluate
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button'))
      .find(b => b.textContent.includes('DONATE'));
    if (btn) btn.click();
  });

  console.log('✅ Clicked DONATE button\n');

  // Wait and check state
  await new Promise(resolve => setTimeout(resolve, 3000));

  const result = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const donateBtn = buttons.find(b => b.textContent.includes('DONATE') || b.textContent.includes('Donated'));
    const trackBtn = buttons.find(b => b.textContent.includes('Track Journey'));

    return {
      donateButtonText: donateBtn?.textContent.trim(),
      donateButtonClass: donateBtn?.className,
      hasTrackButton: !!trackBtn,
      trackButtonText: trackBtn?.textContent.trim(),
      allButtonTexts: buttons.map(b => b.textContent.trim()).filter(t => t.length < 50)
    };
  });

  console.log('\n📊 Button State After Click:');
  console.log(JSON.stringify(result, null, 2));

  console.log('\n📋 Relevant Console Logs:');
  logs.filter(l =>
    l.includes('Donation') ||
    l.includes('Journey') ||
    l.includes('complete') ||
    l.includes('saved')
  ).slice(-10).forEach(log => console.log(`  - ${log}`));

  console.log('\n🔍 Browser will stay open for 30 seconds for inspection...');
  await new Promise(resolve => setTimeout(resolve, 30000));
  await browser.close();
}

diagnose();
