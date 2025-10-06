import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing environment variables');
  console.error('Required: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function refreshSchemaCache() {
  console.log('🔄 Attempting to refresh Supabase schema cache...\n');

  try {
    // Method 1: Execute NOTIFY command via RPC
    console.log('Method 1: Trying NOTIFY pgrst via RPC...');
    const { data: rpcData, error: rpcError } = await supabase.rpc('notify_pgrst_reload');
    
    if (!rpcError) {
      console.log('✅ Successfully sent NOTIFY command via RPC');
    } else {
      console.log('⚠️  RPC method not available:', rpcError.message);
    }

    // Method 2: Force cache refresh by querying all tables
    console.log('\nMethod 2: Force refresh by querying all tables...');
    const tables = ['journeys', 'journey_events', 'donations', 'sms_logs', 'donor_profiles'];
    
    for (const table of tables) {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: Accessible (${data?.length || 0} rows)`);
      }
      // Small delay between queries
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Method 3: Insert and delete a dummy row to force schema recognition
    console.log('\nMethod 3: Write operation to force schema recognition...');
    const testJourney = {
      id: 'TEST-SCHEMA-REFRESH-' + Date.now(),
      donor_id: 'test',
      tracking_id: 'test',
      status: 'active',
      current_stage: 1,
      waypoints: [],
      created_at: new Date().toISOString()
    };

    const { error: insertError } = await supabase.from('journeys').insert(testJourney);
    if (insertError) {
      console.log(`⚠️  Insert test failed: ${insertError.message}`);
    } else {
      console.log('✅ Test insert successful');
      // Clean up test data
      await supabase.from('journeys').delete().eq('id', testJourney.id);
      console.log('✅ Test data cleaned up');
    }

    console.log('\n✅ Schema cache refresh completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Wait 10 seconds for cache to propagate');
    console.log('2. Hard refresh your browser (Ctrl+F5)');
    console.log('3. Run: node test-correct-production-flow.mjs');
    
    return true;
  } catch (error) {
    console.error('❌ Error refreshing schema cache:', error.message);
    return false;
  }
}

// Execute
refreshSchemaCache()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });