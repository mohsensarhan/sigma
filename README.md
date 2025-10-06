# Sigma - Journey Tracking & Donation Platform

A real-time journey tracking and donation management platform built with React, TypeScript, and Supabase.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 📋 Project Status

**Current Phase**: Phase 1 - Foundation Hardening ✅ **COMPLETE**

### Phase 1 Achievements
- ✅ TypeScript Strict Mode (0 errors)
- ✅ ESLint + Prettier Configuration
- ✅ Error Boundaries (All routes protected)
- ✅ Structured Logging System
- ✅ Production-Ready Quality Controls

**See**: [`PHASE_1_COMPLETION_REPORT.md`](PHASE_1_COMPLETION_REPORT.md) for full details

## 🛠️ Available Scripts

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

### Code Quality
```bash
npm run lint         # Check for linting issues
npm run lint:fix     # Auto-fix linting issues
npm run format       # Format all source files
npm run format:check # Check formatting without changes
npx tsc --noEmit     # Type check without building
```

### Testing & Verification
```bash
node refresh-supabase-schema.mjs        # Verify Supabase tables
node test-correct-production-flow.mjs   # Test complete user flow
node check-strict-mode.mjs              # Check TypeScript errors
```

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL + PostgREST)
- **Maps**: Leaflet
- **Build Tool**: Vite
- **Code Quality**: ESLint + Prettier

### Key Features
- 🗺️ Real-time journey tracking on interactive maps
- 💰 Donation management and processing
- 📱 SMS notification system
- 👥 Donor profile management
- 📊 Admin dashboard with analytics
- 🔄 Multi-journey support
- ⚡ Real-time updates via Supabase subscriptions

## 📁 Project Structure

```
sigma/
├── src/
│   ├── components/          # React components
│   │   ├── ErrorBoundary.tsx    # Error boundary wrapper
│   │   ├── ErrorFallback.tsx    # Error UI components
│   │   └── ErrorTest.tsx        # Error testing component
│   ├── contexts/            # React contexts
│   │   ├── AuthContext.tsx
│   │   └── GlobalSettingsContext.tsx
│   ├── pages/               # Page components
│   ├── services/            # Business logic
│   │   └── errorLogger.ts       # Logging service
│   ├── types/               # TypeScript types
│   └── lib/                 # Utilities
├── docs/                    # Documentation
├── tests/                   # Test files
├── public/                  # Static assets
└── supabase/               # Database migrations
```

## 🔧 Configuration Files

- [`.prettierrc`](.prettierrc) - Code formatting rules
- [`eslint.config.js`](eslint.config.js) - Linting rules
- [`tsconfig.app.json`](tsconfig.app.json) - TypeScript configuration
- [`vite.config.ts`](vite.config.ts) - Vite build configuration
- [`tailwind.config.js`](tailwind.config.js) - Tailwind CSS configuration

## 🛡️ Error Handling

All routes are protected with error boundaries for graceful error handling:

```typescript
import { ErrorBoundary } from './components/ErrorBoundary';
import { ErrorFallback } from './components/ErrorFallback';

<ErrorBoundary fallback={<ErrorFallback context="map" />}>
  <YourComponent />
</ErrorBoundary>
```

**Available Contexts**: `map`, `admin`, `payment`, `sms`, `journey`, `generic`

## 📝 Logging

Use the structured logging service for all error scenarios:

```typescript
import { errorLogger } from './services/errorLogger';

errorLogger.error('Something went wrong', { userId, action });
errorLogger.warn('Potential issue detected', { context });
errorLogger.info('Operation completed', { result });
```

## 🗄️ Database Schema

The application uses Supabase with the following tables:
- `journeys` - Journey tracking data
- `journey_events` - Journey stage events
- `donations` - Donation records
- `sms_logs` - SMS notification logs
- `donor_profiles` - Donor information

**Schema File**: [`supabase-schema.sql`](supabase-schema.sql)

## 🚨 Troubleshooting

### Supabase "Table not found" Error
Run in Supabase SQL editor:
```sql
NOTIFY pgrst, 'reload schema';
```

### Linting Errors
```bash
npm run lint:fix
```

### Formatting Issues
```bash
npm run format
```

### TypeScript Errors
```bash
npx tsc --noEmit
```

## 📚 Documentation

- [`PHASE_1_COMPLETION_REPORT.md`](PHASE_1_COMPLETION_REPORT.md) - Phase 1 completion details
- [`PHASE_1_QUICK_REFERENCE.md`](PHASE_1_QUICK_REFERENCE.md) - Quick reference guide
- [`TYPESCRIPT_STRICT_MIGRATION.md`](TYPESCRIPT_STRICT_MIGRATION.md) - TypeScript best practices
- [`PRODUCTION_PARADISE_BLUEPRINT.md`](PRODUCTION_PARADISE_BLUEPRINT.md) - Production roadmap
- [`docs/TECHNICAL_SPECIFICATION.md`](docs/TECHNICAL_SPECIFICATION.md) - Technical specifications

## 🎯 Quality Metrics

- ✅ TypeScript Errors: **0**
- ✅ Linting Errors: **0**
- ⚠️ Linting Warnings: **156** (non-blocking)
- ✅ Code Formatting: **100% consistent**
- ✅ Error Boundaries: **All routes protected**
- ✅ Type Safety: **Excellent coverage**

## 🔜 Roadmap

### Phase 2: Testing Excellence (Week 2)
- [ ] Unit testing with Vitest
- [ ] E2E testing with Playwright
- [ ] Performance testing with Lighthouse
- [ ] 80%+ code coverage

### Phase 3: Security Hardening (Week 3)
- [ ] Row Level Security (RLS)
- [ ] Input validation with Zod
- [ ] XSS/SQL injection protection
- [ ] Environment variable security

### Phase 4: Performance Optimization (Week 4)
- [ ] Code splitting
- [ ] Lazy loading
- [ ] Image optimization
- [ ] Caching strategies

## 🤝 Contributing

1. Follow TypeScript strict mode guidelines
2. Run `npm run lint:fix` before committing
3. Run `npm run format` to format code
4. Ensure all routes have error boundaries
5. Use `errorLogger` for error tracking
6. Write tests for new features (Phase 2+)

## 📄 License

[Your License Here]

## 🔗 Links

- **Production**: [Your Production URL]
- **Staging**: [Your Staging URL]
- **Supabase Dashboard**: [Your Supabase URL]

## 💡 Development Tips

1. **Error Testing**: Visit `/error-test` to test error boundaries
2. **Console Logs**: Use `errorLogger` instead of `console.log`
3. **Type Safety**: Always use explicit types, avoid `any`
4. **Code Style**: Let Prettier handle formatting automatically
5. **Linting**: Fix errors immediately, address warnings gradually

## 📞 Support

For issues or questions:
1. Check [`PHASE_1_QUICK_REFERENCE.md`](PHASE_1_QUICK_REFERENCE.md) for common solutions
2. Review error logs via `errorLogger.getLogs()`
3. Check Supabase logs for backend issues
4. Review [`PHASE_1_COMPLETION_REPORT.md`](PHASE_1_COMPLETION_REPORT.md) for known issues

---

**Last Updated**: January 5, 2025  
**Version**: 1.0.0  
**Status**: Phase 1 Complete ✅