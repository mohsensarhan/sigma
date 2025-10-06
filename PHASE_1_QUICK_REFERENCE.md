# Phase 1: Quick Reference Guide

## New Scripts Available

```bash
# Linting
npm run lint              # Check for linting issues
npm run lint:fix          # Auto-fix linting issues

# Formatting
npm run format            # Format all source files
npm run format:check      # Check formatting without changes

# TypeScript
npx tsc --noEmit         # Type check without building

# Testing & Verification
node refresh-supabase-schema.mjs        # Verify Supabase tables
node test-correct-production-flow.mjs   # Test complete user flow
node check-strict-mode.mjs              # Check TypeScript errors
```

## New Components

### Error Boundaries
```typescript
import { ErrorBoundary } from './components/ErrorBoundary';
import { ErrorFallback } from './components/ErrorFallback';

// Wrap any component that might throw errors
<ErrorBoundary fallback={<ErrorFallback context="map" />}>
  <YourComponent />
</ErrorBoundary>
```

**Available Contexts**:
- `"map"` - For map/journey visualization errors
- `"admin"` - For admin dashboard errors
- `"payment"` - For payment gateway errors
- `"sms"` - For SMS inbox errors
- `"journey"` - For journey viewer errors
- `"generic"` - For general errors

### Error Logger
```typescript
import { errorLogger } from './services/errorLogger';

// Log different severity levels
errorLogger.error('Something went wrong', { userId, action });
errorLogger.warn('Potential issue detected', { context });
errorLogger.info('Operation completed', { result });

// Get all logs
const logs = errorLogger.getLogs();

// Get logs by level
const errors = errorLogger.getLogs('error');
const warnings = errorLogger.getLogs('warn');

// Export logs to CSV
errorLogger.exportToCSV();

// Get statistics
const stats = errorLogger.getStats();
console.log(`Total errors: ${stats.error}`);

// Clear logs
errorLogger.clearLogs();
```

## Error Handling Best Practices

1. **Wrap Routes**: All routes should be wrapped with [`ErrorBoundary`](src/components/ErrorBoundary.tsx)
2. **Use Context**: Provide context-specific error messages via [`ErrorFallback`](src/components/ErrorFallback.tsx)
3. **Log Errors**: Use [`errorLogger`](src/services/errorLogger.ts) for all error scenarios
4. **Graceful Degradation**: Always provide recovery options
5. **Development Info**: Show detailed errors only in dev mode

## Code Quality Standards

### TypeScript
- ✅ Strict mode enabled in [`tsconfig.app.json`](tsconfig.app.json)
- ✅ No `any` types (use proper types)
- ✅ Explicit return types for functions
- ✅ Null checks for optional values
- ✅ Use type guards for runtime checks

### ESLint Rules
- ⚠️ No console.log (use errorLogger instead)
- ❌ No debugger statements
- ✅ Prefer const over let
- ✅ No var declarations
- ✅ Use === instead of ==
- ✅ Always use curly braces
- ✅ No unused variables

### Prettier Formatting
- Single quotes for strings
- Semicolons enabled
- 100 character line width
- 2-space indentation
- Trailing commas (ES5)
- Arrow function parentheses (always)

## Testing Error Boundaries

Visit `/error-test` in development mode to test error boundary functionality.

**Test Component**: [`src/components/ErrorTest.tsx`](src/components/ErrorTest.tsx)

```typescript
// The test component throws an error after 2 seconds
// This allows you to verify:
// 1. Error boundary catches the error
// 2. Fallback UI is displayed
// 3. Error is logged to errorLogger
// 4. Recovery options work correctly
```

## Troubleshooting

### Supabase "Table not found" Error
**Problem**: PostgREST schema cache is stale

**Solution**: Run in Supabase SQL editor:
```sql
NOTIFY pgrst, 'reload schema';
```

**Alternative**: Restart your Supabase project

**Verification**: Run [`test-correct-production-flow.mjs`](test-correct-production-flow.mjs)

### Linting Errors
**Problem**: Code doesn't meet ESLint standards

**Solution**: Run auto-fix:
```bash
npm run lint:fix
```

**Manual Review**: Check [`eslint.config.js`](eslint.config.js) for rules

### Formatting Issues
**Problem**: Code formatting is inconsistent

**Solution**: Format all files:
```bash
npm run format
```

**Check Only**: Verify without changes:
```bash
npm run format:check
```

### TypeScript Errors
**Problem**: Type errors in code

**Solution**: Check errors:
```bash
npx tsc --noEmit
```

**Analysis Tool**: Use [`check-strict-mode.mjs`](check-strict-mode.mjs) for detailed analysis

### Build Failures
**Problem**: Production build fails

**Solution**: 
1. Check TypeScript errors: `npx tsc --noEmit`
2. Check linting: `npm run lint`
3. Try clean build: `rm -rf dist && npm run build`

## File Structure Reference

### Configuration Files
- [`.prettierrc`](.prettierrc) - Prettier formatting rules
- [`.prettierignore`](.prettierignore) - Files to skip formatting
- [`eslint.config.js`](eslint.config.js) - ESLint rules
- [`tsconfig.app.json`](tsconfig.app.json) - TypeScript config (strict mode)
- [`tsconfig.strict.json`](tsconfig.strict.json) - Reference strict config

### Error Handling
- [`src/components/ErrorBoundary.tsx`](src/components/ErrorBoundary.tsx) - React error boundary
- [`src/components/ErrorFallback.tsx`](src/components/ErrorFallback.tsx) - Error UI components
- [`src/services/errorLogger.ts`](src/services/errorLogger.ts) - Logging service
- [`src/components/ErrorTest.tsx`](src/components/ErrorTest.tsx) - Test component

### Testing Scripts
- [`refresh-supabase-schema.mjs`](refresh-supabase-schema.mjs) - Verify Supabase tables
- [`test-correct-production-flow.mjs`](test-correct-production-flow.mjs) - E2E flow test
- [`check-strict-mode.mjs`](check-strict-mode.mjs) - TypeScript analysis

### Documentation
- [`PHASE_1_COMPLETION_REPORT.md`](PHASE_1_COMPLETION_REPORT.md) - Full completion report
- [`TYPESCRIPT_STRICT_MIGRATION.md`](TYPESCRIPT_STRICT_MIGRATION.md) - TypeScript best practices
- [`PHASE_1_QUICK_REFERENCE.md`](PHASE_1_QUICK_REFERENCE.md) - This guide

## Common Workflows

### Adding a New Feature
1. Create feature branch
2. Write code following TypeScript strict mode
3. Run `npm run lint:fix` to fix linting issues
4. Run `npm run format` to format code
5. Wrap new routes with error boundaries
6. Add error logging where appropriate
7. Test locally
8. Run `npm run build` to verify production build
9. Commit and push

### Fixing a Bug
1. Reproduce the bug
2. Check error logs via [`errorLogger`](src/services/errorLogger.ts)
3. Add error boundary if missing
4. Fix the issue
5. Add error logging for future debugging
6. Test the fix
7. Run verification scripts
8. Deploy

### Code Review Checklist
- [ ] TypeScript strict mode compliant
- [ ] No linting errors
- [ ] Code properly formatted
- [ ] Error boundaries in place
- [ ] Error logging added
- [ ] No console.log statements
- [ ] Production build succeeds
- [ ] Tests pass (when available)

## Next Phase Preview

**Phase 2: Testing Excellence**
- Unit testing with Vitest
- E2E testing with Playwright
- Performance testing with Lighthouse
- 80%+ code coverage target
- Visual regression testing
- API integration tests

**Key Focus Areas**:
1. Critical business logic unit tests
2. User journey E2E tests
3. Performance benchmarks
4. Accessibility testing
5. Cross-browser compatibility

## Quick Commands Cheat Sheet

```bash
# Development
npm run dev                    # Start dev server

# Quality Checks
npm run lint                   # Check linting
npm run lint:fix              # Fix linting issues
npm run format                # Format all files
npm run format:check          # Check formatting
npx tsc --noEmit              # Check TypeScript

# Build
npm run build                 # Production build
npm run preview               # Preview production build

# Testing
node refresh-supabase-schema.mjs           # Verify DB schema
node test-correct-production-flow.mjs      # Test user flow
node check-strict-mode.mjs                 # Check TS errors

# Troubleshooting
npm run lint:fix && npm run format         # Fix all formatting
rm -rf node_modules && npm install         # Clean install
rm -rf dist && npm run build               # Clean build
```

## Support & Resources

- **Phase 1 Report**: [`PHASE_1_COMPLETION_REPORT.md`](PHASE_1_COMPLETION_REPORT.md)
- **TypeScript Guide**: [`TYPESCRIPT_STRICT_MIGRATION.md`](TYPESCRIPT_STRICT_MIGRATION.md)
- **Production Blueprint**: [`PRODUCTION_PARADISE_BLUEPRINT.md`](PRODUCTION_PARADISE_BLUEPRINT.md)

## Key Metrics

- ✅ TypeScript Errors: 0
- ✅ Linting Errors: 0
- ⚠️ Linting Warnings: 156 (non-blocking)
- ✅ Code Formatting: 100% consistent
- ✅ Error Boundaries: All routes protected
- ✅ Logging System: Fully integrated

---

**Last Updated**: January 5, 2025
**Phase**: 1 - Foundation Hardening
**Status**: ✅ Complete