#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

console.log('🔍 TypeScript Strict Mode Analysis');
console.log('=' .repeat(50));

async function analyzeTypeScriptErrors() {
  const results = {
    timestamp: new Date().toISOString(),
    totalErrors: 0,
    errorsByCategory: {},
    filesByErrorCount: [],
    criticalFiles: [],
    summary: {}
  };

  try {
    // Run TypeScript compiler in no-emit mode to check for errors
    console.log('\n📊 Running TypeScript compiler check...\n');
    
    const { stdout, stderr } = await execAsync('npx tsc --noEmit --pretty false', {
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer
    }).catch(err => ({ stdout: err.stdout || '', stderr: err.stderr || '' }));

    const output = stdout + stderr;
    const lines = output.split('\n').filter(line => line.trim());
    
    // Parse TypeScript errors
    const errorPattern = /^(.+?)\((\d+),(\d+)\): error (TS\d+): (.+)$/;
    const errors = [];
    const fileErrors = {};
    const errorCategories = {
      'TS2307': 'Module not found',
      'TS2339': 'Property does not exist',
      'TS2345': 'Argument type mismatch',
      'TS2322': 'Type assignment error',
      'TS2532': 'Object possibly undefined',
      'TS2531': 'Object possibly null',
      'TS7006': 'Parameter implicitly has any type',
      'TS7031': 'Binding element implicitly has any type',
      'TS2304': 'Cannot find name',
      'TS2554': 'Expected arguments mismatch',
      'TS2571': 'Object is of type unknown',
      'TS18048': 'Value possibly undefined',
      'TS18047': 'Value possibly null',
      'TS2769': 'No overload matches',
      'TS2741': 'Property missing in type',
      'TS2564': 'Property has no initializer',
      'TS2454': 'Variable used before assigned'
    };

    lines.forEach(line => {
      const match = line.match(errorPattern);
      if (match) {
        const [, file, line, col, code, message] = match;
        const relativeFile = file.replace(process.cwd() + path.sep, '');
        
        errors.push({
          file: relativeFile,
          line: parseInt(line),
          column: parseInt(col),
          code,
          message,
          category: errorCategories[code] || 'Other'
        });

        // Track errors by file
        if (!fileErrors[relativeFile]) {
          fileErrors[relativeFile] = [];
        }
        fileErrors[relativeFile].push({ line, code, message });

        // Track errors by category
        const category = errorCategories[code] || 'Other';
        if (!results.errorsByCategory[category]) {
          results.errorsByCategory[category] = 0;
        }
        results.errorsByCategory[category]++;
      }
    });

    results.totalErrors = errors.length;

    // Sort files by error count
    results.filesByErrorCount = Object.entries(fileErrors)
      .map(([file, errs]) => ({ file, errorCount: errs.length, errors: errs }))
      .sort((a, b) => b.errorCount - a.errorCount);

    // Identify critical files (core business logic)
    const criticalPatterns = [
      'GlobalSettingsContext',
      'journeyService',
      'useJourneyAnimation',
      'useGlobalJourneyProgression',
      'App.tsx',
      'supabase',
      'database'
    ];

    results.criticalFiles = results.filesByErrorCount.filter(item => 
      criticalPatterns.some(pattern => item.file.includes(pattern))
    );

    // Generate summary
    console.log('\n📈 Error Summary:');
    console.log(`Total Errors: ${results.totalErrors}`);
    console.log(`Files with Errors: ${results.filesByErrorCount.length}`);
    
    console.log('\n🏷️ Errors by Category:');
    Object.entries(results.errorsByCategory)
      .sort((a, b) => b[1] - a[1])
      .forEach(([category, count]) => {
        console.log(`  ${category}: ${count}`);
      });

    console.log('\n📁 Top 10 Files with Most Errors:');
    results.filesByErrorCount.slice(0, 10).forEach(({ file, errorCount }) => {
      console.log(`  ${file}: ${errorCount} errors`);
    });

    console.log('\n🔥 Critical Files with Errors:');
    if (results.criticalFiles.length > 0) {
      results.criticalFiles.forEach(({ file, errorCount }) => {
        console.log(`  ${file}: ${errorCount} errors`);
      });
    } else {
      console.log('  No errors in critical files! ✅');
    }

    // Check for specific strict mode issues
    console.log('\n🎯 Strict Mode Specific Issues:');
    const strictIssues = {
      'any types': errors.filter(e => e.code === 'TS7006' || e.code === 'TS7031').length,
      'null/undefined': errors.filter(e => 
        ['TS2532', 'TS2531', 'TS18048', 'TS18047'].includes(e.code)
      ).length,
      'uninitialized': errors.filter(e => e.code === 'TS2564').length,
      'type mismatches': errors.filter(e => 
        ['TS2322', 'TS2345', 'TS2741'].includes(e.code)
      ).length
    };

    Object.entries(strictIssues).forEach(([issue, count]) => {
      console.log(`  ${issue}: ${count}`);
    });

    // Save detailed report
    const report = {
      ...results,
      errors: errors.slice(0, 100), // First 100 errors for review
      strictIssues,
      recommendations: generateRecommendations(results, strictIssues)
    };

    await fs.writeFile(
      'typescript-analysis-report.json',
      JSON.stringify(report, null, 2)
    );

    console.log('\n✅ Detailed report saved to typescript-analysis-report.json');

    return report;

  } catch (error) {
    console.error('Error during analysis:', error.message);
    return results;
  }
}

function generateRecommendations(results, strictIssues) {
  const recommendations = [];

  if (strictIssues['any types'] > 0) {
    recommendations.push({
      priority: 'HIGH',
      issue: 'Implicit any types',
      count: strictIssues['any types'],
      action: 'Add explicit type annotations to parameters and variables'
    });
  }

  if (strictIssues['null/undefined'] > 0) {
    recommendations.push({
      priority: 'HIGH',
      issue: 'Null/undefined checks',
      count: strictIssues['null/undefined'],
      action: 'Add null checks or use optional chaining (?.) and nullish coalescing (??)'
    });
  }

  if (strictIssues['uninitialized'] > 0) {
    recommendations.push({
      priority: 'MEDIUM',
      issue: 'Uninitialized properties',
      count: strictIssues['uninitialized'],
      action: 'Initialize class properties in constructor or at declaration'
    });
  }

  if (strictIssues['type mismatches'] > 0) {
    recommendations.push({
      priority: 'MEDIUM',
      issue: 'Type mismatches',
      count: strictIssues['type mismatches'],
      action: 'Fix type assignments and function arguments'
    });
  }

  return recommendations;
}

// Run the analysis
analyzeTypeScriptErrors().then(report => {
  console.log('\n' + '='.repeat(50));
  console.log('Analysis Complete!');
  
  if (report.totalErrors === 0) {
    console.log('🎉 No TypeScript errors found! The codebase is already strict mode compliant.');
  } else {
    console.log(`\n⚠️ Found ${report.totalErrors} TypeScript errors that need attention.`);
    console.log('Review typescript-analysis-report.json for details.');
  }
});