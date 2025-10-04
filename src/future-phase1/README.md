# Future Phase 1 Code

This directory contains code prepared for Phase 1 (Donor Authentication) but not yet integrated.

## Files

- **AuthContext.tsx** - Complete authentication context with:
  - Donor registration/login
  - Session management
  - Profile CRUD operations
  - Password reset

- **supabase-schema.sql** - Database schema for authentication:
  - donor_profiles table
  - Row Level Security (RLS) policies
  - UUID extension setup

## Integration Checklist (Phase 1)

Before using these files:

1. [ ] Create `donor_profiles` table in Supabase
2. [ ] Update supabaseClient.ts to enable auth:
   - Set `persistSession: true`
   - Set `autoRefreshToken: true`
3. [ ] Wrap App.tsx with AuthProvider
4. [ ] Create login/signup UI components
5. [ ] Add protected routes
6. [ ] Test auth flow end-to-end

## Database Schema Required

```sql
create table donor_profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  phone text,
  name text,
  total_donations_amount integer default 0,
  total_donations_count integer default 0,
  total_meals_provided integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
```

## Status

- ⚠️ Not active in Phase 0
- ✅ Ready for Phase 1 integration
- 📝 Requires database schema updates
