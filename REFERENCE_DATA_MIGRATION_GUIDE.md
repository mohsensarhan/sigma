# Reference Data Migration Guide

## Overview
This guide explains how to migrate reference data (governorates, programs, families) from hardcoded files to Supabase tables.

## Migration Files Created

1. **`supabase/migrations/20250106_reference_data_tables.sql`**
   - Creates 4 new tables: governorates, programs, villages, families
   - Adds foreign key constraints to existing journeys table
   - Sets up RLS policies for public read access
   - Creates helpful views for querying

2. **`supabase/migrations/20250106_seed_reference_data.sql`**
   - Seeds governorates (5 regions)
   - Seeds programs (6 EFB programs)
   - Seeds villages (14 villages)
   - Seeds families (55 beneficiary families)
   - Verifies foreign key integrity

## Deployment Options

### Option 1: Supabase Dashboard (Recommended)

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Copy and paste the contents of `supabase/migrations/20250106_reference_data_tables.sql`
4. Click **Run** to create the tables
5. Copy and paste the contents of `supabase/migrations/20250106_seed_reference_data.sql`
6. Click **Run** to seed the data

### Option 2: Supabase CLI

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

### Option 3: Manual Deployment Script

If you have your service role key, add it to `.env`:

```env
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

Then run:
```bash
node deploy-reference-data-migration.mjs
```

## Database Schema

### Governorates
- **id**: TEXT (primary key)
- **name**: TEXT (unique)
- **weight**: INTEGER (for weighted selection)
- **strategic_warehouse**: JSONB (warehouse location)

### Programs
- **id**: TEXT (primary key)
- **name**: TEXT (unique)
- **weight**: INTEGER (for weighted selection)
- **description**: TEXT

### Villages
- **id**: TEXT (primary key)
- **governorate_id**: TEXT (FK → governorates)
- **name**: TEXT
- **lon**, **lat**: NUMERIC (coordinates)

### Families
- **id**: TEXT (primary key)
- **program_id**: TEXT (FK → programs)
- **village_id**: TEXT (FK → villages)
- **profile**: TEXT (family description)
- **active**: BOOLEAN

## Foreign Key Relationships

```
governorates
    ↓
villages
    ↓
families → programs
    ↓
journeys
```

## After Deployment

1. Verify tables exist:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('governorates', 'programs', 'villages', 'families');
   ```

2. Verify row counts:
   ```sql
   SELECT 
     (SELECT COUNT(*) FROM governorates) as governorates,
     (SELECT COUNT(*) FROM programs) as programs,
     (SELECT COUNT(*) FROM villages) as villages,
     (SELECT COUNT(*) FROM families) as families;
   ```

3. Test foreign key relationships:
   ```sql
   SELECT 
     f.id,
     p.name as program,
     v.name as village,
     g.name as governorate
   FROM families f
   JOIN programs p ON f.program_id = p.id
   JOIN villages v ON f.village_id = v.id
   JOIN governorates g ON v.governorate_id = g.id
   LIMIT 5;
   ```

## Code Changes

The following files have been updated to use Supabase instead of hardcoded data:

1. **`src/data/dataService.ts`** - All data access functions now query Supabase
2. **`src/data/selectionAlgorithm.ts`** - Already uses dataService (no changes needed)

## Benefits

✅ **Scalability**: Add new families, programs, or governorates without code changes  
✅ **Real-time**: Data updates immediately available to all users  
✅ **Queryable**: Use SQL views and joins for complex queries  
✅ **Maintainable**: No more hardcoded arrays scattered through the codebase  
✅ **RLS Protected**: Row-level security ensures data access control  

## Rollback

If you need to rollback, the system automatically falls back to `mockDatabase` if Supabase queries fail. To fully revert:

```sql
DROP TABLE IF EXISTS families CASCADE;
DROP TABLE IF EXISTS villages CASCADE;
DROP TABLE IF EXISTS programs CASCADE;
DROP TABLE IF EXISTS governorates CASCADE;
```

## Support

If you encounter issues:
1. Check Supabase logs in the dashboard
2. Verify RLS policies are set correctly
3. Ensure foreign key data exists before inserting children
4. Check the verification queries above