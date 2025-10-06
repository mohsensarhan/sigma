/**
 * Force Supabase Schema Reload via Management API
 * This uses the Supabase Management API to trigger a schema reload
 */

const SUPABASE_PROJECT_REF = 'sdmjetiogbvgzqsvcuth';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkbWpldGlvZ2J2Z3pxc3ZjdXRoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTU1MDg4NywiZXhwIjoyMDc1MTI2ODg3fQ.AnIFEN2u59ME4ETrk7mCHwXjg34OXvnt4VAXlIJ-pfc';

async function forceSchemaReload() {
  console.log('🔄 Attempting to force schema reload via PostgREST API...\n');
  
  try {
    // Method 1: Send NOTIFY to PostgREST to reload schema
    const reloadUrl = `https://${SUPABASE_PROJECT_REF}.supabase.co/rest/v1/rpc/pgrst_watch`;
    
    console.log('📡 Sending schema reload signal...');
    const response = await fetch(reloadUrl, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      }
    });
    
    console.log(`Response status: ${response.status}`);
    
    if (response.status === 404) {
      console.log('⚠️  pgrst_watch function not available (expected)');
      console.log('📡 Trying alternative method: Direct schema query...\n');
      
      // Method 2: Query the schema directly to force cache update
      const schemaUrl = `https://${SUPABASE_PROJECT_REF}.supabase.co/rest/v1/`;
      const schemaResponse = await fetch(schemaUrl, {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Accept': 'application/openapi+json'
        }
      });
      
      console.log(`Schema query status: ${schemaResponse.status}`);
      
      if (schemaResponse.ok) {
        const schema = await schemaResponse.json();
        const tables = Object.keys(schema.definitions || {});
        console.log(`✅ Schema retrieved with ${tables.length} definitions`);
        console.log('📋 Tables found:', tables.slice(0, 10).join(', '));
      }
    }
    
    console.log('\n⏳ Waiting 10 seconds for cache to propagate...\n');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Verify tables are now accessible
    console.log('🔍 Verifying table access...\n');
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      `https://${SUPABASE_PROJECT_REF}.supabase.co`,
      SUPABASE_SERVICE_KEY
    );
    
    const tables = ['journeys', 'journey_events', 'donations', 'sms_logs', 'donor_profiles'];
    let allAccessible = true;
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('id', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
        allAccessible = false;
      } else {
        console.log(`✅ ${table}: Accessible`);
      }
    }
    
    console.log('\n' + '='.repeat(70));
    if (allAccessible) {
      console.log('🎉 SUCCESS! All tables are now accessible!');
      console.log('🚀 Run: node test-complete-production-verification.mjs');
    } else {
      console.log('⚠️  Schema cache still not refreshed.');
      console.log('\n💡 MANUAL ACTION REQUIRED:');
      console.log('   1. Open: https://sdmjetiogbvgzqsvcuth.supabase.co');
      console.log('   2. Go to: Settings → API');
      console.log('   3. Click: "Reload schema cache" button');
      console.log('   4. Wait 30 seconds');
      console.log('   5. Run: node verify-supabase-schema.mjs');
    }
    console.log('='.repeat(70));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 MANUAL ACTION REQUIRED:');
    console.log('   1. Open: https://sdmjetiogbvgzqsvcuth.supabase.co');
    console.log('   2. Go to: Settings → API');
    console.log('   3. Click: "Reload schema cache" button');
  }
}

forceSchemaReload().catch(console.error);