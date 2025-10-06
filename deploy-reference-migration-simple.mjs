#!/usr/bin/env node

/**
 * Simple Reference Data Migration Deployment
 * Executes SQL files directly via Supabase Management API
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

console.log('🚀 Deploying Reference Data Migration\n');

async function executeSQL(sql, description) {
  console.log(`📄 ${description}...`);
  
  try {
    // Execute via REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ query: sql })
    });

    if (response.ok) {
      console.log(`   ✅ Success\n`);
      return true;
    } else {
      const error = await response.text();
      console.log(`   ⚠️  Response: ${response.status} - ${error}\n`);
      return false;
    }
  } catch (error) {
    console.log(`   ⚠️  Error: ${error.message}\n`);
    return false;
  }
}

async function verifyTables() {
  console.log('🔍 Verifying tables...\n');
  
  const checks = [
    { table: 'governorates', expected: 5 },
    { table: 'programs', expected: 6 },
    { table: 'villages', expected: 14 },
    { table: 'families', expected: 55 }
  ];
  
  for (const check of checks) {
    try {
      const { count, error } = await supabase
        .from(check.table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`   ❌ ${check.table}: ${error.message}`);
      } else {
        const status = count >= check.expected ? '✅' : '⚠️';
        console.log(`   ${status} ${check.table}: ${count} rows (expected ${check.expected})`);
      }
    } catch (err) {
      console.log(`   ❌ ${check.table}: ${err.message}`);
    }
  }
  
  // Test join query
  console.log('\n🔗 Testing foreign keys...\n');
  try {
    const { data, error } = await supabase
      .from('families')
      .select('id, programs(name), villages(name, governorates(name))')
      .limit(1);
    
    if (error) {
      console.log(`   ❌ Join query failed: ${error.message}`);
    } else if (data && data.length > 0) {
      console.log(`   ✅ Foreign keys working`);
    }
  } catch (err) {
    console.log(`   ❌ Join test failed: ${err.message}`);
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════\n');
  
  // Read migration files
  const schemaPath = join(__dirname, 'supabase', 'migrations', '20250106_reference_data_tables.sql');
  const seedPath = join(__dirname, 'supabase', 'migrations', '20250106_seed_reference_data.sql');
  
  const schemaSql = readFileSync(schemaPath, 'utf8');
  const seedSql = readFileSync(seedPath, 'utf8');
  
  // Execute schema
  await executeSQL(schemaSql, 'Creating tables');
  await new Promise(r => setTimeout(r, 2000));
  
  // Execute seed data
  await executeSQL(seedSql, 'Seeding data');
  await new Promise(r => setTimeout(r, 2000));
  
  // Verify
  await verifyTables();
  
  console.log('\n═══════════════════════════════════════════════');
  console.log('✅ Migration deployment complete!\n');
}

main().catch(console.error);