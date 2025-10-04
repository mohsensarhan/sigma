/**
 * Deploy Database Schema to Supabase
 * Runs the schema SQL script to create donor_profiles table and RLS policies
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sdmjetiogbvgzqsvcuth.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkbWpldGlvZ2J2Z3pxc3ZjdXRoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTU1MDg4NywiZXhwIjoyMDc1MTI2ODg3fQ.AnIFEN2u59ME4ETrk7mCHwXjg34OXvnt4VAXlIJ-pfc';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function deploySchema() {
  console.log('🗄️ Deploying database schema to Supabase...');
  
  try {
    // Read the schema file
    const fs = await import('fs');
    const path = await import('path');
    const schemaSQL = fs.readFileSync('supabase-schema.sql', 'utf8');
    
    // Split the SQL into individual statements
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`\n🔧 Executing statement ${i + 1}/${statements.length}: ${statement.substring(0, 50)}...`);
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          console.error(`❌ Error executing statement: ${error.message}`);
          throw error;
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      } catch (error) {
        console.error(`❌ Error executing statement ${i + 1}: ${error.message}`);
        throw error;
      }
    }
    
    console.log('\n🎉 Database schema deployed successfully!');
    
    // Verify the donor_profiles table was created
    console.log('\n🔍 Verifying donor_profiles table...');
    const { data, error } = await supabase
      .from('donor_profiles')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error(`❌ Error verifying table: ${error.message}`);
    } else {
      console.log(`✅ donor_profiles table exists (${data} rows)`);
    }
    
    // Test RLS policies
    console.log('\n🔒 Testing RLS policies...');
    
    // Try to query without authentication (should fail)
    try {
      const { error: rlsError } = await supabase
        .from('donor_profiles')
        .select('*')
        .limit(1);
      
      if (rlsError && rlsError.code === 'PGRST301') {
        console.log('✅ RLS policies are working (authentication required)');
      } else {
        console.log('⚠️ RLS policies may need configuration');
      }
    } catch (error) {
      console.log('⚠️ RLS policies test failed:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Failed to deploy schema:', error.message);
    process.exit(1);
  }
}

deploySchema().catch(console.error);
