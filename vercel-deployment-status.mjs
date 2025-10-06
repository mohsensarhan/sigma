import { chromium } from 'playwright';

async function checkVercelDeployment() {
  console.log('🔍 Checking Vercel Deployment Status...\n');
  
  // Update this with your actual Vercel URL
  const VERCEL_URL = 'https://sigma-.vercel.app'; // Example - update with your URL
  
  console.log(`📍 Testing URL: ${VERCEL_URL}`);
  console.log('⏳ Waiting for Vercel to deploy (usually takes 1-2 minutes)...\n');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Test main route first
    console.log('1️⃣ Testing main route...');
    await page.goto(VERCEL_URL, { waitUntil: 'networkidle', timeout: 15000 });
    
    const mainContent = await page.content();
    const hasMainContent = mainContent.includes('Egyptian Food Bank');
    
    if (hasMainContent) {
      console.log('✅ Main route loads successfully');
    } else {
      console.log('❌ Main route failed - still deploying?');
      return;
    }
    
    // Test problematic routes
    const routes = [
      { path: '/donors', name: 'Donors' },
      { path: '/admin', name: 'Admin' },
      { path: '/sms', name: 'SMS' }
    ];
    
    let successCount = 0;
    
    for (const route of routes) {
      console.log(`2️⃣ Testing ${route.name} route...`);
      
      try {
        await page.goto(`${VERCEL_URL}${route.path}`, { 
          waitUntil: 'networkidle', 
          timeout: 10000 
        });
        
        await page.waitForTimeout(2000); // Wait for content to load
        
        const content = await page.content();
        const has404 = content.includes('404') || content.includes('Not Found');
        const isVercelError = content.includes('vercel') && content.includes('error');
        
        if (!has404 && !isVercelError) {
          console.log(`✅ ${route.name} route works!`);
          successCount++;
        } else {
          console.log(`❌ ${route.name} route still returns 404`);
        }
      } catch (error) {
        console.log(`❌ ${route.name} route failed: ${error.message}`);
      }
    }
    
    console.log('\n📊 Results:');
    console.log(`✅ ${successCount}/3 routes working`);
    
    if (successCount === 3) {
      console.log('\n🎉 SUCCESS! All routes work on Vercel!');
      console.log('✅ SPA routing fix is complete');
    } else {
      console.log('\n⚠️  Some routes still failing.');
      console.log('💡 Wait a few more minutes for Vercel deployment to complete');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

console.log('📋 Instructions:');
console.log('1. Update VERCEL_URL with your actual Vercel deployment URL');
console.log('2. Run: node vercel-deployment-status.mjs');
console.log('3. Wait 1-2 minutes after GitHub push for Vercel to deploy\n');

// Uncomment after updating URL above:
// checkVercelDeployment();