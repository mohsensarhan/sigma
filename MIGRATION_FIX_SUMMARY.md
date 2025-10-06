# Migration Fix Summary

## Problem
Foreign key constraint violation when running [`MANUAL_MIGRATION.sql`](MANUAL_MIGRATION.sql:1):
```
ERROR: insert or update on table "journeys" violates foreign key constraint "fk_journeys_governorate"
DETAIL: Key (governorate_id)=(Sohag) is not present in table "governorates".
```

## Root Cause
Existing `journeys` table had data with **capitalized** governorate IDs like `'Sohag'`, but the reference data uses **lowercase** IDs like `'sohag'`. The migration tried to add foreign key constraints BEFORE fixing the data mismatch.

## Solution
Reordered migration steps to fix data BEFORE adding constraints:

### New Execution Order
1. **Create Tables** - governorates, programs, villages, families
2. **Insert Reference Data** - Seed all lookup tables with lowercase IDs
3. **Update Existing Journey Data** - Convert existing IDs to lowercase to match reference data
4. **Add Foreign Key Constraints** - NOW safe to add FK constraints
5. **Enable RLS** - Security policies
6. **Verification** - Confirm counts

### Key Changes in [`MANUAL_MIGRATION.sql`](MANUAL_MIGRATION.sql:169)

**Added Step 3: Update Existing Data**
```sql
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'journeys') THEN
    -- Update governorate_id to lowercase to match reference data
    UPDATE journeys SET governorate_id = LOWER(governorate_id) WHERE governorate_id IS NOT NULL;
    
    -- Update program_id to lowercase to match reference data
    UPDATE journeys SET program_id = LOWER(program_id) WHERE program_id IS NOT NULL;
    
    RAISE NOTICE 'Updated existing journey data to match reference IDs';
  END IF;
END $$;
```

**Step 4 NOW adds FK constraints** (after data is fixed)

## How to Deploy

1. Open Supabase Dashboard → SQL Editor
2. Copy **ENTIRE** contents of [`MANUAL_MIGRATION.sql`](MANUAL_MIGRATION.sql:1)
3. Paste into SQL Editor
4. Click **Run** (or Ctrl+Enter)
5. Wait for "Migration Complete!" message with counts

Expected output:
```
========================================
Migration Complete!
========================================
Governorates: 5
Programs: 6
Villages: 13
Families: 55
========================================
```

## What This Fixes

✅ Foreign key constraint violations
✅ Data consistency between existing journeys and new reference tables
✅ Proper referential integrity
✅ Safe to run multiple times (uses ON CONFLICT clauses)
✅ Handles both fresh installs and databases with existing data

## Next Steps

After successful migration:
1. System will be 100% database-driven
2. All reference data queries go to Supabase
3. No hardcoded arrays in TypeScript
4. Ready for admin interface to manage beneficiaries