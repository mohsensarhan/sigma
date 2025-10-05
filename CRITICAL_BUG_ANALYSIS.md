# Critical Bug Analysis - Journey Not Persisting

## Date: October 5, 2025 3:10 PM

## The Bug

Journey is registered in GlobalSettingsContext but immediately disappears.

## Evidence from Logs

```
Line 1:  🔵 registerJourney called for: EFB-2025-1759670001295-1653
Line 2:  🔵 After registration, activeJourneys count: 1
Line 3:  🔵 getAllActiveJourneys called, returning 1 journeys    ← WORKS!
Line 4:  🔵 getAllActiveJourneys called, returning 0 journeys    ← BROKEN!
```

## What We Know

1. ✅ Journey IS successfully added to array (`activeJourneys count: 1`)
2. ✅ First call to getAllActiveJourneys returns it (`returning 1 journeys`)
3. ❌ Very next call returns empty array (`returning 0 journeys`)
4. ✅ Changed from Map to Array - problem persists
5. ✅ Removed StrictMode - problem persists
6. ✅ GlobalSettingsProvider is in main.tsx (correct location)
7. ✅ No calls to clearAllJourneys found in logs

## Hypothesis

The `useCallback` dependency array for `getAllActiveJourneys` depends on `settings.activeJourneys`. When we call `setSettings` to add a journey, React creates a new settings object. However, the `useCallback` might be returning a stale closure.

## The Real Problem (Suspected)

Looking at this code:
```typescript
const getAllActiveJourneys = useCallback(() => {
  console.log(`🔵 getAllActiveJourneys called, returning ${settings.activeJourneys.length} journeys`);
  return settings.activeJourneys;
}, [settings.activeJourneys]);
```

When `registerJourney` calls `setSettings`, it creates a NEW settings object with updated activeJourneys. But components that already have the old closure of `getAllActiveJourneys` will still reference the OLD `settings.activeJourneys`.

## Why This Happens

1. MockPaymentGateway renders and calls `useGlobalSettings()`
2. It gets `registerJourney` function and `getAllActiveJourneys` function
3. These functions have closures over CURRENT `settings` state
4. User clicks DONATE
5. `registerJourney` is called, updates state via `setSettings`
6. State updates, but MockPaymentGateway component hasn't re-rendered yet
7. MockPaymentGateway calls `getAllActiveJourneys` - gets OLD closure with OLD state
8. Component re-renders, gets NEW functions with NEW state
9. But by then, user has navigated away to /map page
10. /map page mounts fresh, gets CURRENT state... but it's the OLD state before registration!

## The Fix

Option 1: **Don't use useCallback for getters** - They should always return current state:
```typescript
const getAllActiveJourneys = () => settings.activeJourneys;
```

Option 2: **Use useRef to store state** - Bypass React's closure issues:
```typescript
const settingsRef = useRef(settings);
useEffect(() => { settingsRef.current = settings; }, [settings]);
const getAllActiveJourneys = () => settingsRef.current.activeJourneys;
```

Option 3: **Use external state management** - Zustand, Redux, etc.

## Recommended Solution

Remove `useCallback` from ALL getter functions:
- getAllActiveJourneys
- getAllCompletedJourneys
- getJourney
- getErrorLogs

These should NOT be memoized because they need to always return the current state, not a memoized closure.

## Status

🔴 CRITICAL - System non-functional
🟡 Root cause identified
🟢 Fix ready to implement
