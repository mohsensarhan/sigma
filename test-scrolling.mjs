import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

// Create test-results directory if it doesn't exist
const testResultsDir = 'test-results';
if (!fs.existsSync(testResultsDir)) {
  fs.mkdirSync(testResultsDir, { recursive: true });
}

// Test configuration
const BASE_URL = 'http://localhost:5175';
const PAGES = [
  { name: 'Main Map', path: '/', shouldScroll: false },
  { name: 'Admin Dashboard', path: '/admin', shouldScroll: true },
  { name: 'Payment Gateway', path: '/donors', shouldScroll: true },
  { name: 'SMS Inbox', path: '/sms', shouldScroll: true },
  { name: 'Journey Viewer', path: '/journey/test-journey-id', shouldScroll: true }
];

async function testScrolling() {
  console.log('🚀 Starting scrolling test...\n');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: { width: 1200, height: 400 }  // Smaller height to force scrolling
  });
  
  const results = [];
  
  try {
    for (const pageConfig of PAGES) {
      console.log(`📄 Testing: ${pageConfig.name} (${pageConfig.path})`);
      
      const page = await browser.newPage();
      const result = {
        name: pageConfig.name,
        path: pageConfig.path,
        shouldScroll: pageConfig.shouldScroll,
        canScroll: false,
        hasScrollableClass: false,
        bodyOverflow: null,
        screenshot: null,
        error: null
      };
      
      try {
        // Navigate to the page
        await page.goto(`${BASE_URL}${pageConfig.path}`, { 
          waitUntil: 'networkidle2',
          timeout: 10000 
        });
        
        // Wait a bit for any animations
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check if the page has the scrollable class
        const hasScrollableClass = await page.evaluate(() => {
          const mainElement = document.querySelector('.scrollable-page') || 
                             document.querySelector('div[class*="min-h-screen"]');
          return mainElement ? mainElement.classList.contains('scrollable-page') : false;
        });
        
        result.hasScrollableClass = hasScrollableClass;
        
        // Check body overflow style
        const bodyOverflow = await page.evaluate(() => {
          return window.getComputedStyle(document.body).overflowY;
        });
        
        result.bodyOverflow = bodyOverflow;
        
        // Check if scrolling is possible
        const pageHeight = await page.evaluate(() => document.body.scrollHeight);
        const viewportHeight = await page.evaluate(() => window.innerHeight);
        const canScroll = pageHeight > viewportHeight;
        
        // Check if the scrollable class allows scrolling
        const scrollableElement = await page.evaluate(() => {
          const elem = document.querySelector('.scrollable-page');
          if (!elem) return null;
          const style = window.getComputedStyle(elem);
          return {
            overflowY: style.overflowY,
            height: style.height,
            maxHeight: style.maxHeight
          };
        });
        
        result.scrollableElementStyle = scrollableElement;
        result.canScroll = canScroll || (scrollableElement && scrollableElement.overflowY === 'auto');
        
        // Take a screenshot
        const screenshotPath = path.join(testResultsDir, `scroll-test-${pageConfig.name.toLowerCase().replace(/\s+/g, '-')}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        result.screenshot = screenshotPath;
        
        // If the page should be scrollable, try scrolling
        if (pageConfig.shouldScroll && canScroll) {
          await page.evaluate(() => {
            window.scrollTo(0, document.body.scrollHeight / 2);
          });
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Take another screenshot after scrolling
          const scrolledScreenshotPath = path.join(testResultsDir, `scroll-test-${pageConfig.name.toLowerCase().replace(/\s+/g, '-')}-scrolled.png`);
          await page.screenshot({ path: scrolledScreenshotPath, fullPage: true });
        }
        
        console.log(`  ✓ Has scrollable class: ${hasScrollableClass}`);
        console.log(`  ✓ Body overflow: ${bodyOverflow}`);
        console.log(`  ✓ Can scroll: ${canScroll} (page height: ${pageHeight}px, viewport: ${viewportHeight}px)`);
        console.log(`  ✓ Screenshot saved: ${screenshotPath}`);
        
      } catch (error) {
        result.error = error.message;
        console.log(`  ✗ Error: ${error.message}`);
      }
      
      results.push(result);
      await page.close();
      console.log('');
    }
    
    // Generate report
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: PAGES.length,
        passed: results.filter(r => {
          // Pages that should scroll must have the scrollable class
          if (r.shouldScroll) {
            return r.hasScrollableClass;
          }
          // Pages that shouldn't scroll must not have the scrollable class
          return !r.hasScrollableClass;
        }).length,
        failed: results.filter(r => {
          // Pages that should scroll must have the scrollable class
          if (r.shouldScroll) {
            return !r.hasScrollableClass;
          }
          // Pages that shouldn't scroll must not have the scrollable class
          return r.hasScrollableClass;
        }).length
      },
      results
    };
    
    // Save report
    const reportPath = path.join(testResultsDir, 'scrolling-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Print summary
    console.log('\n📊 Test Summary:');
    console.log(`Total pages tested: ${report.summary.total}`);
    console.log(`Passed: ${report.summary.passed}`);
    console.log(`Failed: ${report.summary.failed}`);
    console.log(`Report saved: ${reportPath}`);
    
    // Print details for failed tests
    const failedTests = results.filter(r => {
      if (r.shouldScroll) {
        return !r.hasScrollableClass;
      }
      return r.hasScrollableClass;
    });
    
    if (failedTests.length > 0) {
      console.log('\n❌ Failed Tests:');
      failedTests.forEach(test => {
        if (test.shouldScroll && !test.hasScrollableClass) {
          console.log(`- ${test.name}: Should scroll but missing scrollable-page class`);
        } else if (!test.shouldScroll && test.hasScrollableClass) {
          console.log(`- ${test.name}: Should not scroll but has scrollable-page class`);
        }
      });
    }
    
  } finally {
    await browser.close();
  }
}

// Run the test
testScrolling().catch(console.error);