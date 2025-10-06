/**
 * TruPath V1 - Supabase Client
 *
 * Configured with project credentials.
 * Used by dataService.ts to fetch data from Supabase.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check .env.local file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // Enable session persistence for donor authentication
    autoRefreshToken: true, // Auto-refresh tokens for seamless experience
    detectSessionInUrl: true, // Handle email confirmation links
  },
  db: {
    schema: 'public', // Explicitly set schema
  },
  global: {
    headers: {
      'x-client-info': 'trupath-v2', // Custom client identifier
    },
  },
});

// Test connection (only in development)
if (import.meta.env.DEV) {
  supabase
    .from('journeys')
    .select('count', { count: 'exact', head: true })
    .then(({ error }) => {
      if (error) {
        console.error('❌ Supabase connection failed:', error.message);
      } else {
        console.log('✅ Supabase connected successfully');
      }
    });
}
