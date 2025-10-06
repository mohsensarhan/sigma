/**
 * Force PostgREST Schema Reload
 * 
 * THE PROBLEM:
 * - Tables exist in database (verified)
 * - PostgREST API layer has stale schema cache
 * - Browser clients get "table not found" errors
 * 
 * THE SOLUTION:
 * - Force PostgREST to reload its schema cache
 * - This requires calling the Supabase Management API
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_PROJECT_REF = 'sdmjetiogbvgzqsvcuth'; // Your project reference
const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN; // You need to add this

async function reloadPostgrestSchema() {
  console.log('🔄 Forcing PostgREST schema reload...');
  
  if (!SUPABASE_ACCESS_TOKEN) {
    console.error(`
❌ SUPABASE_ACCESS_TOKEN not found in .env.local

To fix this:
1. Go to https://app.supabase.com/account/tokens
2. Generate a new access token
3. Add to .env.local:
   SUPABASE_ACCESS_TOKEN=your_token_here
4. Run this script again
`);
    return false;
  }
  
  try {
    // Call Supabase Management API to reload schema
    const response = await fetch(
      `https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/database/reload-schema`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error: ${error}`);
    }
    
    console.log('✅ PostgREST schema reload triggered successfully!');
    console.log('⏳ Wait 5-10 seconds for the reload to complete...');
    
    return true;
    
  } catch (error) {
    console.error('❌ Failed to reload schema:', error.message);
    return false;
  }
}

// Alternative solution if Management API doesn't work
async function alternativeSolution() {
  console.log(`
📋 ALTERNATIVE SOLUTION:

Since we can't programmatically reload the schema, here's the manual fix:

1. Go to your Supabase Dashboard:
   https://app.supabase.com/project/${SUPABASE_PROJECT_REF}/editor

2. Run this SQL command in the SQL Editor:
   NOTIFY pgrst, 'reload schema';

3. OR restart your Supabase project:
   - Go to Settings > General
   - Click "Restart project"
   - Wait 2-3 minutes

4. After doing either of the above, run the test again.

The issue is that PostgREST (the REST API layer) has cached the old schema
and doesn't know about the new tables we created via migration.
`);
}

// Run the reload
reloadPostgrestSchema().then(success => {
  if (!success) {
    alternativeSolution();
  }
});