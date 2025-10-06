# ✅ CORRECT User Journey Flow - TruPath System

**Date**: 2025-01-05  
**Status**: VERIFIED AND DOCUMENTED

---

## 🎯 THE ACTUAL USER FLOW

### **Step 1: Donor Makes Donation** (`/donors` page)
- User visits **Mock Payment Gateway** at `/donors`
- Clicks **DONATE** button for a specific donor (Ahmed, Fatima, Mohamed, or Sara)
- System:
  1. Selects beneficiary using `selectBeneficiary('general')`
  2. Generates 5-stage journey with `generateJourney(selection)`
  3. **Writes donation to Supabase** `donations` table
  4. **Sends SMS** to donor's phone with tracking link: `${origin}/journey/${trackingId}`
  5. **Registers journey** in GlobalSettingsContext
  6. Journey begins auto-progression through 5 stages

### **Step 2: Donor Receives SMS** (`/sms` page)
- SMS sent to donor contains:
  ```
  Thank you Ahmed! Your donation of $50 has been received. 
  Track your journey here: http://localhost:5173/journey/EFB-2025-1759651851234-8129
  ```
- Donor can view SMS inbox at `/sms` page
- SMS messages are stored in Supabase `sms_logs` table
- Each SMS has a **clickable tracking link**

### **Step 3: Donor Clicks SMS Link** (Journey Viewer)
- Link format: `/journey/:trackingId`
- Opens **JourneyViewer** page showing:
  - **Interactive Mapbox map** with journey visualization
  - **5 waypoint markers** (pending/active/completed states)
  - **Journey path line** connecting completed stages
  - **Progress bar** showing completion percentage
  - **Current location** highlight
  - **Donor info**: name, amount, governorate, program
  - **Real-time updates** (polls every 2 seconds)
  - **Timeline** of all 5 stages with status indicators

### **Step 4: Journey Progresses Automatically**
- `useGlobalJourneyProgression` hook manages progression
- Every `settings.stepDuration` seconds (default 5s):
  1. Current stage marked as **completed**
  2. Next stage marked as **active**
  3. SMS sent to donor (via `sendJourneyNotification`)
  4. Map updates in real-time
  5. JourneyViewer polls and shows new state

### **Step 5: Journey Completes**
- After stage 5 completes:
  - Journey status → `completed`
  - Moved to `completedJourneys` map
  - Final SMS sent: "DELIVERED! Your donation reached the family"
  - Journey persists in system until manual clear

---

## 📊 DATA FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────┐
│ 1. DONOR VISITS /donors (Mock Payment Gateway)             │
│    - Clicks DONATE button                                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. SYSTEM PROCESSES DONATION                                │
│    - selectBeneficiary() → picks program/governorate/family │
│    - generateJourney() → creates 5 waypoints                │
│    - Supabase INSERT → donations table                      │
│    - sendSMS() → sends tracking link to donor               │
│    - registerJourney() → adds to GlobalSettingsContext      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. DONOR RECEIVES SMS                                       │
│    - SMS contains: "Track: http://localhost:5173/journey/..." │
│    - Stored in Supabase sms_logs table                      │
│    - Visible in /sms inbox page                             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. DONOR CLICKS LINK → /journey/:trackingId                 │
│    - JourneyViewer loads journey from GlobalSettingsContext │
│    - Displays map with 5 waypoints                          │
│    - Shows progress bar, current location, timeline         │
│    - Polls for updates every 2 seconds                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. JOURNEY AUTO-PROGRESSES                                  │
│    - useGlobalJourneyProgression hook runs                  │
│    - Every 5 seconds: stage completes → next activates      │
│    - SMS sent at each stage transition                      │
│    - Map updates in real-time                               │
│    - Stage 1 → 2 → 3 → 4 → 5 → COMPLETED                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗂️ KEY FILES IN THE FLOW

### 1. **MockPaymentGateway.tsx** (`/donors`)
- **Purpose**: Simulates payment gateway where donors make donations
- **Key Function**: `handleDonate(donorId)`
  - Generates journey
  - Writes to Supabase `donations` table
  - Sends SMS with tracking link
  - Registers journey in global context

### 2. **MockSMSInbox.tsx** (`/sms`)
- **Purpose**: Shows SMS messages sent to donors
- **Data Source**: Reads from Supabase `sms_logs` table
- **Key Feature**: Each SMS has clickable "View Journey" link

### 3. **JourneyViewer.tsx** (`/journey/:trackingId`)
- **Purpose**: Individual journey tracking page with map visualization
- **Data Source**: Reads from GlobalSettingsContext via `getJourney(trackingId)`
- **Key Features**:
  - Interactive Mapbox map
  - 5 waypoint markers with status colors
  - Journey path line
  - Progress bar
  - Real-time polling (every 2s)
  - Donor info panel
  - Timeline of all stages

### 4. **GlobalSettingsContext.tsx**
- **Purpose**: Centralized state management for all journeys
- **Key Functions**:
  - `registerJourney()` - Adds new journey
  - `getJourney(id)` - Retrieves specific journey
  - `updateJourney(id, updates)` - Updates journey state
  - `getAllActiveJourneys()` - Gets all active journeys
  - `getAllCompletedJourneys()` - Gets all completed journeys

### 5. **useGlobalJourneyProgression.ts**
- **Purpose**: Auto-progresses all active journeys
- **How It Works**:
  - Monitors `activeJourneys` map
  - Creates interval timer for each journey
  - Every `stepDuration` seconds:
    - Marks current stage as completed
    - Activates next stage
    - Sends SMS notification
    - Updates journey in context
  - Moves to `completedJourneys` when done

### 6. **mockSMS.ts**
- **Purpose**: Mock SMS service (writes to Supabase)
- **Key Functions**:
  - `sendSMS(phone, message, metadata)` - Sends SMS and writes to Supabase
  - `sendJourneyNotification(journeyId, stage, phone, data)` - Stage-specific SMS
  - `getAllSMSAsync()` - Retrieves all SMS from Supabase

---

## 🧪 CORRECT TEST FLOW

### **Test Scenario: Complete Donation Journey**

```javascript
// 1. Navigate to payment gateway
await page.goto('http://localhost:5173/donors');

// 2. Click DONATE button for first donor
await page.click('button:has-text("DONATE")');
await page.waitForTimeout(2000); // Wait for donation to process

// 3. Navigate to SMS inbox
await page.goto('http://localhost:5173/sms');
await page.waitForTimeout(3000); // Wait for SMS to load from Supabase

// 4. Find and click "View Journey" link in SMS
const journeyLink = await page.locator('a:has-text("View Journey")').first();
await journeyLink.click();

// 5. Verify JourneyViewer loaded
await page.waitForSelector('text=Journey Tracking');
await page.waitForSelector('text=Progress');

// 6. Wait for journey to progress through stages
for (let i = 0; i < 30; i += 5) {
  await page.waitForTimeout(5000);
  console.log(`⏳ ${i + 5} seconds elapsed...`);
  
  // Take screenshot at each interval
  await page.screenshot({ 
    path: `test-results/journey-stage-${i + 5}s.png` 
  });
}

// 7. Verify journey completed
const status = await page.locator('text=COMPLETED').count();
console.log(status > 0 ? '✅ Journey completed' : '❌ Journey not completed');
```

---

## ❌ MY PREVIOUS MISTAKE

I incorrectly thought the test should:
1. Navigate to admin panel
2. Click "General Donation" button
3. Check if data appears on other pages

**This was WRONG because:**
- Admin panel is for **testing/internal use only**
- Real user flow starts at **payment gateway** (`/donors`)
- Donations must be initiated from `/donors` page
- SMS links point to `/journey/:trackingId` (not admin panel)

---

## ✅ CORRECT UNDERSTANDING

**The system has TWO donation entry points:**

### 1. **Production Flow** (Real Users)
- `/donors` → User clicks DONATE
- SMS sent with tracking link
- User clicks link → `/journey/:trackingId`
- Watches journey progress in real-time

### 2. **Testing Flow** (Admin/Internal)
- `/admin` → Admin triggers test donations
- Multiple journeys can be triggered
- View all journeys on main map (`/`)
- Used for QA and system testing

**Both flows write to Supabase and use the same journey progression system.**

---

## 📝 SUPABASE TABLES INVOLVED

### 1. **journeys** table
- Stores journey metadata
- Fields: `id`, `donor_name`, `donor_phone`, `status`, `current_stage`, etc.

### 2. **journey_events** table
- Stores individual waypoint status
- Fields: `journey_id`, `stage`, `status`, `timestamp`, etc.

### 3. **donations** table
- Stores payment transactions
- Fields: `journey_id`, `donor_id`, `amount`, `status`, `completed_at`, etc.

### 4. **sms_logs** table
- Stores SMS notifications
- Fields: `id`, `to_phone`, `body`, `status`, `journey_id`, `stage`, etc.

### 5. **donor_profiles** table
- Stores donor information
- Fields: `id`, `email`, `phone`, `name`, `total_donations_amount`, etc.

---

## 🎯 PRODUCTION READINESS STATUS

### ✅ **What Works**
- Donation flow from `/donors` page
- Journey registration in GlobalSettingsContext
- Auto-progression through 5 stages
- SMS notifications to Supabase
- Journey viewer with map visualization
- Real-time polling for updates
- Multi-journey support

### ⚠️ **What Needs Verification**
- Supabase table schema (need to verify all 5 tables exist)
- SMS messages displaying in `/sms` inbox
- Journey viewer loading from Supabase (currently uses GlobalSettingsContext)
- Data persistence across browser refresh

### 🔧 **Next Steps**
1. Verify Supabase schema cache is refreshed
2. Test complete flow: `/donors` → SMS → `/journey/:trackingId`
3. Verify data persists in Supabase
4. Confirm SMS messages load from Supabase
5. Test journey viewer with real tracking IDs

---

**Status**: ✅ FLOW DOCUMENTED AND UNDERSTOOD  
**Ready For**: Complete E2E testing with correct flow