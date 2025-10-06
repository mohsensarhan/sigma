import puppeteer from 'puppeteer';

async function testDonationButton() {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--window-size=1200,800'],
    devtools: true
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('🧪 Testing donation button fix...');
    
    // Navigate to donors page
    await page.goto('http://localhost:5173/donors', { waitUntil: 'networkidle0' });
    console.log('✅ Navigated to donors page');
    
    // Wait for donation button
    await page.waitForSelector('button', { timeout: 5000 });
    console.log('✅ Found buttons on page');
    
    // Click first donate button (contains "DONATE" text)
    const donateButton = await page.$('button[class*="from-purple-500"]');
    if (!donateButton) {
      throw new Error('Could not find donate button');
    }
    await donateButton.click();
    console.log('✅ Clicked donate button');
    
    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check console for errors
    const logs = [];
    page.on('console', msg => {
      const text = msg.text();
      logs.push(text);
      if (text.includes('409') || text.includes('Failed to write donation')) {
        console.error('❌ FK constraint error still occurring:', text);
      } else if (text.includes('Journey saved to Supabase')) {
        console.log('✅ Journey saved successfully');
      } else if (text.includes('Donation saved to Supabase')) {
        console.log('✅ Donation saved successfully');
      }
    });
    
    // Wait for donation complete message
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check for success indicators
    const donationHistory = await page.$eval('.text-gray-500', el => el.textContent);
    if (donationHistory.includes('No donations yet')) {
      console.log('❌ Donation not saved - still showing "No donations yet"');
    } else {
      console.log('✅ Donation appears in history');
    }
    
    console.log('\n📋 Console logs:', logs.slice(-10).join('\n'));
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

testDonationButton();