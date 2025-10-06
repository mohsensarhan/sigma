import { chromium } from 'playwright';

async function testRoutingSimple() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('🧪 Testing SPA Routing Configuration...\n');
    
    // Test routes that should work
    const routes = [
      { path: '/', expected: 'Egyptian Food Bank' },
      { path: '/donors', expected: 'Mock Payment Gateway' },
      { path: '/admin', expected: 'Admin Dashboard' },
      { path: '/sms', expected: 'SMS' } // More flexible selector
    ];
    
    for (const route of routes) {
      console.log(`📍 Testing route: ${route.path}`);
      await page.goto(`http://localhost:5173${route.path}`, { waitUntil: 'networkidle' });
      
      // Wait a bit for content to load
      await page.waitForTimeout(1000);
      
      // Check if page loaded (not 404)
      const content = await page.content();
      const hasExpectedContent = content.includes(route.expected);
      const has404 = content.includes('404') || content.includes('Not Found');
      
      if (hasExpectedContent && !has404) {
        console.log(`✅ Route ${route.path} loads successfully`);
      } else {
        console.log(`❌ Route ${route.path} failed to load`);
        console.log(`   Expected: ${route.expected}`);
        console.log(`   Page content length: ${content.length}`);
      }
    }
    
    console.log('\n🎉 Routing configuration test complete!');
    console.log('\n📋 vercel.json has been created with SPA rewrite rules.');
    console.log('📋 vite.config.ts has been updated with base path configuration.');
    console.log('\n🚀 To deploy to Vercel:');
    console.log('   1. git add vercel.json vite.config.ts');
    console.log('   2. git commit -m "Fix Vercel SPA routing"');
    console.log('   3. git push');
    console.log('   4. Vercel will auto-redeploy with the fix');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testRoutingSimple();