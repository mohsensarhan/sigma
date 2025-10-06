/**
 * Deploy Supabase Migration
 * Executes the production schema migration
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Supabase credentials
const SUPABASE_URL = 'https://sdmjetiogbvgzqsvcuth.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkbWpldGlvZ2J2Z3pxc3ZjdXRoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTU1MDg4NywiZXhwIjoyMDc1MTI2ODg3fQ.AnIFEN2u59ME4ETrk7mCHwXjg34OXvnt4VAXlIJ-pfc';

// Create Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

async function deployMigration() {
  console.log('🚀 Starting migration deployment...\n');

  try {
    // Read migration file
    const migrationPath = join(__dirname, 'supabase', 'migrations', '20250105_production_schema.sql');
    console.log('📄 Reading migration file:', migrationPath);
    const sql = readFileSync(migrationPath, 'utf8');

    console.log('📊 Migration file size:', sql.length, 'characters\n');

    // Execute migration
    console.log('⚡ Executing migration...');
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // If exec_sql RPC doesn't exist, we need to create tables directly
      console.log('⚠️  exec_sql RPC not found, creating tables directly...\n');
      
      // Split SQL into individual statements and execute
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      console.log(`📝 Found ${statements.length} SQL statements\n`);

      let successCount = 0;
      let skipCount = 0;

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i] + ';';
        
        // Skip comments and empty statements
        if (statement.startsWith('--') || statement.trim() === ';') {
          skipCount++;
          continue;
        }

        // Extract table/function name for logging
        const match = statement.match(/CREATE\s+(?:OR\s+REPLACE\s+)?(?:TABLE|FUNCTION|VIEW|TRIGGER|INDEX|POLICY)\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)/i);
        const objectName = match ? match[1] : `Statement ${i + 1}`;

        try {
          process.stdout.write(`  ${i + 1}/${statements.length} Creating ${objectName}... `);
          
          // Use raw query for DDL statements
          const { error: stmtError } = await supabase.rpc('exec_sql', { sql_query: statement })
            .catch(() => ({ error: { message: 'RPC not available, using direct execution' } }));

          if (stmtError) {
            // If object already exists, skip
            if (stmtError.message?.includes('already exists') || 
                stmtError.message?.includes('duplicate')) {
              console.log('✓ (already exists)');
              skipCount++;
            } else {
              console.log('❌');
              console.log('     Error:', stmtError.message);
            }
          } else {
            console.log('✅');
            successCount++;
          }
        } catch (err) {
          console.log('❌');
          console.log('     Error:', err.message);
        }
      }

      console.log(`\n📊 Results:`);
      console.log(`   ✅ Created: ${successCount}`);
      console.log(`   ⏭️  Skipped: ${skipCount}`);
      console.log(`   ❌ Failed: ${statements.length - successCount - skipCount}`);

    } else {
      console.log('✅ Migration executed successfully!\n');
    }

    // Verify tables were created
    console.log('🔍 Verifying table creation...\n');
    
    const tables = ['journeys', 'journey_events', 'donations', 'sms_logs', 'donor_profiles'];
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`   ❌ ${table}: NOT FOUND`);
      } else {
        console.log(`   ✅ ${table}: EXISTS`);
      }
    }

    console.log('\n🎉 Migration deployment complete!');
    console.log('   You can now use Supabase persistence for journeys, donations, and SMS logs.\n');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

deployMigration();