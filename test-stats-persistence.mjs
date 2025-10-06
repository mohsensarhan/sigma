import puppeteer from 'puppeteer';

async function testStatsPersistence() {
  console.log('🧪 Testing donor stats persistence across page refresh\n');

  const browser = await puppeteer.launch({
    headless: false,
    devtools: true
  });

  const page = await browser.newPage();

  try {
    // 1. Load page and capture initial stats
    console.log('1️⃣ Loading donors page...');
    await page.goto('http://localhost:5174/donors', { waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for stats to load

    const statsBefore = await page.evaluate(() => {
      const statElements = Array.from(document.querySelectorAll('.text-gray-500'))
        .filter(el => el.textContent.includes('Total:'));
      return statElements.map(el => el.textContent.trim());
    });

    console.log('✅ Initial stats loaded:');
    statsBefore.forEach((stat, i) => console.log(`   Donor ${i + 1}: ${stat}`));
    console.log();

    // 2. Make a donation
    console.log('2️⃣ Making a donation...');
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button'))
        .find(b => b.textContent.includes('DONATE'));
      if (btn) btn.click();
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    const statsAfterDonation = await page.evaluate(() => {
      const statElements = Array.from(document.querySelectorAll('.text-gray-500'))
        .filter(el => el.textContent.includes('Total:'));
      return statElements.map(el => el.textContent.trim());
    });

    console.log('✅ Stats after donation:');
    statsAfterDonation.forEach((stat, i) => console.log(`   Donor ${i + 1}: ${stat}`));
    console.log();

    // 3. Refresh page
    console.log('3️⃣ Refreshing page...');
    await page.reload({ waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for stats to load from Supabase

    const statsAfterRefresh = await page.evaluate(() => {
      const statElements = Array.from(document.querySelectorAll('.text-gray-500'))
        .filter(el => el.textContent.includes('Total:'));
      return statElements.map(el => el.textContent.trim());
    });

    console.log('✅ Stats after refresh:');
    statsAfterRefresh.forEach((stat, i) => console.log(`   Donor ${i + 1}: ${stat}`));
    console.log();

    // 4. Compare
    console.log('📊 Comparison:');
    const donor1Before = statsAfterDonation[0];
    const donor1After = statsAfterRefresh[0];

    if (donor1Before === donor1After) {
      console.log('✅ SUCCESS: Stats persisted across page refresh!');
      console.log(`   Before refresh: ${donor1Before}`);
      console.log(`   After refresh:  ${donor1After}`);
    } else {
      console.log('❌ FAILED: Stats reset on page refresh');
      console.log(`   Before refresh: ${donor1Before}`);
      console.log(`   After refresh:  ${donor1After}`);
    }

    console.log('\n🔍 Browser will stay open for 10 seconds for inspection...');
    await new Promise(resolve => setTimeout(resolve, 10000));

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testStatsPersistence();
