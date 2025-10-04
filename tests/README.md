# TruPath Testing

## Active Tests

Tests in the root directory are current and actively maintained:

- **test-supabase-connection.mjs** - Verifies Supabase client initialization and connectivity
- **test-supabase-integration.mjs** - Tests full Supabase integration with donation flow

## Running Tests

Make sure the dev server is running first:
```bash
npm run dev
```

Then run individual tests:
```bash
node test-supabase-connection.mjs
node test-supabase-integration.mjs
```

## Archive

The `archive/` directory contains legacy test files from previous development phases. These are kept for reference but are not actively maintained.
