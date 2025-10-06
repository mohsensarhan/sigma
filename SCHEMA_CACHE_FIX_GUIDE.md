# Supabase Schema Cache Fix Guide

## Problem Summary

PostgREST's schema cache is stale and preventing the browser client from accessing database tables. All tables exist in the database (verified by service role), but PostgREST returns "Could not find the table in the schema cache" errors.

## Root Cause

PostgREST caches the database schema for performance. When tables are created or modified, the cache must be refreshed. The cache is currently stale and needs a manual restart.

## Solution: Manual PostgREST Restart

### Step 1: Access Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/sdmjetiogbvgzqsvcuth
2. Log in with your Supabase credentials

### Step 2: Navigate to API Settings

1. Click on "Settings" in the left sidebar
2. Click on "API" in the settings menu

### Step 3: Restart PostgREST

1. Scroll down to find the "PostgREST" section
2. Click the "Restart PostgREST" button
3. Wait 30-60 seconds for the restart to complete

### Step 4: Verify the Fix

After restarting PostgREST:

```bash
# Wait 30 seconds, then run:
node test-correct-production-flow.mjs
```

Expected results:
- ✅ All 5 tables accessible from browser
- ✅ Journey saved to Supabase
- ✅ Donation saved to Supabase
- ✅ SMS logged in Supabase
- ✅ 8/8 test validations pass

## Alternative: Wait for Auto-Refresh

PostgREST's schema cache may auto-refresh in 5-10 minutes. However, manual restart is faster and more reliable.

## Why Automated Solutions Failed

All programmatic attempts to refresh the schema cache failed because:

1. **RPC calls require PostgREST** - We can't call `exec_sql` or `notify_pgrst_reload` because PostgREST can't find these functions in its stale cache
2. **REST API requires PostgREST** - All Supabase client operations go through PostgREST
3. **Direct database access not available** - The service role key only works through PostgREST, not direct PostgreSQL connections

## Prevention

To prevent this issue in the future:

1. **Use Supabase CLI for migrations** - The CLI automatically handles schema cache refresh
2. **Restart PostgREST after manual schema changes** - Always restart after running SQL in the dashboard
3. **Use migration files** - Proper migration files trigger automatic cache refresh

## Technical Details

### What is PostgREST?

PostgREST is the REST API layer that sits between your application and PostgreSQL. It:
- Converts HTTP requests to SQL queries
- Caches the database schema for performance
- Enforces Row Level Security (RLS) policies

### Schema Cache Lifecycle

1. PostgREST starts and loads the schema into memory
2. Schema cache is used for all subsequent requests
3. Cache is refreshed when:
   - PostgREST restarts
   - `NOTIFY pgrst, 'reload schema'` is executed
   - Auto-refresh timer expires (typically 5-10 minutes)

### Why This Happened

The tables were created using direct SQL execution, but PostgREST was not notified to reload its schema cache. This left PostgREST with an outdated view of the database schema.

## Verification Commands

After fixing, verify with these commands:

```bash
# Test 1: Check table accessibility
node fix-supabase-schema-cache.mjs

# Test 2: Run full production flow
node test-correct-production-flow.mjs

# Test 3: Check browser console
# Open http://localhost:5173
# Open DevTools Console
# Should see no "schema cache" errors
```

## Success Criteria

- [ ] PostgREST restarted successfully
- [ ] All 5 tables accessible from browser client
- [ ] No "schema cache" errors in console
- [ ] Data persists to Supabase correctly
- [ ] Production flow test passes (8/8 validations)

## Support

If the issue persists after restarting PostgREST:

1. Check Supabase status: https://status.supabase.com
2. Review Supabase logs in dashboard
3. Contact Supabase support with project ref: `sdmjetiogbvgzqsvcuth`