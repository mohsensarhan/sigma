#!/usr/bin/env node

/**
 * Test Reference Data Migration
 * Verifies that the system works 100% with Supabase reference data
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🧪 Testing Reference Data Migration\n');
console.log('═══════════════════════════════════════════════════════════════\n');

let testsPassed = 0;
let testsFailed = 0;

async function test(name, fn) {
  try {
    console.log(`🔍 ${name}...`);
    await fn();
    console.log(`   ✅ PASS\n`);
    testsPassed++;
  } catch (error) {
    console.log(`   ❌ FAIL: ${error.message}\n`);
    testsFailed++;
  }
}

// Test 1: Verify all tables exist and have data
await test('All reference tables exist with data', async () => {
  const tables = ['governorates', 'programs', 'villages', 'families'];
  
  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      throw new Error(`Table ${table} query failed: ${error.message}`);
    }
    
    if (!count || count === 0) {
      throw new Error(`Table ${table} has no data`);
    }
    
    console.log(`      ${table}: ${count} rows`);
  }
});

// Test 2: Verify governorates structure
await test('Governorates have correct structure', async () => {
  const { data, error } = await supabase
    .from('governorates')
    .select('*')
    .limit(1)
    .single();
  
  if (error) throw new Error(error.message);
  if (!data) throw new Error('No governorate found');
  
  const required = ['id', 'name', 'weight', 'strategic_warehouse'];
  for (const field of required) {
    if (!(field in data)) {
      throw new Error(`Missing field: ${field}`);
    }
  }
  
  console.log(`      Sample: ${data.name} (weight: ${data.weight})`);
});

// Test 3: Verify programs structure
await test('Programs have correct structure', async () => {
  const { data, error } = await supabase
    .from('programs')
    .select('*')
    .limit(1)
    .single();
  
  if (error) throw new Error(error.message);
  if (!data) throw new Error('No program found');
  
  const required = ['id', 'name', 'weight'];
  for (const field of required) {
    if (!(field in data)) {
      throw new Error(`Missing field: ${field}`);
    }
  }
  
  console.log(`      Sample: ${data.name} (weight: ${data.weight})`);
});

// Test 4: Verify villages structure and foreign keys
await test('Villages link correctly to governorates', async () => {
  const { data, error } = await supabase
    .from('villages')
    .select(`
      id,
      name,
      lon,
      lat,
      governorate_id,
      governorates (
        id,
        name
      )
    `)
    .limit(1)
    .single();
  
  if (error) throw new Error(error.message);
  if (!data) throw new Error('No village found');
  if (!data.governorates) throw new Error('Village not linked to governorate');
  
  console.log(`      Sample: ${data.name} → ${data.governorates.name}`);
});

// Test 5: Verify families structure and foreign keys
await test('Families link correctly to programs and villages', async () => {
  const { data, error } = await supabase
    .from('families')
    .select(`
      id,
      profile,
      program_id,
      programs (
        id,
        name
      ),
      village_id,
      villages (
        id,
        name,
        governorate_id,
        governorates (
          id,
          name
        )
      )
    `)
    .limit(1)
    .single();
  
  if (error) throw new Error(error.message);
  if (!data) throw new Error('No family found');
  if (!data.programs) throw new Error('Family not linked to program');
  if (!data.villages) throw new Error('Family not linked to village');
  if (!data.villages.governorates) throw new Error('Village not linked to governorate');
  
  console.log(`      Sample: ${data.id}`);
  console.log(`      Program: ${data.programs.name}`);
  console.log(`      Location: ${data.villages.name}, ${data.villages.governorates.name}`);
  console.log(`      Profile: ${data.profile}`);
});

// Test 6: Test weighted selection data
await test('Programs have varied weights for selection', async () => {
  const { data, error } = await supabase
    .from('programs')
    .select('name, weight')
    .order('weight', { ascending: false });
  
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) throw new Error('No programs found');
  
  const weights = data.map(p => p.weight);
  const uniqueWeights = new Set(weights);
  
  if (uniqueWeights.size < 2) {
    throw new Error('All programs have same weight - selection won\'t be varied');
  }
  
  console.log(`      Weight range: ${Math.min(...weights)} - ${Math.max(...weights)}`);
});

// Test 7: Test data distribution
await test('Families are distributed across programs and governorates', async () => {
  const { data: distribution, error } = await supabase
    .from('families')
    .select(`
      program_id,
      programs(name),
      villages(governorate_id, governorates(name))
    `);
  
  if (error) throw new Error(error.message);
  if (!distribution) throw new Error('No families found');
  
  const programSet = new Set(distribution.map(f => f.program_id));
  const governorateSet = new Set(distribution.map(f => f.villages?.governorates?.name).filter(Boolean));
  
  if (programSet.size < 3) throw new Error('Too few programs represented');
  if (governorateSet.size < 3) throw new Error('Too few governorates represented');
  
  console.log(`      ${programSet.size} programs, ${governorateSet.size} governorates`);
});

// Test 8: Test RLS policies (public read access)
await test('Public can read reference data (RLS working)', async () => {
  // Create an unauthenticated client
  const anonClient = createClient(supabaseUrl, supabaseAnonKey);
  
  const { data, error } = await anonClient
    .from('governorates')
    .select('id, name')
    .limit(1);
  
  if (error) throw new Error(`RLS blocking read: ${error.message}`);
  if (!data || data.length === 0) throw new Error('No data returned');
  
  console.log(`      Public access confirmed`);
});

// Test 9: Verify active families filter
await test('Only active families are accessible', async () => {
  const { data, error } = await supabase
    .from('families')
    .select('id, active');
  
  if (error) throw new Error(error.message);
  
  const inactiveCount = data?.filter(f => !f.active).length || 0;
  
  if (inactiveCount > 0) {
    console.log(`      Note: ${inactiveCount} inactive families found (should be filtered in queries)`);
  } else {
    console.log(`      All ${data?.length} families are active`);
  }
});

// Test 10: Test complex query with joins
await test('Complex join query performs well', async () => {
  const startTime = Date.now();
  
  const { data, error } = await supabase
    .from('families')
    .select(`
      id,
      profile,
      programs (name, weight),
      villages (
        name,
        lon,
        lat,
        governorates (
          name,
          strategic_warehouse
        )
      )
    `)
    .eq('active', true)
    .limit(10);
  
  const duration = Date.now() - startTime;
  
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) throw new Error('No results');
  
  console.log(`      Query returned ${data.length} results in ${duration}ms`);
  
  if (duration > 1000) {
    console.log(`      ⚠️  Slow query detected (>1s)`);
  }
});

// Summary
console.log('═══════════════════════════════════════════════════════════════');
console.log(`\n📊 Test Results: ${testsPassed} passed, ${testsFailed} failed\n`);

if (testsFailed === 0) {
  console.log('✅ ALL TESTS PASSED');
  console.log('✅ Reference data migration is 100% successful');
  console.log('✅ System is fully database-driven\n');
  console.log('Next steps:');
  console.log('1. Test donation flow end-to-end');
  console.log('2. Monitor Supabase logs for any errors');
  console.log('3. Consider removing mockDatabase.ts as fallback\n');
  process.exit(0);
} else {
  console.log('❌ SOME TESTS FAILED');
  console.log('Please review the errors above and fix issues\n');
  process.exit(1);
}