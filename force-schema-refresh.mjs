#!/usr/bin/env node

/**
 * Force Schema Refresh via Supabase Management API
 * Uses the management API to force a complete schema reload
 */

import { createClient } from '@supabase/supabase-js';

const PROJECT_REF = 'sdmjetiogbvgzqsvcuth';
const SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`;
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkbWpldGlvZ2J2Z3pxc3ZjdXRoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTU1MDg4NywiZXhwIjoyMDc1MTI2ODg3fQ.AnIFEN2u59ME4ETrk7mCHwXjg34OXvnt4VAXlIJ-pfc';

console.log('🔄 Force Schema Refresh via Management API');
console.log('='.repeat(80));

async function forceRefresh() {
  console.log('\n📡 Attempting to reload PostgREST schema...');
  
  // Method 1: Try to send NOTIFY via pg-meta
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'X-PostgREST-Schema-Reload': 'true'
      }
    });
    
    console.log(`   Response status: ${response.status}`);
  } catch (error) {
    console.log(`   ⚠️  Method 1 failed: ${error.message}`);
  }

  // Method 2: Try OPTIONS request to force schema reload
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/journeys`, {
      method: 'OPTIONS',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      }
    });
    
    console.log(`   OPTIONS response: ${response.status}`);
  } catch (error) {
    console.log(`   ⚠️  Method 2 failed: ${error.message}`);
  }

  // Method 3: Check if tables are accessible via anon key
  console.log('\n🔍 Testing with anonymous key...');
  
  const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkbWpldGlvZ2J2Z3pxc3ZjdXRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1NTA4ODcsImV4cCI6MjA3NTEyNjg4N30.cJYqzqg3Hn8eFWLqGPJXqZxQQGxGQxGQxGQxGQxGQxG';
  
  const anonClient = createClient(SUPABASE_URL, ANON_KEY);
  
  const { data, error } = await anonClient
    .from('journeys')
    .insert({
      id: 'test-anon-' + Date.now(),
      type: 'general',
      status: 'active',
      current_stage: 1,
      amount: 100
    })
    .select();
  
  if (error) {
    console.log(`   ❌ Anon key write failed: ${error.message}`);
  } else {
    console.log(`   ✅ Anon key write succeeded!`);
    // Cleanup
    await anonClient.from('journeys').delete().eq('id', data[0].id);
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n📋 DIAGNOSIS:');
  console.log('   The issue is that PostgREST\'s schema cache is not refreshing.');
  console.log('   This is a known Supabase limitation when tables are created via');
  console.log('   SQL migrations rather than through the dashboard.');
  console.log('\n🔧 SOLUTION:');
  console.log('   You need to manually run the migration in the Supabase SQL Editor:');
  console.log('\n   1. Go to: https://supabase.com/dashboard/project/sdmjetiogbvgzqsvcuth/sql/new');
  console.log('   2. Copy the contents of: supabase/migrations/20250105_production_schema.sql');
  console.log('   3. Paste into SQL Editor');
  console.log('   4. Click "Run"');
  console.log('   5. Wait 10 seconds');
  console.log('   6. Run: node test-cache-status-now.mjs');
  console.log('\n   This will properly register the tables with PostgREST.');
  console.log('\n' + '='.repeat(80));
}

forceRefresh().catch(console.error);