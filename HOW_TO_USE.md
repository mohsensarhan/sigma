# TruPath - How to Use Guide

## 🚀 Quick Start

### 1. Start the Development Server
```bash
npm run dev
```

Then open: http://localhost:5173

---

## 🎯 Using the Admin Panel

### Step 1: Open Admin Panel
Look for the **glowing gradient notch** on the **left edge** of the screen (middle-left).

- **Position**: Left edge, middle of screen
- **Appearance**: Cyan/green gradient vertical bar (6px wide)
- **Action**: Click it to slide open the admin panel

### Step 2: Trigger a Donation

The admin panel has **3 donation types**:

#### Option 1: General Donation (Randomize Everything)
1. Click **"Trigger General Donation"** button
2. System randomly selects:
   - ✅ Random Program (e.g., Ramadan, School Meals)
   - ✅ Random Governorate (e.g., Minya, Aswan)
   - ✅ Random Family in that program/location

#### Option 2: Location-Fixed Donation
1. Select a **Governorate** from dropdown (e.g., "Minya")
2. Click **"Trigger Location-Fixed Donation"**
3. System randomly selects:
   - ✅ Random Program
   - ✅ Random Family in selected governorate

#### Option 3: Program-Fixed Donation
1. Select a **Program** from dropdown (e.g., "Ramadan Food Parcels")
2. Click **"Trigger Program-Fixed Donation"**
3. System randomly selects:
   - ✅ Random Governorate
   - ✅ Random Family in selected program

---

## 📊 What Happens After Triggering

### 1. Journey Starts (5-Stage Progression)
Each donation goes through 5 stages (5 seconds each):

| Stage | Location | Time |
|-------|----------|------|
| 1️⃣ | Received at EFB HQ, New Cairo | 0-5s |
| 2️⃣ | Processing at Badr Warehouse | 5-10s |
| 3️⃣ | Arrived at [Governorate] Strategic Reserve | 10-15s |
| 4️⃣ | At [Village] Touchpoint | 15-20s |
| 5️⃣ | Delivered to Family | 20-25s |

### 2. Watch the Map
- **Waypoints appear** on the map (5 markers)
- **Blue route line** connects waypoints
- **Active stage pulses** with cyan glow
- **Completed stages** turn green

### 3. Check Multi-Journey HUD (Top-Right)
Shows real-time stats:
```
[🟢 2 Active] [🔵 3 Completed] [Total: 5]
```

### 4. View SMS Notifications (Bottom-Left)
Click **"SMS Logs"** button to see:
- All SMS messages sent
- Delivery status (queued → sent → delivered)
- Journey tracking links
- Stats: `37 sent · 37 delivered`

---

## 🔥 Advanced: Stress Testing (Multiple Concurrent Journeys)

### Trigger 10 Donations Rapidly
1. Open admin panel
2. Click **"Trigger General Donation"** 10 times fast
3. Watch all journeys progress simultaneously
4. HUD shows: `10 Active | 0 Completed | Total: 10`

**The system supports UNLIMITED concurrent journeys!**

---

## 🛠️ Troubleshooting

### Issue: "Admin panel won't open"
**Fix**: The notch is very small (6px wide). Look for the **gradient bar on the left edge** and click it.

### Issue: "Buttons are disabled/grayed out"
**Fix**:
- For Location-Fixed: Select a governorate first
- For Program-Fixed: Select a program first
- General Donation should always work

### Issue: "No waypoints appearing on map"
**Check**:
1. Browser console for errors (F12)
2. Mapbox token is set in `.env.local`
3. Supabase is loading data (check console for "✅ Supabase" logs)

### Issue: "SMS Logs not showing"
**Fix**: Click the **"SMS Logs"** button at bottom-left to expand the panel

### Issue: "Governorate/Program dropdowns empty"
**Check**: Browser console should show:
```
✅ Supabase: Loaded 5 governorates
✅ Supabase: Loaded 6 programs
```

If missing, check Supabase connection.

---

## 📱 SMS Notification Format

Each stage sends an SMS to the donor:

**Stage 1:**
```
✅ Your donation EFB-2025-1759651851234-8129 has been
received at EFB HQ, New Cairo.
Track: https://trupath.eg/EFB-2025-1759651851234-8129
```

**Stage 2:**
```
📦 Your donation EFB-2025-1759651851234-8129 is being
processed at Badr Warehouse.
Track: https://trupath.eg/EFB-2025-1759651851234-8129
```

**Stage 3:**
```
🚚 Your donation EFB-2025-1759651851234-8129 has reached
Minya Strategic Reserve.
Track: https://trupath.eg/EFB-2025-1759651851234-8129
```

**Stage 4:**
```
📍 Your donation EFB-2025-1759651851234-8129 arrived at
Bani Mazar Touchpoint.
Track: https://trupath.eg/EFB-2025-1759651851234-8129
```

**Stage 5 (Final):**
```
🎉 Your donation EFB-2025-1759651851234-8129 has been
delivered to 5 families in Bani Mazar! Thank you for
making a difference.
Track: https://trupath.eg/EFB-2025-1759651851234-8129
```

---

## 🔍 How to Debug

### 1. Open Browser Console (F12)
Look for:
- `🎯 New journey started:` - Journey created
- `🚀 Journey X → Stage Y/5` - Stage progression
- `[SMS] Queued to...` - SMS sent
- `[API Gateway] POST /journeys` - Backend call
- `✅ Supabase: Loaded...` - Data loaded

### 2. Check Admin Panel Status
Active donation shows:
```
Active Donation
EFB-2025-1759651851234-8129
Stage 3/5
[Progress Bar]
```

### 3. Check Multi-Journey HUD
Should show non-zero counts after triggering

---

## 🎬 Complete Workflow Example

### Scenario: Trigger 3 Donations

1. **Open http://localhost:5173**
2. **Click left edge notch** → Admin panel slides out
3. **Click "Trigger General Donation"** → Journey #1 starts
4. **Wait 2 seconds**
5. **Click "Trigger General Donation"** again → Journey #2 starts
6. **Click "Trigger General Donation"** again → Journey #3 starts
7. **Watch HUD** → Shows `3 Active | 0 Completed | Total: 3`
8. **Click "SMS Logs"** → See 3 messages queued
9. **Wait 25 seconds** → All journeys complete
10. **Check HUD** → Shows `0 Active | 3 Completed | Total: 3`
11. **Check SMS Logs** → Shows 15 messages (3 journeys × 5 stages)

---

## 🔌 Mock Services (Currently Active)

### Mock AWS Lambda
- Creates journey records
- Updates journey stages
- Logs all API calls to console

### Mock SMS (Twilio/SNS)
- Queues SMS messages
- Simulates 500ms send delay
- Simulates 1s delivery confirmation
- 100% delivery rate (for testing)

**All console logs prefixed with:**
- `[API Gateway]` - API calls
- `[Lambda:xyz]` - Lambda function logs
- `[SMS]` - SMS service logs

---

## 🚨 Common Mistakes

### ❌ Don't
- Click too fast (wait for data to load)
- Expect instant delivery (SMS has 1s delay)
- Forget to select governorate/program for fixed donations

### ✅ Do
- Wait for "✅ Supabase: Loaded..." in console
- Check browser console for errors
- Use General Donation for quick testing
- Open SMS Logs to see notifications

---

## 📞 Support

If you encounter issues:

1. **Check browser console** (F12)
2. **Look for error messages** in terminal running `npm run dev`
3. **Verify Supabase/Mapbox tokens** in `.env.local`
4. **Try refreshing the page** (Ctrl+R)

---

**System Status:** ✅ Fully Working
**Mock Services:** ✅ AWS Lambda + SMS Active
**Multi-Journey:** ✅ Unlimited Concurrent Support
