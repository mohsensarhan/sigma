import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testVercelRouting() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('🧪 Testing Vercel SPA Routing Configuration...\n');
    
    // Test local development first
    console.log('1️⃣ Testing local development routing...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    
    // Test main route
    await page.waitForSelector('[alt="Egyptian Food Bank"]', { timeout: 5000 });
    console.log('✅ Main route (/) loads correctly');
    
    // Test /donors route
    await page.goto('http://localhost:5173/donors', { waitUntil: 'networkidle' });
    await page.waitForSelector('text=Mock Payment Gateway', { timeout: 5000 });
    console.log('✅ Donors route (/donors) loads correctly');
    
    // Test /admin route
    await page.goto('http://localhost:5173/admin', { waitUntil: 'networkidle' });
    await page.waitForSelector('text=Admin Dashboard', { timeout: 5000 });
    console.log('✅ Admin route (/admin) loads correctly');
    
    // Test /sms route
    await page.goto('http://localhost:5173/sms', { waitUntil: 'networkidle' });
    await page.waitForSelector('text=Mock SMS Inbox', { timeout: 5000 });
    console.log('✅ SMS route (/sms) loads correctly');
    
    // Test direct refresh (simulates Vercel behavior)
    console.log('\n2️⃣ Testing direct route refresh (simulates Vercel)...');
    await page.goto('http://localhost:5173/donors', { waitUntil: 'networkidle' });
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForSelector('text=Mock Payment Gateway', { timeout: 5000 });
    console.log('✅ Direct refresh of /donors works correctly');
    
    // Test navigation between routes
    console.log('\n3️⃣ Testing client-side navigation...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    
    // Navigate via Link components
    await page.click('text=Admin');
    await page.waitForSelector('text=Admin Dashboard', { timeout: 5000 });
    console.log('✅ Client-side navigation to /admin works');
    
    await page.click('text=SMS →');
    await page.waitForSelector('text=Mock SMS Inbox', { timeout: 5000 });
    console.log('✅ Client-side navigation to /sms works');
    
    console.log('\n🎉 All routing tests passed locally!');
    console.log('\n📋 Next steps for Vercel deployment:');
    console.log('   1. Commit vercel.json and vite.config.ts changes');
    console.log('   2. Push to GitHub');
    console.log('   3. Vercel will automatically redeploy with routing fix');
    console.log('   4. Test all routes on your Vercel URL');
    
    // Take screenshot for verification
    await page.screenshot({ 
      path: join(__dirname, 'test-results', 'vercel-routing-test.png'),
      fullPage: true 
    });
    console.log('\n📸 Screenshot saved to test-results/vercel-routing-test.png');
    
  } catch (error) {
    console.error('❌ Routing test failed:', error.message);
    await page.screenshot({ 
      path: join(__dirname, 'test-results', 'routing-error.png'),
      fullPage: true 
    });
  } finally {
    await browser.close();
  }
}

// Create test-results directory if it doesn't exist
import { mkdir } from 'fs/promises';
try {
  await mkdir(join(__dirname, 'test-results'), { recursive: true });
} catch (error) {
  // Directory already exists
}

// Run the test
testVercelRouting();