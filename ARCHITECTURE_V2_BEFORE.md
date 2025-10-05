# TruPath V2 - Architecture BEFORE Multi-Page Refactor

**Date**: October 5, 2025
**Status**: Pre-refactor documentation
**Next Step**: Multi-page architecture implementation

---

## Current Architecture (V2 - Multi-Journey)

### Single Page Application
- **Route**: `/` (main page only)
- **Features**:
  - Multi-journey concurrent support
  - Admin panel (slide-out from left)
  - SMS logs panel (bottom-left)
  - Multi-journey HUD (top-right)
  - Map with waypoints

### File Structure
```
src/
├── App.tsx                          # Main app with routes
├── components/
│   ├── AdminPanel.tsx               # Slide-out admin panel
│   ├── DonationInfoPanel.tsx        # Journey details
│   ├── WaypointMarker.tsx           # Map markers
│   ├── WaypointControlCard.tsx      # Stage progress
│   ├── MobileDrawer.tsx             # Mobile UI
│   └── SMSLogsPanel.tsx             # SMS visualization
├── hooks/
│   ├── useJourneyManager.ts         # Multi-journey orchestration
│   └── useJourneyAnimation.ts       # OLD (not used)
├── services/
│   ├── mockAWSLambda.ts             # Mock Lambda functions
│   └── mockSMS.ts                   # Mock SMS service
├── data/
│   ├── dataService.ts               # Supabase abstraction
│   ├── mockDatabase.ts              # Mock data
│   ├── selectionAlgorithm.ts        # Beneficiary selection
│   └── journeyGenerator.ts          # Route generation
├── types/
│   ├── database.ts                  # DB types
│   └── journey.ts                   # Journey types
└── contexts/
    └── AuthContext.tsx              # Auth (already exists)
```

### Key Features
1. **Multi-Journey Manager** (`useJourneyManager`)
   - Unlimited concurrent journeys
   - Independent timers per journey
   - Automatic progression (5s intervals)

2. **Mock Services**
   - AWS Lambda (5 handlers)
   - SMS service (Twilio/SNS)
   - API Gateway router

3. **Admin Panel** (Current)
   - Trigger 3 donation types
   - View active donations
   - Clear system

4. **SMS Logs Panel**
   - Real-time SMS display
   - Delivery tracking
   - Journey links (not clickable yet)

---

## What Needs to Change

### Route Structure
**FROM**: Single page `/`
**TO**: Multi-page app
```
/                    → Public journey viewer (no admin)
/admin              → Admin dashboard
/donors             → Mock payment gateway
/sms                → Mock SMS inbox
/journey/:id        → Individual journey viewer
```

### Admin Panel
**FROM**: Slide-out panel on main page
**TO**: Separate `/admin` route
- Add: Global step duration control
- Add: Comprehensive error logs
- Add: Journey monitoring
- Add: System health status

### New Pages Needed
1. **Mock Payment Gateway** (`/donors`)
   - 4 donor cards
   - Donation buttons
   - Recent donations log

2. **Mock SMS Inbox** (`/sms`)
   - 4 donor inboxes
   - SMS messages per donor
   - Clickable journey links

3. **Journey Viewer** (`/journey/:trackingId`)
   - Single journey display
   - Public-facing
   - No admin controls

### Global State
**NEW**: Settings Context
- Step duration (adjustable)
- Error logs (centralized)
- Journey registry (all active)

---

## Data Flow (Current)

### Journey Creation Flow
```
1. Admin Panel → Click "General Donation"
2. selectionAlgorithm.ts → Pick beneficiary
3. journeyGenerator.ts → Create 5-stage route
4. useJourneyManager → Start journey
5. mockAWSLambda → Log to backend
6. mockSMS → Send notifications
7. Map → Display waypoints
```

### Journey Progression Flow
```
Every 5 seconds:
1. useJourneyManager → Advance stage
2. Update waypoint status (active → completed)
3. mockSMS → Send stage notification
4. mockAWSLambda → Log stage update
5. UI updates → HUD, map, panels
```

---

## Migration Checklist

### Files to Modify
- [x] `App.tsx` → Add routes
- [ ] `AdminPanel.tsx` → Convert to page
- [ ] `SMSLogsPanel.tsx` → Convert to page
- [ ] `useJourneyManager.ts` → Connect to global settings

### Files to Create
- [ ] `contexts/GlobalSettingsContext.tsx`
- [ ] `pages/AdminDashboard.tsx`
- [ ] `pages/MockPaymentGateway.tsx`
- [ ] `pages/MockSMSInbox.tsx`
- [ ] `pages/JourneyViewer.tsx`
- [ ] `pages/PublicJourneyMap.tsx`
- [ ] `services/errorLogger.ts`
- [ ] `types/settings.ts`

### Files to Keep As-Is
- ✅ `hooks/useJourneyManager.ts` (minor updates)
- ✅ `services/mockAWSLambda.ts`
- ✅ `services/mockSMS.ts`
- ✅ `data/*` (all data services)
- ✅ `components/WaypointMarker.tsx`
- ✅ `components/DonationInfoPanel.tsx`

---

## Testing Strategy

### Before Changes
- [x] Multi-journey system working
- [x] SMS notifications functional
- [x] Admin panel accessible
- [x] Production build successful

### After Changes
- [ ] All 5 routes accessible
- [ ] Admin can control step timing
- [ ] Donors can trigger donations
- [ ] SMS inbox shows messages
- [ ] Journey links work
- [ ] Error logs capture issues
- [ ] Production build works

---

## Backup Strategy

### Current Working Version
- Commit hash: `a80dd48`
- Branch: `main`
- Tag: `v2.0-single-page` (to be created)

### Rollback Plan
```bash
# If refactor fails, rollback:
git checkout a80dd48
# or
git revert HEAD
```

---

## Next Steps (in order)

1. **✅ Document current state** (this file)
2. Create Global Settings Context
3. Build route structure
4. Create Admin Dashboard page
5. Create Mock Payment Gateway page
6. Create Mock SMS Inbox page
7. Create Journey Viewer page
8. Update main page (remove admin panel)
9. Implement error logging
10. Test all flows
11. Document new architecture

---

## Key Constraints

### Must Keep Working
- ✅ Multi-journey concurrency
- ✅ 5-second stage progression
- ✅ Mock AWS/SMS services
- ✅ Supabase data loading
- ✅ Journey tracking IDs

### Can Change
- ❌ Admin panel location (move to /admin)
- ❌ SMS panel location (move to /sms)
- ❌ Donation triggering (move to /donors)
- ❌ Step timing (make configurable)

### Must Add
- ✅ Global settings context
- ✅ Error logging system
- ✅ Individual journey viewer
- ✅ Mock donor profiles
- ✅ SMS inbox simulation

---

**Status**: ✅ Documentation complete
**Ready for**: Multi-page refactor implementation
**Estimated Time**: 30-45 minutes
**Risk Level**: Medium (major architectural change)

---

## Resume Point for Future Sessions

If context is lost, start here:

1. Read this file (`ARCHITECTURE_V2_BEFORE.md`)
2. Check TODO list status
3. Review latest commit
4. Continue from last completed step
5. Reference `IMPLEMENTATION_STEPS.md` (to be created)

---

**Next File**: `IMPLEMENTATION_STEPS.md` - Step-by-step refactor guide
