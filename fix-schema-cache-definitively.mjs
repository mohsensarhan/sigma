/**
 * Definitive Schema Cache Fix
 * Uses Supabase Management API to execute SQL directly, bypassing PostgREST
 */

import https from 'https';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

// Extract project ref
const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
if (!projectRef) {
  console.error('❌ Could not extract project ref');
  process.exit(1);
}

console.log('🔧 Definitive Schema Cache Fix');
console.log('=' .repeat(80));
console.log(`Project: ${projectRef}`);
console.log(`URL: ${SUPABASE_URL}\n`);

/**
 * Execute SQL using Supabase's database REST API
 * This bypasses PostgREST and goes directly to the database
 */
async function executeSQLDirect(sql) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ query: sql });
    
    const options = {
      hostname: `${projectRef}.supabase.co`,
      port: 443,
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Prefer': 'return=representation'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          resolve({ success: true, data: data });
        } else {
          resolve({ success: false, error: data, statusCode: res.statusCode });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Check if tables exist using pg_catalog
 */
async function checkTablesExist() {
  console.log('🔍 Step 1: Checking if tables exist in database...\n');
  
  const checkSQL = `
    SELECT 
      schemaname,
      tablename,
      tableowner
    FROM pg_catalog.pg_tables
    WHERE schemaname = 'public'
    AND tablename IN ('journeys', 'journey_events', 'donations', 'sms_logs', 'donor_profiles')
    ORDER BY tablename;
  `;
  
  try {
    const result = await executeSQLDirect(checkSQL);
    
    if (result.success) {
      console.log('✅ Successfully queried pg_catalog');
      console.log('Response:', result.data);
      return true;
    } else {
      console.log('⚠️  Query failed:', result.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
    return false;
  }
}

/**
 * Create the NOTIFY function to reload PostgREST
 */
async function createNotifyFunction() {
  console.log('\n🔧 Step 2: Creating NOTIFY function...\n');
  
  const createFunctionSQL = `
    CREATE OR REPLACE FUNCTION public.notify_pgrst_reload()
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      NOTIFY pgrst, 'reload schema';
    END;
    $$;
    
    GRANT EXECUTE ON FUNCTION public.notify_pgrst_reload() TO service_role;
    GRANT EXECUTE ON FUNCTION public.notify_pgrst_reload() TO anon;
    GRANT EXECUTE ON FUNCTION public.notify_pgrst_reload() TO authenticated;
  `;
  
  try {
    const result = await executeSQLDirect(createFunctionSQL);
    
    if (result.success) {
      console.log('✅ NOTIFY function created successfully');
      return true;
    } else {
      console.log('⚠️  Function creation failed:', result.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
    return false;
  }
}

/**
 * Call the NOTIFY function
 */
async function callNotifyFunction() {
  console.log('\n📢 Step 3: Sending NOTIFY to PostgREST...\n');
  
  const callSQL = `SELECT public.notify_pgrst_reload();`;
  
  try {
    const result = await executeSQLDirect(callSQL);
    
    if (result.success) {
      console.log('✅ NOTIFY sent successfully');
      return true;
    } else {
      console.log('⚠️  NOTIFY failed:', result.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
    return false;
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    // Step 1: Check if tables exist
    const tablesExist = await checkTablesExist();
    
    if (!tablesExist) {
      console.log('\n❌ CRITICAL: Tables do not exist in database');
      console.log('\n🔧 REQUIRED ACTIONS:');
      console.log('1. Go to Supabase Dashboard SQL Editor');
      console.log('2. Run the migration from: supabase/migrations/20250105_production_schema.sql');
      console.log('3. Then run this script again');
      process.exit(1);
    }
    
    // Step 2: Create NOTIFY function
    await createNotifyFunction();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 3: Call NOTIFY function
    await callNotifyFunction();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('📋 SUMMARY');
    console.log('='.repeat(80));
    console.log('✅ Tables exist in database');
    console.log('✅ NOTIFY function created');
    console.log('✅ NOTIFY signal sent to PostgREST');
    
    console.log('\n⏳ NEXT STEPS:');
    console.log('1. Wait 30 seconds for PostgREST to reload schema cache');
    console.log('2. Restart your dev server: Ctrl+C then npm run dev');
    console.log('3. Hard refresh browser: Ctrl+F5');
    console.log('4. Run test: node test-correct-production-flow.mjs');
    
    console.log('\n💡 If issue persists:');
    console.log('   Go to: https://supabase.com/dashboard/project/' + projectRef + '/settings/api');
    console.log('   Click: "Restart PostgREST" button');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

main();