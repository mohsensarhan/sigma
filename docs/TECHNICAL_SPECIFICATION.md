# TruPath V1 - Technical Specification

## Table of Contents
1. [Product Overview](#product-overview)
2. [Tech Stack](#tech-stack)
3. [Architecture](#architecture)
4. [Database Schema](#database-schema)
5. [Core Features](#core-features)
6. [File-by-File Guide](#file-by-file-guide)
7. [API Contracts](#api-contracts)
8. [Styling Guide](#styling-guide)
9. [Testing Suite](#testing-suite)
10. [Deployment](#deployment)
11. [Replication Steps](#replication-steps)

---

## Product Overview

**TruPath V1** is a real-time donation journey tracking system for the Egyptian Food Bank. It visualizes the complete supply chain from donation receipt to family delivery through an interactive map interface.

### What It Does
- Triggers donation journeys with 3 different allocation modes
- Auto-progresses through 5 fixed stages (EFB HQ → Warehouse → Regional Reserve → Village → Family)
- Displays real-time journey status on an interactive Mapbox map
- Provides admin controls for testing different donation scenarios
- Persists completed journeys until manual reset

### Who It's For
- **Internal Testing**: EFB operations team testing journey logic
- **Future Donors**: Will become public-facing tracking portal
- **Field Officers**: Foundation for check-in mobile app

### Key Metrics
- **Journey Time**: 25 seconds (5 stages × 5 seconds)
- **Database Size**: 55 families, 5 governorates, 6 programs
- **Map Coverage**: All of Egypt (coordinates for real locations)

---

## Tech Stack

### Frontend Framework
```json
{
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "typescript": "^5.5.3",
  "vite": "^7.1.9"
}
```

### UI Libraries
```json
{
  "mapbox-gl": "^3.15.0",          // Interactive maps
  "react-map-gl": "^8.0.4",        // React wrapper for Mapbox
  "framer-motion": "^12.23.22",    // Animations
  "lucide-react": "^0.344.0",      // Icons
  "@use-gesture/react": "^10.3.1" // Touch gestures
}
```

### Styling
```json
{
  "tailwindcss": "^3.4.1",
  "autoprefixer": "^10.4.18",
  "postcss": "^8.4.35"
}
```

### Testing
```json
{
  "@playwright/test": "^1.55.1",   // E2E testing
  "puppeteer": "^24.23.0"          // Browser automation
}
```

### Build Tools
```json
{
  "@vitejs/plugin-react": "^4.3.1",
  "eslint": "^9.9.1",
  "typescript-eslint": "^8.3.0"
}
```

---

## Architecture

### Component Hierarchy
```
App.tsx (Root)
├── Map (Mapbox)
│   ├── WaypointMarker × 5 (journey points)
│   └── Path Layers (connecting lines)
├── AdminPanel (left slide-out)
│   ├── Active Donation Status
│   ├── General Donation Button
│   ├── Location-Fixed Section
│   ├── Program-Fixed Section
│   └── Clear System Button
├── DonationInfoPanel (left detail card)
├── WaypointControlCard (right stage list)
└── MobileDrawer (mobile view)
```

### Data Flow
```
User Click (AdminPanel)
  ↓
handleTriggerDonation (App.tsx)
  ↓
selectBeneficiary (selectionAlgorithm.ts)
  ├→ getProgram/getGovernorate (dataService.ts)
  └→ returns SelectionResult
  ↓
generateJourney (journeyGenerator.ts)
  └→ returns Waypoint[]
  ↓
setWaypoints (React state)
  ↓
startJourney (useJourneyAnimation)
  ↓
Interval Timer (5s)
  ├→ Mark stage as completed
  ├→ Activate next stage
  └→ Call onStageComplete callback
  ↓
Update UI (all components re-render)
```

### State Management

**React State (App.tsx)**
```typescript
const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
const [activeWaypoint, setActiveWaypoint] = useState<Waypoint | null>(null);
const [activeDonation, setActiveDonation] = useState<{
  id: string;
  stage: number;
} | null>(null);
```

**Refs (useJourneyAnimation.ts)**
```typescript
const intervalRef = useRef<NodeJS.Timeout | null>(null);  // Stores timer
const hasActiveRef = useRef(false);  // Tracks if journey is running
```

### Critical Patterns

**1. Callback Form for State Updates**
```typescript
// ✅ CORRECT - Uses current state
setWaypoints((prevWaypoints) =>
  prevWaypoints.map(w => w.id === 1 ? { ...w, status: 'active' } : w)
);

// ❌ WRONG - Uses stale closure
setWaypoints(
  waypoints.map(w => w.id === 1 ? { ...w, status: 'active' } : w)
);
```

**2. Stable useEffect Dependencies**
```typescript
// ✅ CORRECT - Only re-runs when journey starts/stops
useEffect(() => {
  // ...
}, [waypoints.length, waypoints.find(w => w.status === 'active') ? 'has-active' : 'no-active']);

// ❌ WRONG - Re-runs on every waypoint change (infinite loop)
useEffect(() => {
  // ...
}, [waypoints]);
```

**3. Passing Updated State in Callbacks**
```typescript
// ✅ CORRECT - Passes updated waypoints
if (onStageComplete) {
  onStageComplete(currentId, finalWaypoints);
}

// ❌ WRONG - Relies on closure (stale data)
if (onStageComplete) {
  onStageComplete(currentId);
}
```

---

## Database Schema

### Entity Relationship
```
Anchor (Fixed Points)
  - EFB_HQ
  - BADR_WAREHOUSE

Governorate
  ├─ strategicWarehouse (WarehouseLocation)
  └─ Villages[]
      └─ Families[]
          └─ Program (reference)

Program
  └─ Families[] (reference)

Journey
  ├─ SelectionResult (program + governorate + village + family)
  └─ Waypoint[] (5 stages)
```

### TypeScript Interfaces

**Core Entities** (`types/database.ts`)
```typescript
interface Anchor {
  key: string;          // 'EFB_HQ' | 'BADR_WAREHOUSE'
  name: string;         // Display name
  lon: number;          // Longitude
  lat: number;          // Latitude
}

interface Governorate {
  id: string;           // 'minya', 'aswan', etc.
  name: string;         // Display name
  weight: number;       // For weighted random (higher = more likely)
  strategicWarehouse: {
    name: string;
    lon: number;
    lat: number;
  };
}

interface Village {
  id: string;           // 'v_minya_1', etc.
  governorateId: string;
  name: string;
  lon: number;
  lat: number;
}

interface Program {
  id: string;           // 'ramadan', 'orphan', etc.
  name: string;
  weight: number;       // For weighted random
}

interface Family {
  id: string;           // 'f_001', etc.
  programId: string;    // Which program they're enrolled in
  villageId: string;    // Where they live
  profile: string;      // "3 children, single mother, disabled woman 55"
}
```

**Journey Models** (`types/database.ts`)
```typescript
type DonationType = 'general' | 'location-fixed' | 'program-fixed';

interface SelectionResult {
  program: Program;
  governorate: Governorate;
  village: Village;
  family: Family;
}

interface Waypoint {
  id: number;                    // 1-5
  name: string;                  // "Donation Received", "Processing at Warehouse", etc.
  location: string;              // "EFB HQ New Cairo", etc.
  coordinates: [number, number]; // [lon, lat]
  stage: string;                 // "Stage 1", "Stage 2", etc.
  status: 'pending' | 'active' | 'completed';
  timestamp: string;             // ISO 8601
  details: {
    packageId: string;           // Tracking token
    items: string[];             // ["Rice (25kg)", ...]
    quantity: number;            // Total kg
    beneficiaries: number;       // Number of families
    distanceFromPrevious?: number; // km
    handler: string;             // "EFB HQ Operations", etc.
    familyProfile?: string;      // Only for stage 5
  };
}
```

### Mock Database Contents

**Governorates** (5)
- Minya (weight: 100)
- Aswan (weight: 90)
- Luxor (weight: 95)
- Sohag (weight: 85)
- Qena (weight: 80)

**Programs** (6)
- Ramadan 2024 (weight: 100)
- Orphan Support (weight: 90)
- Disabled Support (weight: 85)
- Elderly Care (weight: 80)
- Child Nutrition Support (weight: 95)
- Winter Relief (weight: 75)

**Villages** (13 total, 2-3 per governorate)
- Minya: Idamo, Samalut, Beni Mazar
- Aswan: Kom Ombo, Daraw, Edfu
- Luxor: Esna, Armant
- Sohag: Akhmim, Girga
- Qena: Naqada, Qift, Qus

**Families** (55 total)
- Distributed across all villages
- Each has program enrollment + profile
- Example profiles:
  - "3 children, single mother, disabled woman 55"
  - "5 children, elderly couple 75 & 72"
  - "2 children, orphan household, disabled father 45"

---

## Core Features

### Feature 1: General Donation
**Flow**: Randomize program + governorate + family

```typescript
// Algorithm (selectionAlgorithm.ts)
1. Pick program using weighted random
2. Pick governorate using weighted random
3. Get families matching (program AND governorate)
4. Pick random family from eligible set
5. Get village from family.villageId
```

**UI**:
- Button: "General Donation"
- Subtitle: "Randomize ALL (program + location + family)"
- Icon: Dices
- Disabled when journey active

### Feature 2: Location-Fixed Donation
**Flow**: User selects governorate → randomize program + family

```typescript
// Algorithm (selectionAlgorithm.ts)
1. User selects governorate from dropdown
2. Pick program using weighted random
3. Get families matching (program AND selected governorate)
4. If no match, fallback to any family in governorate
5. Pick random family, return its program
```

**UI**:
- Section header: "Location-Fixed"
- Dropdown: "Select Governorate" (5 options)
- Button: "Trigger Donation" (disabled until selection)
- Icon: MapPin

### Feature 3: Program-Fixed Donation
**Flow**: User selects program → randomize governorate + family

```typescript
// Algorithm (selectionAlgorithm.ts)
1. User selects program from dropdown
2. Pick governorate using weighted random
3. Get families matching (selected program AND governorate)
4. If no match, fallback to any family in program
5. Pick random family, return its governorate
```

**UI**:
- Section header: "Program-Fixed"
- Dropdown: "Select Program" (6 options)
- Button: "Trigger Donation" (disabled until selection)
- Icon: Package

### Feature 4: 5-Stage Auto-Progression

**Stage Definitions**:
```typescript
// Fixed for ALL donations (journeyGenerator.ts)
Stage 1: Received at EFB HQ New Cairo
  - Location: 31.4486 lon, 30.0655 lat
  - Handler: "EFB HQ Operations"
  - Duration: 5 seconds

Stage 2: Processing at Warehouse
  - Location: Badr Warehouse (31.7357 lon, 30.1582 lat)
  - Handler: "Badr Logistics Team"
  - Duration: 5 seconds
  - Distance from Stage 1: ~29km

Stage 3: Allocated to Region
  - Location: [Governorate] Strategic Reserve
  - Handler: "[Governorate] Coordinator"
  - Duration: 5 seconds
  - Distance from Stage 2: varies (200-600km)

Stage 4: In Transit to Community
  - Location: [Village] Touchpoint
  - Handler: "[Village] Volunteer"
  - Duration: 5 seconds
  - Distance from Stage 3: varies (10-50km)

Stage 5: Delivered
  - Location: Same as Stage 4 (village)
  - Handler: "Community Field Officer"
  - Duration: PERSISTS until manual clear
  - Distance: 0km (same location)
  - Shows family profile
```

**Animation Mechanics** (`useJourneyAnimation.ts`):
```typescript
1. startJourney() called
   → Sets waypoint[0].status = 'active'

2. useEffect detects active waypoint
   → Starts 5-second interval timer

3. Every 5 seconds:
   → Current active waypoint → 'completed'
   → Next waypoint → 'active'
   → Call onStageComplete(completedId, updatedWaypoints)

4. When stage 5 completes:
   → All waypoints marked 'completed'
   → activeDonation.stage = 5
   → Journey persists on screen
   → Interval timer stops

5. User clicks "Clear System & Reset":
   → waypoints = []
   → activeDonation = null
   → Map returns to "powered off" state
```

### Feature 5: Admin Panel

**Panel Structure**:
```
┌─────────────────────────────┐
│ Admin Panel                 │
│ Testing Controls            │
├─────────────────────────────┤
│ [ACTIVE DONATION]           │
│ EFB-2025-1759576-9888      │
│ Stage 3/5                   │
│ [===========60%====>    ]   │
├─────────────────────────────┤
│ [🎲] General Donation       │
│     Randomize ALL           │
├─────────────────────────────┤
│ [📍] Location-Fixed         │
│     [Select Governorate ▼]  │
│     [Trigger Donation]      │
├─────────────────────────────┤
│ [📦] Program-Fixed          │
│     [Select Program ▼]      │
│     [Trigger Donation]      │
├─────────────────────────────┤
│ [🗑️] Clear System & Reset   │
│                             │
│ Testing only - 5s/stage     │
└─────────────────────────────┘
```

**Slide-Out Animation**:
- Default: Hidden (x: -100%)
- Notch always visible on left edge
- Click notch → slides in (x: 0)
- Click outside → slides out
- Transition: 300ms ease-out

### Feature 6: Journey Visualization

**Map Elements**:
```
1. Markers (WaypointMarker.tsx)
   - Pending: Gray circle, number inside
   - Active: Cyan glow, pulsing animation
   - Completed: Green checkmark

2. Path Lines (App.tsx)
   - route-line-glow: Cyan blur (#00d9ff)
   - route-line: Green solid (#00ff9f)
   - route-line-animated: White dashed (moving)

3. Info Panel (DonationInfoPanel.tsx)
   - Shows active waypoint details
   - Package ID, location, beneficiaries
   - Smooth transitions between stages

4. Control Card (WaypointControlCard.tsx)
   - List of all 5 stages
   - Click to jump (manual override)
   - Progress indicators
```

---

## File-by-File Guide

### `/src/types/database.ts`
**Purpose**: TypeScript interfaces for entire data model

**Key Exports**:
- `Anchor`, `Governorate`, `Village`, `Program`, `Family`
- `DonationType`, `SelectionResult`, `Waypoint`

**Critical Details**:
- These types EXACTLY match future Supabase schema
- No business logic - pure types
- Used by every other file in the project

---

### `/src/data/mockDatabase.ts`
**Purpose**: JSON test data (will be replaced by Supabase)

**Structure**:
```typescript
export const ANCHORS: Anchor[] = [ /* 2 fixed points */ ];
export const GOVERNORATES: Governorate[] = [ /* 5 regions */ ];
export const VILLAGES: Village[] = [ /* 13 villages */ ];
export const PROGRAMS: Program[] = [ /* 6 programs */ ];
export const FAMILIES: Family[] = [ /* 55 families */ ];
```

**Important**: This file should NEVER be imported directly. Always use `dataService.ts`.

---

### `/src/data/dataService.ts`
**Purpose**: Single abstraction layer for data access

**Key Functions**:
```typescript
// Getters
export function getAnchor(key: string): Anchor | undefined
export function getGovernorate(id: string): Governorate | undefined
export function getVillage(id: string): Village | undefined
export function getProgram(id: string): Program | undefined
export function getFamily(id: string): Family | undefined

// List Functions
export function getAllGovernorates(): Governorate[]
export function getAllPrograms(): Program[]
export function getAllVillages(): Village[]

// Query Functions
export function getVillagesByGovernorate(govId: string): Village[]
export function getFamiliesByProgram(programId: string): Family[]
export function getFamiliesByGovernorate(govId: string): Family[]
export function getFamiliesByProgramAndGovernorate(
  programId: string,
  govId: string
): Family[]
```

**Migration Strategy**:
When moving to Supabase, ONLY change this file:
1. Replace imports from `mockDatabase.ts` with Supabase client
2. Make all functions async
3. Add error handling
4. All other files remain unchanged

---

### `/src/data/selectionAlgorithm.ts`
**Purpose**: Implements 3 donation allocation strategies

**Core Algorithm**:
```typescript
function weightedRandomSelection<T extends { weight: number }>(items: T[]): T {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;

  for (const item of items) {
    random -= item.weight;
    if (random <= 0) return item;
  }

  return items[items.length - 1];
}
```

**Explanation**: Items with higher `weight` have higher probability.
Example: If Program A has weight 100 and Program B has weight 50, Program A is 2× more likely to be selected.

**Exported Functions**:
- `selectForGeneralDonation()` - 100% random
- `selectForLocationFixedDonation(governorateId)` - Lock location
- `selectForProgramFixedDonation(programId)` - Lock program
- `selectBeneficiary(type, fixedId?)` - Main router

**Fallback Logic**:
If no families match (program + governorate intersection is empty):
1. Find all families in that governorate/program
2. Pick random family
3. Return its actual program/governorate (not the randomly selected one)

This prevents errors when testing with sparse data.

---

### `/src/data/journeyGenerator.ts`
**Purpose**: Builds 5-stage waypoint array from selection

**Main Function**:
```typescript
export function generateJourney(selection: SelectionResult): Waypoint[] {
  // Extract selection
  const { governorate, village, family } = selection;

  // Get fixed points
  const efbHQ = getAnchor('EFB_HQ');
  const badrWarehouse = getAnchor('BADR_WAREHOUSE');

  // Generate unique tracking token
  const trackingToken = generateTrackingToken();

  // Build 5 waypoints
  return [stage1, stage2, stage3, stage4, stage5];
}
```

**Helper Functions**:
```typescript
// Haversine formula for distance between coordinates
function calculateDistance(lon1, lat1, lon2, lat2): number {
  const R = 6371; // Earth radius in km
  // ... standard Haversine formula
  return Math.round(R * c);
}

// Generates: "EFB-2025-1759576636252-9888"
function generateTrackingToken(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `EFB-${new Date().getFullYear()}-${timestamp}-${random}`;
}
```

**Waypoint Details**:
Each waypoint includes:
- `id`: 1-5
- `name`: Stage name ("Donation Received", etc.)
- `location`: Display location
- `coordinates`: [lon, lat]
- `stage`: "Stage 1", "Stage 2", etc.
- `status`: 'pending' (all start as pending)
- `timestamp`: ISO 8601 string
- `details`:
  - `packageId`: Unique tracking token
  - `items`: ["Rice (25kg)", "Cooking Oil (10L)", ...]
  - `quantity`: 60 kg total
  - `beneficiaries`: 1 family
  - `distanceFromPrevious`: km from last stage
  - `handler`: Person/team responsible
  - `familyProfile`: Only for stage 5

---

### `/src/hooks/useJourneyAnimation.ts`
**Purpose**: React hook for 5-second auto-progression

**State Management**:
```typescript
const intervalRef = useRef<NodeJS.Timeout | null>(null);
const hasActiveRef = useRef(false);
```

**Why Refs?**:
- `intervalRef`: Stores timer ID, persists across renders
- `hasActiveRef`: Tracks journey state without causing re-renders

**Logic Flow**:
```typescript
useEffect(() => {
  // 1. Check if journey is active
  const activeWaypoint = waypoints.find(w => w.status === 'active');

  // 2. Start interval when journey begins
  if (activeWaypoint && !hasActiveRef.current) {
    hasActiveRef.current = true;

    intervalRef.current = setInterval(() => {
      setWaypoints((prevWaypoints) => {
        // 3. Find current active stage
        const active = prevWaypoints.find(w => w.status === 'active');

        // 4. Mark as completed
        const updated = prevWaypoints.map(w =>
          w.id === active.id ? { ...w, status: 'completed' } : w
        );

        // 5. Handle stage 5 completion
        if (active.id === 5) {
          clearInterval(intervalRef.current);
          onStageComplete(5, updated);
          return updated;
        }

        // 6. Activate next stage
        const finalWaypoints = updated.map(w =>
          w.id === active.id + 1 ? { ...w, status: 'active' } : w
        );

        // 7. Notify parent
        onStageComplete(active.id, finalWaypoints);

        return finalWaypoints;
      });
    }, 5000);
  }

  // Cleanup
  return () => clearInterval(intervalRef.current);
}, [waypoints.length, waypoints.find(w => w.status === 'active') ? 'has-active' : 'no-active']);
```

**Critical Dependencies**:
```typescript
[
  waypoints.length,  // Detects new journey (5 waypoints added)
  waypoints.find(w => w.status === 'active') ? 'has-active' : 'no-active'
  // ^ Computed string instead of object (stable reference)
]
```

**Why Not `[waypoints]`?**
- Would trigger on EVERY status change (pending→active, active→completed)
- Creates infinite loop (effect → state change → effect → ...)
- Computed string only changes when active state appears/disappears

---

### `/src/components/AdminPanel.tsx`
**Purpose**: Hidden slide-out panel for donation triggers

**State**:
```typescript
const [isOpen, setIsOpen] = useState(false);
const [selectedGovernorate, setSelectedGovernorate] = useState('');
const [selectedProgram, setSelectedProgram] = useState('');
```

**Layout**:
```tsx
<>
  {/* Notch (always visible) */}
  <motion.div
    className="fixed left-0 top-1/2"
    onClick={() => setIsOpen(!isOpen)}
  >
    <ChevronRight />
  </motion.div>

  {/* Panel (slides in/out) */}
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ x: '-100%' }}
        animate={{ x: 0 }}
        exit={{ x: '-100%' }}
      >
        {/* Active Donation Status */}
        {activeDonation && (
          <div>
            <div>Stage {activeDonation.stage}/5</div>
            <progress value={activeDonation.stage / 5} />
          </div>
        )}

        {/* Donation Triggers */}
        <button onClick={() => onTriggerDonation('general')}>
          General Donation
        </button>

        <select onChange={e => setSelectedGovernorate(e.target.value)}>
          {governorates.map(...)}
        </select>
        <button onClick={() => onTriggerDonation('location-fixed', selectedGovernorate)}>
          Trigger Location-Fixed
        </button>

        {/* Similar for program-fixed */}

        <button onClick={onClearSystem}>
          Clear System & Reset
        </button>
      </motion.div>
    )}
  </AnimatePresence>
</>
```

**Button Disable Logic**:
```typescript
disabled={!!activeDonation}  // Disabled when journey active
```

**Confirmation Dialog**:
```typescript
onClick={() => {
  if (window.confirm('Are you sure?')) {
    onClearSystem();
  }
}}
```

---

### `/src/components/WaypointMarker.tsx`
**Purpose**: Individual map marker for each stage

**Props**:
```typescript
interface Props {
  longitude: number;
  latitude: number;
  number: number;  // 1-5
  status: 'pending' | 'active' | 'completed';
  onClick: () => void;
}
```

**Rendering**:
```tsx
<Marker longitude={longitude} latitude={latitude}>
  <motion.div
    className={cn(
      'w-12 h-12 rounded-full',
      status === 'active' && 'bg-cyan-400 shadow-cyan-500',
      status === 'completed' && 'bg-green-400',
      status === 'pending' && 'bg-gray-600'
    )}
    animate={status === 'active' ? { scale: [1, 1.1, 1] } : {}}
  >
    {status === 'completed' ? <Check /> : number}
  </motion.div>
</Marker>
```

**Animations**:
- **Active**: Pulsing scale animation (1 → 1.1 → 1, infinite)
- **Completed**: Static green with checkmark
- **Pending**: Static gray with number

---

### `/src/components/DonationInfoPanel.tsx`
**Purpose**: Left-side detail card showing active waypoint

**Props**:
```typescript
interface Props {
  waypoint: Waypoint | null;
}
```

**Rendering**:
```tsx
{waypoint && (
  <motion.div
    key={waypoint.id}  // Re-animates on stage change
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
  >
    <div>{waypoint.stage} - {waypoint.name}</div>
    <div>{waypoint.location}</div>
    <div>Package: {waypoint.details.packageId}</div>
    <div>Beneficiaries: {waypoint.details.beneficiaries}</div>

    {waypoint.details.familyProfile && (
      <div>Family: {waypoint.details.familyProfile}</div>
    )}
  </motion.div>
)}
```

**Critical Fix**:
```typescript
import { User } from 'lucide-react';  // ✅ Must import User icon
```

---

### `/src/components/WaypointControlCard.tsx`
**Purpose**: Right-side list of all 5 stages

**Rendering**:
```tsx
{waypoints.map(waypoint => (
  <button
    key={waypoint.id}
    onClick={() => onWaypointClick(waypoint.id)}
    className={cn(
      waypoint.status === 'active' && 'border-cyan-400',
      waypoint.status === 'completed' && 'border-green-400'
    )}
  >
    <div className="number">
      {waypoint.status === 'completed' ? <Check /> : waypoint.id}
    </div>
    <div>
      <div>{waypoint.stage}</div>
      <div>{waypoint.name}</div>
      <div>{waypoint.location}</div>
    </div>
  </button>
))}
```

**Click Handler** (App.tsx):
```typescript
const handleWaypointClick = (clickedId: number) => {
  // Allows manual jumping to specific stage
  const updatedWaypoints = waypoints.map(w => {
    if (w.id < clickedId) return { ...w, status: 'completed' };
    if (w.id === clickedId) return { ...w, status: 'active' };
    if (w.id > clickedId) return { ...w, status: 'pending' };
    return w;
  });

  setWaypoints(updatedWaypoints);
};
```

---

### `/src/App.tsx`
**Purpose**: Main component, integrates everything

**State**:
```typescript
const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
const [activeWaypoint, setActiveWaypoint] = useState<Waypoint | null>(null);
const [activeDonation, setActiveDonation] = useState<{
  id: string;
  stage: number;
} | null>(null);
```

**Journey Animation Hook**:
```typescript
const { startJourney } = useJourneyAnimation({
  waypoints,
  setWaypoints,
  onStageComplete: (completedStageId, updatedWaypoints) => {
    const nextStageId = completedStageId + 1;

    if (nextStageId <= 5) {
      // Update to next stage
      setActiveDonation(prev => prev ? { ...prev, stage: nextStageId } : null);
      setActiveWaypoint(updatedWaypoints.find(w => w.id === nextStageId) || null);
    } else {
      // Stage 5 completed - keep visible
      setActiveDonation(prev => prev ? { ...prev, stage: 5 } : null);
      setActiveWaypoint(updatedWaypoints.find(w => w.id === 5) || null);
    }
  },
  onJourneyComplete: () => {
    // Journey complete - do nothing (keep visible until manual clear)
  }
});
```

**Donation Trigger**:
```typescript
const handleTriggerDonation = async (type: DonationType, fixedId?: string) => {
  // 1. Select beneficiary
  const selection = selectBeneficiary(type, fixedId);

  // 2. Generate journey
  const journeyWaypoints = generateJourney(selection);

  // 3. Set active donation
  setActiveDonation({
    id: journeyWaypoints[0].details.packageId,
    stage: 1
  });

  // 4. Load waypoints
  setWaypoints(journeyWaypoints);

  // 5. Start animation after 500ms delay
  setTimeout(() => startJourney(), 500);
};
```

**Clear System**:
```typescript
const handleClearSystem = () => {
  setWaypoints([]);
  setActiveDonation(null);
  setActiveWaypoint(null);
};
```

**Map Path Drawing**:
```typescript
const createPathGeoJSON = () => {
  const activeWaypointIds = waypoints
    .filter(w => w.status === 'active' || w.status === 'completed')
    .map(w => w.id);

  if (activeWaypointIds.length < 2) return null;

  const coordinates = waypoints
    .filter(w => activeWaypointIds.includes(w.id))
    .sort((a, b) => a.id - b.id)
    .map(w => w.coordinates);

  return {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates
    }
  };
};
```

---

## API Contracts

### selectionAlgorithm.ts
```typescript
function selectBeneficiary(
  type: DonationType,
  fixedId?: string
): SelectionResult

// Returns:
{
  program: { id, name, weight },
  governorate: { id, name, weight, strategicWarehouse },
  village: { id, name, lon, lat },
  family: { id, profile, programId, villageId }
}
```

### journeyGenerator.ts
```typescript
function generateJourney(
  selection: SelectionResult
): Waypoint[]

// Returns array of 5 waypoints:
[
  { id: 1, status: 'pending', ... },
  { id: 2, status: 'pending', ... },
  { id: 3, status: 'pending', ... },
  { id: 4, status: 'pending', ... },
  { id: 5, status: 'pending', ... }
]
```

### useJourneyAnimation.ts
```typescript
function useJourneyAnimation({
  waypoints: Waypoint[],
  setWaypoints: (waypoints: Waypoint[]) => void,
  onStageComplete?: (stageId: number, waypoints: Waypoint[]) => void,
  onJourneyComplete?: () => void
}): {
  startJourney: () => void
}
```

---

## Styling Guide

### Tailwind Configuration
```javascript
// tailwind.config.js
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cyan: { 400: '#00d9ff' },
        green: { 400: '#00ff9f' }
      }
    }
  }
};
```

### Design System

**Colors**:
- Primary Cyan: `#00d9ff` (active states, glows)
- Primary Green: `#00ff9f` (completed states)
- Dark: `rgba(0, 0, 0, 0.7)` (panel backgrounds)
- Gray: `#666` (pending states)

**Gradients**:
```css
background: linear-gradient(135deg, #00d9ff, #00ff9f);  /* Admin notch */
background: linear-gradient(90deg, #00d9ff, #00ff9f);   /* Progress bar */
```

**Shadows**:
```css
box-shadow: 0 0 40px rgba(0, 217, 255, 0.15);  /* Panel glow */
filter: drop-shadow(0 4px 12px rgba(0, 217, 255, 0.3));  /* Logo */
```

**Backdrop Blur**:
```css
backdrop-filter: blur(16px);
background: rgba(0, 0, 0, 0.85);
```

### Framer Motion Patterns

**Slide-In Panel**:
```tsx
<motion.div
  initial={{ x: '-100%' }}
  animate={{ x: 0 }}
  exit={{ x: '-100%' }}
  transition={{ duration: 0.3, ease: 'easeOut' }}
>
```

**Fade-In Component**:
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.2 }}
>
```

**Pulsing Animation**:
```tsx
<motion.div
  animate={{
    scale: [1, 1.1, 1],
    boxShadow: [
      '0 0 10px rgba(0, 217, 255, 0.5)',
      '0 0 20px rgba(0, 217, 255, 0.8)',
      '0 0 10px rgba(0, 217, 255, 0.5)'
    ]
  }}
  transition={{
    duration: 2,
    repeat: Infinity,
    ease: 'easeInOut'
  }}
/>
```

**Key Press**:
```tsx
<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
>
```

---

## Testing Suite

### Test Files

1. **test-final-verification.mjs**
   - Takes screenshots at 3s, 8s, 13s
   - Verifies visual journey progression
   - Checks for 5 markers on map

2. **test-sync-verification.mjs**
   - Compares admin panel stage vs map stage
   - Runs for 30 seconds
   - Confirms no mismatch throughout journey

3. **test-stage5-persistence.mjs**
   - Waits 28s for journey to complete
   - Verifies stage 5 stays visible
   - Tests clear button functionality

4. **test-simple-stage5.mjs**
   - Quick test (30s total)
   - Checks stage display every 5s
   - Minimal output

5. **test-with-console.mjs**
   - Captures browser console logs
   - Useful for debugging state issues
   - Shows callback execution

### Running Tests

```bash
# Install Playwright
npm install --save-dev @playwright/test

# Run specific test
node test-final-verification.mjs

# Run with browser visible (default)
# Tests open Chromium automatically

# View screenshots
ls test-results/*.png
```

### Test Structure
```javascript
import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Navigate
  await page.goto('http://localhost:5177');

  // Interact
  await page.click('button:has-text("General Donation")');

  // Wait
  await page.waitForTimeout(5000);

  // Verify
  const stageText = await page.locator('text=/Stage \\d+\\/5/').textContent();
  console.log('Current stage:', stageText);

  // Screenshot
  await page.screenshot({ path: 'test-results/screenshot.png' });

  await browser.close();
})();
```

---

## Deployment

### Development
```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Visit http://localhost:5177
```

### Production Build
```bash
# Type check
npm run typecheck

# Build
npm run build

# Preview build
npm run preview
```

### Environment Variables
Create `.env` file:
```env
VITE_MAPBOX_TOKEN=pk.eyJ1IjoibW9oc2Vuc2FyaGFuIiwiYSI6ImNtZnliaWFpeTBpdTUyanNieGdydXRjMmUifQ.W14WRrNn17S-bCR6nEK8Yg
```

**Important**: Replace with your own Mapbox token for production.

### Build Output
```
dist/
├── index.html
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── mapbox-gl-[hash].css
└── efb logo.png
```

### Hosting
Deploy `dist/` folder to:
- Vercel (recommended)
- Netlify
- AWS S3 + CloudFront
- Any static hosting

---

## Replication Steps

### From Scratch
```bash
# 1. Create Vite project
npm create vite@latest trupath-v1 -- --template react-ts
cd trupath-v1

# 2. Install dependencies
npm install mapbox-gl react-map-gl framer-motion lucide-react @use-gesture/react
npm install -D tailwindcss postcss autoprefixer @playwright/test

# 3. Initialize Tailwind
npx tailwindcss init -p

# 4. Configure Tailwind (tailwind.config.js)
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: { extend: {} },
  plugins: [],
}

# 5. Add Tailwind directives (src/index.css)
@tailwind base;
@tailwind components;
@tailwind utilities;

# 6. Create directory structure
mkdir -p src/{components,data,hooks,types}

# 7. Copy all files from this project:
# - types/database.ts
# - data/mockDatabase.ts
# - data/dataService.ts
# - data/waypoints.ts
# - data/selectionAlgorithm.ts
# - data/journeyGenerator.ts
# - hooks/useJourneyAnimation.ts
# - components/AdminPanel.tsx
# - components/DonationInfoPanel.tsx
# - components/WaypointMarker.tsx
# - components/WaypointControlCard.tsx
# - components/MobileDrawer.tsx
# - App.tsx
# - main.tsx

# 8. Add Mapbox token to .env
echo "VITE_MAPBOX_TOKEN=your_token_here" > .env

# 9. Add EFB logo to public/
cp efb_logo.png public/

# 10. Start dev server
npm run dev

# 11. Verify
# - Visit http://localhost:5177
# - Click admin panel notch (left side)
# - Click "General Donation"
# - Watch 5-stage journey auto-progress
# - Verify stage 5 persists
# - Click "Clear System & Reset"
```

### Key Configuration Files

**vite.config.ts**:
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
```

**tsconfig.json**:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "strict": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "noEmit": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

**package.json scripts**:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit"
  }
}
```

---

## Troubleshooting

### Issue: Map not loading
**Solution**: Check VITE_MAPBOX_TOKEN in .env file

### Issue: Journey starts but dies immediately
**Solution**: Check useJourneyAnimation dependencies (see Bug #3 in WHAT_HAPPENED.md)

### Issue: Admin panel shows wrong stage
**Solution**: Verify onStageComplete callback uses nextStageId (see Bug #4)

### Issue: DonationInfoPanel crashes on stage 5
**Solution**: Import User icon from lucide-react (see Bug #7)

### Issue: Stage 5 disappears after completion
**Solution**: Remove auto-clear from onJourneyComplete (see Bug #8)

---

## Support & Resources

- **Mapbox Docs**: https://docs.mapbox.com/mapbox-gl-js/
- **React Map GL**: https://visgl.github.io/react-map-gl/
- **Framer Motion**: https://www.framer.com/motion/
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Playwright**: https://playwright.dev/docs/intro

---

**Version**: 1.0.0
**Last Updated**: October 4, 2025
**Status**: Production Ready ✅
