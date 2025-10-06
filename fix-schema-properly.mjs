#!/usr/bin/env node

/**
 * Proper Schema Fix
 * Creates exec_sql function, then rebuilds schema using Supabase Management API
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const SUPABASE_URL = 'https://sdmjetiogbvgzqsvcuth.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkbWpldGlvZ2J2Z3pxc3ZjdXRoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTU1MDg4NywiZXhwIjoyMDc1MTI2ODg3fQ.AnIFEN2u59ME4ETrk7mCHwXjg34OXvnt4VAXlIJ-pfc';
const SUPABASE_DB_PASSWORD = 'Mohsen@2580';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false }
});

console.log('🔧 Proper Schema Fix');
console.log('='.repeat(80));

async function executeSQL(sql, description) {
  console.log(`\n📝 ${description}...`);
  
  try {
    // Use Supabase's pg-meta API for direct SQL execution
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ query: sql })
    });

    if (!response.ok) {
      const error = await response.text();
      console.log(`   ⚠️  ${description}: ${error}`);
      return false;
    }
    
    console.log(`   ✅ ${description}: Success`);
    return true;
  } catch (error) {
    console.log(`   ❌ ${description}: ${error.message}`);
    return false;
  }
}

async function fixSchema() {
  console.log('\n🎯 STEP 1: Create exec_sql helper function');
  
  const execSqlFunction = `
CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
RETURNS VOID AS $$
BEGIN
  EXECUTE sql_query;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`;

  // Try to create via direct query
  console.log('   Attempting to create exec_sql function...');
  
  // Since we can't use RPC, let's use the SQL Editor approach
  console.log('\n⚠️  Cannot create exec_sql via API');
  console.log('\n📋 MANUAL ACTION REQUIRED:');
  console.log('   1. Go to: https://supabase.com/dashboard/project/sdmjetiogbvgzqsvcuth/sql/new');
  console.log('   2. Paste and run this SQL:\n');
  console.log('─'.repeat(80));
  console.log(execSqlFunction);
  console.log('─'.repeat(80));
  console.log('\n   3. Then run the full migration:\n');
  
  // Read migration file
  const migrationSQL = readFileSync('./supabase/migrations/20250105_production_schema.sql', 'utf8');
  console.log('─'.repeat(80));
  console.log(migrationSQL);
  console.log('─'.repeat(80));
  
  console.log('\n   4. After running both, execute: node test-cache-status-now.mjs');
  console.log('\n' + '='.repeat(80));
  
  // Alternative: Show connection string for psql
  console.log('\n💡 ALTERNATIVE: Use psql directly');
  console.log('   Connection string:');
  console.log(`   postgresql://postgres:${SUPABASE_DB_PASSWORD}@db.sdmjetiogbvgzqsvcuth.supabase.co:5432/postgres`);
  console.log('\n   Commands:');
  console.log('   psql "postgresql://postgres:Mohsen@2580@db.sdmjetiogbvgzqsvcuth.supabase.co:5432/postgres"');
  console.log('   \\i supabase/migrations/20250105_production_schema.sql');
  console.log('   \\q');
  console.log('\n' + '='.repeat(80));
}

fixSchema().catch(console.error);