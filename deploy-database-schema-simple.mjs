/**
 * Deploy Database Schema to Supabase (Simple Version)
 * Uses individual SQL operations instead of exec_sql
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sdmjetiogbvgzqsvcuth.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkbWpldGlvZ2J2Z3pxc3ZjdXRoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTU1MDg4NywiZXhwIjoyMDc1MTI2ODg3fQ.AnIFEN2u59ME4ETrk7mCHwXjg34OXvnt4VAXlIJ-pfc';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function deploySchema() {
  console.log('🗄️ Deploying database schema to Supabase...');
  
  try {
    // Step 1: Create donor_profiles table
    console.log('\n📝 Step 1: Creating donor_profiles table...');
    
    const { error: tableError } = await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS donor_profiles (
          id UUID PRIMARY KEY,
          email TEXT NOT NULL UNIQUE,
          phone TEXT,
          name TEXT,
          total_donations_amount DECIMAL(10,2) DEFAULT 0,
          total_donations_count INTEGER DEFAULT 0,
          total_meals_provided INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (tableError) {
      console.log(`⚠️ Table creation may have failed: ${tableError.message}`);
    } else {
      console.log('✅ donor_profiles table created successfully');
    }
    
    // Step 2: Enable RLS
    console.log('\n🔒 Step 2: Enabling Row Level Security...');
    
    const { error: rlsError } = await supabase.rpc('exec', {
      sql: 'ALTER TABLE donor_profiles ENABLE ROW LEVEL SECURITY;'
    });
    
    if (rlsError) {
      console.log(`⚠️ RLS enable may have failed: ${rlsError.message}`);
    } else {
      console.log('✅ RLS enabled successfully');
    }
    
    // Step 3: Create RLS policies
    console.log('\n🛡️ Step 3: Creating RLS policies...');
    
    // Policy 1: Users can view own profile
    const { error: policy1Error } = await supabase.rpc('exec', {
      sql: `
        CREATE POLICY IF NOT EXISTS "Users can view own profile" 
        ON donor_profiles 
        FOR SELECT 
        USING (auth.uid() = id);
      `
    });
    
    if (policy1Error) {
      console.log(`⚠️ Policy 1 creation may have failed: ${policy1Error.message}`);
    } else {
      console.log('✅ Policy 1 (SELECT) created successfully');
    }
    
    // Policy 2: Users can insert own profile
    const { error: policy2Error } = await supabase.rpc('exec', {
      sql: `
        CREATE POLICY IF NOT EXISTS "Users can insert own profile" 
        ON donor_profiles 
        FOR INSERT 
        WITH CHECK (auth.uid() = id);
      `
    });
    
    if (policy2Error) {
      console.log(`⚠️ Policy 2 creation may have failed: ${policy2Error.message}`);
    } else {
      console.log('✅ Policy 2 (INSERT) created successfully');
    }
    
    // Policy 3: Users can update own profile
    const { error: policy3Error } = await supabase.rpc('exec', {
      sql: `
        CREATE POLICY IF NOT EXISTS "Users can update own profile" 
        ON donor_profiles 
        FOR UPDATE 
        USING (auth.uid() = id);
      `
    });
    
    if (policy3Error) {
      console.log(`⚠️ Policy 3 creation may have failed: ${policy3Error.message}`);
    } else {
      console.log('✅ Policy 3 (UPDATE) created successfully');
    }
    
    // Step 4: Create function for auto-profile creation
    console.log('\n⚙️ Step 4: Creating auto-profile function...');
    
    const { error: funcError } = await supabase.rpc('exec', {
      sql: `
        CREATE OR REPLACE FUNCTION public.handle_new_user()
        RETURNS TRIGGER AS $$
        BEGIN
          INSERT INTO public.donor_profiles (id, email, name, phone)
          VALUES (
            NEW.id,
            NEW.email,
            NEW.raw_user_meta_data->>'name',
            NEW.raw_user_meta_data->>'phone'
          );
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `
    });
    
    if (funcError) {
      console.log(`⚠️ Function creation may have failed: ${funcError.message}`);
    } else {
      console.log('✅ handle_new_user function created successfully');
    }
    
    // Step 5: Create trigger for auto-profile creation
    console.log('\n🎯 Step 5: Creating auto-profile trigger...');
    
    const { error: triggerError } = await supabase.rpc('exec', {
      sql: `
        CREATE OR REPLACE TRIGGER on_auth_user_created
          AFTER INSERT ON auth.users
          FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
      `
    });
    
    if (triggerError) {
      console.log(`⚠️ Trigger creation may have failed: ${triggerError.message}`);
    } else {
      console.log('✅ on_auth_user_created trigger created successfully');
    }
    
    // Step 6: Verify the donor_profiles table was created
    console.log('\n🔍 Step 6: Verifying donor_profiles table...');
    
    try {
      const { data, error } = await supabase
        .from('donor_profiles')
        .select('count', { count: 'exact', head: true });
      
      if (error) {
        console.error(`❌ Error verifying table: ${error.message}`);
      } else {
        console.log(`✅ donor_profiles table exists (${data} rows)`);
      }
    } catch (error) {
      console.log(`⚠️ Table verification failed: ${error.message}`);
    }
    
    console.log('\n🎉 Database schema deployment completed!');
    console.log('\n📋 Next steps:');
    console.log('1. The donor_profiles table should now exist in Supabase');
    console.log('2. RLS policies should be active');
    console.log('3. Auto-profile creation trigger should be working');
    console.log('4. You can now test user registration and profile creation');
    
  } catch (error) {
    console.error('❌ Failed to deploy schema:', error.message);
    process.exit(1);
  }
}

deploySchema().catch(console.error);
