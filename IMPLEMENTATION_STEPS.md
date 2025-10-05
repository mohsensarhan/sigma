# Implementation Steps - Multi-Page Refactor

**Date**: October 5, 2025
**Objective**: Convert single-page app to multi-page architecture
**Estimated Time**: 30-45 minutes

---

## 🎯 Overview

Converting from:
- Single page with admin panel
- All features on one route

To:
- 5 separate pages/routes
- Admin dashboard with error logs
- Mock payment gateway
- Mock SMS inbox
- Individual journey viewer

---

## 📋 Step-by-Step Implementation

### ✅ STEP 0: Pre-Implementation (COMPLETED)
- [x] Document current architecture (`ARCHITECTURE_V2_BEFORE.md`)
- [x] Create this implementation guide
- [x] Backup current working version (commit `a80dd48`)

---

### 🔄 STEP 1: Create Global Settings Context
**File**: `src/contexts/GlobalSettingsContext.tsx`

**Purpose**: Centralized state for timing and error logs

**What to create**:
```typescript
interface GlobalSettings {
  stepDuration: number; // milliseconds (default: 5000)
  errorLogs: ErrorLog[];
  activeJourneys: Journey[];
}
```

**Functions needed**:
- `setStepDuration(ms: number)`
- `addErrorLog(log: ErrorLog)`
- `clearErrorLogs()`
- `registerJourney(journey: Journey)`
- `updateJourney(id: string, updates: Partial<Journey>)`

**Status**: ⏳ Pending
**Next**: Create `src/contexts/GlobalSettingsContext.tsx`

---

### 🔄 STEP 2: Create Error Logger Service
**File**: `src/services/errorLogger.ts`

**Purpose**: Centralized error logging

**What to create**:
```typescript
interface ErrorLog {
  id: string;
  timestamp: number;
  level: 'error' | 'warning' | 'info';
  journeyId?: string;
  stage?: number;
  message: string;
  stack?: string;
  context?: any;
}

export function logError(log: Omit<ErrorLog, 'id' | 'timestamp'>)
export function getErrorLogs(): ErrorLog[]
export function clearLogs(): void
```

**Status**: ⏳ Pending
**Next**: Create `src/services/errorLogger.ts`

---

### 🔄 STEP 3: Create Mock Donor Data
**File**: `src/data/mockDonors.ts`

**Purpose**: 4 donor profiles for payment gateway

**What to create**:
```typescript
export const MOCK_DONORS = [
  {
    id: 1,
    name: 'Ahmed Hassan',
    phone: '+201234567890',
    email: 'ahmed@example.com',
    avatar: '👨',
    defaultAmount: 50
  },
  // ... 3 more donors
];
```

**Status**: ⏳ Pending
**Next**: Create `src/data/mockDonors.ts`

---

### 🔄 STEP 4: Create Pages Directory Structure
**Directory**: `src/pages/`

**What to create**:
```
src/pages/
├── PublicJourneyMap.tsx      # Main page (/)
├── AdminDashboard.tsx         # Admin (/admin)
├── MockPaymentGateway.tsx     # Donors (/donors)
├── MockSMSInbox.tsx           # SMS (/sms)
└── JourneyViewer.tsx          # Journey (/journey/:trackingId)
```

**Status**: ⏳ Pending
**Next**: Create empty page files

---

### 🔄 STEP 5: Build Admin Dashboard Page
**File**: `src/pages/AdminDashboard.tsx`

**Features**:
1. **Global Controls**:
   - Step duration slider (1-30 seconds)
   - Emergency stop button
   - Clear all journeys

2. **Journey Monitor**:
   - Active journeys count
   - Completed journeys count
   - List of all active journeys with stages

3. **Error Logs**:
   - Real-time log display (last 100)
   - Filter by level (error/warning/info)
   - Export to CSV
   - Clear logs button

4. **System Health**:
   - Supabase status
   - SMS service status
   - API Gateway status

**Status**: ⏳ Pending
**Next**: Build `src/pages/AdminDashboard.tsx`

---

### 🔄 STEP 6: Build Mock Payment Gateway Page
**File**: `src/pages/MockPaymentGateway.tsx`

**Features**:
1. **4 Donor Cards**:
   - Name, phone, avatar
   - Amount input (default: $50, $100, $25, $75)
   - "DONATE" button
   - Last donation timestamp

2. **Recent Donations**:
   - List of recent donations
   - Shows: Donor → Amount → Tracking ID

3. **Simulation Controls**:
   - "Trigger All" button (all 4 donate simultaneously)
   - "Random Donor" button

**Status**: ⏳ Pending
**Next**: Build `src/pages/MockPaymentGateway.tsx`

---

### 🔄 STEP 7: Build Mock SMS Inbox Page
**File**: `src/pages/MockSMSInbox.tsx`

**Features**:
1. **4 Donor Inboxes** (tabs or columns):
   - One inbox per donor
   - Shows all SMS for that donor

2. **SMS Message Display**:
   - Timestamp
   - Message content
   - Clickable journey link
   - Delivery status (queued/sent/delivered)

3. **Journey Link**:
   - Clickable link: `/journey/{trackingId}`
   - Opens in new tab or same page

**Status**: ⏳ Pending
**Next**: Build `src/pages/MockSMSInbox.tsx`

---

### 🔄 STEP 8: Build Journey Viewer Page
**File**: `src/pages/JourneyViewer.tsx`

**Features**:
1. **Single Journey Display**:
   - Uses `trackingId` from URL params
   - Shows only that journey's waypoints
   - Map with route

2. **Journey Details**:
   - Donor name
   - Current stage
   - Progress bar
   - Estimated completion

3. **Public Facing**:
   - Clean design (no admin controls)
   - Shareable link
   - Mobile responsive

**Status**: ⏳ Pending
**Next**: Build `src/pages/JourneyViewer.tsx`

---

### 🔄 STEP 9: Build Public Journey Map Page
**File**: `src/pages/PublicJourneyMap.tsx`

**Features**:
1. **Main Map**:
   - Shows ALL active journeys
   - No admin panel
   - Read-only view

2. **Journey List**:
   - Sidebar with active journeys
   - Click to focus on specific journey

**Status**: ⏳ Pending
**Next**: Build `src/pages/PublicJourneyMap.tsx`

---

### 🔄 STEP 10: Update App.tsx Routes
**File**: `src/App.tsx`

**What to change**:
```typescript
// OLD:
<Route path="/" element={<DonationTracker />} />

// NEW:
<Route path="/" element={<PublicJourneyMap />} />
<Route path="/admin" element={<AdminDashboard />} />
<Route path="/donors" element={<MockPaymentGateway />} />
<Route path="/sms" element={<MockSMSInbox />} />
<Route path="/journey/:trackingId" element={<JourneyViewer />} />
```

**Status**: ⏳ Pending
**Next**: Update `src/App.tsx`

---

### 🔄 STEP 11: Connect useJourneyManager to Global Settings
**File**: `src/hooks/useJourneyManager.ts`

**What to change**:
```typescript
// Use global step duration instead of hardcoded 5000ms
const { stepDuration } = useGlobalSettings();

// Use stepDuration in setInterval
setInterval(() => { ... }, stepDuration);
```

**Status**: ⏳ Pending
**Next**: Update `src/hooks/useJourneyManager.ts`

---

### 🔄 STEP 12: Update Mock SMS Service
**File**: `src/services/mockSMS.ts`

**What to add**:
```typescript
// Add donor-specific SMS storage
export function getSMSByDonor(donorPhone: string): SMSMessage[]

// Add journey link to SMS
export function sendJourneyNotification(
  journeyId: string,
  stage: number,
  donorPhone: string,
  details: { ... }
): Promise<SMSMessage>
```

**Status**: ⏳ Pending
**Next**: Update `src/services/mockSMS.ts`

---

### 🔄 STEP 13: Create Navigation Component
**File**: `src/components/Navigation.tsx`

**Purpose**: Quick navigation between pages

**What to create**:
```tsx
<nav>
  <Link to="/">Map</Link>
  <Link to="/admin">Admin</Link>
  <Link to="/donors">Donors</Link>
  <Link to="/sms">SMS</Link>
</nav>
```

**Status**: ⏳ Pending
**Next**: Create `src/components/Navigation.tsx`

---

### 🔄 STEP 14: Test All Routes Locally
**Command**: `npm run dev`

**What to test**:
1. http://localhost:5173/ → Public map loads
2. http://localhost:5173/admin → Admin dashboard loads
3. http://localhost:5173/donors → Payment gateway loads
4. http://localhost:5173/sms → SMS inbox loads
5. http://localhost:5173/journey/test-123 → Journey viewer loads

**Status**: ⏳ Pending
**Next**: Manual testing

---

### 🔄 STEP 15: Create Playwright Test Suite
**File**: `test-multipage-flow.mjs`

**What to test**:
1. Donor triggers donation on `/donors`
2. Journey appears on `/admin`
3. SMS appears in `/sms`
4. Click SMS link → Opens `/journey/:id`
5. Admin changes step duration
6. Verify timing change works

**Status**: ⏳ Pending
**Next**: Create `test-multipage-flow.mjs`

---

### 🔄 STEP 16: Update Documentation
**Files to update**:
- `HOW_TO_USE.md` → Add new pages
- `QUICK_START.md` → Update routes
- Create `ARCHITECTURE_V3_AFTER.md` → Document new structure

**Status**: ⏳ Pending
**Next**: Update documentation

---

### 🔄 STEP 17: Production Build Test
**Commands**:
```bash
npm run build
npm run preview
```

**What to verify**:
- All routes work in production
- No build errors
- Assets load correctly

**Status**: ⏳ Pending
**Next**: Build and test

---

### 🔄 STEP 18: Final Verification
**Checklist**:
- [ ] All 5 routes accessible
- [ ] Admin can control step timing
- [ ] Donors can trigger donations
- [ ] SMS inbox shows messages
- [ ] Journey links work
- [ ] Error logs capture issues
- [ ] Production build works
- [ ] Documentation updated

**Status**: ⏳ Pending
**Next**: Final checks

---

## 🚨 Rollback Points

### After Each Major Step
```bash
# Save progress
git add .
git commit -m "WIP: Step X - [description]"
```

### If Something Breaks
```bash
# Rollback to last working commit
git reset --hard HEAD~1
```

### Emergency Rollback
```bash
# Return to V2 (before refactor)
git checkout a80dd48
```

---

## 📊 Progress Tracking

### Completed Steps: 0/18
- [x] Step 0: Pre-implementation ✅

### Current Step: 1
- [ ] Step 1: Create Global Settings Context

### Estimated Remaining Time: 30-45 minutes

---

## 🔗 Quick Links

- Current Architecture: `ARCHITECTURE_V2_BEFORE.md`
- Final Architecture: `ARCHITECTURE_V3_AFTER.md` (to be created)
- Test Results: `test-results/` (to be created)

---

## 📝 Notes for Future Sessions

**If you need to resume later**:

1. Read `ARCHITECTURE_V2_BEFORE.md` to understand what we had
2. Read this file to see progress
3. Check TODO list for current step
4. Look for `Status: ⏳ Pending` to find next task
5. Each step is self-contained - can resume anywhere

**Current Session Status**: Just started, Step 0 complete

---

**Next Action**: Begin Step 1 - Create Global Settings Context
