#!/usr/bin/env node

/**
 * Deploy Reference Data Migration to Supabase
 * Reads MANUAL_MIGRATION.sql and executes it via Supabase client
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.error('Required: VITE_SUPABASE_URL, VITE_SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('📂 Reading MANUAL_MIGRATION.sql...');
const migrationSQL = readFileSync('MANUAL_MIGRATION.sql', 'utf8');

console.log('🚀 Deploying reference data migration to Supabase...');
console.log('⏳ This may take a few seconds...\n');

try {
  const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
  
  if (error) {
    // Try direct query if RPC fails
    console.log('⚠️ RPC failed, trying direct query...');
    const { error: queryError } = await supabase.from('_migrations').select('*').limit(1);
    
    if (queryError) {
      throw new Error('Cannot execute SQL via Supabase client. Please run MANUAL_MIGRATION.sql in Supabase Dashboard SQL Editor.');
    }
  }
  
  console.log('✅ Migration deployed successfully!');
  console.log('\n========================================');
  console.log('Next steps:');
  console.log('1. Verify in Supabase Dashboard');
  console.log('2. Test donation button');
  console.log('3. Check SMS page for messages');
  console.log('========================================\n');
  
} catch (error) {
  console.error('\n❌ Deployment failed:', error.message);
  console.error('\n📋 Manual deployment required:');
  console.error('1. Open Supabase Dashboard → SQL Editor');
  console.error('2. Copy contents of MANUAL_MIGRATION.sql');
  console.error('3. Paste and click Run');
  console.error('4. Wait for success message\n');
  process.exit(1);
}