# Testing Guide

## Running Tests

```bash
# Run tests in watch mode
npm test

# Run tests once
npm run test:run

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test src/data/selectionAlgorithm.test.ts
```

## Writing Tests

### Unit Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from './myModule';

describe('myModule', () => {
  it('should do something', () => {
    const result = myFunction('input');
    expect(result).toBe('expected output');
  });
});
```

### Component Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '../test/utils';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

## Coverage Thresholds

- Lines: 80%
- Functions: 80%
- Branches: 80%
- Statements: 80%

## Best Practices

1. **Test behavior, not implementation**
2. **Use descriptive test names**
3. **Keep tests isolated and independent**
4. **Mock external dependencies**
5. **Test edge cases and error scenarios**

## Test Structure

### Directory Layout

```
src/
├── test/
│   ├── setup.ts           # Test setup and global mocks
│   ├── utils.tsx          # Custom render utilities
│   └── mocks/
│       ├── supabase.ts    # Supabase client mocks
│       └── mapbox.ts      # Mapbox GL mocks
├── data/
│   └── selectionAlgorithm.test.ts
└── services/
    └── errorLogger.test.ts
```

### Test File Naming

- Unit tests: `*.test.ts` or `*.test.tsx`
- Place test files next to the code they test
- Use descriptive names that match the module being tested

## Mocking

### Using Supabase Mocks

```typescript
import { mockSupabaseClient } from '../test/mocks/supabase';

// Mock will be automatically available in tests
```

### Using Mapbox Mocks

```typescript
import { mockMapboxGL } from '../test/mocks/mapbox';

// Mock will be automatically available in tests
```

## Debugging Tests

### Run Tests in UI Mode

```bash
npm run test:ui
```

This opens an interactive UI where you can:
- See test results in real-time
- Filter and search tests
- View test execution details
- Debug failing tests

### Run Specific Tests

```bash
# Run a specific test file
npm test src/data/selectionAlgorithm.test.ts

# Run tests matching a pattern
npm test -- --grep "should select"
```

## Coverage Reports

After running `npm run test:coverage`, coverage reports are generated in:

- `coverage/index.html` - Interactive HTML report
- `coverage/lcov.info` - LCOV format for CI/CD
- Console output - Summary statistics

## Continuous Integration

Tests should be run in CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run tests
  run: npm run test:run

- name: Generate coverage
  run: npm run test:coverage
```

## Common Issues

### Tests Timing Out

Increase timeout in test file:

```typescript
import { describe, it, expect } from 'vitest';

describe('myModule', () => {
  it('should do something', { timeout: 10000 }, () => {
    // Test code
  });
});
```

### Mock Not Working

Ensure mocks are imported before the module being tested:

```typescript
import { mockSupabaseClient } from '../test/mocks/supabase';
import { myFunction } from './myModule'; // Import after mocks
```

### Component Not Rendering

Use the custom render from test utils:

```typescript
import { render } from '../test/utils'; // Not from @testing-library/react
```

## Next Steps

1. Write tests for new features before implementation (TDD)
2. Maintain coverage above 80% threshold
3. Review and update tests when refactoring
4. Add integration tests for critical user flows
5. Consider E2E tests with Playwright for full user journeys