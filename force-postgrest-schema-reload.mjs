import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import https from 'https';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

// Extract project ref from URL
const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
if (!projectRef) {
  console.error('❌ Could not extract project ref from URL');
  process.exit(1);
}

console.log(`🔍 Project: ${projectRef}`);
console.log(`🔄 Forcing PostgREST schema reload...\n`);

// Method 1: Direct HTTP request to PostgREST admin endpoint
async function reloadViaHTTP() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: `${projectRef}.supabase.co`,
      port: 443,
      path: '/rest/v1/',
      method: 'POST',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      }
    };

    const req = https.request(options, (res) => {
      console.log(`✅ HTTP reload response: ${res.statusCode}`);
      resolve(res.statusCode === 200 || res.statusCode === 201);
    });

    req.on('error', (error) => {
      console.log(`⚠️  HTTP reload failed: ${error.message}`);
      resolve(false);
    });

    req.end();
  });
}

// Method 2: Execute SQL to create and call reload function
async function reloadViaSQL() {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  
  console.log('Method 2: Creating reload function via SQL...');
  
  try {
    // First, try to create the function
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION notify_pgrst_reload()
      RETURNS void
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        NOTIFY pgrst, 'reload schema';
      END;
      $$;
    `;
    
    // Execute via RPC (this might fail but we'll try)
    const { error: createError } = await supabase.rpc('exec_sql', { 
      sql: createFunctionSQL 
    });
    
    if (createError) {
      console.log(`⚠️  Could not create function: ${createError.message}`);
    } else {
      console.log('✅ Function created');
      
      // Now try to call it
      const { error: callError } = await supabase.rpc('notify_pgrst_reload');
      if (callError) {
        console.log(`⚠️  Could not call function: ${callError.message}`);
      } else {
        console.log('✅ NOTIFY sent successfully');
        return true;
      }
    }
  } catch (error) {
    console.log(`⚠️  SQL method failed: ${error.message}`);
  }
  
  return false;
}

// Method 3: Force schema detection by creating a temporary table
async function forceSchemaDetection() {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  
  console.log('Method 3: Force schema detection with temp table...');
  
  try {
    // Create a temporary table
    const tempTableName = `temp_reload_${Date.now()}`;
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `CREATE TABLE IF NOT EXISTS ${tempTableName} (id serial primary key);`
    });
    
    if (!createError) {
      console.log('✅ Temp table created');
      
      // Drop it immediately
      await supabase.rpc('exec_sql', {
        sql: `DROP TABLE IF EXISTS ${tempTableName};`
      });
      
      console.log('✅ Temp table dropped');
      return true;
    }
  } catch (error) {
    console.log(`⚠️  Temp table method failed: ${error.message}`);
  }
  
  return false;
}

// Method 4: Verify tables exist in database directly
async function verifyTablesExist() {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  
  console.log('\nMethod 4: Verifying tables exist in database...');
  
  try {
    // Query information_schema to check if tables exist
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('journeys', 'journey_events', 'donations', 'sms_logs', 'donor_profiles')
        ORDER BY table_name;
      `
    });
    
    if (error) {
      console.log(`⚠️  Could not query information_schema: ${error.message}`);
      return false;
    }
    
    if (data && data.length > 0) {
      console.log('✅ Tables found in database:');
      data.forEach(row => console.log(`  - ${row.table_name}`));
      return true;
    } else {
      console.log('❌ No tables found in database!');
      return false;
    }
  } catch (error) {
    console.log(`⚠️  Verification failed: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting aggressive PostgREST schema reload...\n');
  
  // Try Method 1
  console.log('Method 1: HTTP reload request...');
  await reloadViaHTTP();
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Try Method 2
  await reloadViaSQL();
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Try Method 3
  await forceSchemaDetection();
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Verify tables exist
  const tablesExist = await verifyTablesExist();
  
  console.log('\n' + '='.repeat(80));
  console.log('📋 SUMMARY');
  console.log('='.repeat(80));
  
  if (tablesExist) {
    console.log('✅ Tables exist in database');
    console.log('⚠️  However, PostgREST schema cache is still stale');
    console.log('\n🔧 REQUIRED ACTION:');
    console.log('1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/' + projectRef);
    console.log('2. Navigate to: Settings > API');
    console.log('3. Click "Restart PostgREST" button');
    console.log('4. Wait 30 seconds for restart to complete');
    console.log('5. Run: node test-correct-production-flow.mjs');
  } else {
    console.log('❌ Tables do not exist in database');
    console.log('🔧 REQUIRED ACTION:');
    console.log('1. Run: node deploy-migration.mjs');
    console.log('2. Then restart PostgREST as described above');
  }
  
  console.log('\n💡 Alternative: The schema cache may auto-refresh in 5-10 minutes');
  
  process.exit(tablesExist ? 0 : 1);
}

main().catch(console.error);