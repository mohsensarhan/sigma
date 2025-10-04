/**
 * Enable Supabase Test Mode
 * Disables email confirmation for seamless testing
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sdmjetiogbvgzqsvcuth.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkbWpldGlvZ2J2Z3pxc3ZjdXRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1NTA4ODcsImV4cCI6MjA3NTEyNjg4N30.EKAt4imuEHXdhNsnVTkp2JWnX09jPXXD96WZeE9GyGY';

console.log('🔧 ENABLING SUPABASE TEST MODE\n');
console.log('This will disable email confirmation for seamless testing.\n');

console.log('📋 MANUAL STEPS REQUIRED:');
console.log('Supabase API doesn\'t allow changing auth settings programmatically.');
console.log('Please follow these steps in Supabase Dashboard:\n');

console.log('1. Go to: https://supabase.com/dashboard/project/sdmjetiogbvgzqsvcuth/auth/providers');
console.log('2. Scroll to "Email" section');
console.log('3. Toggle OFF: "Confirm email"');
console.log('4. Click "Save"');
console.log('5. Re-run tests\n');

console.log('✅ After this change:');
console.log('   - Users can login immediately after registration');
console.log('   - No email confirmation required');
console.log('   - Perfect for testing and development\n');

console.log('⚠️  IMPORTANT: Re-enable for production!');
console.log('   Enable "Confirm email" before deploying to production.\n');

// Alternative: Create a test with auto-confirmed user
console.log('💡 ALTERNATIVE: Test with auto-confirmed account');
console.log('   You can manually confirm an email in Supabase:');
console.log('   1. Go to Authentication → Users');
console.log('   2. Find the user');
console.log('   3. Click "..." → "Confirm email"');
console.log('   4. Use that account for testing\n');

process.exit(0);
