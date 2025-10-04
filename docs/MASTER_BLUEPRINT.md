# 🎯 TruPath - Master Blueprint: MVP → Fully Functioning Product

**Created:** October 4, 2025
**Last Updated:** October 4, 2025
**Status:** Ready for Execution

---

## 📋 TABLE OF CONTENTS

1. [Product Vision](#product-vision)
2. [Current State](#current-state)
3. [Architecture Overview](#architecture-overview)
4. [Phase-by-Phase Roadmap](#phase-by-phase-roadmap)
5. [Database Schema Evolution](#database-schema-evolution)
6. [API Design](#api-design)
7. [Testing Strategy](#testing-strategy)
8. [Deployment Strategy](#deployment-strategy)
9. [Timeline & Milestones](#timeline--milestones)

---

## 🎨 PRODUCT VISION

### **End-to-End User Journey**

#### **Donor Experience:**
1. **Donation:** Donor visits website → Donates via AWS Payment Gateway
2. **Instant Confirmation:** System detects payment → Sends SMS: "Thank you! Track your donation: [unique-link]"
3. **Stage 1 Notification:** Donor clicks link → Sees their donation at EFB HQ on map
4. **Progressive Updates:** At preset intervals, donor receives SMS for each stage (2, 3, 4, 5)
5. **Impact Dashboard:** Swipeable card on right side shows:
   - Last donation details
   - Total donations (lifetime)
   - Number of meals provided
   - Lives impacted
6. **Real-time Tracking:** Donor watches their specific donation journey on live map

#### **Admin Experience:**
1. **Dashboard:** See all active journeys simultaneously
2. **Manual Testing:** Trigger test donations for QA
3. **Multi-Donor Simulation:** Push different donations for different people, watch all maps update in real-time
4. **Analytics:** Monitor delivery times, success rates, donor engagement

---

## 📊 CURRENT STATE

### ✅ **What We Have (Functional)**
- Supabase database (5 tables, 81 rows)
- 3 donation trigger types (General, Location-Fixed, Program-Fixed)
- 5-stage journey animation (5-second intervals)
- Beautiful map UI with Mapbox
- Admin panel for testing
- TypeScript, React, Vite stack
- 21 test files (Puppeteer/Playwright)

### ⚠️ **What's Missing for Full Product**
- ❌ Donor authentication & accounts
- ❌ Unique tracking links per donation
- ❌ Multi-journey support (currently shows 1 journey at a time)
- ❌ Donor portal & impact dashboard
- ❌ SMS notification system
- ❌ Payment gateway integration
- ❌ Real-time multi-donor tracking
- ❌ Donor-specific journey isolation
- ❌ Production-ready security

---

## 🏗️ ARCHITECTURE OVERVIEW

### **System Architecture (Target State)**

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND LAYER                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │  Public Website  │  │  Donor Portal    │  │ Admin Panel  │  │
│  │  (Donation Page) │  │  (Track Journey) │  │ (Testing)    │  │
│  └──────────────────┘  └──────────────────┘  └──────────────┘  │
│         │                      │                     │          │
└─────────┼──────────────────────┼─────────────────────┼──────────┘
          │                      │                     │
          ▼                      ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API LAYER (Serverless)                  │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐    │
│  │ /donate     │  │ /track/:id   │  │ /admin/trigger      │    │
│  │ (Payment)   │  │ (Real-time)  │  │ (Testing)           │    │
│  └─────────────┘  └──────────────┘  └─────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
          │                      │                     │
          ▼                      ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SUPABASE LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐   │
│  │  PostgreSQL  │  │  Auth        │  │  Real-time          │   │
│  │  (Database)  │  │  (Donors)    │  │  (WebSockets)       │   │
│  └──────────────┘  └──────────────┘  └─────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐   │
│  │ AWS Payment  │  │  Twilio SMS  │  │  Cloudflare CDN     │   │
│  │  Gateway     │  │  (Notify)    │  │  (Assets)           │   │
│  └──────────────┘  └──────────────┘  └─────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 PHASE-BY-PHASE ROADMAP

---

## **PHASE 0: CRITICAL SECURITY FIXES (30 min)**
**Priority:** 🔴 URGENT - Do Immediately

### Tasks:
1. ✅ Delete exposed `.env` file (contains old credentials)
2. ✅ Update `.gitignore` to protect all env files
3. ✅ Verify no credentials in git history
4. ✅ Clean up dead code in `dataService.ts`
5. ✅ Git commit: "fix: secure environment variables"

### Success Criteria:
- No credentials exposed in repository
- `.env.local` gitignored and secure
- Clean git history

---

## **PHASE 1: DONOR AUTHENTICATION & ACCOUNTS (1 week)**
**Goal:** Enable donors to create accounts and track their donations

### Week 1: Supabase Auth Integration

#### Day 1-2: Set Up Authentication
**Files to Create:**
- `src/contexts/AuthContext.tsx` - Auth state management
- `src/pages/Login.tsx` - Donor login page
- `src/pages/Register.tsx` - Donor registration
- `src/pages/DonorDashboard.tsx` - Main donor portal

**Database Changes:**
```sql
-- Enable Supabase Auth
-- Users table auto-created by Supabase Auth

-- Add donor profile table
CREATE TABLE donor_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  name TEXT,
  total_donations_amount DECIMAL(10,2) DEFAULT 0,
  total_donations_count INTEGER DEFAULT 0,
  total_meals_provided INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE donor_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Donors can only see their own profile
CREATE POLICY "Users can view own profile" ON donor_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON donor_profiles
  FOR UPDATE USING (auth.uid() = id);
```

**Implementation:**
```typescript
// src/contexts/AuthContext.tsx
import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

interface AuthContextType {
  user: User | null;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  };

  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, signUp, signIn, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

#### Day 3-4: Donor Registration Flow
**Features:**
- Email/password registration
- Phone number collection (for SMS)
- Email verification
- Profile creation

#### Day 5: Donor Login & Session Management
**Features:**
- Login page
- Persistent sessions
- Password reset
- Protected routes

**Test:** Can donors register, login, and see their dashboard?

---

## **PHASE 2: UNIQUE TRACKING LINKS & MULTI-JOURNEY SUPPORT (1 week)**
**Goal:** Each donation gets unique tracking link, support multiple concurrent journeys

### Week 2: Journey Isolation & Tracking

#### Day 6-7: Update Database Schema

```sql
-- Update donations table to link to donors
ALTER TABLE donations ADD COLUMN donor_id UUID REFERENCES auth.users(id);
ALTER TABLE donations ADD COLUMN tracking_url TEXT UNIQUE;
ALTER TABLE donations ADD COLUMN status TEXT DEFAULT 'active';
ALTER TABLE donations ADD COLUMN sms_notifications_sent INTEGER DEFAULT 0;

-- Create journey_stages table for real-time updates
CREATE TABLE journey_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id UUID REFERENCES donations(id),
  stage_number INTEGER NOT NULL,
  stage_name TEXT NOT NULL,
  location_name TEXT NOT NULL,
  coordinates JSONB NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, active, completed
  activated_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable real-time
ALTER PUBLICATION supabase_realtime ADD TABLE journey_stages;

-- RLS policies
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE journey_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Donors can view own donations" ON donations
  FOR SELECT USING (auth.uid() = donor_id);

CREATE POLICY "Donors can view own journey stages" ON journey_stages
  FOR SELECT USING (
    donation_id IN (
      SELECT id FROM donations WHERE donor_id = auth.uid()
    )
  );
```

#### Day 8-9: Generate Unique Tracking URLs

**Update journeyGenerator.ts:**
```typescript
export async function createDonation(
  selectionResult: SelectionResult,
  donorId: string
): Promise<string> {
  // Generate unique tracking token
  const trackingToken = generateTrackingToken();
  const trackingUrl = `https://trupath.com/track/${trackingToken}`;

  // Insert donation record
  const { data: donation, error } = await supabase
    .from('donations')
    .insert({
      donor_id: donorId,
      tracking_token: trackingToken,
      tracking_url: trackingUrl,
      program_id: selectionResult.program.id,
      governorate_id: selectionResult.governorate.id,
      family_id: selectionResult.family.id,
      status: 'active'
    })
    .select()
    .single();

  if (error) throw error;

  // Create journey stages
  const stages = generateJourneyStages(selectionResult);
  const { error: stagesError } = await supabase
    .from('journey_stages')
    .insert(
      stages.map((stage, index) => ({
        donation_id: donation.id,
        stage_number: index + 1,
        stage_name: stage.name,
        location_name: stage.location,
        coordinates: { lon: stage.lon, lat: stage.lat },
        status: index === 0 ? 'active' : 'pending'
      }))
    );

  if (stagesError) throw error;

  return trackingUrl;
}
```

#### Day 10: Multi-Journey Display Support

**Update App.tsx to handle multiple journeys:**
```typescript
// Instead of single journey state
const [activeJourneys, setActiveJourneys] = useState<Map<string, Journey>>(new Map());

// Real-time subscription to journey updates
useEffect(() => {
  const subscription = supabase
    .channel('journey_updates')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'journey_stages'
      },
      (payload) => {
        handleJourneyUpdate(payload);
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}, []);
```

**Test:** Can admin trigger multiple donations and see all journeys simultaneously?

---

## **PHASE 3: DONOR PORTAL & IMPACT DASHBOARD (1 week)**
**Goal:** Beautiful donor-facing portal with impact metrics

### Week 3: Donor Portal Features

#### Day 11-12: Donor Dashboard Layout

**Create:**
- `src/pages/DonorPortal.tsx` - Main portal
- `src/components/ImpactDashboard.tsx` - Swipeable stats card
- `src/components/DonorJourneyMap.tsx` - Donor-specific map view

**Impact Dashboard Design:**
```typescript
// src/components/ImpactDashboard.tsx
interface ImpactMetrics {
  lastDonation: {
    amount: number;
    date: string;
    status: string;
  };
  totalDonations: {
    amount: number;
    count: number;
  };
  impact: {
    mealsProvided: number;
    livesSaved: number;
    familiesHelped: number;
  };
}

export function ImpactDashboard({ metrics }: { metrics: ImpactMetrics }) {
  return (
    <div className="swipeable-card">
      {/* Swipeable carousel with Framer Motion */}
      <motion.div drag="x" dragConstraints={{ left: -600, right: 0 }}>
        <Card>
          <h3>Last Donation</h3>
          <p>${metrics.lastDonation.amount}</p>
          <p>{metrics.lastDonation.date}</p>
        </Card>

        <Card>
          <h3>Total Impact</h3>
          <p>{metrics.totalDonations.count} donations</p>
          <p>${metrics.totalDonations.amount} total</p>
        </Card>

        <Card>
          <h3>Lives Impacted</h3>
          <p>{metrics.impact.mealsProvided} meals</p>
          <p>{metrics.impact.livesSaved} lives saved</p>
        </Card>
      </motion.div>
    </div>
  );
}
```

#### Day 13-14: Impact Metrics Calculation

**Add database function:**
```sql
-- Calculate donor impact metrics
CREATE OR REPLACE FUNCTION calculate_donor_impact(donor_uuid UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_amount', COALESCE(SUM(amount), 0),
    'total_count', COUNT(*),
    'meals_provided', COUNT(*) * 60,  -- 60 meals per donation
    'lives_saved', COUNT(*) / 5        -- 1 life per 5 donations
  ) INTO result
  FROM donations
  WHERE donor_id = donor_uuid AND status = 'completed';

  RETURN result;
END;
$$ LANGUAGE plpgsql;
```

**Use in frontend:**
```typescript
async function loadImpactMetrics(donorId: string) {
  const { data, error } = await supabase
    .rpc('calculate_donor_impact', { donor_uuid: donorId });

  return data;
}
```

#### Day 15: Donor-Specific Journey Tracking

**Create tracking page:**
```typescript
// src/pages/TrackDonation.tsx
export function TrackDonation() {
  const { trackingToken } = useParams();
  const [journey, setJourney] = useState(null);

  useEffect(() => {
    async function loadJourney() {
      // Fetch donation by tracking token
      const { data: donation } = await supabase
        .from('donations')
        .select(`
          *,
          journey_stages (*)
        `)
        .eq('tracking_token', trackingToken)
        .single();

      setJourney(donation);

      // Subscribe to real-time updates
      const subscription = supabase
        .channel(`journey:${donation.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'journey_stages',
            filter: `donation_id=eq.${donation.id}`
          },
          (payload) => {
            updateJourneyStage(payload.new);
          }
        )
        .subscribe();

      return () => subscription.unsubscribe();
    }

    loadJourney();
  }, [trackingToken]);

  return (
    <div>
      <h1>Track Your Donation</h1>
      <DonorJourneyMap stages={journey?.journey_stages} />
      <ImpactDashboard metrics={impact} />
    </div>
  );
}
```

**Test:** Can donor visit tracking link and see their journey in real-time?

---

## **PHASE 4: SMS NOTIFICATION SYSTEM (3 days)**
**Goal:** Send automated SMS at each journey stage

### Day 16-17: Twilio Integration

**Install dependencies:**
```bash
npm install twilio
```

**Create Supabase Edge Function for SMS:**
```typescript
// supabase/functions/send-sms/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Twilio from 'https://esm.sh/twilio@4.19.0';

const twilioClient = Twilio(
  Deno.env.get('TWILIO_ACCOUNT_SID'),
  Deno.env.get('TWILIO_AUTH_TOKEN')
);

serve(async (req) => {
  const { phone, message, donorName } = await req.json();

  try {
    const result = await twilioClient.messages.create({
      body: message,
      from: Deno.env.get('TWILIO_PHONE_NUMBER'),
      to: phone
    });

    return new Response(JSON.stringify({ success: true, sid: result.sid }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
```

**Deploy Edge Function:**
```bash
supabase functions deploy send-sms
```

#### Day 18: Automated SMS Triggers

**Create database trigger:**
```sql
-- Function to send SMS when stage updates
CREATE OR REPLACE FUNCTION notify_donor_stage_update()
RETURNS TRIGGER AS $$
DECLARE
  donation_record RECORD;
  donor_record RECORD;
  message TEXT;
BEGIN
  -- Get donation and donor details
  SELECT * INTO donation_record FROM donations WHERE id = NEW.donation_id;
  SELECT * INTO donor_record FROM donor_profiles WHERE id = donation_record.donor_id;

  -- Build SMS message
  IF NEW.status = 'active' THEN
    message := format(
      'TruPath: Your donation has reached %s! Track live: %s',
      NEW.location_name,
      donation_record.tracking_url
    );

    -- Call Edge Function to send SMS
    PERFORM net.http_post(
      url := 'https://your-project.supabase.co/functions/v1/send-sms',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.jwt_secret') || '"}'::jsonb,
      body := json_build_object(
        'phone', donor_record.phone,
        'message', message,
        'donorName', donor_record.name
      )::jsonb
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER on_journey_stage_update
  AFTER UPDATE ON journey_stages
  FOR EACH ROW
  WHEN (NEW.status = 'active' AND OLD.status = 'pending')
  EXECUTE FUNCTION notify_donor_stage_update();
```

**Test SMS Messages:**
```
Stage 1: "Thank you for your donation! Track it live: https://trupath.com/track/ABC123"
Stage 2: "Your donation is being processed at Badr Warehouse. View: https://trupath.com/track/ABC123"
Stage 3: "Your donation reached Minya Strategic Reserve! Track: https://trupath.com/track/ABC123"
Stage 4: "Your donation is on its way to the family in Idamo village! Track: https://trupath.com/track/ABC123"
Stage 5: "DELIVERED! Your donation reached the family. See impact: https://trupath.com/track/ABC123"
```

**Test:** Do SMS notifications arrive at correct stage transitions?

---

## **PHASE 5: PAYMENT GATEWAY INTEGRATION (1 week)**
**Goal:** Accept real donations via AWS Payment Gateway

### Week 4: Payment Processing

#### Day 19-21: AWS Payment Gateway Setup

**Install AWS SDK:**
```bash
npm install @aws-sdk/client-payment-gateway
```

**Create payment endpoint (Supabase Edge Function):**
```typescript
// supabase/functions/process-payment/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { PaymentGatewayClient } from 'aws-sdk';

const paymentClient = new PaymentGatewayClient({
  credentials: {
    accessKeyId: Deno.env.get('AWS_ACCESS_KEY_ID'),
    secretAccessKey: Deno.env.get('AWS_SECRET_ACCESS_KEY')
  },
  region: 'us-east-1'
});

serve(async (req) => {
  const { amount, donorId, paymentMethod } = await req.json();

  try {
    // Process payment with AWS
    const paymentResult = await paymentClient.charge({
      amount: amount * 100, // Convert to cents
      currency: 'USD',
      paymentMethod: paymentMethod,
      description: 'TruPath Donation'
    });

    if (paymentResult.status === 'succeeded') {
      // Create donation in database
      const { data: donation } = await supabaseAdmin
        .from('donations')
        .insert({
          donor_id: donorId,
          amount: amount,
          payment_id: paymentResult.id,
          status: 'paid'
        })
        .select()
        .single();

      // Trigger journey creation
      await triggerJourneyCreation(donation.id);

      return new Response(JSON.stringify({ success: true, donation }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500
    });
  }
});
```

#### Day 22-23: Public Donation Page

**Create:**
- `src/pages/Donate.tsx` - Public donation page
- `src/components/PaymentForm.tsx` - Stripe-like payment form
- `src/components/DonationAmountSelector.tsx` - Preset amounts

**Payment Form:**
```typescript
// src/components/PaymentForm.tsx
export function PaymentForm() {
  const [amount, setAmount] = useState(50);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Call payment endpoint
      const response = await fetch('/api/process-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          donorId: user.id,
          paymentMethod: paymentMethodData
        })
      });

      const { success, donation } = await response.json();

      if (success) {
        // Redirect to tracking page
        router.push(`/track/${donation.tracking_token}`);
      }
    } catch (error) {
      console.error('Payment failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <DonationAmountSelector value={amount} onChange={setAmount} />
      <PaymentMethodInput />
      <button disabled={loading}>
        {loading ? 'Processing...' : `Donate $${amount}`}
      </button>
    </form>
  );
}
```

#### Day 24-25: Journey Auto-Creation on Payment

**Create webhook handler:**
```typescript
// Triggered after successful payment
async function onPaymentSuccess(donationId: string) {
  // 1. Select beneficiary
  const selection = await selectBeneficiary('general');

  // 2. Create journey stages
  const stages = generateJourneyStages(selection);

  // 3. Insert into database
  await supabase.from('journey_stages').insert(stages);

  // 4. Send initial SMS
  await sendSMS(donor.phone, `Thank you! Track: ${trackingUrl}`);

  // 5. Start stage progression timer (background job)
  await scheduleStageProgression(donationId);
}
```

**Test:** Can user donate and immediately receive tracking link via SMS?

---

## **PHASE 6: MULTI-DONOR TESTING SYSTEM (3 days)**
**Goal:** Simulate multiple donors, watch all journeys in real-time

### Day 26-27: Admin Multi-Donor Dashboard

**Create:**
- `src/pages/AdminMultiDonor.tsx` - Testing dashboard
- `src/components/MultiJourneyMap.tsx` - Show all active journeys

**Multi-Journey Map:**
```typescript
// src/components/MultiJourneyMap.tsx
export function MultiJourneyMap() {
  const [activeJourneys, setActiveJourneys] = useState<Journey[]>([]);

  useEffect(() => {
    // Subscribe to ALL journey updates
    const subscription = supabase
      .channel('all_journeys')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'journey_stages'
        },
        (payload) => {
          updateJourney(payload.new);
        }
      )
      .subscribe();

    return () => subscription.unsubscribe();
  }, []);

  return (
    <Map>
      {activeJourneys.map(journey => (
        <JourneyPath
          key={journey.id}
          stages={journey.stages}
          color={journey.color} // Each donor gets unique color
        />
      ))}
    </Map>
  );
}
```

#### Day 28: Bulk Donation Trigger

**Admin panel feature:**
```typescript
// Trigger multiple test donations simultaneously
async function triggerBulkDonations(count: number) {
  const donations = [];

  for (let i = 0; i < count; i++) {
    const donation = await createTestDonation({
      amount: 50,
      donorEmail: `test-donor-${i}@example.com`,
      donorPhone: `+1555000${i.toString().padStart(4, '0')}`
    });

    donations.push(donation);
  }

  // Watch all donations progress in real-time on map
  return donations;
}
```

**Test:** Can admin trigger 10 donations and see all 10 journeys animating simultaneously?

---

## **PHASE 7: STAGE PROGRESSION AUTOMATION (2 days)**
**Goal:** Automate journey stage progression based on time intervals

### Day 29-30: Background Job System

**Option A: Supabase pg_cron (Recommended)**
```sql
-- Enable pg_cron extension
CREATE EXTENSION pg_cron;

-- Schedule job to progress stages every 5 minutes (for real scenario)
-- For testing: every 5 seconds
SELECT cron.schedule(
  'progress-journey-stages',
  '*/5 * * * *', -- Every 5 minutes
  $$
  UPDATE journey_stages
  SET
    status = 'completed',
    completed_at = NOW()
  WHERE status = 'active';

  UPDATE journey_stages
  SET
    status = 'active',
    activated_at = NOW()
  WHERE id IN (
    SELECT id FROM journey_stages
    WHERE status = 'pending'
    ORDER BY stage_number ASC
    LIMIT 1
  );
  $$
);
```

**Option B: Supabase Edge Function with Cron Trigger**
```typescript
// supabase/functions/progress-stages/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL'),
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
);

serve(async (req) => {
  // Find all active stages
  const { data: activeStages } = await supabase
    .from('journey_stages')
    .select('*')
    .eq('status', 'active');

  for (const stage of activeStages) {
    // Check if enough time has passed (e.g., 5 seconds for testing)
    const elapsed = Date.now() - new Date(stage.activated_at).getTime();

    if (elapsed >= 5000) { // 5 seconds
      // Mark as completed
      await supabase
        .from('journey_stages')
        .update({ status: 'completed', completed_at: new Date() })
        .eq('id', stage.id);

      // Activate next stage
      await supabase
        .from('journey_stages')
        .update({ status: 'active', activated_at: new Date() })
        .eq('donation_id', stage.donation_id)
        .eq('stage_number', stage.stage_number + 1);
    }
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

**Invoke via cron:**
```bash
# Deploy function
supabase functions deploy progress-stages

# Schedule with external cron (e.g., GitHub Actions, Vercel Cron)
# Or use Supabase pg_cron
```

**Test:** Do journeys progress automatically without manual intervention?

---

## **PHASE 8: PRODUCTION DEPLOYMENT & SCALING (1 week)**

### Day 31-33: Production Infrastructure

#### Vercel Deployment
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard:
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY
- VITE_MAPBOX_TOKEN
- AWS_PAYMENT_GATEWAY_KEY
- TWILIO_ACCOUNT_SID
- TWILIO_AUTH_TOKEN
```

#### Cloudflare CDN Setup
- Add domain to Cloudflare
- Enable CDN for static assets
- Configure caching rules
- Enable WAF (Web Application Firewall)

#### Database Optimization
```sql
-- Add indexes for performance
CREATE INDEX idx_donations_donor_id ON donations(donor_id);
CREATE INDEX idx_donations_tracking_token ON donations(tracking_token);
CREATE INDEX idx_journey_stages_donation_id ON journey_stages(donation_id);
CREATE INDEX idx_journey_stages_status ON journey_stages(status);

-- Optimize queries
ANALYZE donations;
ANALYZE journey_stages;
```

### Day 34-35: Monitoring & Alerts

**Set up monitoring:**
- Sentry for error tracking
- PostHog for analytics
- Supabase dashboard for database metrics
- Uptime monitoring (UptimeRobot)

**Alerts:**
- Payment failures
- SMS delivery failures
- Database errors
- High response times

### Day 36-37: Load Testing

**Test scenarios:**
1. 100 concurrent donations
2. 1000 active journeys
3. Real-time updates with 500 connected users
4. SMS delivery at scale

**Tools:**
- Artillery for load testing
- k6 for performance testing

---

## 📚 DATABASE SCHEMA EVOLUTION

### **Current Schema (Phase 0)**
```
anchors (2 rows)
governorates (5 rows)
villages (13 rows)
programs (6 rows)
families (55 rows)
```

### **Target Schema (After Phase 8)**
```sql
-- Auth (Supabase managed)
auth.users
  - id (UUID)
  - email
  - encrypted_password

-- Donor profiles
donor_profiles
  - id (UUID, FK to auth.users)
  - email
  - phone
  - name
  - total_donations_amount
  - total_donations_count
  - total_meals_provided
  - created_at

-- Donations
donations
  - id (UUID)
  - donor_id (FK to donor_profiles)
  - tracking_token (unique)
  - tracking_url
  - amount
  - payment_id
  - program_id (FK)
  - governorate_id (FK)
  - family_id (FK)
  - status (paid, active, completed)
  - created_at

-- Journey stages
journey_stages
  - id (UUID)
  - donation_id (FK)
  - stage_number (1-5)
  - stage_name
  - location_name
  - coordinates (JSONB)
  - status (pending, active, completed)
  - activated_at
  - completed_at
  - created_at

-- SMS notifications log
sms_notifications
  - id (UUID)
  - donation_id (FK)
  - stage_number
  - phone
  - message
  - twilio_sid
  - status (sent, failed)
  - sent_at
  - created_at

-- Existing tables (unchanged)
anchors
governorates
villages
programs
families
```

---

## 🧪 TESTING STRATEGY

### **Unit Tests**
```typescript
// Test selection algorithm
test('selects beneficiary correctly', async () => {
  const result = await selectBeneficiary('general');
  expect(result).toHaveProperty('program');
  expect(result).toHaveProperty('governorate');
});

// Test journey generation
test('generates 5-stage journey', () => {
  const stages = generateJourneyStages(selection);
  expect(stages).toHaveLength(5);
});
```

### **Integration Tests**
```typescript
// Test end-to-end donation flow
test('donation creates journey and sends SMS', async () => {
  const donation = await createDonation({ amount: 50, donorId });
  expect(donation).toHaveProperty('tracking_url');

  const sms = await checkSMSSent(donor.phone);
  expect(sms).toContain(donation.tracking_url);
});
```

### **Load Tests**
```javascript
// Artillery config
export default {
  config: {
    target: 'https://trupath.com',
    phases: [
      { duration: 60, arrivalRate: 10 },
      { duration: 120, arrivalRate: 50 },
      { duration: 300, arrivalRate: 100 }
    ]
  },
  scenarios: [
    {
      name: 'Donate and track',
      weight: 70,
      flow: [
        { post: { url: '/api/donate', json: { amount: 50 } } },
        { get: { url: '/track/{{ trackingToken }}' } }
      ]
    }
  ]
};
```

---

## 📅 TIMELINE & MILESTONES

### **Sprint Overview (8-10 weeks total)**

| Phase | Duration | Start | End | Deliverable |
|-------|----------|-------|-----|-------------|
| Phase 0: Security | 0.5 days | Day 1 | Day 1 | Secure env vars |
| Phase 1: Auth | 5 days | Day 2 | Day 6 | Donor accounts |
| Phase 2: Tracking | 5 days | Day 7 | Day 11 | Unique URLs |
| Phase 3: Portal | 5 days | Day 12 | Day 16 | Impact dashboard |
| Phase 4: SMS | 3 days | Day 17 | Day 19 | Automated SMS |
| Phase 5: Payment | 7 days | Day 20 | Day 26 | AWS gateway |
| Phase 6: Multi-donor | 3 days | Day 27 | Day 29 | Testing system |
| Phase 7: Automation | 2 days | Day 30 | Day 31 | Auto progression |
| Phase 8: Production | 7 days | Day 32 | Day 38 | Live deployment |

**Total:** ~8 weeks (38 working days)

### **Milestones**

**Milestone 1 (Week 2):** Donor authentication working
**Milestone 2 (Week 4):** Unique tracking links live
**Milestone 3 (Week 6):** SMS notifications automated
**Milestone 4 (Week 8):** Payment gateway integrated
**Milestone 5 (Week 10):** Production ready & deployed

---

## 🎯 SUCCESS CRITERIA (Final Product)

### **Functional Requirements**
- ✅ Donor registers account
- ✅ Donor donates via AWS payment gateway
- ✅ System generates unique tracking link
- ✅ SMS sent immediately with tracking link
- ✅ Journey progresses through 5 stages automatically
- ✅ SMS sent at each stage update
- ✅ Donor views real-time journey on map
- ✅ Impact dashboard shows metrics
- ✅ Admin can trigger multiple test donations
- ✅ Multiple journeys display simultaneously
- ✅ Real-time updates via WebSockets

### **Performance Requirements**
- Page load: < 2 seconds
- Payment processing: < 3 seconds
- SMS delivery: < 10 seconds
- Real-time update latency: < 500ms
- Support 1000+ concurrent users
- Support 100+ active journeys
- 99.9% uptime

### **Security Requirements**
- HTTPS only
- Environment variables secured
- RLS policies enforced
- Payment data encrypted
- Rate limiting enabled
- SQL injection protected

---

## 📞 NEXT STEPS (When You Return)

1. ✅ Phase 0: Fix environment security (30 min)
2. ✅ Start Phase 1: Set up Supabase Auth (1 hour)
3. ✅ Create donor registration flow (2 hours)
4. ✅ Test donor login & dashboard (30 min)

**First milestone:** Donor can register, login, and see empty dashboard by end of week 1.

---

**Blueprint Status:** ✅ Complete & Ready for Execution
**Confidence Level:** 95% - All pieces fit together logically
**Ready to Start:** Phase 0 (Security Fixes)
