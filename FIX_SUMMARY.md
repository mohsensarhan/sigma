# Critical Bugs Found & Fixes Required

## Date: October 5, 2025

## Issues Identified

### 1. **Journey Not Appearing on Map** ❌ CRITICAL
**Symptom**: When donation is triggered from /donors page, journey is registered in GlobalSettingsContext but doesn't appear on map.

**Evidence**:
- Console shows: `Journey registered: EFB-2025-xxx`
- Map HUD shows: `0 Active`
- getAllActiveJourneys() returns empty array

**Root Cause Investigation**:
Need to trace why:
1. Journey IS registered (we see the log)
2. But getAllActiveJourneys() returns 0 journeys when called from DonationTracker

**Possible Causes**:
- Context state not persisting between route changes
- Map not re-rendering when context updates
- Dependency array issues in useCallback

**Next Steps**:
- Add console.logs in browser devtools (not Puppeteer)
- Manually test: trigger donation on /donors, navigate to /, open devtools
- Check if activeJourneys Map actually has the journey

### 2. **Journey Viewer Shows "Not Found"** ❌ CRITICAL
**Symptom**: Clicking SMS link to /journey/:trackingId shows "Journey Not Found"

**Evidence**:
- Tracking ID: EFB-2025-1759669190278-3401
- URL: http://localhost:5173/journey/EFB-2025-1759669190278-3401
- Page shows: "Journey Not Found"

**Root Cause**:
- JourneyViewer calls `getJourney(trackingId)` from GlobalSettingsContext
- Returns undefined even though journey was registered

**Connection to Issue #1**:
- Same underlying problem - context not returning stored journeys

### 3. **Pages Don't Scroll** ✅ FIXED
**Fix Applied**: Changed `body { overflow: hidden }` to `overflow-y: auto` in index.css

### 4. **SMS Integration** ✅ WORKING
- SMS messages ARE being created
- MockSMSInbox shows 1 message correctly
- SMS service is functional

## Immediate Action Required

Test the following manually in browser devtools:

```javascript
// On /donors page after clicking DONATE
// Open devtools console and check:

// 1. Check React DevTools for GlobalSettingsContext
// Look for activeJourneys Map

// 2. Or add this to MockPaymentGateway.tsx handleDonate:
setTimeout(() => {
  console.log('Checking context after registration...');
  const { getAllActiveJourneys } = useGlobalSettings();
  console.log('Active journeys:', getAllActiveJourneys());
}, 1000);
```

## Hypothesis

The most likely issue is that getAllActiveJourneys is using stale closure or the Map reference isn't triggering re-renders properly.

The `useCallback` dependency on `settings.activeJourneys` might not be detecting Map mutations even though we create a new Map.

## Proposed Fix

Instead of storing journeys in a Map, use an array:

```typescript
// Change from:
activeJourneys: new Map<string, Journey>()

// To:
activeJourneys: Journey[]

// Then:
registerJourney: (journey) => {
  setSettings(prev => ({
    ...prev,
    activeJourneys: [...prev.activeJourneys, journey]
  }));
}

getAllActiveJourneys: () => settings.activeJourneys
```

This ensures React properly detects changes since arrays are compared by reference.

## Status

🔴 **BLOCKED** - Need to identify why context state isn't being read correctly
🟡 **IN PROGRESS** - Added debug logging
🟢 **NEXT** - Manually test in browser devtools to see actual state
