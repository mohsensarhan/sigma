import fs from 'fs';
import path from 'path';

const REPORT_PATH = './test-results/fbi-stress/fbi-stress-report.json';

try {
  console.log('🔍 Analyzing FBI Stress Test Report...\n');
  
  const reportData = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf8'));
  
  // Extract key summary information
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🔥 FBI STRESS TEST SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════');
  
  console.log(`\n📊 Test Duration: ${(reportData.duration / 1000).toFixed(2)} seconds`);
  console.log(`📅 Timestamp: ${reportData.timestamp}`);
  console.log(`🎯 Overall Status: ${reportData.status}`);
  
  console.log('\n📈 Test Configuration:');
  console.log(`   Concurrent Donations: ${reportData.testConfig.concurrentDonations}`);
  console.log(`   Step Duration: ${reportData.testConfig.stepDuration} seconds`);
  console.log(`   Total Stages: ${reportData.testConfig.totalStages}`);
  console.log(`   Monitoring Interval: ${reportData.testConfig.monitoringInterval}ms`);
  
  console.log('\n📸 Screenshots Taken:');
  console.log(`   Total: ${reportData.summary.screenshotsTaken}`);
  reportData.detectiveReport.screenshots.forEach((screenshot, index) => {
    console.log(`   ${index + 1}. ${screenshot.description} (${path.basename(screenshot.path)})`);
  });
  
  console.log('\n🎯 Test Results:');
  Object.entries(reportData.testResults.results).forEach(([test, result]) => {
    const status = result ? '✅ PASSED' : '❌ FAILED';
    console.log(`   ${test}: ${status}`);
  });
  
  console.log('\n📊 Performance Summary:');
  const perf = reportData.performanceReport.summary;
  console.log(`   Page Loads: ${perf.totalPageLoads}`);
  console.log(`   Network Requests: ${perf.totalNetworkRequests}`);
  console.log(`   Console Errors: ${perf.totalErrors}`);
  console.log(`   State Changes: ${perf.totalStateChanges}`);
  console.log(`   Avg Memory Usage: ${(perf.averageMemoryUsage / 1024 / 1024).toFixed(2)} MB`);
  
  console.log('\n📝 Logging Summary:');
  const logs = reportData.detectiveReport.summary;
  console.log(`   Total Logs: ${logs.totalLogs}`);
  console.log(`   Total Events: ${logs.totalEvents}`);
  console.log(`   Errors: ${logs.errorCount}`);
  console.log(`   Warnings: ${logs.warningCount}`);
  
  console.log('\n🔍 Key Events:');
  reportData.detectiveReport.events.slice(0, 10).forEach((event, index) => {
    console.log(`   ${index + 1}. ${event.event} - ${new Date(event.timestamp).toLocaleTimeString()}`);
  });
  
  console.log('\n💡 Recommendations:');
  reportData.recommendations.forEach(rec => {
    console.log(`   • ${rec}`);
  });
  
  // Extract journey progression data if available
  if (reportData.testResults.results.journeyMonitoring) {
    const journeyData = reportData.testResults.results.journeyMonitoring;
    console.log('\n🚗 Journey Progression:');
    console.log(`   Total Checkpoints: ${journeyData.checkpoints?.length || 0}`);
    console.log(`   Errors During Monitoring: ${journeyData.errors?.length || 0}`);
    
    if (journeyData.checkpoints && journeyData.checkpoints.length > 0) {
      const firstCheckpoint = journeyData.checkpoints[0];
      const lastCheckpoint = journeyData.checkpoints[journeyData.checkpoints.length - 1];
      console.log(`   First Checkpoint: Stage ${firstCheckpoint.currentStage} (${(firstCheckpoint.elapsed/1000).toFixed(1)}s)`);
      console.log(`   Last Checkpoint: Stage ${lastCheckpoint.currentStage} (${(lastCheckpoint.elapsed/1000).toFixed(1)}s)`);
    }
  }
  
  // Extract SMS verification data if available
  if (reportData.testResults.results.smsVerification) {
    const smsData = reportData.testResults.results.smsVerification;
    console.log('\n📱 SMS Verification:');
    console.log(`   Message Cards: ${smsData.messageCards}`);
    console.log(`   Donor Tabs: ${smsData.donorTabs}`);
    console.log(`   View Journey Buttons: ${smsData.viewJourneyButtons}`);
  }
  
  // Extract final admin stats if available
  if (reportData.testResults.results.finalAdminStats) {
    const adminData = reportData.testResults.results.finalAdminStats;
    console.log('\n📊 Final Admin Stats:');
    console.log(`   Matches Expected: ${adminData.matchesExpected ? '✅ YES' : '❌ NO'}`);
    console.log(`   Error Logs Found: ${adminData.errorLogs?.length || 0}`);
    if (adminData.stats) {
      console.log(`   Active: ${adminData.stats.active}, Completed: ${adminData.stats.completed}, Total: ${adminData.stats.total}`);
    }
  }
  
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log(`📄 Full Report: ${REPORT_PATH}`);
  console.log(`📁 Screenshots: ./test-results/fbi-stress/`);
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  // Create a concise summary file
  const summary = {
    timestamp: reportData.timestamp,
    duration: reportData.duration,
    status: reportData.status,
    config: reportData.testConfig,
    summary: reportData.summary,
    performance: reportData.performanceReport.summary,
    recommendations: reportData.recommendations,
    testResults: Object.keys(reportData.testResults.results).map(key => ({
      test: key,
      passed: !!reportData.testResults.results[key]
    }))
  };
  
  const summaryPath = './test-results/fbi-stress/fbi-stress-summary.json';
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  console.log(`📋 Concise summary saved to: ${summaryPath}`);
  
} catch (error) {
  console.error('❌ Error reading report:', error.message);
  process.exit(1);
}