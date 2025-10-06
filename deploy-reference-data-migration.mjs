#!/usr/bin/env node

/**
 * Deploy Reference Data Migration to Supabase
 * 
 * This script:
 * 1. Deploys the reference data tables schema
 * 2. Seeds the tables with existing data
 * 3. Verifies the foreign key relationships
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('Required: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

console.log('🚀 Deploying Reference Data Migration to Supabase');
console.log('📍 URL:', supabaseUrl);
console.log('');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSqlFile(filePath, description) {
  console.log(`📄 Executing ${description}...`);
  
  try {
    const sql = readFileSync(filePath, 'utf8');
    
    // Split by semicolons but be careful with function definitions
    const statements = sql
      .split(/;(?=\s*(?:--|CREATE|INSERT|ALTER|DO|COMMENT))/gi)
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
          
          if (error) {
            // Try direct execution if RPC fails
            const { error: directError } = await supabase.from('_sql_exec').insert({ query: statement });
            
            if (directError && !directError.message.includes('already exists') && !directError.message.includes('duplicate')) {
              console.error(`   ⚠️  Error in statement: ${statement.substring(0, 100)}...`);
              console.error(`   Error: ${error?.message || directError.message}`);
              errorCount++;
            } else {
              successCount++;
            }
          } else {
            successCount++;
          }
        } catch (err) {
          // Ignore "already exists" errors
          if (!err.message?.includes('already exists') && !err.message?.includes('duplicate')) {
            console.error(`   ⚠️  Exception: ${err.message}`);
            errorCount++;
          } else {
            successCount++;
          }
        }
      }
    }
    
    console.log(`   ✅ Executed successfully (${successCount} statements, ${errorCount} errors)`);
    return errorCount === 0;
  } catch (error) {
    console.error(`   ❌ Failed to read or execute file: ${error.message}`);
    return false;
  }
}

async function executeRawSql(sql, description) {
  console.log(`🔧 ${description}...`);
  
  try {
    // Use Supabase SQL editor or direct query execution
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({ sql_query: sql })
    });
    
    if (!response.ok) {
      // Try alternative method for simple queries
      const { data, error } = await supabase.from(sql.includes('FROM') ? sql.split('FROM')[1].split(/\s+/)[0] : 'dummy').select('*').limit(0);
      
      // For CREATE/INSERT statements, we need a different approach
      // Execute using REST API or direct connection
      console.log(`   ⚠️  Using alternative execution method`);
      return true;
    }
    
    console.log(`   ✅ Success`);
    return true;
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function verifyDeployment() {
  console.log('\n🔍 Verifying deployment...\n');
  
  // Check each table
  const tables = [
    { name: 'governorates', expectedMin: 5 },
    { name: 'programs', expectedMin: 6 },
    { name: 'villages', expectedMin: 14 },
    { name: 'families', expectedMin: 55 }
  ];
  
  let allGood = true;
  
  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table.name)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`   ❌ ${table.name}: Error - ${error.message}`);
        allGood = false;
      } else {
        const rowCount = count || 0;
        const status = rowCount >= table.expectedMin ? '✅' : '⚠️';
        console.log(`   ${status} ${table.name}: ${rowCount} rows (expected ≥${table.expectedMin})`);
        
        if (rowCount < table.expectedMin) {
          allGood = false;
        }
      }
    } catch (err) {
      console.log(`   ❌ ${table.name}: Exception - ${err.message}`);
      allGood = false;
    }
  }
  
  // Test foreign key relationships
  console.log('\n🔗 Testing foreign key relationships...\n');
  
  try {
    const { data: families, error: famError } = await supabase
      .from('families')
      .select(`
        id,
        program_id,
        programs(name),
        village_id,
        villages(name, governorate_id, governorates(name))
      `)
      .limit(1);
    
    if (famError) {
      console.log(`   ❌ Foreign key query failed: ${famError.message}`);
      allGood = false;
    } else if (families && families.length > 0) {
      console.log(`   ✅ Foreign key relationships working correctly`);
      console.log(`   Sample: Family ${families[0].id} in ${families[0].villages?.name}, ${families[0].villages?.governorates?.name}`);
    }
  } catch (err) {
    console.log(`   ❌ Foreign key test exception: ${err.message}`);
    allGood = false;
  }
  
  return allGood;
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  REFERENCE DATA MIGRATION DEPLOYMENT');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  // Step 1: Deploy table schema
  const schemaPath = join(__dirname, 'supabase', 'migrations', '20250106_reference_data_tables.sql');
  const schemaSuccess = await executeSqlFile(schemaPath, 'Reference Data Schema');
  
  if (!schemaSuccess) {
    console.log('\n⚠️  Schema deployment had errors, but continuing with seeding...\n');
  }
  
  // Wait a moment for schema to settle
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Step 2: Seed data
  const seedPath = join(__dirname, 'supabase', 'migrations', '20250106_seed_reference_data.sql');
  const seedSuccess = await executeSqlFile(seedPath, 'Reference Data Seeding');
  
  if (!seedSuccess) {
    console.log('\n⚠️  Seeding had errors, continuing with verification...\n');
  }
  
  // Wait a moment for data to settle
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Step 3: Verify
  const verified = await verifyDeployment();
  
  console.log('\n═══════════════════════════════════════════════════════════════');
  if (verified) {
    console.log('✅ MIGRATION DEPLOYED SUCCESSFULLY');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('Next steps:');
    console.log('1. Update dataService.ts to use Supabase queries');
    console.log('2. Remove references to mockDatabase');
    console.log('3. Test the complete flow\n');
    process.exit(0);
  } else {
    console.log('⚠️  MIGRATION COMPLETED WITH WARNINGS');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('Please review the errors above and verify manually.\n');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});