# TruPath - Quick Start Guide

## ✅ System Status: FULLY WORKING

### 🚀 Start the System
```bash
npm run dev
```
Open: **http://localhost:5173**

---

## 📍 Step-by-Step Usage

### Step 1: Find the Admin Panel Notch
- **Location**: Far LEFT edge of screen, middle height
- **Appearance**: Vertical **cyan/green gradient bar** (6px wide, 96px tall)
- **Look for**: A glowing vertical strip that says `>` on it

### Step 2: Open Admin Panel
- **Click the notch** (the gradient bar)
- Panel slides out from left (384px wide)
- You'll see "Admin Panel" header with a dice icon

### Step 3: Trigger a Donation

#### Option A: General Donation (Easiest - No Selection Needed)
1. Click the **first big card** that says:
   ```
   General Donation
   Randomize ALL (program + location + family)
   ```
2. System automatically:
   - ✅ Picks random program
   - ✅ Picks random governorate
   - ✅ Picks random family
3. Journey starts immediately

#### Option B: Location-Fixed Donation
1. **First**: Select a governorate from the dropdown:
   - Minya
   - Aswan
   - Luxor
   - Sohag
   - Qena
2. **Then**: Click "Trigger Donation" button below it
3. System picks random program + random family in that governorate

#### Option C: Program-Fixed Donation
1. **First**: Select a program from the dropdown:
   - Ramadan Food Parcels
   - School Meal Program
   - Emergency Relief
   - Elderly Support
   - Family Support
   - Orphan Support
2. **Then**: Click "Trigger Donation" button below it
3. System picks random governorate + random family in that program

---

## 👀 What to Watch

### 1. Browser Console (F12)
You'll see:
```
✅ Supabase: Found 2 families for program ramadan in qena
[API Gateway] POST /journeys
[Lambda:createJourney] Created journey EFB-2025-1759657619468-1257
[SMS] Queued to +201234567890: "✅ Your donation..."
🎯 New journey started: EFB-2025-1759657619468-1257
[SMS] Sent to +201234567890
[SMS] Delivered to +201234567890
🚀 Journey EFB-2025-1759657619468-1257 → Stage 2/5
```

### 2. SMS Logs Panel (Bottom-Left)
- Click **"SMS Logs"** button
- See all SMS messages
- Shows: `X sent · Y delivered`

### 3. Multi-Journey HUD (Top-Right)
Shows: `[🟢 X Active] [🔵 Y Completed] [Total: Z]`

### 4. Map (Center)
- **Waypoints appear** (5 blue circles)
- **Route line** connects them
- **Active waypoint** pulses with cyan glow

---

## 🎬 Complete Example

**Let's trigger 3 donations:**

1. Open http://localhost:5173
2. Click the **gradient notch** on left edge
3. Click **"General Donation"** → Wait 2 seconds
4. Click **"General Donation"** again → Wait 2 seconds
5. Click **"General Donation"** again
6. Open **Browser Console (F12)**
7. See 3 journeys created:
   ```
   🎯 New journey started: EFB-2025-...
   🎯 New journey started: EFB-2025-...
   🎯 New journey started: EFB-2025-...
   ```
8. Click **"SMS Logs"** (bottom-left)
9. See SMS messages being sent
10. Watch journeys progress every 5 seconds:
    - Stage 1/5 → Stage 2/5 → Stage 3/5 → Stage 4/5 → Stage 5/5

---

## ⚡ Quick Test (30 seconds)

```bash
# Terminal 1
npm run dev

# Terminal 2
node test-simple-debug.mjs
```

The test script will:
- Open browser
- Click admin panel
- Trigger donation
- Show all console logs
- Save screenshot

---

## 🔧 Troubleshooting

### "I don't see the notch"
- It's **VERY small** (6px wide)
- Look at the **far left edge**, middle of screen
- It has a cyan/green gradient
- Move mouse slowly along left edge until it highlights

### "Buttons are grayed out"
- **Location-Fixed**: Select a governorate first
- **Program-Fixed**: Select a program first
- **General Donation**: Should always be enabled

### "No console logs"
- Open **DevTools** (F12 or right-click → Inspect)
- Go to **Console** tab
- Refresh page
- You should see: `✅ Supabase: Loaded 5 governorates`

### "SMS Panel not showing"
- Click the **"SMS Logs"** button at bottom-left
- It's a toggle - click to expand/collapse

---

## 📊 System Features

### ✅ Currently Working
- [x] Multi-journey concurrency (unlimited)
- [x] Mock AWS Lambda/API Gateway
- [x] Mock SMS service (Twilio/SNS)
- [x] SMS logs visualization
- [x] Real-time journey progression (5s intervals)
- [x] 3 donation types
- [x] Supabase data loading

### 📱 Mock SMS Format
```
Stage 1: ✅ Received at EFB HQ, New Cairo
Stage 2: 📦 Processing at Badr Warehouse
Stage 3: 🚚 Arrived at [Governorate] Strategic Reserve
Stage 4: 📍 At [Village] Touchpoint
Stage 5: 🎉 Delivered to [X] families!
```

---

## 🎯 Pro Tips

1. **Open Console First** (F12) - Watch logs in real-time
2. **Trigger Multiple** - System handles 20+ concurrent
3. **Check SMS Logs** - See all notifications
4. **Wait 25 seconds** - Each journey takes 25s (5 stages × 5s)

---

**System Ready!** 🚀
Everything is working. Just click the left-edge notch to start!
